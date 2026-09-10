import Phaser from 'phaser';
import { store } from '../../state/store.ts';
import { eventBus } from '../../state/eventBus.ts';
import { HUD_REGISTRY_KEY, SceneKeys, type HudTelemetry } from './keys.ts';

const FONT_SANS = 'system-ui, sans-serif';
const FONT_MONO = 'monospace';

/**
 * HudScene - runs in parallel with StreetScene and draws every on-screen readout.
 *
 * Slow-changing state comes from the store; per-frame telemetry (bellows,
 * balance) comes from the registry entry StreetScene writes each update.
 */
export class HudScene extends Phaser.Scene {
  private actBadgeBg!: Phaser.GameObjects.Graphics;
  private actBadgeText!: Phaser.GameObjects.Text;
  private tipsText!: Phaser.GameObjects.Text;
  private momentumText!: Phaser.GameObjects.Text;
  private progressionGfx!: Phaser.GameObjects.Graphics;
  private bellowsBar!: Phaser.GameObjects.Graphics;
  private balanceGauge!: Phaser.GameObjects.Graphics;
  private statusText!: Phaser.GameObjects.Text;
  private buffBadgeBg!: Phaser.GameObjects.Graphics;
  private buffBadgeText!: Phaser.GameObjects.Text;
  private bannerContainer!: Phaser.GameObjects.Container;
  private bannerTitle!: Phaser.GameObjects.Text;
  private bannerSub!: Phaser.GameObjects.Text;
  private unsubActChange?: () => void;

  private static readonly CONTROLS_HINT =
    'A / D (← / →) : Balance   •   Hold SPACE : Accordion Jump   •   P : Pause';
  private static readonly BUFF_DURATION_FALLBACK = 12;

  constructor() {
    super({ key: SceneKeys.Hud });
  }

  create(): void {
    const { width } = this.scale;

    // Act badge (top left)
    this.actBadgeBg = this.add.graphics();
    this.drawBadgeBg(0xf59e0b);
    const act = store.getCurrentActDefinition();
    this.actBadgeText = this.add.text(32, 26, `ACT ${act.act}: ${act.name.toUpperCase()}`, {
      fontFamily: FONT_SANS,
      fontSize: '15px',
      color: '#f59e0b',
      fontStyle: 'bold',
    });
    this.tipsText = this.add.text(32, 48, '⚙️ Tips: 0', {
      fontFamily: FONT_MONO,
      fontSize: '14px',
      color: '#fbbf24',
      fontStyle: 'bold',
    });
    this.momentumText = this.add.text(150, 48, '', {
      fontFamily: FONT_MONO,
      fontSize: '14px',
      color: '#9ca3af',
    });
    this.progressionGfx = this.add.graphics();

    // Controls hint and gauges (top right)
    this.statusText = this.add
      .text(width - 20, 20, HudScene.CONTROLS_HINT, {
        fontFamily: FONT_MONO,
        fontSize: '14px',
        color: '#d1d5db',
        backgroundColor: 'rgba(18, 19, 22, 0.88)',
        padding: { x: 12, y: 7 },
      })
      .setOrigin(1, 0);
    this.bellowsBar = this.add.graphics();
    this.balanceGauge = this.add.graphics();

    // Buff badge (under act badge)
    this.buffBadgeBg = this.add.graphics();
    this.buffBadgeText = this.add.text(32, 100, '', {
      fontFamily: FONT_MONO,
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
    });

    // Act transition banner (centre)
    this.bannerContainer = this.add
      .container(width / 2, 240)
      .setAlpha(0)
      .setDepth(100);
    const bannerBg = this.add.graphics();
    bannerBg.fillStyle(0x090a0f, 0.92);
    bannerBg.lineStyle(2, 0xf59e0b, 0.95);
    bannerBg.fillRoundedRect(-260, -48, 520, 96, 10);
    bannerBg.strokeRoundedRect(-260, -48, 520, 96, 10);
    this.bannerTitle = this.add
      .text(0, -18, '', { fontFamily: FONT_SANS, fontSize: '22px', color: '#fef08a', fontStyle: 'bold' })
      .setOrigin(0.5);
    this.bannerSub = this.add
      .text(0, 16, '', { fontFamily: FONT_MONO, fontSize: '14px', color: '#9ca3af' })
      .setOrigin(0.5);
    this.bannerContainer.add([bannerBg, this.bannerTitle, this.bannerSub]);

    this.unsubActChange = eventBus.on('ACT_CHANGE', (p) => this.announceAct(p.act, p.name));
    this.events.once('shutdown', () => {
      this.unsubActChange?.();
      this.unsubActChange = undefined;
    });
  }

