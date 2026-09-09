import Phaser from 'phaser';
import { Robot, type RobotInputs } from '../entities/Robot.ts';
import { store } from '../../state/store.ts';
import { eventBus, type BuffType } from '../../state/eventBus.ts';

interface ParallaxLayer {
  name: 'sky' | 'distant' | 'midground' | 'street' | 'foreground';
  tileSprite: Phaser.GameObjects.TileSprite;
  scrollSpeedFactor: number;
  currentTint: number;
}

export class StreetScene extends Phaser.Scene {
  private layers: ParallaxLayer[] = [];
  private robot!: Robot;
  private groundPlatform!: Phaser.GameObjects.Rectangle;

  // Object Pools & Groups
  private tipsGroup!: Phaser.Physics.Arcade.Group;
  private hazardsGroup!: Phaser.Physics.Arcade.Group;
  private powerupsGroup!: Phaser.Physics.Arcade.Group;
  private nextSpawnX = 750;
  private nextPowerupSpawnTime = 8000;

  // Keyboard Inputs
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA?: Phaser.Input.Keyboard.Key;
  private keyD?: Phaser.Input.Keyboard.Key;
  private keyW?: Phaser.Input.Keyboard.Key;
  private keySpace?: Phaser.Input.Keyboard.Key;

  // HUD Elements
  private hudBellowsBar!: Phaser.GameObjects.Graphics;
  private hudBalanceGauge!: Phaser.GameObjects.Graphics;
  private hudProgressionGfx!: Phaser.GameObjects.Graphics;
  private actBadgeBg!: Phaser.GameObjects.Graphics;
  private actBadgeText!: Phaser.GameObjects.Text;
  private activeBuffBadgeBg!: Phaser.GameObjects.Graphics;
  private activeBuffBadgeText!: Phaser.GameObjects.Text;
  private bannerContainer!: Phaser.GameObjects.Container;
  private bannerBg!: Phaser.GameObjects.Graphics;
  private bannerTitleText!: Phaser.GameObjects.Text;
  private bannerSubText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private tipsText!: Phaser.GameObjects.Text;
  private momentumText!: Phaser.GameObjects.Text;

  private isGameOver = false;
  private isVictory = false;
  private isPaused = false;
  private hasAutoCollapsedSidebar = false;
  private unsubActChange?: () => void;
  private unsubGameOver?: () => void;
  private unsubVictory?: () => void;
  private unsubGamePause?: () => void;
  private gameOverOverlay?: Phaser.GameObjects.Container;
  private pauseOverlay?: Phaser.GameObjects.Container;
  private keyP?: Phaser.Input.Keyboard.Key;
  private keyEsc?: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'StreetScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    this.layers = [];
    this.nextSpawnX = 750;
    this.isGameOver = false;
    this.isVictory = false;
    this.isPaused = store.isPaused();
    this.hasAutoCollapsedSidebar = false;
    this.nextPowerupSpawnTime = 8000;

    // 1. Create Parallax Layers pinned to camera viewport (setScrollFactor(0))
    const skyLayer = this.add.tileSprite(0, 0, width, height, 'bg_sky').setOrigin(0, 0).setScrollFactor(0);
    this.layers.push({ name: 'sky', tileSprite: skyLayer, scrollSpeedFactor: 0.1, currentTint: 0xffffff });

    const distantLayer = this.add.tileSprite(0, 0, width, height, 'bg_distant').setOrigin(0, 0).setScrollFactor(0);
    this.layers.push({ name: 'distant', tileSprite: distantLayer, scrollSpeedFactor: 0.25, currentTint: 0xffffff });

    const initialAct = store.getState().activeAct || 1;
    const midLayer = this.add.tileSprite(0, 0, width, height, `bg_midground_act${initialAct}`).setOrigin(0, 0).setScrollFactor(0);
    this.layers.push({ name: 'midground', tileSprite: midLayer, scrollSpeedFactor: 0.55, currentTint: 0xffffff });

    const streetLayer = this.add.tileSprite(0, 0, width, height, 'bg_street').setOrigin(0, 0).setScrollFactor(0);
    this.layers.push({ name: 'street', tileSprite: streetLayer, scrollSpeedFactor: 1.0, currentTint: 0xffffff });

    const fgLayer = this.add.tileSprite(0, 0, width, height, 'bg_foreground').setOrigin(0, 0).setScrollFactor(0);
    this.layers.push({ name: 'foreground', tileSprite: fgLayer, scrollSpeedFactor: 1.25, currentTint: 0xffffff });

    // 2. Create Static Cobblestone Ground Platform (Aligned to curb/street baseline at y = 584)
    this.groundPlatform = this.add.rectangle(0, 584, 500000, 60, 0x000000, 0);
    this.groundPlatform.setOrigin(0, 0);
    this.physics.add.existing(this.groundPlatform, true);

