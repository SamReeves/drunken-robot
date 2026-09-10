import Phaser from 'phaser';
import { Robot, type RobotContext, type RobotInputs } from '../entities/Robot.ts';
import { store } from '../../state/store.ts';
import { eventBus, type BuffType } from '../../state/eventBus.ts';
import { ensureActTextures, releaseActTextures } from '../art/textureFactory.ts';
import {
  HUD_REGISTRY_KEY,
  SceneKeys,
  type EndSceneData,
  type HudTelemetry,
  type RunOutcome,
} from './keys.ts';

interface ParallaxLayer {
  name: 'sky' | 'distant' | 'midground' | 'street' | 'foreground';
  tileSprite: Phaser.GameObjects.TileSprite;
  scrollSpeedFactor: number;
  currentTint: number;
}

/**
 * StreetScene - the run itself: parallax world, robot, spawner, collisions.
 * Readouts live in HudScene, the pause menu in PauseScene, and both outcomes
 * in EndScene, so this scene only owns the world.
 */
export class StreetScene extends Phaser.Scene {
  private static readonly GROUND_Y = 584;
  private static readonly POWERUP_INITIAL_DELAY_MS = 8000;
  private static readonly POWERUP_RETRY_DELAY_MS = 2500;
  private static readonly POWERUP_MIN_INTERVAL_MS = 14000;
  private static readonly POWERUP_MAX_INTERVAL_MS = 22000;
  private static readonly POWERUP_SPAWN_CHANCE = 0.4;
  private static readonly BUFF_DURATION_SEC = 12;
  private static readonly HAZARD_SPECS = {
    crate: { width: 38, height: 38, y: 562 },
    puddle: { width: 52, height: 14, y: 576 },
  } as const;

  private layers: ParallaxLayer[] = [];
  private robot!: Robot;
  private groundPlatform!: Phaser.GameObjects.Rectangle;
  private tipsGroup!: Phaser.Physics.Arcade.Group;
  private hazardsGroup!: Phaser.Physics.Arcade.Group;
  private powerupsGroup!: Phaser.Physics.Arcade.Group;
  private nextSpawnX = 750;
  private powerupCooldownMs = StreetScene.POWERUP_INITIAL_DELAY_MS;

  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA?: Phaser.Input.Keyboard.Key;
  private keyD?: Phaser.Input.Keyboard.Key;
  private keyW?: Phaser.Input.Keyboard.Key;
  private keySpace?: Phaser.Input.Keyboard.Key;
  private keyP?: Phaser.Input.Keyboard.Key;
  private keyEsc?: Phaser.Input.Keyboard.Key;

  private isRunOver = false;
  private isPaused = false;
  private restartRequested = false;
  private unsubscribers: Array<() => void> = [];

  constructor() {
    super({ key: SceneKeys.Street });
  }

