import Phaser from 'phaser';
import { eventBus } from '../../state/eventBus.ts';
import { store } from '../../state/store.ts';

export const ACT_SWAY_TORQUES: Record<number, number> = {
  1: 1.0,
  2: 1.5,
  3: 2.0,
  4: 2.6,
  5: 3.2,
};

export const ACT_STABILITY_THRESHOLDS: Record<number, number> = {
  1: 0.55,
  2: 0.50,
  3: 0.45,
  4: 0.40,
  5: 0.35,
};

export interface RobotInputs {
  left: boolean;
  right: boolean;
  jump: boolean;
}

interface SteamParticle {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

/**
 * Robot - Drunken Robot Arcade Physics Controller
 *
 * Implements:
 * 1. Drunken Stagger momentum oscillation and balance stability threshold
 * 2. Accordion Jump with continuous bellows pressure charging
 * 3. Procedural Sketchbook Expressionism rendering (shaky outlines, pleated accordion, amber eye)
 * 4. Decoupled telemetry emission via EventBus
 */
export class Robot extends Phaser.GameObjects.Container {
  public declare body: Phaser.Physics.Arcade.Body;

  // Stagger & Balance Physics
  private wobblePhase = 0;
  private wobbleAngle = 0; // in radians
  private wobbleAngularVel = 0;
  private isStumbling = false;
  private stumbleTimer = 0;
  private stumbleCooldown = 0;
  private stumbleDirection: 'left' | 'right' = 'right';
  public spinAngleOffset = 0;
  private spinTween?: Phaser.Tweens.Tween;

  // Bellows & Jump Physics
  private bellowsPressure = 0; // 0.0 to 1.0
  private isChargingBellows = false;
  private wasGrounded = true;
  private coyoteTimer = 0;

  // Gait & Stride
  private stridePhase = 0;
  private lastFootStep: 'left' | 'right' = 'left';

  // Steam particle system
  private steamParticles: SteamParticle[] = [];

  // Graphics Display Components
  private shadowGfx: Phaser.GameObjects.Graphics;
  private limbsGfx: Phaser.GameObjects.Graphics;
  private accordionGfx: Phaser.GameObjects.Graphics;
  private chassisGfx: Phaser.GameObjects.Graphics;
  private eyeGfx: Phaser.GameObjects.Graphics;
  private steamGfx: Phaser.GameObjects.Graphics;

  // Constants
  public static readonly AUTO_WALK_SPEED = 180;
  private static readonly MAX_WALK_SPEED = 240;
  private static readonly TORQUE_FORCE = 5.6;
  public static readonly STABILITY_THRESHOLD = 0.45; // Default fallback
  public static readonly ACT_SWAY_TORQUES = ACT_SWAY_TORQUES;
  public static readonly ACT_STABILITY_THRESHOLDS = ACT_STABILITY_THRESHOLDS;
  private static readonly BASE_JUMP_FORCE = 390;
  private static readonly MAX_JUMP_BOOST = 410;
  private static readonly COYOTE_DURATION = 0.14; // 140ms ground tolerance

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    // 1. Add this container to scene display and physics
    scene.add.existing(this);
    scene.physics.world.enable(this);

    // 2. Configure Arcade Physics Body
    // Container coordinates: origin (0,0) is at ground contact between feet
    this.body.setSize(46, 88);
    this.body.setOffset(-23, -88);
    this.body.setCollideWorldBounds(false);
    this.body.setDragX(350);
    this.body.setMaxVelocity(Robot.MAX_WALK_SPEED + 120, 850);
    this.body.setBounce(0.04, 0.04);

    // 3. Initialize Procedural Graphics layers in container
    this.shadowGfx = scene.add.graphics();
    this.limbsGfx = scene.add.graphics();
    this.chassisGfx = scene.add.graphics();
    this.accordionGfx = scene.add.graphics();
    this.eyeGfx = scene.add.graphics();
    this.steamGfx = scene.add.graphics();

    this.add([
      this.shadowGfx,
      this.limbsGfx,
      this.chassisGfx,
      this.accordionGfx,
      this.eyeGfx,
      this.steamGfx,
    ]);

    // Initial render
    this.redrawVisuals(0, 0, 0);
  }

  public getBellowsPressure(): number {
    return this.bellowsPressure;
  }

  public getWobbleAngle(): number {
    return this.wobbleAngle;
  }

  public getIsStumbling(): boolean {
    return this.isStumbling;
  }

