import Phaser from 'phaser';

// Helper function to draw quadratic Bezier curve segments into Phaser Graphics
function drawQuad(
  gfx: Phaser.GameObjects.Graphics,
  p0x: number,
  p0y: number,
  cx: number,
  cy: number,
  p1x: number,
  p1y: number,
  segments: number = 8
): void {
  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const inv = 1 - t;
    const x = inv * inv * p0x + 2 * inv * t * cx + t * t * p1x;
    const y = inv * inv * p0y + 2 * inv * t * cy + t * t * p1y;
    gfx.lineTo(x, y);
  }
}

// Helper function to draw cubic Bezier curve segments into Phaser Graphics
function drawCubic(
  gfx: Phaser.GameObjects.Graphics,
  p0x: number,
  p0y: number,
  c1x: number,
  c1y: number,
  c2x: number,
  c2y: number,
  p1x: number,
  p1y: number,
  segments: number = 10
): void {
  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const inv = 1 - t;
    const x =
      inv * inv * inv * p0x +
      3 * inv * inv * t * c1x +
      3 * inv * t * t * c2x +
      t * t * t * p1x;
    const y =
      inv * inv * inv * p0y +
      3 * inv * inv * t * c1y +
      3 * inv * t * t * c2y +
      t * t * t * p1y;
    gfx.lineTo(x, y);
  }
}