  create(): void {
    const { width, height } = this.scale;
    this.layers = [];
    this.nextSpawnX = 750;
    this.isRunOver = false;
    this.isPaused = false;
    this.restartRequested = false;
    this.powerupCooldownMs = StreetScene.POWERUP_INITIAL_DELAY_MS;

    // Tear down anything left from a previous run *before* registering new listeners.
    this.cleanupListeners();
    this.physics.resume();

    // 1. Parallax layers pinned to the camera
    const initialAct = store.getState().activeAct || 1;
    ensureActTextures(this, initialAct);
    ensureActTextures(this, initialAct + 1);
    const addLayer = (name: ParallaxLayer['name'], key: string, factor: number): void => {
      const tileSprite = this.add.tileSprite(0, 0, width, height, key).setOrigin(0, 0).setScrollFactor(0);
      this.layers.push({ name, tileSprite, scrollSpeedFactor: factor, currentTint: 0xffffff });
    };
    addLayer('sky', 'bg_sky', 0.1);
    addLayer('distant', 'bg_distant', 0.25);
    addLayer('midground', `bg_midground_act${initialAct}`, 0.55);
    addLayer('street', 'bg_street', 1.0);
    addLayer('foreground', 'bg_foreground', 1.25);

    // 2. Ground platform at the curb baseline
    this.groundPlatform = this.add
      .rectangle(0, StreetScene.GROUND_Y, 500000, 60, 0x000000, 0)
      .setOrigin(0, 0);
    this.physics.add.existing(this.groundPlatform, true);

    // 3. Object groups
    const groupConfig = { allowGravity: false, immovable: true };
    this.tipsGroup = this.physics.add.group(groupConfig);
    this.hazardsGroup = this.physics.add.group(groupConfig);
    this.powerupsGroup = this.physics.add.group(groupConfig);

    // 4. Robot
    this.robot = new Robot(this, 320, 520);
    this.physics.add.collider(this.robot, this.groundPlatform);
    this.physics.add.overlap(this.robot, this.tipsGroup, (_r, obj) =>
      this.handleCollectTip(obj as Phaser.Physics.Arcade.Sprite),
    );
    this.physics.add.overlap(this.robot, this.hazardsGroup, (_r, obj) =>
      this.handleHitHazard(obj as Phaser.Physics.Arcade.Sprite),
    );
    this.physics.add.overlap(this.robot, this.powerupsGroup, (_r, obj) =>
      this.handleCollectPowerup(obj as Phaser.Physics.Arcade.Sprite),
    );

    // 5. Camera
    this.cameras.main.startFollow(this.robot, true, 0.08, 0.08, -140, 50);
    this.cameras.main.setBounds(0, 0, Number.MAX_SAFE_INTEGER, 720);

    // 6. Input
    this.setupInputControls();

    // 7. Bus listeners
    this.unsubscribers = [
      eventBus.on('ACT_CHANGE', (p) => this.handleActTransition(p.act)),
      eventBus.on('GAME_OVER', () => this.handleGameOver()),
      eventBus.on('VICTORY', () => this.handleVictory()),
      eventBus.on('GAME_PAUSE', (p) => this.handlePauseChange(p.isPaused)),
    ];
    this.events.once('shutdown', () => {
      this.cleanupListeners();
      this.scene.stop(SceneKeys.Hud);
      this.scene.stop(SceneKeys.Pause);
    });

    this.applyInstantActPalette(initialAct);

    // 8. Readouts live in their own scene on top of this one
    this.scene.launch(SceneKeys.Hud);
  }