  public getDynamicStabilityThreshold(): number {
    const state = store.getState();
    const activeAct = state.activeAct || 1;
    const base = ACT_STABILITY_THRESHOLDS[activeAct] ?? 0.45;
    return state.activeBuff === 'balance' ? base * 1.5 : base;
  }

  public getDynamicSwayTorque(): number {
    const activeAct = store.getState().activeAct || 1;
    return ACT_SWAY_TORQUES[activeAct] ?? 2.0;
  }

  public getStabilityRatio(): number {
    return Phaser.Math.Clamp(Math.abs(this.wobbleAngle) / this.getDynamicStabilityThreshold(), 0, 1);
  }

  /**
   * Main physics & control update loop
   */
  public update(_time: number, delta: number, inputs: RobotInputs): void {
    const dt = Math.min(delta / 1000, 0.1);
    const isPhysicallyGrounded = Boolean(this.body.blocked.down || this.body.touching.down);

    // Update Coyote time ground tolerance timer
    if (isPhysicallyGrounded) {
      this.coyoteTimer = Robot.COYOTE_DURATION;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }
    const canJump = isPhysicallyGrounded || this.coyoteTimer > 0;

    // 1. Touchdown / Landing Detection
    if (!this.wasGrounded && isPhysicallyGrounded) {
      const impactSpeed = Math.abs(this.body.velocity.y);
      eventBus.emit('PLAYER_LAND', { impactSpeed });

      // Landing squash & wobble kick
      this.wobbleAngularVel += (Math.random() - 0.5) * 3.5;
      this.spawnSteam(0, -78, 6, 40);
    }
    this.wasGrounded = isPhysicallyGrounded;

    // 2. Accordion Jump / Bellows Charging with Coyote Time
    this.handleBellowsJump(dt, inputs, canJump);

    // 3. Paradigm A Drunken Stagger (Auto-walk + Rotational Torque)
    this.handleHorizontalMovement(dt, inputs, isPhysicallyGrounded);

    // 4. Update Steam Particle System
    this.updateSteam(dt);

    // 5. Redraw Sketchbook Graphics & Apply Transformations
    this.redrawVisuals(dt, isPhysicallyGrounded ? this.body.velocity.x : 0, this.bellowsPressure);

    // 6. Emit Continuous Telemetry
    eventBus.emit('VELOCITY_CHANGE', {
      vx: this.body.velocity.x,
      vy: this.body.velocity.y,
      speedRatio: this.body.velocity.x / Robot.MAX_WALK_SPEED,
      isGrounded: isPhysicallyGrounded,
    });

    eventBus.emit('LEAN_CHANGE', {
      angle: Phaser.Math.RadToDeg(this.wobbleAngle),
      balance: Phaser.Math.Clamp(this.wobbleAngle / this.getDynamicStabilityThreshold(), -1, 1),
    });
  }

  private handleBellowsJump(dt: number, inputs: RobotInputs, canJump: boolean): void {
    if (inputs.jump) {
      // Space is held -> Charge bellows pressure
      this.isChargingBellows = true;
      this.bellowsPressure = Math.min(1.0, this.bellowsPressure + dt * 1.55);

      eventBus.emit('BELLOWS_COMPRESS', {
        pressure: this.bellowsPressure,
        isCharging: true,
      });

      // Spawn subtle hiss steam while charging
      if (Math.random() < 0.25) {
        this.spawnSteam(6, -82, 3, 20);
      }
    } else if (this.isChargingBellows) {
      // Space released -> Fire Accordion Jump if grounded or within coyote time
      if (canJump) {
        const baseJump = store.getState().activeBuff === 'jump'
          ? Robot.BASE_JUMP_FORCE * 2
          : Robot.BASE_JUMP_FORCE;
        const jumpForce = baseJump + this.bellowsPressure * Robot.MAX_JUMP_BOOST;
        this.body.setVelocityY(-jumpForce);
        this.coyoteTimer = 0;

        // Add horizontal momentum boost in the direction of the lean
        const forwardImpulse = Math.sin(this.wobbleAngle) * 160;
        this.body.velocity.x += forwardImpulse;

        eventBus.emit('BELLOWS_BURST', {
          jumpForce,
          pressure: this.bellowsPressure,
        });

        // Burst steam cloud
        this.spawnSteam(0, -82, 10, 75);
      }

      this.isChargingBellows = false;
      this.bellowsPressure = 0;
      eventBus.emit('BELLOWS_COMPRESS', {
        pressure: 0,
        isCharging: false,
      });
    }
  }