// Helper function to draw smooth closed organic amoebic splines
function drawSmoothClosedSpline(
  gfx: Phaser.GameObjects.Graphics,
  pts: [number, number][],
  offsetX: number = 0,
  offsetY: number = 0
): void {
  const len = pts.length;
  const startMidX = (pts[0][0] + pts[1][0]) / 2 + offsetX;
  const startMidY = (pts[0][1] + pts[1][1]) / 2 + offsetY;
  gfx.moveTo(startMidX, startMidY);

  for (let i = 1; i <= len; i++) {
    const p1 = pts[i % len];
    const p2 = pts[(i + 1) % len];
    const prev = pts[(i - 1) % len];
    const p0x = (prev[0] + p1[0]) / 2 + offsetX;
    const p0y = (prev[1] + p1[1]) / 2 + offsetY;
    const p1x = (p1[0] + p2[0]) / 2 + offsetX;
    const p1y = (p1[1] + p2[1]) / 2 + offsetY;
    drawQuad(gfx, p0x, p0y, p1[0] + offsetX, p1[1] + offsetY, p1x, p1y, 6);
  }
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Optional preloading of static assets if present
    this.load.image('hero', '/src/assets/hero.png');

    // Generate high-resolution procedural placeholder textures for parallax layers
    this.createProceduralTextures();
  }

  create(): void {
    // Transition to title screen for player entry and audio unlock
    this.scene.start('TitleScene');
  }

  private createProceduralTextures(): void {
    // -------------------------------------------------------------
    // Layer 1: Sky, Atmospheric Haze & Moon Texture (1280x720)
    // -------------------------------------------------------------
    const skyGfx = this.make.graphics({ x: 0, y: 0 });
    // Deep nocturnal watercolor gradient
    skyGfx.fillGradientStyle(0x080912, 0x080912, 0x141826, 0x1c2132, 1);
    skyGfx.fillRect(0, 0, 1280, 720);

    // Multi-ringed lunar atmospheric glow halo (scattering through night mist)
    const moonX = 1050;
    const moonY = 140;
    skyGfx.fillStyle(0xfef3c7, 0.03);
    skyGfx.fillCircle(moonX, moonY, 115);
    skyGfx.fillStyle(0xfef3c7, 0.06);
    skyGfx.fillCircle(moonX, moonY, 78);
    skyGfx.fillStyle(0xfef3c7, 0.14);
    skyGfx.fillCircle(moonX, moonY, 56);

    // Glowing Crescent Moon
    skyGfx.fillStyle(0xfef3c7, 0.96);
    skyGfx.fillCircle(moonX, moonY, 48);
    skyGfx.fillStyle(0x080912, 1);
    skyGfx.fillCircle(moonX + 18, moonY - 8, 44);

    // Atmospheric watercolor cloud / mist washes across the lower sky horizon
    const skyMists = [
      { x: 300, y: 340, rx: 420, ry: 100, color: 0x1b2034, alpha: 0.07 },
      { x: 760, y: 370, rx: 460, ry: 110, color: 0x241830, alpha: 0.06 },
      { x: 520, y: 430, rx: 500, ry: 95, color: 0x281f19, alpha: 0.05 },
      { x: 1120, y: 330, rx: 380, ry: 90, color: 0x182030, alpha: 0.07 },
      { x: -50, y: 360, rx: 360, ry: 85, color: 0x182030, alpha: 0.07 },
    ];
    for (const m of skyMists) {
      skyGfx.fillStyle(m.color, m.alpha);
      skyGfx.fillEllipse(m.x, m.y, m.rx, m.ry);
    }

    // Soft Stars with subtle brightness & size variance
    const starCoords: [number, number, number, number][] = [
      [120, 80, 2.0, 0.85], [240, 160, 1.4, 0.7], [380, 70, 2.2, 0.9], [520, 130, 1.2, 0.6],
      [680, 60, 2.0, 0.8], [820, 110, 1.4, 0.75], [950, 50, 1.8, 0.85], [1180, 90, 2.0, 0.9],
      [180, 220, 1.2, 0.6], [450, 190, 1.6, 0.7], [760, 210, 1.3, 0.65], [1120, 200, 1.5, 0.75],
      [60, 150, 1.8, 0.8], [310, 110, 1.2, 0.65], [600, 150, 1.6, 0.7], [890, 85, 2.0, 0.85],
      [1020, 210, 1.3, 0.6], [40, 40, 1.5, 0.7], [710, 100, 1.9, 0.85], [980, 170, 1.3, 0.65],
      [160, 120, 1.0, 0.5], [550, 80, 1.5, 0.7], [860, 160, 1.2, 0.6], [1230, 140, 1.7, 0.8]
    ];
    for (const [sx, sy, sr, sa] of starCoords) {
      skyGfx.fillStyle(0xffffff, sa);
      skyGfx.fillCircle(sx, sy, sr);
    }
    skyGfx.generateTexture('bg_sky', 1280, 720);
    skyGfx.destroy();

    // -------------------------------------------------------------
    // Layer 2: Distant Horizon Skyline & River Mist (1280x720)
    // -------------------------------------------------------------
    const distGfx = this.make.graphics({ x: 0, y: 0 });

    // Background horizontal mist wash behind distant spires
    distGfx.fillGradientStyle(0x0e111a, 0x0e111a, 0x181e2b, 0x181e2b, 0, 0, 0.35, 0.35);
    distGfx.fillRect(0, 360, 1280, 360);

    const distMists = [
      { x: 260, y: 510, rx: 360, ry: 75, color: 0x182030, alpha: 0.22 },
      { x: 740, y: 495, rx: 400, ry: 80, color: 0x201c2e, alpha: 0.18 },
      { x: 1140, y: 520, rx: 340, ry: 70, color: 0x161e2c, alpha: 0.20 },
      { x: -20, y: 525, rx: 320, ry: 65, color: 0x182030, alpha: 0.18 }
    ];
    for (const dm of distMists) {
      distGfx.fillStyle(dm.color, dm.alpha);
      distGfx.fillEllipse(dm.x, dm.y, dm.rx, dm.ry);
    }

    // Distant Gothic & Bohemian Architectural Silhouettes (14 structures)
    const distStructures = [
      { x: 0, w: 110, h: 260, peak: 45, style: 'gable', chimney: false },
      { x: 100, w: 75, h: 365, peak: 85, style: 'spire', chimney: false }, // Cathedral Spire
      { x: 170, w: 120, h: 240, peak: 35, style: 'mansard', chimney: true },
      { x: 280, w: 105, h: 310, peak: 55, style: 'gable', chimney: true },
      { x: 375, w: 85, h: 395, peak: 95, style: 'spire', chimney: false }, // High Belfry
      { x: 450, w: 140, h: 280, peak: 40, style: 'dome', chimney: true },   // Baroque Dome
      { x: 580, w: 115, h: 320, peak: 60, style: 'gable', chimney: true },
      { x: 685, w: 90, h: 350, peak: 80, style: 'spire', chimney: false },
      { x: 765, w: 130, h: 265, peak: 35, style: 'mansard', chimney: true },
      { x: 885, w: 110, h: 330, peak: 65, style: 'gable', chimney: true },
      { x: 985, w: 80, h: 380, peak: 90, style: 'spire', chimney: false }, // Eastern Watchtower
      { x: 1055, w: 125, h: 275, peak: 40, style: 'dome', chimney: true },
      { x: 1170, w: 95, h: 305, peak: 50, style: 'gable', chimney: true },
      { x: 1255, w: 90, h: 340, peak: 70, style: 'spire', chimney: false }  // Wrap connector
    ];

    distGfx.fillStyle(0x131722, 1);
    for (const b of distStructures) {
      const topY = 720 - b.h;
      distGfx.beginPath();
      distGfx.moveTo(b.x, 720);

      if (b.style === 'spire') {
        // High steep needle spire
        distGfx.lineTo(b.x + b.w * 0.2, topY + b.peak);
        distGfx.lineTo(b.x + b.w * 0.5, topY);
        distGfx.lineTo(b.x + b.w * 0.8, topY + b.peak);
      } else if (b.style === 'dome') {
        // Curved dome profile using drawQuad
        distGfx.lineTo(b.x + 8, topY + b.peak);
        drawQuad(distGfx, b.x + 8, topY + b.peak, b.x + b.w * 0.5, topY - 12, b.x + b.w - 8, topY + b.peak, 8);
      } else if (b.style === 'mansard') {
        // Mansard dual pitch
        distGfx.lineTo(b.x + 14, topY + b.peak);
        distGfx.lineTo(b.x + b.w * 0.3, topY);
        distGfx.lineTo(b.x + b.w * 0.7, topY);
        distGfx.lineTo(b.x + b.w - 14, topY + b.peak);
      } else {
        // Classic steep gable
        distGfx.lineTo(b.x + 5, topY + b.peak);
        distGfx.lineTo(b.x + b.w * 0.5, topY);
        distGfx.lineTo(b.x + b.w - 5, topY + b.peak);
      }

      distGfx.lineTo(b.x + b.w, 720);
      distGfx.closePath();
      distGfx.fillPath();

      if (b.chimney) {
        distGfx.fillRect(b.x + b.w * 0.65, topY - 16, 12, 24);
      }
    }

    // Rolling river mist along the lower distant horizon (aerial perspective)
    distGfx.fillGradientStyle(0x111622, 0x111622, 0x161c29, 0x161c29, 0, 0, 0.45, 0.45);
    distGfx.fillRect(0, 560, 1280, 160);

    const baseMists = [
      { x: 180, y: 620, rx: 280, ry: 45, alpha: 0.16 },
      { x: 540, y: 610, rx: 340, ry: 50, alpha: 0.18 },
      { x: 920, y: 625, rx: 320, ry: 48, alpha: 0.15 },
      { x: 1240, y: 615, rx: 260, ry: 42, alpha: 0.17 }
    ];
    for (const bm of baseMists) {
      distGfx.fillStyle(0x1c2436, bm.alpha);
      distGfx.fillEllipse(bm.x, bm.y, bm.rx, bm.ry);
    }

    distGfx.generateTexture('bg_distant', 1280, 720);
    distGfx.destroy();

    // -------------------------------------------------------------
    // Layer 3: Midground Watercolor Impressionism Architecture (2560x720)
    // -------------------------------------------------------------
    // 16 distinct European/Bohemian architectural structures seamlessly tiling at 2560px
    const midGfx = this.make.graphics({ x: 0, y: 0 });

    interface WindowDef {
      xRel: number;
      yRel: number;
      w: number;
      h: number;
      arched?: boolean;
      lit: boolean;
      amberTint?: number;
    }

    interface MidBuildingDef {
      name: string;
      x: number;
      w: number;
      h: number;
      roofHeight: number;
      roofType: 'gable' | 'gambrel' | 'mansard' | 'spire' | 'shed' | 'bell';
      sag: number;
      lean: number;
      hasSign?: boolean;
      signText?: string;
      hasLantern?: boolean;
      chimney: { xRel: number; w: number; h: number; style: 'pot' | 'brick' | 'pipe' };
      timberBeams: { x1: number; y1: number; x2: number; y2: number; warp: number }[];
      windows: WindowDef[];
    }

    const midBuildings: MidBuildingDef[] = [
      // 1. The Drunken Accordion Tavern
      {
        name: 'The Drunken Accordion Tavern',
        x: 0, w: 180, h: 445, roofHeight: 80, roofType: 'gambrel', sag: 7, lean: -3,
        hasSign: true, signText: 'ZINC', hasLantern: true,
        chimney: { xRel: 135, w: 22, h: 42, style: 'brick' },
        timberBeams: [
          { x1: 15, y1: 140, x2: 165, y2: 240, warp: 4 },
          { x1: 165, y1: 140, x2: 15, y2: 240, warp: -3 },
          { x1: 12, y1: 250, x2: 168, y2: 250, warp: 3 }
        ],
        windows: [
          { xRel: 24, yRel: 120, w: 32, h: 44, lit: true, amberTint: 0xf59e0b },
          { xRel: 118, yRel: 125, w: 32, h: 44, lit: true, amberTint: 0xfbbf24 },
          { xRel: 22, yRel: 195, w: 34, h: 42, lit: true, amberTint: 0xd97706 },
          { xRel: 72, yRel: 190, w: 34, h: 42, lit: true, amberTint: 0xf59e0b },
          { xRel: 122, yRel: 200, w: 32, h: 42, lit: false }
        ]
      },
      // 2. The Crooked Garret
      {
        name: 'The Crooked Garret',
        x: 175, w: 135, h: 485, roofHeight: 90, roofType: 'gable', sag: 9, lean: -5,
        chimney: { xRel: 95, w: 16, h: 48, style: 'pipe' },
        timberBeams: [
          { x1: 12, y1: 110, x2: 122, y2: 195, warp: -4 },
          { x1: 122, y1: 110, x2: 12, y2: 195, warp: 5 },
          { x1: 10, y1: 210, x2: 125, y2: 210, warp: 3 },
          { x1: 15, y1: 300, x2: 120, y2: 300, warp: -2 }
        ],
        windows: [
          { xRel: 48, yRel: 115, w: 28, h: 36, arched: true, lit: true, amberTint: 0xfef08a },
          { xRel: 22, yRel: 220, w: 26, h: 38, lit: true, amberTint: 0xf59e0b },
          { xRel: 78, yRel: 225, w: 28, h: 38, lit: false },
          { xRel: 50, yRel: 315, w: 30, h: 42, lit: true, amberTint: 0xd97706 }
        ]
      },
      // 3. The Stepped Gable House
      {
        name: 'The Stepped Gable House',
        x: 305, w: 160, h: 420, roofHeight: 70, roofType: 'gable', sag: 4, lean: 2,
        chimney: { xRel: 25, w: 20, h: 38, style: 'brick' },
        timberBeams: [
          { x1: 15, y1: 160, x2: 145, y2: 160, warp: 3 },
          { x1: 15, y1: 260, x2: 145, y2: 260, warp: -2 }
        ],
        windows: [
          { xRel: 32, yRel: 100, w: 26, h: 36, arched: true, lit: true, amberTint: 0xfbbf24 },
          { xRel: 95, yRel: 100, w: 26, h: 36, arched: true, lit: true, amberTint: 0xf59e0b },
          { xRel: 28, yRel: 180, w: 30, h: 42, lit: true, amberTint: 0xfef08a },
          { xRel: 95, yRel: 182, w: 30, h: 42, lit: false },
          { xRel: 58, yRel: 275, w: 36, h: 48, lit: true, amberTint: 0xd97706 }
        ]
      },
      // 4. The Timber Jetty Inn
      {
        name: 'The Timber Jetty Inn',
        x: 460, w: 195, h: 465, roofHeight: 85, roofType: 'gable', sag: 8, lean: 4,
        hasLantern: true,
        chimney: { xRel: 145, w: 24, h: 45, style: 'brick' },
        timberBeams: [
          { x1: 10, y1: 110, x2: 185, y2: 220, warp: 5 },
          { x1: 185, y1: 110, x2: 10, y2: 220, warp: -5 },
          { x1: 8, y1: 230, x2: 188, y2: 230, warp: 3 },
          { x1: 20, y1: 320, x2: 175, y2: 320, warp: -3 }
        ],
        windows: [
          { xRel: 30, yRel: 120, w: 30, h: 40, lit: true, amberTint: 0xf59e0b },
          { xRel: 80, yRel: 118, w: 30, h: 40, lit: true, amberTint: 0xfbbf24 },
          { xRel: 130, yRel: 124, w: 30, h: 40, lit: false },
          { xRel: 25, yRel: 240, w: 34, h: 44, lit: true, amberTint: 0xfef08a },
          { xRel: 128, yRel: 245, w: 34, h: 44, lit: true, amberTint: 0xd97706 }
        ]
      },
      // 5. The Clock / Belfry Tower
      {
        name: 'The Clock / Belfry Tower',
        x: 650, w: 115, h: 540, roofHeight: 110, roofType: 'spire', sag: 3, lean: -2,
        chimney: { xRel: 10, w: 12, h: 25, style: 'pipe' },
        timberBeams: [
          { x1: 10, y1: 160, x2: 105, y2: 160, warp: 2 },
          { x1: 10, y1: 280, x2: 105, y2: 280, warp: -2 }
        ],
        windows: [
          // Clock face
          { xRel: 38, yRel: 125, w: 38, h: 38, arched: true, lit: true, amberTint: 0xfef08a },
          // Belfry sound louvers
          { xRel: 25, yRel: 200, w: 24, h: 48, arched: true, lit: false },
          { xRel: 65, yRel: 200, w: 24, h: 48, arched: true, lit: false },
          { xRel: 42, yRel: 310, w: 28, h: 40, lit: true, amberTint: 0xf59e0b }
        ]
      },
      // 6. The Mansard Atelier
      {
        name: 'The Mansard Atelier',
        x: 760, w: 175, h: 435, roofHeight: 75, roofType: 'mansard', sag: 5, lean: 3,
        chimney: { xRel: 130, w: 18, h: 40, style: 'pot' },
        timberBeams: [
          { x1: 15, y1: 145, x2: 160, y2: 145, warp: 3 },
          { x1: 15, y1: 245, x2: 160, y2: 245, warp: -3 }
        ],
        windows: [
          { xRel: 65, yRel: 95, w: 42, h: 34, lit: true, amberTint: 0xfef08a }, // Mansard dormer
          { xRel: 25, yRel: 165, w: 32, h: 44, lit: true, amberTint: 0xfbbf24 },
          { xRel: 115, yRel: 168, w: 32, h: 44, lit: true, amberTint: 0xf59e0b },
          { xRel: 70, yRel: 260, w: 36, h: 46, lit: false }
        ]
      },
      // 7. The Bohemian Tenement
      {
        name: 'The Bohemian Tenement',
        x: 930, w: 165, h: 475, roofHeight: 80, roofType: 'gable', sag: 7, lean: -4,
        chimney: { xRel: 30, w: 24, h: 44, style: 'pot' },
        timberBeams: [
          { x1: 12, y1: 130, x2: 152, y2: 215, warp: -4 },
          { x1: 152, y1: 130, x2: 12, y2: 215, warp: 4 },
          { x1: 10, y1: 230, x2: 155, y2: 230, warp: 2 },
          { x1: 12, y1: 330, x2: 152, y2: 330, warp: -2 }
        ],
        windows: [
          { xRel: 24, yRel: 140, w: 26, h: 36, lit: true, amberTint: 0xd97706 },
          { xRel: 68, yRel: 135, w: 26, h: 36, lit: true, amberTint: 0xf59e0b },
          { xRel: 112, yRel: 142, w: 26, h: 36, lit: false },
          { xRel: 26, yRel: 240, w: 28, h: 38, lit: false },
          { xRel: 70, yRel: 244, w: 28, h: 38, lit: true, amberTint: 0xfbbf24 },
          { xRel: 114, yRel: 238, w: 28, h: 38, lit: true, amberTint: 0xf59e0b }
        ]
      },
      // 8. The Leaning Gable Workshop
      {
        name: 'The Leaning Gable Workshop',
        x: 1090, w: 145, h: 445, roofHeight: 85, roofType: 'gable', sag: 9, lean: -6,
        hasLantern: true,
        chimney: { xRel: 100, w: 16, h: 36, style: 'pipe' },
        timberBeams: [
          { x1: 10, y1: 125, x2: 135, y2: 125, warp: 3 },
          { x1: 12, y1: 220, x2: 132, y2: 310, warp: -4 }
        ],
        windows: [
          { xRel: 52, yRel: 135, w: 34, h: 42, lit: true, amberTint: 0xfef08a },
          { xRel: 22, yRel: 230, w: 28, h: 38, lit: true, amberTint: 0xf59e0b },
          { xRel: 88, yRel: 235, w: 28, h: 38, lit: false }
        ]
      },
      // 9. The Archway House
      {
        name: 'The Archway House',
        x: 1230, w: 185, h: 450, roofHeight: 75, roofType: 'gable', sag: 6, lean: 2,
        hasSign: true, signText: 'VINS',
        chimney: { xRel: 135, w: 22, h: 40, style: 'brick' },
        timberBeams: [
          { x1: 15, y1: 140, x2: 170, y2: 140, warp: 3 },
          { x1: 15, y1: 240, x2: 170, y2: 240, warp: -2 }
        ],
        windows: [
          { xRel: 30, yRel: 150, w: 32, h: 42, lit: true, amberTint: 0xfbbf24 },
          { xRel: 78, yRel: 146, w: 32, h: 42, lit: true, amberTint: 0xfef08a },
          { xRel: 124, yRel: 152, w: 32, h: 42, lit: true, amberTint: 0xd97706 }
        ]
      },
      // 10. The Apothecary
      {
        name: 'The Apothecary',
        x: 1410, w: 140, h: 465, roofHeight: 85, roofType: 'gable', sag: 7, lean: 3,
        chimney: { xRel: 25, w: 20, h: 46, style: 'brick' },
        timberBeams: [
          { x1: 12, y1: 120, x2: 128, y2: 205, warp: 4 },
          { x1: 128, y1: 120, x2: 12, y2: 205, warp: -4 },
          { x1: 10, y1: 220, x2: 130, y2: 220, warp: 2 }
        ],
        windows: [
          { xRel: 48, yRel: 110, w: 32, h: 38, arched: true, lit: true, amberTint: 0x10b981 }, // Green apothecary vial tint
          { xRel: 24, yRel: 235, w: 28, h: 40, lit: true, amberTint: 0xf59e0b },
          { xRel: 82, yRel: 238, w: 28, h: 40, lit: true, amberTint: 0xfbbf24 }
        ]
      },
      // 11. The Weathered Granary
      {
        name: 'The Weathered Granary',
        x: 1545, w: 175, h: 395, roofHeight: 65, roofType: 'shed', sag: 8, lean: -3,
        chimney: { xRel: 120, w: 16, h: 32, style: 'pipe' },
        timberBeams: [
          { x1: 15, y1: 110, x2: 160, y2: 110, warp: 4 },
          { x1: 15, y1: 200, x2: 160, y2: 200, warp: -3 },
          { x1: 20, y1: 115, x2: 155, y2: 280, warp: 3 }
        ],
        windows: [
          { xRel: 35, yRel: 125, w: 30, h: 34, lit: false },
          { xRel: 105, yRel: 130, w: 30, h: 34, lit: true, amberTint: 0xd97706 }
        ]
      },
      // 12. The Conical Turret Villa
      {
        name: 'The Conical Turret Villa',
        x: 1715, w: 160, h: 480, roofHeight: 95, roofType: 'spire', sag: 5, lean: 2,
        hasLantern: true,
        chimney: { xRel: 25, w: 18, h: 42, style: 'pot' },
        timberBeams: [
          { x1: 12, y1: 150, x2: 148, y2: 150, warp: 2 },
          { x1: 12, y1: 250, x2: 148, y2: 250, warp: -3 }
        ],
        windows: [
          { xRel: 35, yRel: 165, w: 28, h: 40, arched: true, lit: true, amberTint: 0xfef08a },
          { xRel: 95, yRel: 165, w: 28, h: 40, arched: true, lit: true, amberTint: 0xf59e0b },
          { xRel: 40, yRel: 270, w: 30, h: 42, lit: false },
          { xRel: 98, yRel: 272, w: 30, h: 42, lit: true, amberTint: 0xfbbf24 }
        ]
      },
      // 13. The Twin Gable Duplex
      {
        name: 'The Twin Gable Duplex',
        x: 1870, w: 185, h: 455, roofHeight: 80, roofType: 'gable', sag: 7, lean: -2,
        chimney: { xRel: 85, w: 22, h: 46, style: 'brick' },
        timberBeams: [
          { x1: 15, y1: 135, x2: 170, y2: 135, warp: 3 },
          { x1: 15, y1: 235, x2: 170, y2: 235, warp: -2 }
        ],
        windows: [
          { xRel: 25, yRel: 145, w: 26, h: 36, lit: true, amberTint: 0xf59e0b },
          { xRel: 60, yRel: 145, w: 26, h: 36, lit: false },
          { xRel: 105, yRel: 142, w: 26, h: 36, lit: true, amberTint: 0xfbbf24 },
          { xRel: 140, yRel: 142, w: 26, h: 36, lit: true, amberTint: 0xd97706 }
        ]
      },
      // 14. The Bookbinder's Shanty
      {
        name: 'The Bookbinder\'s Shanty',
        x: 2050, w: 140, h: 430, roofHeight: 70, roofType: 'shed', sag: 8, lean: 5,
        chimney: { xRel: 95, w: 14, h: 36, style: 'pipe' },
        timberBeams: [
          { x1: 10, y1: 120, x2: 125, y2: 210, warp: -3 },
          { x1: 125, y1: 120, x2: 10, y2: 210, warp: 4 }
        ],
        windows: [
          { xRel: 42, yRel: 130, w: 32, h: 38, lit: true, amberTint: 0xfef08a },
          { xRel: 35, yRel: 235, w: 30, h: 40, lit: true, amberTint: 0xf59e0b }
        ]
      },
      // 15. The Old Bell Gable Cottage
      {
        name: 'The Old Bell Gable Cottage',
        x: 2185, w: 170, h: 440, roofHeight: 75, roofType: 'bell', sag: 6, lean: -2,
        hasSign: true, signText: 'CAFE',
        chimney: { xRel: 25, w: 20, h: 40, style: 'pot' },
        timberBeams: [
          { x1: 15, y1: 145, x2: 155, y2: 145, warp: 3 },
          { x1: 15, y1: 245, x2: 155, y2: 245, warp: -2 }
        ],
        windows: [
          { xRel: 72, yRel: 100, w: 26, h: 26, arched: true, lit: true, amberTint: 0xfef08a }, // Round attic window
          { xRel: 28, yRel: 165, w: 32, h: 42, lit: true, amberTint: 0xfbbf24 },
          { xRel: 110, yRel: 168, w: 32, h: 42, lit: true, amberTint: 0xf59e0b }
        ]
      },
      // 16. The Riverside Watchpost (Wraps seamlessly with x = 2560 -> 0)
      {
        name: 'The Riverside Watchpost',
        x: 2350, w: 215, h: 490, roofHeight: 90, roofType: 'spire', sag: 4, lean: 2,
        hasLantern: true,
        chimney: { xRel: 170, w: 22, h: 42, style: 'brick' },
        timberBeams: [
          { x1: 15, y1: 150, x2: 195, y2: 150, warp: 3 },
          { x1: 15, y1: 260, x2: 195, y2: 260, warp: -3 }
        ],
        windows: [
          { xRel: 40, yRel: 165, w: 30, h: 42, arched: true, lit: true, amberTint: 0xf59e0b },
          { xRel: 135, yRel: 165, w: 30, h: 42, arched: true, lit: true, amberTint: 0xfef08a },
          { xRel: 88, yRel: 275, w: 34, h: 46, lit: true, amberTint: 0xd97706 }
        ]
      }
    ];

    for (const mb of midBuildings) {
      const bTop = 720 - mb.h;
      const roofPeakY = bTop;
      const eaveY = bTop + mb.roofHeight;
      const peakX = mb.x + mb.w / 2 + mb.lean;
      const leftEaveX = mb.x + 6 + mb.lean * 0.7;
      const rightEaveX = mb.x + mb.w - 6 + mb.lean * 0.7;

      // 1. Facade Base with Watercolor Pigment Pooling (fillGradientStyle)
      // Lighter, warm sepia/umber wash at roof eaves -> deeper saturated dark pigment at street level
      midGfx.fillGradientStyle(
        0x382c23, 0x382c23, 0x140e0a, 0x140e0a,
        0.92, 0.92, 1.0, 1.0
      );

      midGfx.beginPath();
      midGfx.moveTo(mb.x, 720);
      midGfx.lineTo(leftEaveX, eaveY);

      if (mb.roofType === 'gambrel') {
        // Gambrel dual-pitch sagging roof using drawQuad
        const midPitchY = eaveY - mb.roofHeight * 0.6;
        drawQuad(midGfx, leftEaveX, eaveY, leftEaveX + 15, midPitchY + mb.sag, mb.x + mb.w * 0.25, midPitchY);
        drawQuad(midGfx, mb.x + mb.w * 0.25, midPitchY, peakX - 15, roofPeakY + mb.sag, peakX, roofPeakY);
        drawQuad(midGfx, peakX, roofPeakY, peakX + 15, roofPeakY + mb.sag, mb.x + mb.w * 0.75, midPitchY);
        drawQuad(midGfx, mb.x + mb.w * 0.75, midPitchY, rightEaveX - 15, midPitchY + mb.sag, rightEaveX, eaveY);
      } else if (mb.roofType === 'mansard') {
        // Mansard bell curve using drawCubic
        drawCubic(midGfx, leftEaveX, eaveY, leftEaveX + 8, eaveY - mb.roofHeight * 0.7, mb.x + mb.w * 0.2, roofPeakY + 4, peakX - 25, roofPeakY);
        midGfx.lineTo(peakX + 25, roofPeakY);
        drawCubic(midGfx, peakX + 25, roofPeakY, mb.x + mb.w * 0.8, roofPeakY + 4, rightEaveX - 8, eaveY - mb.roofHeight * 0.7, rightEaveX, eaveY);
      } else if (mb.roofType === 'bell') {
        // Baroque bell gable with S-curves using drawQuad
        drawQuad(midGfx, leftEaveX, eaveY, leftEaveX + 20, eaveY - 20, leftEaveX + 25, eaveY - mb.roofHeight * 0.5);
        drawQuad(midGfx, leftEaveX + 25, eaveY - mb.roofHeight * 0.5, leftEaveX + 28, roofPeakY + 10, peakX, roofPeakY);
        drawQuad(midGfx, peakX, roofPeakY, rightEaveX - 28, roofPeakY + 10, rightEaveX - 25, eaveY - mb.roofHeight * 0.5);
        drawQuad(midGfx, rightEaveX - 25, eaveY - mb.roofHeight * 0.5, rightEaveX - 20, eaveY - 20, rightEaveX, eaveY);
      } else if (mb.roofType === 'shed') {
        // Sloping single-pitch shed using drawQuad
        drawQuad(midGfx, leftEaveX, eaveY, mb.x + mb.w * 0.5, roofPeakY + mb.sag, rightEaveX, roofPeakY);
        midGfx.lineTo(rightEaveX, eaveY);
      } else {
        // Steep gable or spire with organic sag using drawQuad
        drawQuad(
          midGfx,
          leftEaveX,
          eaveY,
          (leftEaveX + peakX) / 2 - 4,
          (eaveY + roofPeakY) / 2 + mb.sag,
          peakX,
          roofPeakY
        );
        drawQuad(
          midGfx,
          peakX,
          roofPeakY,
          (peakX + rightEaveX) / 2 + 4,
          (roofPeakY + eaveY) / 2 + mb.sag,
          rightEaveX,
          eaveY
        );
      }

      midGfx.lineTo(mb.x + mb.w, 720);
      midGfx.closePath();
      midGfx.fillPath();

      // Street-level heavy watercolor pigment pool wash (lowest 80px)
      midGfx.fillGradientStyle(0x18120e, 0x18120e, 0x0c0806, 0x0c0806, 0, 0, 0.55, 0.55);
      midGfx.fillRect(mb.x, 640, mb.w, 80);

      // 2. 6B Charcoal / Ink Roofline Stroke
      midGfx.lineStyle(3.5, 0x140e0b, 0.95);
      midGfx.beginPath();
      midGfx.moveTo(leftEaveX, eaveY);
      if (mb.roofType === 'gambrel') {
        const midPitchY = eaveY - mb.roofHeight * 0.6;
        drawQuad(midGfx, leftEaveX, eaveY, leftEaveX + 15, midPitchY + mb.sag, mb.x + mb.w * 0.25, midPitchY);
        drawQuad(midGfx, mb.x + mb.w * 0.25, midPitchY, peakX - 15, roofPeakY + mb.sag, peakX, roofPeakY);
        drawQuad(midGfx, peakX, roofPeakY, peakX + 15, roofPeakY + mb.sag, mb.x + mb.w * 0.75, midPitchY);
        drawQuad(midGfx, mb.x + mb.w * 0.75, midPitchY, rightEaveX - 15, midPitchY + mb.sag, rightEaveX, eaveY);
      } else if (mb.roofType === 'mansard') {
        drawCubic(midGfx, leftEaveX, eaveY, leftEaveX + 8, eaveY - mb.roofHeight * 0.7, mb.x + mb.w * 0.2, roofPeakY + 4, peakX - 25, roofPeakY);
        midGfx.lineTo(peakX + 25, roofPeakY);
        drawCubic(midGfx, peakX + 25, roofPeakY, mb.x + mb.w * 0.8, roofPeakY + 4, rightEaveX - 8, eaveY - mb.roofHeight * 0.7, rightEaveX, eaveY);
      } else if (mb.roofType === 'bell') {
        drawQuad(midGfx, leftEaveX, eaveY, leftEaveX + 20, eaveY - 20, leftEaveX + 25, eaveY - mb.roofHeight * 0.5);
        drawQuad(midGfx, leftEaveX + 25, eaveY - mb.roofHeight * 0.5, leftEaveX + 28, roofPeakY + 10, peakX, roofPeakY);
        drawQuad(midGfx, peakX, roofPeakY, rightEaveX - 28, roofPeakY + 10, rightEaveX - 25, eaveY - mb.roofHeight * 0.5);
        drawQuad(midGfx, rightEaveX - 25, eaveY - mb.roofHeight * 0.5, rightEaveX - 20, eaveY - 20, rightEaveX, eaveY);
      } else if (mb.roofType === 'shed') {
        drawQuad(midGfx, leftEaveX, eaveY, mb.x + mb.w * 0.5, roofPeakY + mb.sag, rightEaveX, roofPeakY);
      } else {
        drawQuad(
          midGfx,
          leftEaveX,
          eaveY,
          (leftEaveX + peakX) / 2 - 4,
          (eaveY + roofPeakY) / 2 + mb.sag,
          peakX,
          roofPeakY
        );
        drawQuad(
          midGfx,
          peakX,
          roofPeakY,
          (peakX + rightEaveX) / 2 + 4,
          (roofPeakY + eaveY) / 2 + mb.sag,
          rightEaveX,
          eaveY
        );
      }
      midGfx.strokePath();

      // 3. Chimney Silhouette with Smoke Wisp
      const chX = mb.x + mb.chimney.xRel;
      const chY = roofPeakY - mb.chimney.h + 15;
      midGfx.fillStyle(0x1a130f, 1);
      midGfx.fillRect(chX, chY, mb.chimney.w, mb.chimney.h);

      if (mb.chimney.style === 'brick') {
        // Corbelled brick cap
        midGfx.fillStyle(0x120d0a, 1);
        midGfx.fillRect(chX - 3, chY - 4, mb.chimney.w + 6, 6);
      } else if (mb.chimney.style === 'pot') {
        // Clay pots on top
        midGfx.fillStyle(0x5c2b09, 1);
        midGfx.fillRect(chX + 2, chY - 8, 6, 8);
        midGfx.fillRect(chX + mb.chimney.w - 8, chY - 8, 6, 8);
      } else {
        // Stovepipe cowl
        midGfx.fillStyle(0x0a0c10, 1);
        midGfx.fillRect(chX - 2, chY - 5, mb.chimney.w + 4, 4);
      }

      // Delicate watercolor smoke wisps drifting diagonally
      midGfx.fillStyle(0x475569, 0.08);
      midGfx.fillCircle(chX + mb.chimney.w / 2 + 6, chY - 14, 8);
      midGfx.fillStyle(0x475569, 0.05);
      midGfx.fillCircle(chX + mb.chimney.w / 2 + 16, chY - 28, 13);
      midGfx.fillStyle(0x475569, 0.03);
      midGfx.fillCircle(chX + mb.chimney.w / 2 + 30, chY - 45, 18);

      // 4. Warped Half-Timber Beams (Fachwerk)
      for (const beam of mb.timberBeams) {
        const bx1 = mb.x + beam.x1;
        const by1 = bTop + beam.y1;
        const bx2 = mb.x + beam.x2;
        const by2 = bTop + beam.y2;
        const midBX = (bx1 + bx2) / 2;
        const midBY = (by1 + by2) / 2 + beam.warp;

        midGfx.lineStyle(2.5, 0x181310, 0.88);
        midGfx.beginPath();
        midGfx.moveTo(bx1, by1);
        drawQuad(midGfx, bx1, by1, midBX, midBY, bx2, by2, 8);
        midGfx.strokePath();
      }

      // 5. Asymmetrical Scattered Windows with Warm Tavern Glow
      for (const win of mb.windows) {
        const wx = mb.x + win.xRel;
        const wy = bTop + win.yRel;

        // Outer timber frame
        midGfx.fillStyle(0x110d0a, 0.95);
        if (win.arched) {
          midGfx.fillRect(wx - 2, wy + win.w / 2 - 2, win.w + 4, win.h - win.w / 2 + 4);
          midGfx.fillCircle(wx + win.w / 2, wy + win.w / 2, win.w / 2 + 2);
        } else {
          midGfx.fillRect(wx - 3, wy - 3, win.w + 6, win.h + 6);
        }

        if (win.lit) {
          // Warm glowing amber/gold interior light
          const amberColor = win.amberTint ?? 0xf59e0b;
          midGfx.fillStyle(amberColor, 0.95);
          if (win.arched) {
            midGfx.fillRect(wx, wy + win.w / 2, win.w, win.h - win.w / 2);
            midGfx.fillCircle(wx + win.w / 2, wy + win.w / 2, win.w / 2);
          } else {
            midGfx.fillRect(wx, wy, win.w, win.h);
          }

          // Subtle ambient glow halo around window frame
          midGfx.fillStyle(amberColor, 0.12);
          midGfx.fillCircle(wx + win.w / 2, wy + win.h / 2, Math.max(win.w, win.h) * 0.85);

          // Dark wooden window pane mullion cross
          midGfx.fillStyle(0x1c1511, 0.95);
          midGfx.fillRect(wx + Math.floor(win.w / 2) - 1, wy, 2, win.h);
          midGfx.fillRect(wx, wy + Math.floor(win.h / 2) - 1, win.w, 2);
        } else {
          // Dark unlit curtained glass
          midGfx.fillStyle(0x1c1714, 0.95);
          if (win.arched) {
            midGfx.fillRect(wx, wy + win.w / 2, win.w, win.h - win.w / 2);
            midGfx.fillCircle(wx + win.w / 2, wy + win.w / 2, win.w / 2);
          } else {
            midGfx.fillRect(wx, wy, win.w, win.h);
          }
          // Faint mullion
          midGfx.fillStyle(0x120d0a, 0.8);
          midGfx.fillRect(wx + Math.floor(win.w / 2) - 1, wy, 2, win.h);
        }
      }

      // 6. Hanging Tavern Sign & Ornate Iron Bracket
      if (mb.hasSign) {
        const signX = mb.x + mb.w - 38;
        const signY = bTop + mb.roofHeight + 85;

        // Iron bracket
        midGfx.lineStyle(2, 0x111113, 0.95);
        midGfx.beginPath();
        midGfx.moveTo(signX - 8, signY);
        midGfx.lineTo(signX + 34, signY);
        midGfx.strokePath();

        // Sign board
        midGfx.fillStyle(0x5c2b09, 1);
        midGfx.fillRect(signX - 4, signY + 3, 36, 22);
        midGfx.fillStyle(0xfbbf24, 0.95);
        midGfx.fillRect(signX, signY + 7, 28, 14);

        // Sign text accent bar
        midGfx.fillStyle(0x451a03, 1);
        midGfx.fillRect(signX + 4, signY + 12, 20, 4);
      }

      // 7. Hanging Street / Tavern Lantern
      if (mb.hasLantern) {
        const lanX = mb.x + 14;
        const lanY = bTop + mb.roofHeight + 95;

        // Lantern arm
        midGfx.lineStyle(1.5, 0x18181b, 1);
        midGfx.beginPath();
        midGfx.moveTo(mb.x, lanY - 8);
        midGfx.lineTo(lanX + 4, lanY - 8);
        midGfx.lineTo(lanX + 4, lanY);
        midGfx.strokePath();

        // Lantern glass & glow
        midGfx.fillStyle(0x090a0f, 1);
        midGfx.fillRect(lanX, lanY, 9, 13);
        midGfx.fillStyle(0xfef08a, 0.95);
        midGfx.fillRect(lanX + 1.5, lanY + 2, 6, 8);

        // Radial glow
        midGfx.fillStyle(0xf59e0b, 0.22);
        midGfx.fillCircle(lanX + 4.5, lanY + 6, 24);
        midGfx.fillStyle(0xf59e0b, 0.08);
        midGfx.fillCircle(lanX + 4.5, lanY + 6, 48);
      }
    }

    midGfx.generateTexture('bg_midground', 2560, 720);
    midGfx.destroy();

    // -------------------------------------------------------------
    // Layer 4: Weathered European Cobblestone Alleyway (1280x720)
    // -------------------------------------------------------------
    const streetGfx = this.make.graphics({ x: 0, y: 0 });

    // Weathered Chiseled Curb Stones (y = 560 to 584)
    // Divided into individually carved European curbstones with vertical chisel relief
    streetGfx.fillStyle(0x181c24, 1);
    streetGfx.fillRect(0, 560, 1280, 24);

    let curbX = 0;
    const curbWidths = [85, 70, 95, 80, 75, 90, 85, 100, 70, 80, 90, 85, 75, 95, 85];
    for (let i = 0; curbX < 1280; i++) {
      const cw = curbWidths[i % curbWidths.length];
      const isAlt = (i % 2 === 0);

      // Stone block fill
      streetGfx.fillStyle(isAlt ? 0x242a35 : 0x1f242e, 1);
      streetGfx.fillRect(curbX, 560, cw, 24);

      // Beveled top specular highlight
      streetGfx.fillStyle(0x4b5568, 0.55);
      streetGfx.fillRect(curbX + 3, 560, cw - 6, 3);

      // Vertical chisel relief mortar notch
      streetGfx.fillStyle(0x0e1117, 0.95);
      streetGfx.fillRect(curbX + cw - 2, 560, 2, 24);

      curbX += cw;
    }

    // Cobblestone ground underlay mortar bed (y = 584 to 720)
    streetGfx.fillStyle(0x0e1014, 1);
    streetGfx.fillRect(0, 584, 1280, 136);

    // Weathered European Alleyway Cobblestones:
    // Multi-row organic paving with randomized width, height, mortar spacing, and alpha
    const cobblestonePalettes = [
      0x242934, // slate blue-grey
      0x1b1e26, // dark basalt
      0x28231f, // weathered umber
      0x1e222a, // dark soot granite
      0x2b2723, // warm riverbed stone
      0x181a21  // wet charcoal
    ];

    // Seeded deterministic pseudo-random generator to ensure 100% reproducible seamless paving
    let seed = 42891;
    const deterministicRandom = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    const rowConfigs = [
      { y: 588, h: 17 }, // row 0: slightly smaller stones near curb (perspective)
      { y: 609, h: 18 }, // row 1
      { y: 631, h: 19 }, // row 2
      { y: 654, h: 20 }, // row 3
      { y: 678, h: 21 }, // row 4
      { y: 703, h: 22 }  // row 5: larger stones in immediate foreground
    ];

    for (let r = 0; r < rowConfigs.length; r++) {
      const cfg = rowConfigs[r];
      const rowY = cfg.y;
      const baseH = cfg.h;
      const initialOffset = (r % 2 === 0) ? -28 : -48;
      let currX = initialOffset;

      while (currX < 1320) {
        const randVal = deterministicRandom();
        const randVal2 = deterministicRandom();
        const randVal3 = deterministicRandom();
        const randVal4 = deterministicRandom();

        // Randomized width (28 to 52px)
        const stoneW = Math.round(28 + randVal * 24);
        // Slight height jitter (±2px)
        const stoneH = Math.round(baseH + (randVal2 - 0.5) * 3);
        // Slight vertical jitter (±1.5px)
        const jitterY = (randVal3 - 0.5) * 3;
        // Mortar spacing (3 to 6px)
        const gap = Math.round(3 + randVal4 * 3);

        const colorIndex = Math.floor(deterministicRandom() * cobblestonePalettes.length);
        const stoneColor = cobblestonePalettes[colorIndex];
        const stoneAlpha = 0.72 + deterministicRandom() * 0.24; // 0.72 to 0.96
        const cornerRadius = Math.round(3 + deterministicRandom() * 3); // 3 to 6px worn radius

        // Main rounded cobblestone body
        streetGfx.fillStyle(stoneColor, stoneAlpha);
        streetGfx.fillRoundedRect(currX, rowY + jitterY, stoneW, stoneH, cornerRadius);

        // Specular rainy wet highlight on rounded stone crests
        const highlightW = Math.max(8, stoneW - 10);
        const hasAmberReflection = (deterministicRandom() > 0.82);

        if (hasAmberReflection) {
          // Warm amber glint reflecting streetlamp / tavern light
          streetGfx.fillStyle(0xf59e0b, 0.18);
          streetGfx.fillRect(currX + 4, rowY + jitterY + 2, highlightW, 2.5);
        } else {
          // Cool slate wet sheen
          streetGfx.fillStyle(0x64748b, 0.32);
          streetGfx.fillRect(currX + 4, rowY + jitterY + 2, highlightW, 2);
        }

        // Wrap around boundary for seamless horizontal tiling (0 to 1280)
        if (currX < 0) {
          streetGfx.fillStyle(stoneColor, stoneAlpha);
          streetGfx.fillRoundedRect(currX + 1280, rowY + jitterY, stoneW, stoneH, cornerRadius);
          streetGfx.fillStyle(hasAmberReflection ? 0xf59e0b : 0x64748b, hasAmberReflection ? 0.18 : 0.32);
          streetGfx.fillRect(currX + 1280 + 4, rowY + jitterY + 2, highlightW, 2);
        } else if (currX + stoneW > 1280) {
          streetGfx.fillStyle(stoneColor, stoneAlpha);
          streetGfx.fillRoundedRect(currX - 1280, rowY + jitterY, stoneW, stoneH, cornerRadius);
          streetGfx.fillStyle(hasAmberReflection ? 0xf59e0b : 0x64748b, hasAmberReflection ? 0.18 : 0.32);
          streetGfx.fillRect(currX - 1280 + 4, rowY + jitterY + 2, highlightW, 2);
        }

        currX += stoneW + gap;
      }
    }

    streetGfx.generateTexture('bg_street', 1280, 720);
    streetGfx.destroy();

    // -------------------------------------------------------------
    // Layer 5: Foreground Atmosphere, Streetlamp & Mist (1280x720)
    // -------------------------------------------------------------
    const fgGfx = this.make.graphics({ x: 0, y: 0 });
    const lampX = 980;

    // Gas Streetlamp Post
    fgGfx.fillStyle(0x0e1014, 1);
    fgGfx.fillRect(lampX, 410, 14, 170); // Post
    fgGfx.fillRect(lampX - 6, 570, 26, 14); // Base
    fgGfx.fillRect(lampX - 10, 360, 34, 52); // Lantern housing

    // Lantern light source
    fgGfx.fillStyle(0xfef08a, 0.95);
    fgGfx.fillRect(lampX - 5, 370, 24, 34);

    // Warm radial glow halo
    fgGfx.fillStyle(0xf59e0b, 0.22);
    fgGfx.fillCircle(lampX + 7, 387, 85);
    fgGfx.fillStyle(0xf59e0b, 0.08);
    fgGfx.fillCircle(lampX + 7, 387, 165);

    // Ground mist wash (bottom 80px)
    fgGfx.fillGradientStyle(0x000000, 0x000000, 0x181e2b, 0x181e2b, 0, 0, 0.28, 0.28);
    fgGfx.fillRect(0, 640, 1280, 80);

    fgGfx.generateTexture('bg_foreground', 1280, 720);
    fgGfx.destroy();

    // -------------------------------------------------------------
    // Item: Glowing Copper Tip Gear (32x32)
    // -------------------------------------------------------------
    const gearGfx = this.make.graphics({ x: 0, y: 0 });
    const cx = 16;
    const cy = 16;

    // Ambient warm golden glow
    gearGfx.fillStyle(0xf59e0b, 0.3);
    gearGfx.fillCircle(cx, cy, 15);
    gearGfx.fillStyle(0xfbbf24, 0.45);
    gearGfx.fillCircle(cx, cy, 11);

    // 6 Cog teeth radiating outwards
    gearGfx.fillStyle(0xb45309, 1);
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const tx = cx + Math.cos(angle) * 9;
      const ty = cy + Math.sin(angle) * 9;
      gearGfx.fillCircle(tx, ty, 3.2);
    }

    // Main copper gear disk
    gearGfx.fillStyle(0xd97706, 1);
    gearGfx.fillCircle(cx, cy, 8.5);

    // 6B charcoal outer line
    gearGfx.lineStyle(1.5, 0x18181b, 0.95);
    gearGfx.strokeCircle(cx, cy, 8.5);

    // Inner axle hole & brass rivet
    gearGfx.fillStyle(0x18181b, 1);
    gearGfx.fillCircle(cx, cy, 3.2);
    gearGfx.fillStyle(0xfef08a, 1);
    gearGfx.fillCircle(cx - 0.5, cy - 0.5, 1.2);

    gearGfx.generateTexture('item_tip_gear', 32, 32);
    gearGfx.destroy();

    // -------------------------------------------------------------
    // Hazard: Weathered Shipping Crate (44x44, Sketchbook Expressionism)
    // Warped, battered hand-drawn crate with 6B charcoal contours & slight vertex jitter
    // -------------------------------------------------------------
    const crateGfx = this.make.graphics({ x: 0, y: 0 });

    // Jittered bounding vertices for hand-drawn warped silhouette
    // (TL: 3, 2.5), (TR: 41.5, 3), (BR: 42, 41.5), (BL: 2.5, 41)
    crateGfx.fillStyle(0x451a03, 1);
    crateGfx.beginPath();
    crateGfx.moveTo(3, 2.5);
    crateGfx.lineTo(41.5, 3);
    crateGfx.lineTo(42, 41.5);
    crateGfx.lineTo(2.5, 41);
    crateGfx.closePath();
    crateGfx.fillPath();

    // 3 Uneven battered wooden planks with wavy seams
    // Plank 1 (Top)
    crateGfx.fillStyle(0x78350f, 1);
    crateGfx.beginPath();
    crateGfx.moveTo(4, 4);
    crateGfx.lineTo(40.5, 4.5);
    crateGfx.lineTo(40.5, 14);
    drawQuad(crateGfx, 40.5, 14, 22, 14.5, 4, 13.5, 8);
    crateGfx.closePath();
    crateGfx.fillPath();

    // Plank 2 (Middle)
    crateGfx.fillStyle(0x6b2e09, 1);
    crateGfx.beginPath();
    crateGfx.moveTo(4, 15);
    crateGfx.lineTo(40.5, 15.5);
    crateGfx.lineTo(40.5, 27);
    drawQuad(crateGfx, 40.5, 27, 22, 27.5, 4, 26.5, 8);
    crateGfx.closePath();
    crateGfx.fillPath();

    // Plank 3 (Bottom)
    crateGfx.fillStyle(0x78350f, 1);
    crateGfx.beginPath();
    crateGfx.moveTo(4, 28);
    crateGfx.lineTo(40.5, 28.5);
    crateGfx.lineTo(40.5, 39.5);
    drawQuad(crateGfx, 40.5, 39.5, 22, 40, 4, 39, 8);
    crateGfx.closePath();
    crateGfx.fillPath();

    // Wood grain accents using drawQuad
    crateGfx.lineStyle(1, 0x3d1704, 0.45);
    crateGfx.beginPath();
    crateGfx.moveTo(6, 8);
    drawQuad(crateGfx, 6, 8, 20, 9, 38, 7.5, 6);
    crateGfx.moveTo(7, 20);
    drawQuad(crateGfx, 7, 20, 24, 22, 37, 21, 6);
    crateGfx.moveTo(6, 33);
    drawQuad(crateGfx, 6, 33, 22, 34.5, 38, 33, 6);
    crateGfx.strokePath();

    // Warped diagonal timber braces (drawn with organic curvature)
    crateGfx.lineStyle(3.5, 0x241004, 0.9);
    crateGfx.beginPath();
    crateGfx.moveTo(4.5, 4.5);
    drawQuad(crateGfx, 4.5, 4.5, 23, 23.5, 39.5, 39.5, 8);
    crateGfx.moveTo(39.5, 4.5);
    drawQuad(crateGfx, 39.5, 4.5, 21.5, 22.5, 4.5, 39.5, 8);
    crateGfx.strokePath();

    // Hand-hammered corner iron brackets (slightly asymmetrical)
    crateGfx.fillStyle(0x18181b, 1);
    crateGfx.beginPath();
    crateGfx.moveTo(2, 2); crateGfx.lineTo(11, 2.5); crateGfx.lineTo(8.5, 8.5); crateGfx.lineTo(2.5, 11); crateGfx.closePath(); crateGfx.fillPath();
    crateGfx.beginPath();
    crateGfx.moveTo(42, 2); crateGfx.lineTo(33, 2.5); crateGfx.lineTo(35.5, 8.5); crateGfx.lineTo(41.5, 11); crateGfx.closePath(); crateGfx.fillPath();
    crateGfx.beginPath();
    crateGfx.moveTo(2, 42); crateGfx.lineTo(11, 41.5); crateGfx.lineTo(8.5, 35.5); crateGfx.lineTo(2.5, 33); crateGfx.closePath(); crateGfx.fillPath();
    crateGfx.beginPath();
    crateGfx.moveTo(42, 42); crateGfx.lineTo(33, 41.5); crateGfx.lineTo(35.5, 35.5); crateGfx.lineTo(41.5, 33); crateGfx.closePath(); crateGfx.fillPath();

    // Brass rivets
    crateGfx.fillStyle(0xf59e0b, 1);
    crateGfx.fillCircle(5.5, 5.5, 1.5);
    crateGfx.fillCircle(38.5, 5.5, 1.5);
    crateGfx.fillCircle(5.5, 38.5, 1.5);
    crateGfx.fillCircle(38.5, 38.5, 1.5);

    // 6B Charcoal outer sketch contour (double stroke: primary dark + offset whisper line)
    crateGfx.lineStyle(2, 0x141416, 0.95);
    crateGfx.beginPath();
    crateGfx.moveTo(3, 2.5);
    crateGfx.lineTo(41.5, 3);
    crateGfx.lineTo(42, 41.5);
    crateGfx.lineTo(2.5, 41);
    crateGfx.closePath();
    crateGfx.strokePath();

    // Secondary whisper sketch line (replicates shaky graphite hand-sketch)
    crateGfx.lineStyle(1, 0x27272a, 0.5);
    crateGfx.beginPath();
    crateGfx.moveTo(3.8, 1.8);
    crateGfx.lineTo(42.2, 2.4);
    crateGfx.lineTo(42.6, 42.1);
    crateGfx.lineTo(1.9, 41.6);
    crateGfx.closePath();
    crateGfx.strokePath();

    crateGfx.generateTexture('hazard_crate', 44, 44);
    crateGfx.destroy();

    // -------------------------------------------------------------
    // Hazard: Murky Street Puddle (60x18, Sketchbook Expressionism)
    // Organic amoebic liquid pool with iridescent oil sheen & 6B ripple marks
    // -------------------------------------------------------------
    const puddleGfx = this.make.graphics({ x: 0, y: 0 });

    // Organic amoebic liquid perimeter control points around center (30, 9)
    const puddlePts: [number, number][] = [
      [7, 9], [13, 4.5], [24, 3], [37, 3.5], [49, 5.5],
      [55, 9.5], [48, 14], [35, 15.5], [21, 15], [11, 13]
    ];

    // 1. Dark Ground Absorption Shadow beneath the pool
    puddleGfx.fillStyle(0x090a0f, 0.85);
    puddleGfx.beginPath();
    drawSmoothClosedSpline(puddleGfx, puddlePts);
    puddleGfx.closePath();
    puddleGfx.fillPath();

    // 2. Murky Water Core
    puddleGfx.fillStyle(0x162032, 0.92);
    puddleGfx.beginPath();
    drawSmoothClosedSpline(puddleGfx, puddlePts, 0, -0.5);
    puddleGfx.closePath();
    puddleGfx.fillPath();

    // 3. Organic Wavy Iridescent Petrol Cyan Sheen
    puddleGfx.fillStyle(0x06b6d4, 0.45);
    puddleGfx.beginPath();
    puddleGfx.moveTo(16, 7);
    drawQuad(puddleGfx, 16, 7, 28, 4.5, 40, 7.5, 8);
    drawQuad(puddleGfx, 40, 7.5, 28, 9.5, 16, 7, 8);
    puddleGfx.closePath();
    puddleGfx.fillPath();

    // 4. Reflected Streetlamp / Tavern Amber Glint
    puddleGfx.fillStyle(0xf59e0b, 0.38);
    puddleGfx.beginPath();
    puddleGfx.moveTo(27, 9);
    drawQuad(puddleGfx, 27, 9, 39, 7.5, 48, 10.5, 8);
    drawQuad(puddleGfx, 48, 10.5, 38, 12, 27, 9, 8);
    puddleGfx.closePath();
    puddleGfx.fillPath();

    // 5. 6B Charcoal Outline & Broken Ripple Strokes
    puddleGfx.lineStyle(1.5, 0x0f172a, 0.85);
    puddleGfx.beginPath();
    drawSmoothClosedSpline(puddleGfx, puddlePts);
    puddleGfx.closePath();
    puddleGfx.strokePath();

    // Subtle broken ripple ring off-center
    puddleGfx.lineStyle(1, 0x1e293b, 0.5);
    puddleGfx.beginPath();
    puddleGfx.moveTo(22, 9.5);
    drawQuad(puddleGfx, 22, 9.5, 29, 7.5, 36, 9.5, 6);
    puddleGfx.strokePath();

    puddleGfx.generateTexture('hazard_puddle', 60, 18);
    puddleGfx.destroy();
  }
}