  override update(): void {
    const state = store.getState();
    const telemetry = this.registry.get(HUD_REGISTRY_KEY) as HudTelemetry | undefined;
    const { width } = this.scale;

    this.tipsText.setText(`⚙️ Tips: ${state.tips}`);
    this.momentumText.setText(`⚡ ${Math.round(state.momentum)}%  ${state.tierName}`);

    // Momentum bar
    this.progressionGfx.clear();
    const progX = 32;
    const progY = 70;
    const progW = 296;
    const progH = 6;
    this.progressionGfx.fillStyle(0x18181b, 0.9);
    this.progressionGfx.fillRoundedRect(progX, progY, progW, progH, 2);
    if (state.momentum > 0) {
      const fillW = Math.max(4, progW * (state.momentum / 100));
      const tierColor = state.momentumTier >= 3 ? 0xa855f7 : state.momentumTier >= 1 ? 0xf59e0b : 0x10b981;
      this.progressionGfx.fillStyle(tierColor, 0.95);
      this.progressionGfx.fillRoundedRect(progX, progY, fillW, progH, 2);
    }

    // Bellows and balance
    const barX = width - 260;
    const barY = 62;
    const barW = 240;
    const barH = 14;
    const pressure = telemetry?.bellowsPressure ?? 0;

    this.bellowsBar.clear();
    this.bellowsBar.fillStyle(0x18181b, 0.85);
    this.bellowsBar.fillRoundedRect(barX, barY, barW, barH, 4);
    this.bellowsBar.lineStyle(1, 0x3f3f46, 0.8);
    this.bellowsBar.strokeRoundedRect(barX, barY, barW, barH, 4);
    if (pressure > 0.01) {
      this.bellowsBar.fillStyle(0xf59e0b, 0.95);
      this.bellowsBar.fillRoundedRect(barX + 2, barY + 2, Math.max(4, (barW - 4) * pressure), barH - 4, 2);
    }

    const gaugeY = barY + 20;
    this.balanceGauge.clear();
    this.balanceGauge.fillStyle(0x18181b, 0.85);
    this.balanceGauge.fillRoundedRect(barX, gaugeY, barW, 10, 3);
    this.balanceGauge.fillStyle(0x52525b, 0.8);
    this.balanceGauge.fillRect(barX + barW / 2 - 1, gaugeY, 2, 10);
    if (telemetry) {
      const threshold = telemetry.stabilityThreshold || 1;
      const needleOffset = (telemetry.wobbleAngle / threshold) * (barW / 2 - 8);
      const needleX = Phaser.Math.Clamp(barX + barW / 2 + needleOffset, barX + 4, barX + barW - 4);
      const needleColor = telemetry.isStumbling
        ? 0xef4444
        : telemetry.stabilityRatio > 0.75
          ? 0xf59e0b
          : 0x10b981;
      this.balanceGauge.fillStyle(needleColor, 1);
      this.balanceGauge.fillCircle(needleX, gaugeY + 5, 4);
    }

    // Status line
    if (telemetry?.isStumbling) {
      this.statusText.setText('⚠️ STUMBLE! Rhythm warped, recovering...').setColor('#ef4444');
    } else if (pressure > 0) {
      this.statusText
        .setText(`💨 Charging bellows: ${Math.round(pressure * 100)}%  (release to jump)`)
        .setColor('#f59e0b');
    } else {
      this.statusText.setText(HudScene.CONTROLS_HINT).setColor('#d1d5db');
    }

    // Buff badge
    this.buffBadgeBg.clear();
    if (state.activeBuff && state.buffTimeRemaining > 0) {
      const remaining = Math.ceil(state.buffTimeRemaining);
      const style = HudScene.BUFF_STYLES[state.activeBuff];
      const badgeX = 20;
      const badgeY = 96;
      const badgeW = 250;
      const badgeH = 30;
      this.buffBadgeBg.fillStyle(style.fill, 0.92);
      this.buffBadgeBg.fillRoundedRect(badgeX, badgeY, badgeW, badgeH, 6);
      this.buffBadgeBg.lineStyle(1.5, style.stroke, 0.9);
      this.buffBadgeBg.strokeRoundedRect(badgeX, badgeY, badgeW, badgeH, 6);
      const ratio = Phaser.Math.Clamp(
        state.buffTimeRemaining / (state.buffDuration || HudScene.BUFF_DURATION_FALLBACK),
        0,
        1,
      );
      this.buffBadgeBg.fillStyle(style.stroke, 0.7);
      this.buffBadgeBg.fillRoundedRect(badgeX + 4, badgeY + badgeH - 4, (badgeW - 8) * ratio, 2, 1);
      this.buffBadgeText
        .setText(`${style.label} (${remaining}s)`)
        .setColor(style.text)
        .setPosition(badgeX + 10, badgeY + 7)
        .setVisible(true);
    } else {
      this.buffBadgeText.setVisible(false);
    }
  }

  private static readonly BUFF_STYLES = {
    tips: { label: '🌻 2X TIPS', stroke: 0xf59e0b, fill: 0x271900, text: '#fbbf24' },
    balance: { label: '🍾 +50% STABILITY', stroke: 0x10b981, fill: 0x022c22, text: '#34d399' },
    jump: { label: '⚡ SUPER JUMP & SHIELD', stroke: 0x06b6d4, fill: 0x082f49, text: '#38bdf8' },
  } as const;

  private drawBadgeBg(strokeColor: number): void {
    this.actBadgeBg.clear();
    this.actBadgeBg.fillStyle(0x121316, 0.92);
    this.actBadgeBg.lineStyle(1, strokeColor, 0.85);
    this.actBadgeBg.fillRoundedRect(20, 20, 320, 70, 8);
    this.actBadgeBg.strokeRoundedRect(20, 20, 320, 70, 8);
  }

  private announceAct(act: number, name: string): void {
    const actDef = store.getActDefinition(act);
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

    // The first act's announcement happens before the run is visible; no banner for it.
    if (act === 1) return;

    this.bannerTitle.setText(`ACT ${act}: ${name.toUpperCase()}`);
    this.bannerSub.setText(actDef.subtitle);
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
}