  private handleHorizontalMovement(dt: number, inputs: RobotInputs, isGrounded: boolean): void {
    if (this.isStumbling) {
      // In Stumble State: temporary loss of balance recovery
      this.stumbleTimer -= dt;
      const stumbleSpeed = this.stumbleDirection === 'right' ? 50 : 30;
      this.body.setVelocityX(stumbleSpeed);

      // Severe wobble oscillation during stumble
      this.wobbleAngle = Math.sin(this.stumbleTimer * 18) * 0.42;

      if (this.stumbleTimer <= 0) {
        this.isStumbling = false;
        this.spinAngleOffset = 0;
        this.stumbleCooldown = 1.2; // Grace period before another natural stumble
      }
      return;
    }

    if (this.stumbleCooldown > 0) {
      this.stumbleCooldown -= dt;
    }

    // Paradigm A: Constant Forward Auto-Walk Speed (conserved both grounded and airborne)
    if (isGrounded) {
      this.body.setVelocityX(Robot.AUTO_WALK_SPEED);
    } else {
      // Retain forward momentum during Accordion Jumps
      this.body.setVelocityX(Math.max(Robot.AUTO_WALK_SPEED, this.body.velocity.x));
    }

    // Stride Footstep trigger driven by forward locomotion
    this.stridePhase += dt * 6.5;
    const currentGait = Math.sin(this.stridePhase) > 0 ? 'right' : 'left';
    if (currentGait !== this.lastFootStep && isGrounded && Math.abs(this.body.velocity.x) > 30) {
      this.lastFootStep = currentGait;
      eventBus.emit('PLAYER_STEP', {
        foot: currentGait,
        stride: Math.abs(this.body.velocity.x) / Robot.MAX_WALK_SPEED,
      });
    }

    // Natural drunken sinusoidal sway torque dynamically scaled by Act
    this.wobblePhase += dt * 3.2;
    const activeAct = store.getState().activeAct || 1;
    const swayTorqueMultiplier = ACT_SWAY_TORQUES[activeAct] ?? 2.0;
    const naturalSwayTorque = Math.sin(this.wobblePhase) * swayTorqueMultiplier;

    // Player Balancing Torque (Left/Right inputs exclusively counter-steer/tilt)
    let controlTorque = 0;
    if (inputs.left) {
      controlTorque -= Robot.TORQUE_FORCE;
    }
    if (inputs.right) {
      controlTorque += Robot.TORQUE_FORCE;
    }

    // Spring-damper rotational dynamics (Restoring spring + Wobble sway + Player torque)
    const totalTorque = naturalSwayTorque + controlTorque;
    const springStiffness = 6.0;
    const damping = 3.2;
    const springForce = -this.wobbleAngle * springStiffness;

    this.wobbleAngularVel = (this.wobbleAngularVel + (springForce + totalTorque) * dt) * (1 - dt * damping);
    this.wobbleAngle += this.wobbleAngularVel * dt;

    // Critical Stumble Check (Balance failure past threshold)
    const stabilityThreshold = this.getDynamicStabilityThreshold();
    if (
      Math.abs(this.wobbleAngle) > stabilityThreshold &&
      this.stumbleCooldown <= 0 &&
      isGrounded
    ) {
      this.triggerStumble();
    }
  }

  public triggerStumble(severityOverride?: number, directionOverride?: 'left' | 'right'): void {
    if (this.isStumbling) return;

    this.isStumbling = true;
    this.stumbleTimer = 1.35;
    this.stumbleDirection = directionOverride ?? (this.wobbleAngle >= 0 ? 'right' : 'left');

    // Stumble recovery hop
    this.body.setVelocityY(-210);

    // Spin out visual consequence: 360 degree rapid spin
    if (this.spinTween) {
      this.spinTween.stop();
    }
    const spinTarget = this.stumbleDirection === 'right' ? Math.PI * 2 : -Math.PI * 2;
    this.spinAngleOffset = 0;
    if (this.scene && this.scene.tweens) {
      this.spinTween = this.scene.tweens.add({
        targets: this,
        spinAngleOffset: spinTarget,
        duration: 850,
        ease: 'Cubic.easeOut',
      });
    }

    const currentThreshold = this.getDynamicStabilityThreshold();
    const severity = severityOverride ?? Phaser.Math.Clamp(
      (Math.abs(this.wobbleAngle) - currentThreshold) / 0.12 + 0.45,
      0.4,
      1.0
    );

    eventBus.emit('PLAYER_STUMBLE', {
      direction: this.stumbleDirection,
      severity,
      tiltAngle: this.wobbleAngle,
      speed: Math.abs(this.body.velocity.x),
    });

    this.spawnSteam(this.stumbleDirection === 'right' ? 8 : -8, -80, 8, 60);
  }