    // 3. Object Groups for Tips, Hazards & Power-Ups
    this.tipsGroup = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });

    this.hazardsGroup = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });

    this.powerupsGroup = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });

    // 4. Instantiate Robot Arcade Physics Entity
    this.robot = new Robot(this, 320, 520);
    this.physics.add.collider(this.robot, this.groundPlatform);

    // 5. Overlap Handlers (Collecting Tips, Hitting Hazards & Power-Ups)
    this.physics.add.overlap(this.robot, this.tipsGroup, this.handleCollectTip as any, undefined, this);
    this.physics.add.overlap(this.robot, this.hazardsGroup, this.handleHitHazard as any, undefined, this);
    this.physics.add.overlap(this.robot, this.powerupsGroup, this.handleCollectPowerup as any, undefined, this);

    // 6. Smooth Camera Tracking & Vertical Axis Lock
    this.cameras.main.startFollow(this.robot, true, 0.08, 0.08, -140, 50);
    this.cameras.main.setBounds(0, 0, Number.MAX_SAFE_INTEGER, 720);

    // 7. Setup Keyboard Input Controls (A/D/Left/Right/Space/P/ESC)
    this.setupInputControls();

    // 8. Setup Interactive HUD / Overlay UI & Act Banners
    this.setupOverlayUI(width);

    // 9. Register EventBus Listeners
    this.cleanupListeners();

    this.unsubActChange = eventBus.on('ACT_CHANGE', (payload) => {
      this.handleActTransition(payload.act, payload.name);
    });

    this.unsubGameOver = eventBus.on('GAME_OVER', (payload) => {
      this.handleGameOver(payload.distanceTraveled, payload.tips);
    });

    this.unsubVictory = eventBus.on('VICTORY', () => {
      this.handleVictory();
    });

    this.unsubGamePause = eventBus.on('GAME_PAUSE', (payload) => {
      this.handlePauseChange(payload.isPaused);
    });

    this.events.once('shutdown', this.cleanupListeners, this);
    this.events.once('destroy', this.cleanupListeners, this);

    // Apply initial act visual state
    const currentActDef = store.getCurrentActDefinition();
    this.applyInstantActPalette(currentActDef.act);

    if (this.isPaused) {
      this.handlePauseChange(true);
    }
  }

  private setupInputControls(): void {
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.keyP = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
      this.keyEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

      this.keyP.on('down', () => this.togglePause());
      this.keyEsc.on('down', () => this.togglePause());
    }
  }

  private setupOverlayUI(width: number): void {
    // Act & Busking Progression Badge (Top Left)
    this.actBadgeBg = this.add.graphics().setScrollFactor(0);
    this.drawBadgeBg(0xf59e0b);

    const initialAct = store.getCurrentActDefinition();
    this.actBadgeText = this.add.text(32, 28, `ACT ${initialAct.act}: ${initialAct.name.toUpperCase()}`, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#f59e0b',
      fontStyle: 'bold',
    }).setScrollFactor(0);

    // Live Tips & Momentum HUD labels
    this.tipsText = this.add.text(32, 48, '⚙️ Tips: 0', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#fbbf24',
      fontStyle: 'bold',
    }).setScrollFactor(0);

    this.momentumText = this.add.text(140, 48, '⚡ Momentum: 0% [Solo]', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#9ca3af',
    }).setScrollFactor(0);

    // Cinematic Center-Screen Act Transition Banner
    this.bannerContainer = this.add.container(width / 2, 240).setScrollFactor(0).setAlpha(0).setDepth(100);
    this.bannerBg = this.add.graphics();
    this.bannerBg.fillStyle(0x090a0f, 0.92);
    this.bannerBg.lineStyle(2, 0xf59e0b, 0.95);
    this.bannerBg.fillRoundedRect(-240, -45, 480, 90, 10);
    this.bannerBg.strokeRoundedRect(-240, -45, 480, 90, 10);

    this.bannerTitleText = this.add.text(0, -18, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '19px',
      color: '#fef08a',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    this.bannerSubText = this.add.text(0, 14, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#9ca3af',
    }).setOrigin(0.5, 0.5);

    this.bannerContainer.add([this.bannerBg, this.bannerTitleText, this.bannerSubText]);

    // Right Control Guide HUD
    this.statusText = this.add.text(
      width - 20,
      20,
      'A / D (← / →) : Balance Torque | Hold Space : Accordion Jump',
      {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#d1d5db',
        backgroundColor: 'rgba(18, 19, 22, 0.88)',
        padding: { x: 12, y: 7 },
      }
    ).setOrigin(1, 0).setScrollFactor(0);

    // Dynamic Gauges Container (Pinned top right below guide)
    this.hudBellowsBar = this.add.graphics().setScrollFactor(0);
    this.hudBalanceGauge = this.add.graphics().setScrollFactor(0);
    this.hudProgressionGfx = this.add.graphics().setScrollFactor(0);

    // Active Buff Indicator HUD Badge
    this.activeBuffBadgeBg = this.add.graphics().setScrollFactor(0);
    this.activeBuffBadgeText = this.add.text(32, 100, '', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setScrollFactor(0);
  }

  private drawBadgeBg(strokeColor: number): void {
    this.actBadgeBg.clear();
    this.actBadgeBg.fillStyle(0x121316, 0.92);
    this.actBadgeBg.lineStyle(1, strokeColor, 0.85);
    this.actBadgeBg.fillRoundedRect(20, 20, 320, 68, 8);
    this.actBadgeBg.strokeRoundedRect(20, 20, 320, 68, 8);
  }

  private applyInstantActPalette(act: number): void {
    const actDef = store.getActDefinition(act);
    if (!actDef) return;

    // Hot-swap midground architecture texture key for active Act
    const midLayer = this.layers.find((l) => l.name === 'midground');
    if (midLayer) {
      midLayer.tileSprite.setTexture(`bg_midground_act${act}`);
    }

    for (const layer of this.layers) {
      const tintHex = actDef.visualPalette[layer.name] ?? 0xffffff;
      layer.tileSprite.setTint(tintHex);
      layer.currentTint = tintHex;
    }
  }

  private handleActTransition(act: number, name: string): void {
    const actDef = store.getActDefinition(act);
    if (!actDef) return;

    // Hot-swap midground architecture texture key to match the new Act
    const midLayer = this.layers.find((l) => l.name === 'midground');
    if (midLayer) {
      midLayer.tileSprite.setTexture(`bg_midground_act${act}`);
    }

    // 1. Update Act Badge Text and Pulse Animation
    if (this.actBadgeText) {
      this.actBadgeText.setText(`ACT ${act}: ${name.toUpperCase()}`);
      this.tweens.add({
        targets: this.actBadgeText,
        scaleX: 1.12,
        scaleY: 1.12,
        duration: 200,
        yoyo: true,
        ease: 'Quad.easeInOut',
      });
      this.drawBadgeBg(0xfbbf24);
      this.time.delayedCall(800, () => this.drawBadgeBg(0xf59e0b));
    }

    // 2. Cinematic Center Banner Announcement
    if (this.bannerContainer && this.bannerTitleText && this.bannerSubText) {
      this.bannerTitleText.setText(`ACT ${act}: ${name.toUpperCase()}`);
      this.bannerSubText.setText(actDef.subtitle);
      this.bannerContainer.setY(220);

      this.tweens.killTweensOf(this.bannerContainer);
      this.tweens.add({
        targets: this.bannerContainer,
        alpha: { from: 0, to: 1 },
        y: 240,
        duration: 450,
        ease: 'Cubic.easeOut',
        hold: 2000,
        yoyo: true,
      });
    }

    // 3. Smooth Parallax Tint Tweens across all 5 layers
    const targetPalette = actDef.visualPalette;

    for (const layer of this.layers) {
      const fromColor = Phaser.Display.Color.ValueToColor(layer.currentTint);
      const targetHex = targetPalette[layer.name] ?? 0xffffff;
      const toColor = Phaser.Display.Color.ValueToColor(targetHex);

      const colorTweenObj = { progress: 0 };
      this.tweens.add({
        targets: colorTweenObj,
        progress: 1,
        duration: 2500,
        ease: 'Quad.easeInOut',
        onUpdate: () => {
          const interpolated = Phaser.Display.Color.Interpolate.ColorWithColor(
            fromColor,
            toColor,
            100,
            Math.round(colorTweenObj.progress * 100)
          );
          const currentHex = Phaser.Display.Color.GetColor(
            interpolated.r,
            interpolated.g,
            interpolated.b
          );
          layer.tileSprite.setTint(currentHex);
          layer.currentTint = currentHex;
        },
        onComplete: () => {
          layer.tileSprite.setTint(targetHex);
          layer.currentTint = targetHex;
        },
      });
    }
  }

  private spawnObstaclesAndTips(): void {
    const cameraLookAhead = this.robot.x + 950;
    if (cameraLookAhead <= this.nextSpawnX) return;

    const spawnX = this.nextSpawnX;
    const scenario = Phaser.Math.Between(0, 3);
    const activeAct = store.getState().activeAct || 1;
    const crateKey = `hazard_crate_act${activeAct}`;
    const puddleKey = `hazard_puddle_act${activeAct}`;

    switch (scenario) {
      case 0: {
        // Crate Hazard on Ground + Parabolic Tip Arc
        const crate = this.hazardsGroup.create(spawnX, 562, crateKey) as Phaser.Physics.Arcade.Sprite;
        crate.setOrigin(0.5, 0.5);
        (crate.body as Phaser.Physics.Arcade.Body)?.setSize(38, 38);
        crate.setData('hazardType', 'crate');

        // Tip Arc (3 gears)
        this.createTip(spawnX - 55, 510);
        this.createTip(spawnX, 450);
        this.createTip(spawnX + 55, 510);
        break;
      }
      case 1: {
        // Murky Puddle Hazard + High Bonus Tip
        const puddle = this.hazardsGroup.create(spawnX, 576, puddleKey) as Phaser.Physics.Arcade.Sprite;
        puddle.setOrigin(0.5, 0.5);
        (puddle.body as Phaser.Physics.Arcade.Body)?.setSize(52, 14);
        puddle.setData('hazardType', 'puddle');

        this.createTip(spawnX, 465);
        this.createTip(spawnX + 70, 520);
        break;
      }
      case 2: {
        // Ground Tip Run (3 consecutive tips)
        this.createTip(spawnX, 545);
        this.createTip(spawnX + 45, 545);
        this.createTip(spawnX + 90, 545);
        break;
      }
      case 3: {
        // Double Crate Hurdle (Tightened to 45px for single wide hurdle) + Jump Arc (4 tips)
        const crate1 = this.hazardsGroup.create(spawnX, 562, crateKey) as Phaser.Physics.Arcade.Sprite;
        crate1.setOrigin(0.5, 0.5);
        (crate1.body as Phaser.Physics.Arcade.Body)?.setSize(38, 38);
        crate1.setData('hazardType', 'crate');

        const crate2 = this.hazardsGroup.create(spawnX + 45, 562, crateKey) as Phaser.Physics.Arcade.Sprite;
        crate2.setOrigin(0.5, 0.5);
        (crate2.body as Phaser.Physics.Arcade.Body)?.setSize(38, 38);
        crate2.setData('hazardType', 'crate');

        this.createTip(spawnX - 25, 495);
        this.createTip(spawnX + 5, 435);
        this.createTip(spawnX + 40, 435);
        this.createTip(spawnX + 70, 495);
        break;
      }
    }

    this.nextSpawnX += Phaser.Math.Between(360, 540);
  }

  private createTip(x: number, y: number): Phaser.Physics.Arcade.Sprite {
    const tip = this.tipsGroup.create(x, y, 'item_tip_gear') as Phaser.Physics.Arcade.Sprite;
    tip.setOrigin(0.5, 0.5);
    (tip.body as Phaser.Physics.Arcade.Body)?.setSize(22, 22);

    // Subtle floating bob animation
    this.tweens.add({
      targets: tip,
      y: y - 6,
      duration: 800 + Math.random() * 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    return tip;
  }

  private handleCollectTip(_robot: any, tipObj: any): void {
    const tip = tipObj as Phaser.Physics.Arcade.Sprite;
    if (!tip.active) return;

    const tx = tip.x;
    const ty = tip.y;
    tip.disableBody(true, true);
    tip.destroy();

    store.addTips(1);

    // Visual floating "+1 ⚙️" feedback
    const floatText = this.add.text(tx, ty - 10, '+1 ⚙️', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#fbbf24',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    this.tweens.add({
      targets: floatText,
      y: ty - 38,
      alpha: 0,
      duration: 600,
      ease: 'Power1',
      onComplete: () => floatText.destroy(),
    });
  }

  private handleCollectPowerup(_robot: any, powerupObj: any): void {
    const powerup = powerupObj as Phaser.Physics.Arcade.Sprite;
    if (!powerup.active) return;

    const px = powerup.x;
    const py = powerup.y;
    const buffType = powerup.getData('buffType') as BuffType;

    powerup.disableBody(true, true);
    powerup.destroy();

    // Activate 12-second gameplay buff
    store.activateBuff(buffType, 12);

    let indicator = 'POWER UP!';
    let textColor = '#ffffff';

    switch (buffType) {
      case 'tips':
        indicator = '2X TIPS! 🌻';
        textColor = '#fbbf24';
        break;
      case 'balance':
        indicator = '+50% STABILITY! 🍾';
        textColor = '#34d399';
        break;
      case 'jump':
        indicator = 'SUPER JUMP & SHIELD! ⚡';
        textColor = '#38bdf8';
        break;
    }

    // Floating text indicator
    const floatText = this.add.text(px, py - 15, indicator, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '15px',
      color: textColor,
      fontStyle: 'bold',
      stroke: '#18181b',
      strokeThickness: 3,
    }).setOrigin(0.5, 0.5);

    this.tweens.add({
      targets: floatText,
      y: py - 60,
      alpha: 0,
      duration: 900,
      ease: 'Cubic.easeOut',
      onComplete: () => floatText.destroy(),
    });
  }

  private handleHitHazard(_robot: any, hazardObj: any): void {
    const hazard = hazardObj as Phaser.Physics.Arcade.Sprite;
    if (!hazard.active || hazard.getData('hit')) return;

    // Super Jump & Hazard Invulnerability Buff Bypass
    if (store.getState().activeBuff === 'jump') {
      hazard.setData('hit', true);
      const hx = hazard.x;
      const hy = hazard.y;

      // Shatter hazard with electric cyan energy
      hazard.setTint(0x38bdf8);
      this.tweens.add({
        targets: hazard,
        alpha: 0,
        y: hy - 45,
        angle: 75,
        scaleX: 0.6,
        scaleY: 0.6,
        duration: 400,
        ease: 'Cubic.easeIn',
        onComplete: () => hazard.destroy(),
      });

      // Floating "SMASHED! ⚡" feedback indicator
      const smashText = this.add.text(hx, hy - 25, 'SMASHED! ⚡', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#38bdf8',
        fontStyle: 'bold',
        stroke: '#082f49',
        strokeThickness: 3,
      }).setOrigin(0.5, 0.5);

      this.tweens.add({
        targets: smashText,
        y: hy - 58,
        alpha: 0,
        duration: 650,
        ease: 'Power2',
        onComplete: () => smashText.destroy(),
      });

      // Completely bypass stumble, camera shake, and momentum penalties!
      return;
    }

    hazard.setData('hit', true);
    hazard.setTint(0xef4444);

    const hx = hazard.x;
    const hy = hazard.y;
    const hazardType = (hazard.getData('hazardType') as 'crate' | 'puddle') ?? 'crate';

    this.robot.triggerStumble(0.85);
    store.applyStumblePenalty();

    this.cameras.main.shake(180, 0.005);

    eventBus.emit('HAZARD_HIT', {
      x: hx,
      y: hy,
      hazardType,
    });

    // Floating Stumble text indicator
    const stumbleText = this.add.text(hx, hy - 25, 'STUMBLE! ⚠️', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#ef4444',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    this.tweens.add({
      targets: stumbleText,
      y: hy - 50,
      alpha: 0,
      duration: 750,
      ease: 'Power2',
      onComplete: () => stumbleText.destroy(),
    });
  }

  private recycleOffscreenEntities(): void {
    const despawnX = this.cameras.main.scrollX - 250;

    this.tipsGroup.getChildren().forEach((child) => {
      const sprite = child as Phaser.Physics.Arcade.Sprite;
      if (sprite.x < despawnX) {
        sprite.destroy();
      }
    });

    this.hazardsGroup.getChildren().forEach((child) => {
      const sprite = child as Phaser.Physics.Arcade.Sprite;
      if (sprite.x < despawnX) {
        sprite.destroy();
      }
    });

    this.powerupsGroup.getChildren().forEach((child) => {
      const sprite = child as Phaser.Physics.Arcade.Sprite;
      if (sprite.x < despawnX) {
        sprite.destroy();
      }
    });
  }

  private updateHUD(width: number): void {
    if (!this.robot) return;

    const pressure = this.robot.getBellowsPressure();
    const stabilityRatio = this.robot.getStabilityRatio();
    const isStumbling = this.robot.getIsStumbling();
    const wobbleAngle = this.robot.getWobbleAngle();
    const gameState = store.getState();

    // 1. Update Progression Info
    this.tipsText.setText(`⚙️ Tips: ${gameState.tips}`);
    this.momentumText.setText(`⚡ ${Math.round(gameState.momentum)}% [T${gameState.momentumTier}: ${gameState.tierName}]`);

    // Top-left momentum progress bar
    this.hudProgressionGfx.clear();
    const progX = 32;
    const progY = 66;
    const progW = 296;
    const progH = 6;

    this.hudProgressionGfx.fillStyle(0x18181b, 0.9);
    this.hudProgressionGfx.fillRoundedRect(progX, progY, progW, progH, 2);

    if (gameState.momentum > 0) {
      const fillW = Math.max(4, (progW) * (gameState.momentum / 100));
      const tierColor = gameState.momentumTier >= 3 ? 0xa855f7 : gameState.momentumTier >= 1 ? 0xf59e0b : 0x10b981;
      this.hudProgressionGfx.fillStyle(tierColor, 0.95);
      this.hudProgressionGfx.fillRoundedRect(progX, progY, fillW, progH, 2);
    }

    // 2. Bellows Pressure Bar (Top Right)
    this.hudBellowsBar.clear();
    const barX = width - 260;
    const barY = 56;
    const barW = 240;
    const barH = 14;

    this.hudBellowsBar.fillStyle(0x18181b, 0.85);
    this.hudBellowsBar.fillRoundedRect(barX, barY, barW, barH, 4);
    this.hudBellowsBar.lineStyle(1, 0x3f3f46, 0.8);
    this.hudBellowsBar.strokeRoundedRect(barX, barY, barW, barH, 4);

    if (pressure > 0.01) {
      const fillW = Math.max(4, (barW - 4) * pressure);
      this.hudBellowsBar.fillStyle(0xf59e0b, 0.95);
      this.hudBellowsBar.fillRoundedRect(barX + 2, barY + 2, fillW, barH - 4, 2);
    }

    // 3. Wobble Balance Gauge
    this.hudBalanceGauge.clear();
    const gaugeY = 76;

    this.hudBalanceGauge.fillStyle(0x18181b, 0.85);
    this.hudBalanceGauge.fillRoundedRect(barX, gaugeY, barW, 10, 3);
    this.hudBalanceGauge.fillStyle(0x52525b, 0.8);
    this.hudBalanceGauge.fillRect(barX + barW / 2 - 1, gaugeY, 2, 10);

    const needleOffset = (wobbleAngle / 0.38) * (barW / 2 - 8);
    const needleX = Phaser.Math.Clamp(barX + barW / 2 + needleOffset, barX + 4, barX + barW - 4);
    const needleColor = isStumbling ? 0xef4444 : stabilityRatio > 0.75 ? 0xf59e0b : 0x10b981;

    this.hudBalanceGauge.fillStyle(needleColor, 1);
    this.hudBalanceGauge.fillCircle(needleX, gaugeY + 5, 4);

    // Status label text
    if (isStumbling) {
      this.statusText.setText('⚠️ STUMBLE! Rhythm Warped (Recovering...)');
      this.statusText.setColor('#ef4444');
    } else if (pressure > 0) {
      this.statusText.setText(`💨 Charging Bellows: ${Math.round(pressure * 100)}% (Release Space to Jump)`);
      this.statusText.setColor('#f59e0b');
    } else {
      this.statusText.setText('A / D (← / →) : Balance Torque | Hold Space : Accordion Jump');
      this.statusText.setColor('#d1d5db');
    }

    // 4. Active Buff Indicator (Under Act Badge at top-left)
    this.activeBuffBadgeBg.clear();
    if (gameState.activeBuff && gameState.buffTimeRemaining > 0) {
      const remainingSec = Math.ceil(gameState.buffTimeRemaining);
      let buffTitle = '';
      let badgeStroke = 0xf59e0b;
      let badgeFill = 0x271900;
      let textColor = '#fbbf24';

      switch (gameState.activeBuff) {
        case 'tips':
          buffTitle = `🌻 2X TIPS (${remainingSec}s)`;
          badgeStroke = 0xf59e0b;
          badgeFill = 0x271900;
          textColor = '#fbbf24';
          break;
        case 'balance':
          buffTitle = `🍾 +50% STABILITY (${remainingSec}s)`;
          badgeStroke = 0x10b981;
          badgeFill = 0x022c22;
          textColor = '#34d399';
          break;
        case 'jump':
          buffTitle = `⚡ SUPER JUMP & SHIELD (${remainingSec}s)`;
          badgeStroke = 0x06b6d4;
          badgeFill = 0x082f49;
          textColor = '#38bdf8';
          break;
      }

      const badgeX = 20;
      const badgeY = 96;
      const badgeW = 220;
      const badgeH = 26;

      this.activeBuffBadgeBg.fillStyle(badgeFill, 0.92);
      this.activeBuffBadgeBg.fillRoundedRect(badgeX, badgeY, badgeW, badgeH, 6);
      this.activeBuffBadgeBg.lineStyle(1.5, badgeStroke, 0.9);
      this.activeBuffBadgeBg.strokeRoundedRect(badgeX, badgeY, badgeW, badgeH, 6);

      // Remaining duration bar beneath text
      const progressRatio = Phaser.Math.Clamp(gameState.buffTimeRemaining / (gameState.buffDuration || 12), 0, 1);
      this.activeBuffBadgeBg.fillStyle(badgeStroke, 0.7);
      this.activeBuffBadgeBg.fillRoundedRect(badgeX + 4, badgeY + badgeH - 4, (badgeW - 8) * progressRatio, 2, 1);

      this.activeBuffBadgeText.setText(buffTitle);
      this.activeBuffBadgeText.setColor(textColor);
      this.activeBuffBadgeText.setPosition(badgeX + 10, badgeY + 6);
      this.activeBuffBadgeText.setVisible(true);
    } else {
      this.activeBuffBadgeText.setVisible(false);
    }
  }

  private spawnFloatingPowerups(time: number): void {
    if (time < this.nextPowerupSpawnTime) return;

    // Low-chance check: 40% chance every check cycle
    if (Math.random() > 0.4) {
      this.nextPowerupSpawnTime = time + 2500;
      return;
    }

    // Interval between 14 and 22 seconds
    this.nextPowerupSpawnTime = time + Phaser.Math.Between(14000, 22000);

    const cameraRightEdge = this.cameras.main.scrollX + this.scale.width + 60;
    const baseY = Phaser.Math.Between(410, 490);

    const buffTypes: BuffType[] = ['tips', 'balance', 'jump'];
    const selectedBuff = Phaser.Utils.Array.GetRandom(buffTypes);

    let textureKey = 'powerup_sunflower';
    if (selectedBuff === 'balance') textureKey = 'powerup_brandy';
    else if (selectedBuff === 'jump') textureKey = 'powerup_steam';

    const powerup = this.powerupsGroup.create(cameraRightEdge, baseY, textureKey) as Phaser.Physics.Arcade.Sprite;
    powerup.setOrigin(0.5, 0.5);
    (powerup.body as Phaser.Physics.Arcade.Body)?.setSize(28, 28);
    powerup.setData('buffType', selectedBuff);
    powerup.setData('baseY', baseY);
    powerup.setData('phaseOffset', Math.random() * Math.PI * 2);

    // Drifting leftward at autoWalkSpeed * 1.5
    (powerup.body as Phaser.Physics.Arcade.Body)?.setVelocityX(-Robot.AUTO_WALK_SPEED * 1.5);
  }

  private updatePowerupSinusoidalDrift(time: number): void {
    this.powerupsGroup.getChildren().forEach((child) => {
      const powerup = child as Phaser.Physics.Arcade.Sprite;
      if (powerup.active) {
        const baseY = powerup.getData('baseY') as number;
        const phase = (powerup.getData('phaseOffset') as number) || 0;
        // Sinusoidal vertical bobbing
        powerup.y = baseY + Math.sin(time * 0.0035 + phase) * 32;
        // Maintain leftward velocity
        (powerup.body as Phaser.Physics.Arcade.Body)?.setVelocityX(-Robot.AUTO_WALK_SPEED * 1.5);
      }
    });
  }

  override update(time: number, delta: number): void {
    if (this.isGameOver || this.isVictory || this.isPaused) return;

    const dt = Math.min(delta / 1000, 0.1);

    // 1. Passive momentum decay
    store.decayMomentum(dt);

    // 2. Gather Inputs
    const leftDown = Boolean(this.cursors?.left.isDown || this.keyA?.isDown);
    const rightDown = Boolean(this.cursors?.right.isDown || this.keyD?.isDown);
    const jumpDown = Boolean(this.cursors?.space?.isDown || this.keySpace?.isDown || this.keyW?.isDown || this.cursors?.up.isDown);

    const inputs: RobotInputs = {
      left: leftDown,
      right: rightDown,
      jump: jumpDown,
    };

    // 3. Update Robot Entity
    if (this.robot) {
      this.robot.update(time, delta, inputs);
    }

    // 4. Procedural Spawner, Power-Up Wave & Recycling
    this.spawnObstaclesAndTips();
    this.spawnFloatingPowerups(time);
    this.updatePowerupSinusoidalDrift(time);
    this.recycleOffscreenEntities();

    // 5. Update Parallax Background Layers based on camera position
    const cameraScrollX = this.cameras.main.scrollX;
    for (const layer of this.layers) {
      layer.tileSprite.tilePositionX = cameraScrollX * layer.scrollSpeedFactor;
    }

    // 6. Update Distance Progression in State Store
    store.updateDistance(cameraScrollX);

    // Auto-collapse audio studio rack once player crosses 1,200px in Act 1 for full-screen view
    if (!this.hasAutoCollapsedSidebar && store.getState().distanceTraveled >= 1200) {
      this.hasAutoCollapsedSidebar = true;
      eventBus.emit('UI_SET_SIDEBAR', { collapsed: true });
    }

    // 7. Update HUD
    this.updateHUD(this.scale.width);
  }

  private handleGameOver(distanceTraveled: number, tips: number): void {
    if (this.isGameOver || this.isVictory) return;
    this.isGameOver = true;

    // Pause physics engine
    this.physics.pause();

    // Dramatic passed-out face-plant animation tween
    this.tweens.add({
      targets: this.robot,
      angle: 85,
      y: 584,
      duration: 750,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        this.showGameOverOverlay(distanceTraveled, tips);
      },
    });
  }

  private showGameOverOverlay(distanceTraveled: number, tips: number): void {
    const { width, height } = this.scale;
    const overlay = this.add.container(width / 2, height / 2).setScrollFactor(0).setDepth(200);

    // Dark backdrop
    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x05070e, 0.88);
    backdrop.fillRect(-width / 2, -height / 2, width, height);

    // Card frame
    const card = this.add.graphics();
    card.fillStyle(0x18181b, 0.96);
    card.fillRoundedRect(-240, -170, 480, 340, 16);
    card.lineStyle(2, 0xef4444, 0.9);
    card.strokeRoundedRect(-240, -170, 480, 340, 16);

    const title = this.add
      .text(0, -120, 'PASSED OUT IN THE GUTTERS', {
        fontFamily: 'Georgia, serif',
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#ef4444',
      })
      .setOrigin(0.5);

    const desc = this.add
      .text(0, -75, 'The drunken automaton ran out of rhythmic momentum\nand collapsed on the rain-slick cobblestones.', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#cbd5e1',
        align: 'center',
        lineSpacing: 4,
      })
      .setOrigin(0.5);

    const stats = this.add
      .text(0, -15, `Distance: ${Math.floor(distanceTraveled)} px   •   Tips Busked: ${tips} 🪙`, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#fbbf24',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Try Again Button
    const btnContainer = this.add.container(0, 75);
    const btnGlow = this.add.graphics();
    btnGlow.fillStyle(0xd97706, 0.25);
    btnGlow.fillRoundedRect(-140, -26, 280, 52, 26);

    const btnBg = this.add.graphics();
    btnBg.fillGradientStyle(0xd97706, 0xd97706, 0xb45309, 0x92400e, 1);
    btnBg.fillRoundedRect(-130, -22, 260, 44, 22);
    btnBg.lineStyle(2, 0xfde68a, 0.85);
    btnBg.strokeRoundedRect(-130, -22, 260, 44, 22);

    const btnText = this.add
      .text(0, 0, '🔄 TRY AGAIN', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#ffffff',
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    btnContainer.add([btnGlow, btnBg, btnText]);

    this.tweens.add({
      targets: [btnGlow, btnBg, btnText],
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const hitZone = this.add
      .zone(0, 75, 260, 44)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const restartAction = (): void => {
      store.reset();
      eventBus.emit('RESTART_GAME', {});
      this.scene.restart();
    };

    hitZone.on('pointerdown', restartAction);
    this.input.keyboard?.once('keydown-SPACE', restartAction);
    this.input.keyboard?.once('keydown-ENTER', restartAction);

    overlay.add([backdrop, card, title, desc, stats, btnContainer, hitZone]);
    this.gameOverOverlay = overlay;
  }

  private handleVictory(): void {
    if (this.isVictory || this.isGameOver) return;
    this.isVictory = true;

    // Stop robot movement
    if (this.robot && this.robot.body) {
      this.robot.body.setVelocity(0, 0);
    }

    // Fade camera smoothly to warm black, then launch EndScene
    this.cameras.main.fade(1200, 10, 14, 24);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('EndScene');
    });
  }

  public togglePause(): void {
    if (this.isGameOver || this.isVictory) return;
    store.togglePause();
  }

  private handlePauseChange(paused: boolean): void {
    if (this.isGameOver || this.isVictory) return;
    if (this.isPaused === paused && !paused && !this.pauseOverlay) return;

    this.isPaused = paused;

    if (paused) {
      this.physics.pause();
      if (this.robot) {
        this.tweens.getTweensOf(this.robot).forEach((t) => t.pause());
      }
      this.showPauseOverlay();
    } else {
      this.physics.resume();
      if (this.robot) {
        this.tweens.getTweensOf(this.robot).forEach((t) => t.resume());
      }
      this.hidePauseOverlay();
    }
  }

  private showPauseOverlay(): void {
    if (this.pauseOverlay) return;

    const { width, height } = this.scale;
    const overlay = this.add.container(width / 2, height / 2).setScrollFactor(0).setDepth(250);

    // Darkened backdrop
    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x05070e, 0.85);
    backdrop.fillRect(-width / 2, -height / 2, width, height);

    // Card frame
    const card = this.add.graphics();
    card.fillStyle(0x18181b, 0.96);
    card.fillRoundedRect(-240, -165, 480, 330, 16);
    card.lineStyle(2, 0xf59e0b, 0.9);
    card.strokeRoundedRect(-240, -165, 480, 330, 16);

    const title = this.add
      .text(0, -118, 'GAME PAUSED', {
        fontFamily: 'Georgia, serif',
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#f59e0b',
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    const desc = this.add
      .text(0, -74, 'The automaton rests its weary brass gears.\nRhythm and journey are temporarily suspended.', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#cbd5e1',
        align: 'center',
        lineSpacing: 4,
      })
      .setOrigin(0.5);

    const state = store.getState();
    const stats = this.add
      .text(
        0,
        -22,
        `Act ${state.activeAct}: ${state.actName.toUpperCase()}  •  Distance: ${Math.floor(state.distanceTraveled)} px  •  Tips: ${state.tips} ⚙️`,
        {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#fbbf24',
        }
      )
      .setOrigin(0.5);

    // 1. Resume Button
    const btnResumeContainer = this.add.container(0, 32);
    const resumeGlow = this.add.graphics();
    resumeGlow.fillStyle(0xd97706, 0.25);
    resumeGlow.fillRoundedRect(-130, -22, 260, 44, 22);

    const resumeBg = this.add.graphics();
    resumeBg.fillGradientStyle(0xd97706, 0xd97706, 0xb45309, 0x92400e, 1);
    resumeBg.fillRoundedRect(-120, -18, 240, 36, 18);
    resumeBg.lineStyle(2, 0xfde68a, 0.85);
    resumeBg.strokeRoundedRect(-120, -18, 240, 36, 18);

    const resumeText = this.add
      .text(0, 0, '▶ RESUME', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#ffffff',
        letterSpacing: 1.5,
      })
      .setOrigin(0.5);

    btnResumeContainer.add([resumeGlow, resumeBg, resumeText]);

    const resumeHit = this.add
      .zone(0, 32, 240, 36)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    resumeHit.on('pointerdown', () => {
      store.setPaused(false);
    });

    // 2. Restart Button
    const btnRestartContainer = this.add.container(0, 84);
    const restartBg = this.add.graphics();
    restartBg.fillStyle(0x27272a, 0.95);
    restartBg.fillRoundedRect(-120, -18, 240, 36, 18);
    restartBg.lineStyle(1, 0x71717a, 0.8);
    restartBg.strokeRoundedRect(-120, -18, 240, 36, 18);

    const restartText = this.add
      .text(0, 0, '🔄 RESTART JOURNEY', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#e4e4e7',
        letterSpacing: 1,
      })
      .setOrigin(0.5);

    btnRestartContainer.add([restartBg, restartText]);

    const restartHit = this.add
      .zone(0, 84, 240, 36)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const restartAction = (): void => {
      this.hidePauseOverlay();
      store.setPaused(false);
      store.reset();
      eventBus.emit('RESTART_GAME', {});
      this.scene.restart();
    };

    restartHit.on('pointerdown', restartAction);

    // Keyboard shortcut hint
    const hint = this.add
      .text(0, 130, '[P] or [ESC] : Resume   •   [R] : Restart', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#9ca3af',
      })
      .setOrigin(0.5);

    const onKeyR = (event: KeyboardEvent) => {
      if (event.code === 'KeyR' && this.isPaused) {
        window.removeEventListener('keydown', onKeyR);
        restartAction();
      }
    };
    window.addEventListener('keydown', onKeyR);

    overlay.once('destroy', () => {
      window.removeEventListener('keydown', onKeyR);
    });

    overlay.add([
      backdrop,
      card,
      title,
      desc,
      stats,
      btnResumeContainer,
      resumeHit,
      btnRestartContainer,
      restartHit,
      hint,
    ]);

    this.pauseOverlay = overlay;
  }

  private hidePauseOverlay(): void {
    if (this.pauseOverlay) {
      this.pauseOverlay.destroy();
      this.pauseOverlay = undefined;
    }
  }

  private cleanupListeners(): void {
    if (this.unsubActChange) {
      this.unsubActChange();
      this.unsubActChange = undefined;
    }
    if (this.unsubGameOver) {
      this.unsubGameOver();
      this.unsubGameOver = undefined;
    }
    if (this.unsubVictory) {
      this.unsubVictory();
      this.unsubVictory = undefined;
    }
    if (this.unsubGamePause) {
      this.unsubGamePause();
      this.unsubGamePause = undefined;
    }
    if (this.gameOverOverlay) {
      this.gameOverOverlay.destroy();
      this.gameOverOverlay = undefined;
    }
    this.hidePauseOverlay();
    if (this.keyP) {
      this.keyP.removeAllListeners();
    }
    if (this.keyEsc) {
      this.keyEsc.removeAllListeners();
    }
  }
}

