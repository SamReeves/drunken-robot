import Phaser from 'phaser';
import { store } from '../../state/store.ts';
import { eventBus } from '../../state/eventBus.ts';

/**
 * EndScene - Victory Screen (Reached Home)
 * The Drunken Robot's Journey Home - Sprint 4.2
 *
 * Displays the robot safely home at a warm, glowing tavern/home stoop at dawn.
 * Presents final busking scorecard (tips, distance, recruited ensemble)
 * and an interactive "Play Again" button that resets state and restarts the journey.
 */
export class EndScene extends Phaser.Scene {
  private isRestarting = false;

  constructor() {
    super({ key: 'EndScene' });
  }

  create(): void {
    this.isRestarting = false;
    const { width, height } = this.scale;
    const finalState = store.getState();

    // 1. Dawn Sunrise Atmosphere (Act 5 Aesthetic: Lavender, Soft Rose & Golden Peach)
    const skyGfx = this.add.graphics();
    skyGfx.fillGradientStyle(0x3b0764, 0x581c87, 0x831843, 0x9a3412, 1);
    skyGfx.fillRect(0, 0, width, height);

    // Warm morning sun glow on horizon
    const sunGfx = this.add.graphics();
    sunGfx.fillStyle(0xfef08a, 0.12);
    sunGfx.fillCircle(width / 2 + 180, 360, 280);
    sunGfx.fillStyle(0xfde68a, 0.25);
    sunGfx.fillCircle(width / 2 + 180, 360, 140);
    sunGfx.fillStyle(0xfef08a, 0.85);
    sunGfx.fillCircle(width / 2 + 180, 360, 52);

    // 2. Cobblestone Pavement & Ground Baseline (y = 584)
    const groundGfx = this.add.graphics();
    // Sidewalk curb
    groundGfx.fillStyle(0x3f3f46, 1);
    groundGfx.fillRect(0, 560, width, 24);
    // Golden-hour cobblestone street
    groundGfx.fillGradientStyle(0x27272a, 0x27272a, 0x18181b, 0x18181b, 1);
    groundGfx.fillRect(0, 584, width, height - 584);

    // Decorative warm specular highlights on curb
    groundGfx.fillStyle(0xfef08a, 0.35);
    groundGfx.fillRect(0, 560, width, 2);

    // 3. Glowing Home Tavern Stoop & Archway (Right Side)
    const stoopX = width / 2 + 180;
    const stoopY = 560;

    const houseGfx = this.add.graphics();
    // Warm brick/timber facade
    houseGfx.fillStyle(0x271911, 0.95);
    houseGfx.fillRect(stoopX - 110, stoopY - 260, 220, 260);

    // Arched Timber Doorway
    houseGfx.fillStyle(0x18110b, 1);
    houseGfx.fillRect(stoopX - 55, stoopY - 190, 110, 190);
    houseGfx.fillCircle(stoopX, stoopY - 190, 55);

    // Warm Interior Hearth Glow radiating through doorway
    const doorGlow = this.add.graphics();
    doorGlow.fillGradientStyle(0xfef3c7, 0xfef3c7, 0xf59e0b, 0xd97706, 0.9, 0.9, 0.95, 0.95);
    doorGlow.fillRect(stoopX - 48, stoopY - 182, 96, 182);
    doorGlow.fillCircle(stoopX, stoopY - 182, 48);

    // Hanging Street Lantern with amber rays
    const lanternX = stoopX - 85;
    const lanternY = stoopY - 210;
    const lanternGlow = this.add.graphics();
    lanternGlow.fillStyle(0xfef08a, 0.22);
    lanternGlow.fillCircle(lanternX, lanternY, 90);
    lanternGlow.fillStyle(0xf59e0b, 0.45);
    lanternGlow.fillCircle(lanternX, lanternY, 40);
    lanternGlow.fillStyle(0xffffff, 0.95);
    lanternGlow.fillCircle(lanternX, lanternY, 8);

    // Soft lantern glow pulse
    this.tweens.add({
      targets: lanternGlow,
      alpha: { from: 0.85, to: 1.0 },
      scaleX: { from: 0.98, to: 1.04 },
      scaleY: { from: 0.98, to: 1.04 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 4. Contented Robot resting on the stoop
    const robotContainer = this.add.container(stoopX - 25, stoopY);
    const robotGfx = this.add.graphics();

    // Resting shadow
    robotGfx.fillStyle(0x0a0a0f, 0.65);
    robotGfx.fillEllipse(0, 0, 75, 18);

    // Seated / leaning chassis
    robotGfx.fillStyle(0x382c23, 1);
    robotGfx.fillRoundedRect(-22, -62, 44, 52, 6);
    robotGfx.lineStyle(2, 0x18120e, 1);
    robotGfx.strokeRoundedRect(-22, -62, 44, 52, 6);

    // Resting Accordion strapped across front
    robotGfx.fillStyle(0x991b1b, 1);
    robotGfx.fillRect(-18, -48, 36, 32);
    // Accordion pleats
    robotGfx.fillStyle(0xfef3c7, 1);
    for (let p = -14; p <= 14; p += 7) {
      robotGfx.fillRect(p, -48, 3, 32);
    }

    // Peaceful sleepy vacuum-tube amber eye (soft glow)
    robotGfx.fillStyle(0x78350f, 1);
    robotGfx.fillCircle(0, -78, 12);
    robotGfx.fillStyle(0xf59e0b, 0.85);
    robotGfx.fillCircle(0, -78, 7);

    // Gentle steam breath puff rising into dawn air
    const steamGfx = this.add.graphics();
    steamGfx.fillStyle(0xfde68a, 0.4);
    steamGfx.fillCircle(12, -92, 6);
    steamGfx.fillCircle(18, -104, 9);
    steamGfx.fillCircle(24, -118, 13);
    this.tweens.add({
      targets: steamGfx,
      y: -15,
      alpha: { from: 0.4, to: 0.05 },
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    robotContainer.add([robotGfx, steamGfx]);

    // 5. Victory Banner & Narrative Header (Left Side)
    const panelX = width / 2 - 320;

    const bannerBg = this.add.graphics();
    bannerBg.fillStyle(0x0f172a, 0.82);
    bannerBg.fillRoundedRect(panelX - 240, 70, 480, 500, 16);
    bannerBg.lineStyle(2, 0xd97706, 0.9);
    bannerBg.strokeRoundedRect(panelX - 240, 70, 480, 500, 16);

    // Golden Tag
    this.add
      .text(panelX, 105, '★ JOURNEY COMPLETE ★', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#fbbf24',
        letterSpacing: 3,
      })
      .setOrigin(0.5);

    // Title
    this.add
      .text(panelX, 145, 'REACHED HOME', {
        fontFamily: 'Georgia, serif',
        fontSize: '40px',
        fontStyle: 'bold',
        color: '#fef3c7',
        stroke: '#18110b',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.add
      .text(panelX, 185, 'The clockwork wanderer finally rests by the warm hearth.', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '13px',
        color: '#cbd5e1',
        fontStyle: 'italic',
        align: 'center',
        wordWrap: { width: 420 },
      })
      .setOrigin(0.5);

    // 6. Scorecard Stats
    const statsBox = this.add.graphics();
    statsBox.fillStyle(0x1e293b, 0.7);
    statsBox.fillRoundedRect(panelX - 210, 220, 420, 195, 12);
    statsBox.lineStyle(1, 0x475569, 0.8);
    statsBox.strokeRoundedRect(panelX - 210, 220, 420, 195, 12);

    const stats = [
      { label: 'Total Tips Busked', value: `${finalState.tips} 🪙 Copper Gears`, color: '#fef08a' },
      {
        label: 'Distance Traveled',
        value: `${Math.floor(finalState.distanceTraveled)} px (All 5 Acts Navigated)`,
        color: '#67e8f9',
      },
      { label: 'Final Act Biome', value: 'Act V: The Sunrise Overlook', color: '#f472b6' },
      { label: 'Ensemble Recruited', value: 'Full Balkan Band (6/6 Instruments)', color: '#a7f3d0' },
    ];

    stats.forEach((st, idx) => {
      const rowY = 245 + idx * 42;
      this.add.text(panelX - 190, rowY, st.label, {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '13px',
        color: '#94a3b8',
      });

      this.add
        .text(panelX + 190, rowY, st.value, {
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '13px',
          fontStyle: 'bold',
          color: st.color,
          align: 'right',
        })
        .setOrigin(1, 0);
    });

    // 7. Interactive "Play Again" Button
    const playAgainBtn = this.add.container(panelX, 480);

    const btnGlow = this.add.graphics();
    btnGlow.fillStyle(0x10b981, 0.3);
    btnGlow.fillRoundedRect(-155, -28, 310, 56, 28);

    const btnBg = this.add.graphics();
    btnBg.fillGradientStyle(0x059669, 0x059669, 0x047857, 0x065f46, 1);
    btnBg.fillRoundedRect(-145, -24, 290, 48, 24);
    btnBg.lineStyle(2, 0xa7f3d0, 0.9);
    btnBg.strokeRoundedRect(-145, -24, 290, 48, 24);

    const btnLabel = this.add
      .text(0, 0, '🔄 PLAY AGAIN', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
        color: '#ffffff',
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    playAgainBtn.add([btnGlow, btnBg, btnLabel]);

    this.tweens.add({
      targets: [btnGlow, btnBg, btnLabel],
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const hitArea = this.add
      .zone(panelX, 480, 310, 56)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const handleRestart = (): void => {
      if (this.isRestarting) return;
      this.isRestarting = true;

      store.reset();
      eventBus.emit('RESTART_GAME', {});

      this.cameras.main.fade(600, 10, 14, 24);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('StreetScene');
      });
    };

    hitArea.on('pointerdown', handleRestart);
    this.input.keyboard?.once('keydown-SPACE', handleRestart);
    this.input.keyboard?.once('keydown-ENTER', handleRestart);
  }
}