  private spawnSteam(x: number, y: number, count: number, maxSpeed: number): void {
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
      const speed = 20 + Math.random() * maxSpeed;
      this.steamParticles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 6,
        radius: 3 + Math.random() * 5,
        alpha: 0.85,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 0.4 + Math.random() * 0.5,
      });
    }
  }

  private updateSteam(dt: number): void {
    for (let i = this.steamParticles.length - 1; i >= 0; i--) {
      const p = this.steamParticles[i];
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.radius += dt * 4;
      p.alpha = Math.max(0, 0.85 * (1 - p.life / p.maxLife));

      if (p.life >= p.maxLife) {
        this.steamParticles.splice(i, 1);
      }
    }
  }

  /**
   * Procedural Sketchbook Expressionism Renderer
   */
  private redrawVisuals(_dt: number, vx: number, bellowsRatio: number): void {
    // 1. Container Transform (Wobble Tilt + Jump Squash/Stretch)
    const crouchSquashY = 1.0 - bellowsRatio * 0.22;
    const crouchSpreadX = 1.0 + bellowsRatio * 0.14;

    this.setRotation(this.wobbleAngle + this.spinAngleOffset);
    this.setScale(crouchSpreadX, crouchSquashY);

    // 2. Ground Contact Shadow
    this.shadowGfx.clear();
    this.shadowGfx.fillStyle(0x0a0c10, 0.55);
    this.shadowGfx.fillEllipse(0, -2, 44 * crouchSpreadX, 10);

    // 3. Limbs & Clockwork Feet
    this.limbsGfx.clear();
    const legSpread = Math.sin(this.stridePhase) * 14 * (Math.abs(vx) > 10 ? 1 : 0.2);

    // Left Leg & Iron Boot
    this.limbsGfx.lineStyle(4, 0x18181b, 1);
    this.limbsGfx.lineBetween(-10, -32, -12 - legSpread, -6);
    this.limbsGfx.fillStyle(0x3f3f46, 1);
    this.limbsGfx.fillRect(-20 - legSpread, -6, 16, 6);

    // Right Leg & Iron Boot
    this.limbsGfx.lineBetween(10, -32, 12 + legSpread, -6);
    this.limbsGfx.fillStyle(0x3f3f46, 1);
    this.limbsGfx.fillRect(4 + legSpread, -6, 16, 6);

    // 4. Jagged Asymmetrical Scrap Chassis
    this.chassisGfx.clear();

    // Rusted Amber Main Torso Polygon
    this.chassisGfx.fillStyle(0x92400e, 1);
    this.chassisGfx.beginPath();
    this.chassisGfx.moveTo(-20, -32);
    this.chassisGfx.lineTo(-24, -72);
    this.chassisGfx.lineTo(18, -76);
    this.chassisGfx.lineTo(22, -34);
    this.chassisGfx.closePath();
    this.chassisGfx.fillPath();

    // 6B Shaky Pencil Charcoal Outline
    this.chassisGfx.lineStyle(3, 0x18181b, 0.95);
    this.chassisGfx.strokePath();

    // Patch plate (weathered bronze)
    this.chassisGfx.fillStyle(0xb45309, 1);
    this.chassisGfx.fillRect(-18, -68, 14, 18);
    this.chassisGfx.lineStyle(1.5, 0x18181b, 0.9);
    this.chassisGfx.strokeRect(-18, -68, 14, 18);

    // Rivet studs
    this.chassisGfx.fillStyle(0xfbbf24, 0.9);
    this.chassisGfx.fillCircle(-15, -65, 1.5);
    this.chassisGfx.fillCircle(-7, -65, 1.5);
    this.chassisGfx.fillCircle(-15, -53, 1.5);
    this.chassisGfx.fillCircle(-7, -53, 1.5);

    // Top Chimney Exhaust Pipe
    this.chassisGfx.fillStyle(0x27272a, 1);
    this.chassisGfx.fillRect(4, -84, 8, 10);
    this.chassisGfx.fillStyle(0xd97706, 1);
    this.chassisGfx.fillRect(2, -87, 12, 4);

    // 5. Pleated Accordion Strapped to Torso
    this.accordionGfx.clear();
    const accordionY = -56;
    const foldCount = 5;
    const accordionWidth = 32 + bellowsRatio * 8;
    const foldSpacing = accordionWidth / foldCount;
    const leftX = -accordionWidth / 2;

    // Draw bellows folds (zigzag pleats responding to lean and jump charge)
    for (let i = 0; i < foldCount; i++) {
      const fx = leftX + i * foldSpacing;
      const isEven = i % 2 === 0;
      const topOffset = (isEven ? -10 : -7) - Math.sin(this.wobbleAngle) * (i - 2) * 3;
      const botOffset = (isEven ? 10 : 7) + Math.sin(this.wobbleAngle) * (i - 2) * 3;

      // Weathered leather pleated fold
      this.accordionGfx.fillStyle(isEven ? 0x292524 : 0x44403c, 1);
      this.accordionGfx.fillRect(fx, accordionY + topOffset, foldSpacing + 1, botOffset - topOffset);

      // Signature Red Poppy & Golden Sunflower accent trim
      this.accordionGfx.fillStyle(0xef4444, 0.9);
      this.accordionGfx.fillRect(fx, accordionY + topOffset + 1, foldSpacing + 1, 2);
      this.accordionGfx.fillStyle(0xfbbf24, 0.9);
      this.accordionGfx.fillRect(fx, accordionY + botOffset - 3, foldSpacing + 1, 2);

      // Charcoal fold divider
      this.accordionGfx.lineStyle(1.5, 0x18181b, 0.85);
      this.accordionGfx.lineBetween(fx, accordionY + topOffset, fx, accordionY + botOffset);
    }

    // Accordion wooden end blocks
    this.accordionGfx.fillStyle(0x78350f, 1);
    this.accordionGfx.fillRect(leftX - 4, accordionY - 11, 4, 22);
    this.accordionGfx.fillRect(leftX + accordionWidth, accordionY - 11, 4, 22);

    // 6. Glowing Amber/Cyan Vacuum Tube Eye & Buff Auras
    this.eyeGfx.clear();
    const eyeX = 4;
    const eyeY = -66;
    const eyeGlowPulse = 0.75 + Math.sin(this.wobblePhase * 2) * 0.25 + bellowsRatio * 0.8;
    const activeBuff = store.getState().activeBuff;

    // Buff-specific visual auras
    if (activeBuff === 'jump') {
      // Super Jump + Invulnerability: Electric cyan shield aura
      this.eyeGfx.fillStyle(0x06b6d4, 0.22 * eyeGlowPulse);
      this.eyeGfx.fillCircle(0, -48, 42);
      this.eyeGfx.lineStyle(1.5, 0x67e8f9, 0.55 * eyeGlowPulse);
      this.eyeGfx.strokeCircle(0, -48, 42);
    } else if (activeBuff === 'balance') {
      // Gypsy Brandy: Amber stabilization gyro rings around feet
      this.eyeGfx.lineStyle(1.5, 0xf59e0b, 0.65);
      this.eyeGfx.strokeEllipse(0, -8, 38, 12);
    } else if (activeBuff === 'tips') {
      // Golden Sunflower: Radiant golden halo around torso
      this.eyeGfx.fillStyle(0xfbbf24, 0.18 * eyeGlowPulse);
      this.eyeGfx.fillCircle(0, -48, 36);
    }

    // Outer glass vacuum bulb
    this.eyeGfx.fillStyle(0x18181b, 0.85);
    this.eyeGfx.fillCircle(eyeX, eyeY, 8);
    this.eyeGfx.lineStyle(2, activeBuff === 'jump' ? 0x22d3ee : 0xd97706, 0.9);
    this.eyeGfx.strokeCircle(eyeX, eyeY, 8);

    // Radial eye halo
    const eyeHaloColor = activeBuff === 'jump' ? 0x06b6d4 : 0xf59e0b;
    this.eyeGfx.fillStyle(eyeHaloColor, 0.25 * eyeGlowPulse);
    this.eyeGfx.fillCircle(eyeX, eyeY, 16 + bellowsRatio * 8);

    // Inner fiery tungsten or electric cyan filament
    this.eyeGfx.fillStyle(activeBuff === 'jump' ? 0xe0f2fe : 0xfef08a, 1);
    this.eyeGfx.fillCircle(eyeX, eyeY, 4);
    this.eyeGfx.fillStyle(0xffffff, 0.95);
    this.eyeGfx.fillCircle(eyeX - 1, eyeY - 1, 1.8);

    // 7. Render Steam Particles
    this.steamGfx.clear();
    const steamColor = activeBuff === 'jump' ? 0x67e8f9 : 0xfef3c7;
    for (const p of this.steamParticles) {
      this.steamGfx.fillStyle(steamColor, p.alpha * 0.45);
      this.steamGfx.fillCircle(p.x, p.y, p.radius);
    }
  }
}