  private setupInputControls(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) return;
    this.cursors = keyboard.createCursorKeys();
    this.keyA = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keySpace = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyP = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.keyEsc = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.keyP.on('down', () => this.togglePause());
    this.keyEsc.on('down', () => this.togglePause());
  }

  // ---------------------------------------------------------------
  // Acts and palette
  // ---------------------------------------------------------------

  private applyInstantActPalette(act: number): void {
    const actDef = store.getActDefinition(act);
    this.layers.find((l) => l.name === 'midground')?.tileSprite.setTexture(`bg_midground_act${act}`);
    for (const layer of this.layers) {
      const tint = actDef.visualPalette[layer.name] ?? 0xffffff;
      layer.tileSprite.setTint(tint);
      layer.currentTint = tint;
    }
  }

  private handleActTransition(act: number): void {
    const actDef = store.getActDefinition(act);

    // Keep only the current and next midgrounds resident (each is a 2560x720 texture).
    ensureActTextures(this, act);
    ensureActTextures(this, act + 1);
    this.time.delayedCall(3000, () => releaseActTextures(this, act - 1));

    this.layers.find((l) => l.name === 'midground')?.tileSprite.setTexture(`bg_midground_act${act}`);

    for (const layer of this.layers) {
      const fromColor = Phaser.Display.Color.ValueToColor(layer.currentTint);
      const targetHex = actDef.visualPalette[layer.name] ?? 0xffffff;
      const toColor = Phaser.Display.Color.ValueToColor(targetHex);
      const progress = { t: 0 };
      this.tweens.add({
        targets: progress,
        t: 1,
        duration: 2500,
        ease: 'Quad.easeInOut',
        onUpdate: () => {
          const c = Phaser.Display.Color.Interpolate.ColorWithColor(
            fromColor,
            toColor,
            100,
            Math.round(progress.t * 100),
          );
          const hex = Phaser.Display.Color.GetColor(c.r, c.g, c.b);
          layer.tileSprite.setTint(hex);
          layer.currentTint = hex;
        },
        onComplete: () => {
          layer.tileSprite.setTint(targetHex);
          layer.currentTint = targetHex;
        },
      });
    }
  }

  // ---------------------------------------------------------------
  // Spawning
  // ---------------------------------------------------------------

  private spawnObstaclesAndTips(): void {
    const lookAhead = this.robot.x + 950;
    if (lookAhead <= this.nextSpawnX) return;

    const spawnX = this.nextSpawnX;
    const scenario = Phaser.Math.Between(0, 3);
    const activeAct = store.getState().activeAct || 1;
    const crateKey = `hazard_crate_act${activeAct}`;
    const puddleKey = `hazard_puddle_act${activeAct}`;

    switch (scenario) {
      case 0:
        // Crate on the ground with a tip arc over it
        this.spawnHazard(spawnX, 'crate', crateKey);
        this.createTip(spawnX - 55, 510);
        this.createTip(spawnX, 450);
        this.createTip(spawnX + 55, 510);
        break;
      case 1:
        // Puddle with a high bonus tip
        this.spawnHazard(spawnX, 'puddle', puddleKey);
        this.createTip(spawnX, 465);
        this.createTip(spawnX + 70, 520);
        break;
      case 2:
        // Ground run of three tips
        this.createTip(spawnX, 545);
        this.createTip(spawnX + 45, 545);
        this.createTip(spawnX + 90, 545);
        break;
      case 3:
        // Double crate hurdle (45 px apart reads as one wide hurdle) with a four-tip arc
        this.spawnHazard(spawnX, 'crate', crateKey);
        this.spawnHazard(spawnX + 45, 'crate', crateKey);
        this.createTip(spawnX - 25, 495);
        this.createTip(spawnX + 5, 435);
        this.createTip(spawnX + 40, 435);
        this.createTip(spawnX + 70, 495);
        break;
    }

    this.nextSpawnX += Phaser.Math.Between(360, 540);
  }

  private spawnHazard(x: number, kind: 'crate' | 'puddle', textureKey: string): Phaser.Physics.Arcade.Sprite {
    const spec = StreetScene.HAZARD_SPECS[kind];
    const hazard = this.hazardsGroup.create(x, spec.y, textureKey) as Phaser.Physics.Arcade.Sprite;
    hazard.setOrigin(0.5, 0.5);
    (hazard.body as Phaser.Physics.Arcade.Body | null)?.setSize(spec.width, spec.height);
    hazard.setData('hazardType', kind);
    return hazard;
  }

  private createTip(x: number, y: number): Phaser.Physics.Arcade.Sprite {
    const tip = this.tipsGroup.create(x, y, 'item_tip_gear') as Phaser.Physics.Arcade.Sprite;
    tip.setOrigin(0.5, 0.5);
    (tip.body as Phaser.Physics.Arcade.Body | null)?.setSize(22, 22);
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

  /** Destroys a pooled sprite and any tweens still targeting it. */
  private destroyEntity(sprite: Phaser.GameObjects.GameObject): void {
    this.tweens.killTweensOf(sprite);
    sprite.destroy();
  }

  private spawnFloatingPowerups(delta: number): void {
    this.powerupCooldownMs -= delta;
    if (this.powerupCooldownMs > 0) return;

    if (Math.random() > StreetScene.POWERUP_SPAWN_CHANCE) {
      this.powerupCooldownMs = StreetScene.POWERUP_RETRY_DELAY_MS;
      return;
    }
    this.powerupCooldownMs = Phaser.Math.Between(
      StreetScene.POWERUP_MIN_INTERVAL_MS,
      StreetScene.POWERUP_MAX_INTERVAL_MS,
    );

    const spawnX = this.cameras.main.scrollX + this.scale.width + 60;
    const baseY = Phaser.Math.Between(410, 490);
    const buffTypes: BuffType[] = ['tips', 'balance', 'jump'];
    const buff = Phaser.Utils.Array.GetRandom(buffTypes);
    const textureKey =
      buff === 'balance' ? 'powerup_brandy' : buff === 'jump' ? 'powerup_steam' : 'powerup_sunflower';

    const powerup = this.powerupsGroup.create(spawnX, baseY, textureKey) as Phaser.Physics.Arcade.Sprite;
    powerup.setOrigin(0.5, 0.5);
    (powerup.body as Phaser.Physics.Arcade.Body | null)?.setSize(28, 28);
    powerup.setData('buffType', buff);
    powerup.setData('baseY', baseY);
    powerup.setData('phaseOffset', Math.random() * Math.PI * 2);
    (powerup.body as Phaser.Physics.Arcade.Body | null)?.setVelocityX(-Robot.AUTO_WALK_SPEED * 1.5);
  }

  private updatePowerupDrift(time: number): void {
    for (const child of this.powerupsGroup.getChildren()) {
      const powerup = child as Phaser.Physics.Arcade.Sprite;
      if (!powerup.active) continue;
      const baseY = powerup.getData('baseY') as number;
      const phase = (powerup.getData('phaseOffset') as number) || 0;
      powerup.y = baseY + Math.sin(time * 0.0035 + phase) * 32;
      (powerup.body as Phaser.Physics.Arcade.Body | null)?.setVelocityX(-Robot.AUTO_WALK_SPEED * 1.5);
    }
  }

  private recycleOffscreenEntities(): void {
    const despawnX = this.cameras.main.scrollX - 250;
    for (const group of [this.tipsGroup, this.hazardsGroup, this.powerupsGroup]) {
      for (const child of [...group.getChildren()]) {
        const sprite = child as Phaser.Physics.Arcade.Sprite;
        if (sprite.x < despawnX) this.destroyEntity(sprite);
      }
    }
  }

  // ---------------------------------------------------------------
  // Collisions
  // ---------------------------------------------------------------

  private handleCollectTip(tip: Phaser.Physics.Arcade.Sprite): void {
    if (!tip.active) return;
    const { x, y } = tip;
    tip.disableBody(true, true);
    this.destroyEntity(tip);
    store.addTips(1);
    this.floatText(x, y - 10, '+1 ⚙️', '#fbbf24', 15, 600, 28);
  }

  private handleCollectPowerup(powerup: Phaser.Physics.Arcade.Sprite): void {
    if (!powerup.active) return;
    const { x, y } = powerup;
    const buff = powerup.getData('buffType') as BuffType;
    powerup.disableBody(true, true);
    this.destroyEntity(powerup);
    store.activateBuff(buff, StreetScene.BUFF_DURATION_SEC);

    const labels: Record<BuffType, [string, string]> = {
      tips: ['2X TIPS! 🌻', '#fbbf24'],
      balance: ['+50% STABILITY! 🍾', '#34d399'],
      jump: ['SUPER JUMP & SHIELD! ⚡', '#38bdf8'],
    };
    const [text, color] = labels[buff];
    this.floatText(x, y - 15, text, color, 17, 900, 45, '#18181b');
  }

  private handleHitHazard(hazard: Phaser.Physics.Arcade.Sprite): void {
    if (!hazard.active || hazard.getData('hit')) return;
    hazard.setData('hit', true);
    const { x, y } = hazard;

    if (store.getState().activeBuff === 'jump') {
      // Shielded: shatter the hazard instead of stumbling
      hazard.setTint(0x38bdf8);
      this.tweens.add({
        targets: hazard,
        alpha: 0,
        y: y - 45,
        angle: 75,
        scaleX: 0.6,
        scaleY: 0.6,
        duration: 400,
        ease: 'Cubic.easeIn',
        onComplete: () => this.destroyEntity(hazard),
      });
      this.floatText(x, y - 25, 'SMASHED! ⚡', '#38bdf8', 16, 650, 33, '#082f49');
      return;
    }

    hazard.setTint(0xef4444);
    const hazardType = (hazard.getData('hazardType') as 'crate' | 'puddle' | undefined) ?? 'crate';
    this.robot.triggerStumble(0.85);
    store.applyStumblePenalty();
    this.cameras.main.shake(180, 0.005);
    eventBus.emit('HAZARD_HIT', { x, y, hazardType });
    this.floatText(x, y - 25, 'STUMBLE! ⚠️', '#ef4444', 15, 750, 25);
  }

  private floatText(
    x: number,
    y: number,
    text: string,
    color: string,
    size: number,
    duration: number,
    rise: number,
    stroke?: string,
  ): void {
    const label = this.add
      .text(x, y, text, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: `${size}px`,
        color,
        fontStyle: 'bold',
        stroke,
        strokeThickness: stroke ? 3 : 0,
      })
      .setOrigin(0.5, 0.5);
    this.tweens.add({
      targets: label,
      y: y - rise,
      alpha: 0,
      duration,
      ease: 'Power2',
      onComplete: () => label.destroy(),
    });
  }

  // ---------------------------------------------------------------
  // Frame loop
  // ---------------------------------------------------------------

  override update(time: number, delta: number): void {
    if (this.isRunOver || this.isPaused) return;

    const dt = Math.min(delta / 1000, 0.1);
    store.decayMomentum(dt);

    const inputs: RobotInputs = {
      left: Boolean(this.cursors?.left.isDown || this.keyA?.isDown),
      right: Boolean(this.cursors?.right.isDown || this.keyD?.isDown),
      jump: Boolean(
        this.cursors?.space.isDown || this.keySpace?.isDown || this.keyW?.isDown || this.cursors?.up.isDown,
      ),
    };

    const state = store.getState();
    const ctx: RobotContext = { activeAct: state.activeAct, activeBuff: state.activeBuff };
    this.robot.update(time, delta, inputs, ctx);

    this.spawnObstaclesAndTips();
    this.spawnFloatingPowerups(delta);
    this.updatePowerupDrift(time);
    this.recycleOffscreenEntities();

    const scrollX = this.cameras.main.scrollX;
    for (const layer of this.layers) {
      layer.tileSprite.tilePositionX = scrollX * layer.scrollSpeedFactor;
    }
    store.updateDistance(scrollX);

    // One coalesced store notification per frame, then publish telemetry for the HUD
    store.flush();
    const telemetry: HudTelemetry = {
      bellowsPressure: this.robot.getBellowsPressure(),
      stabilityRatio: this.robot.getStabilityRatio(),
      isStumbling: this.robot.getIsStumbling(),
      wobbleAngle: this.robot.getWobbleAngle(),
      stabilityThreshold: this.robot.getDynamicStabilityThreshold(),
    };
    this.registry.set(HUD_REGISTRY_KEY, telemetry);
  }

  // ---------------------------------------------------------------
  // Run lifecycle
  // ---------------------------------------------------------------

  /**
   * The single restart path: resumes anything paused, kills every tween so
   * nothing outlives the scene, resets the run, and tells the audio layer to
   * start over from Act 1.
   */
  public restartRun(): void {
    if (this.restartRequested) return;
    this.restartRequested = true;

    this.scene.stop(SceneKeys.Pause);
    if (this.scene.isPaused()) this.scene.resume();
    this.physics.resume();
    this.tweens.killAll();
    store.setPaused(false);
    store.reset();
    eventBus.emit('RESTART_GAME', {});
    this.scene.restart();
  }

  private endData(outcome: RunOutcome): EndSceneData {
    const s = store.getState();
    return {
      outcome,
      distanceTraveled: s.distanceTraveled,
      tips: s.tips,
      tier: s.momentumTier,
      tierName: s.tierName,
      act: s.activeAct,
      actName: s.actName,
      elapsedSec: store.getElapsedTime(),
    };
  }

  private handleGameOver(): void {
    if (this.isRunOver) return;
    this.isRunOver = true;
    this.physics.pause();

    // Face-plant, then hand off to the end screen
    this.tweens.add({
      targets: this.robot,
      angle: 85,
      y: StreetScene.GROUND_Y,
      duration: 750,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        this.cameras.main.fade(500, 5, 7, 14);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start(SceneKeys.End, this.endData('gameover'));
        });
      },
    });
  }

  private handleVictory(): void {
    if (this.isRunOver) return;
    this.isRunOver = true;
    this.robot.body.setVelocity(0, 0);
    this.cameras.main.fade(1200, 10, 14, 24);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(SceneKeys.End, this.endData('victory'));
    });
  }

  public togglePause(): void {
    if (this.isRunOver) return;
    store.togglePause();
  }

  private handlePauseChange(paused: boolean): void {
    if (this.isRunOver || this.isPaused === paused) return;
    this.isPaused = paused;
    if (paused) {
      // scene.pause() freezes update, physics, tweens, and timers together.
      this.scene.launch(SceneKeys.Pause);
      this.scene.pause();
    } else {
      this.scene.stop(SceneKeys.Pause);
      this.scene.resume();
    }
  }

  private cleanupListeners(): void {
    for (const off of this.unsubscribers) off();
    this.unsubscribers = [];
    this.keyP?.removeAllListeners();
    this.keyEsc?.removeAllListeners();
  }
}
