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

// Explicit cubic Bezier curve helper wrapping drawCubic for sweeping canvas awnings and drapery
function bezierCurveTo(
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
  drawCubic(gfx, p0x, p0y, c1x, c1y, c2x, c2y, p1x, p1y, segments);
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

    // Generate high-resolution procedural placeholder textures for parallax layers and hazards
    this.createProceduralTextures();
  }

  create(): void {
    // Transition to title screen for player entry and audio unlock
    this.scene.start('TitleScene');
  }

  private createProceduralTextures(): void {
    this.createSkyTexture();
    this.createDistantTexture();
    this.createMidgroundTextures();
    this.createStreetTexture();
    this.createForegroundTexture();
    this.createItemTextures();
    this.createPowerupTextures();
    this.createHazardTextures();
  }

  // -------------------------------------------------------------
  // Layer 1: Sky, Atmospheric Haze & Moon Texture (1280x720)
  // -------------------------------------------------------------
  private createSkyTexture(): void {
    const skyGfx = this.make.graphics({ x: 0, y: 0 });
    skyGfx.fillGradientStyle(0x080912, 0x080912, 0x141826, 0x1c2132, 1);
    skyGfx.fillRect(0, 0, 1280, 720);

    const moonX = 1050;
    const moonY = 140;
    skyGfx.fillStyle(0xfef3c7, 0.03);
    skyGfx.fillCircle(moonX, moonY, 115);
    skyGfx.fillStyle(0xfef3c7, 0.06);
    skyGfx.fillCircle(moonX, moonY, 78);
    skyGfx.fillStyle(0xfef3c7, 0.14);
    skyGfx.fillCircle(moonX, moonY, 56);

    skyGfx.fillStyle(0xfef3c7, 0.96);
    skyGfx.fillCircle(moonX, moonY, 48);
    skyGfx.fillStyle(0x080912, 1);
    skyGfx.fillCircle(moonX + 18, moonY - 8, 44);

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
  }

  // -------------------------------------------------------------
  // Layer 2: Distant Horizon Skyline & River Mist (1280x720)
  // -------------------------------------------------------------
  private createDistantTexture(): void {
    const distGfx = this.make.graphics({ x: 0, y: 0 });
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

    const distStructures = [
      { x: 0, w: 110, h: 260, peak: 45, style: 'gable', chimney: false },
      { x: 100, w: 75, h: 365, peak: 85, style: 'spire', chimney: false },
      { x: 170, w: 120, h: 240, peak: 35, style: 'mansard', chimney: true },
      { x: 280, w: 105, h: 310, peak: 55, style: 'gable', chimney: true },
      { x: 375, w: 85, h: 395, peak: 95, style: 'spire', chimney: false },
      { x: 450, w: 140, h: 280, peak: 40, style: 'dome', chimney: true },
      { x: 580, w: 115, h: 320, peak: 60, style: 'gable', chimney: true },
      { x: 685, w: 90, h: 350, peak: 80, style: 'spire', chimney: false },
      { x: 765, w: 130, h: 265, peak: 35, style: 'mansard', chimney: true },
      { x: 885, w: 110, h: 330, peak: 65, style: 'gable', chimney: true },
      { x: 985, w: 80, h: 380, peak: 90, style: 'spire', chimney: false },
      { x: 1055, w: 125, h: 275, peak: 40, style: 'dome', chimney: true },
      { x: 1170, w: 95, h: 305, peak: 50, style: 'gable', chimney: true },
      { x: 1255, w: 90, h: 340, peak: 70, style: 'spire', chimney: false }
    ];

    distGfx.fillStyle(0x131722, 1);
    for (const b of distStructures) {
      const topY = 720 - b.h;
      distGfx.beginPath();
      distGfx.moveTo(b.x, 720);

      if (b.style === 'spire') {
        distGfx.lineTo(b.x + b.w * 0.2, topY + b.peak);
        distGfx.lineTo(b.x + b.w * 0.5, topY);
        distGfx.lineTo(b.x + b.w * 0.8, topY + b.peak);
      } else if (b.style === 'dome') {
        distGfx.lineTo(b.x + 8, topY + b.peak);
        drawQuad(distGfx, b.x + 8, topY + b.peak, b.x + b.w * 0.5, topY - 12, b.x + b.w - 8, topY + b.peak, 8);
      } else if (b.style === 'mansard') {
        distGfx.lineTo(b.x + 14, topY + b.peak);
        distGfx.lineTo(b.x + b.w * 0.3, topY);
        distGfx.lineTo(b.x + b.w * 0.7, topY);
        distGfx.lineTo(b.x + b.w - 14, topY + b.peak);
      } else {
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
  }

  // -------------------------------------------------------------
  // Layer 3: Biome-Specific Midground Architecture Textures (2560x720)
  // Generates 5 distinct architectural styles (Acts 1-5) seamlessly tiling at 2560px
  // -------------------------------------------------------------
  private createMidgroundTextures(): void {
    this.createMidgroundAct1();
    this.createMidgroundAct2();
    this.createMidgroundAct3();
    this.createMidgroundAct4();
    this.createMidgroundAct5();
  }

  // Act 1: The Tavern Exit — Steep sagging gables, half-timber beams (Fachwerk), smoking chimneys, tavern signs
  private createMidgroundAct1(): void {
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
      {
        name: 'The Clock / Belfry Tower',
        x: 650, w: 115, h: 540, roofHeight: 110, roofType: 'spire', sag: 3, lean: -2,
        chimney: { xRel: 10, w: 12, h: 25, style: 'pipe' },
        timberBeams: [
          { x1: 10, y1: 160, x2: 105, y2: 160, warp: 2 },
          { x1: 10, y1: 280, x2: 105, y2: 280, warp: -2 }
        ],
        windows: [
          { xRel: 38, yRel: 125, w: 38, h: 38, arched: true, lit: true, amberTint: 0xfef08a },
          { xRel: 25, yRel: 200, w: 24, h: 48, arched: true, lit: false },
          { xRel: 65, yRel: 200, w: 24, h: 48, arched: true, lit: false },
          { xRel: 42, yRel: 310, w: 28, h: 40, lit: true, amberTint: 0xf59e0b }
        ]
      },
      {
        name: 'The Mansard Atelier',
        x: 760, w: 175, h: 435, roofHeight: 75, roofType: 'mansard', sag: 5, lean: 3,
        chimney: { xRel: 130, w: 18, h: 40, style: 'pot' },
        timberBeams: [
          { x1: 15, y1: 145, x2: 160, y2: 145, warp: 3 },
          { x1: 15, y1: 245, x2: 160, y2: 245, warp: -3 }
        ],
        windows: [
          { xRel: 65, yRel: 95, w: 42, h: 34, lit: true, amberTint: 0xfef08a },
          { xRel: 25, yRel: 165, w: 32, h: 44, lit: true, amberTint: 0xfbbf24 },
          { xRel: 115, yRel: 168, w: 32, h: 44, lit: true, amberTint: 0xf59e0b },
          { xRel: 70, yRel: 260, w: 36, h: 46, lit: false }
        ]
      },
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
          { xRel: 48, yRel: 110, w: 32, h: 38, arched: true, lit: true, amberTint: 0x10b981 },
          { xRel: 24, yRel: 235, w: 28, h: 40, lit: true, amberTint: 0xf59e0b },
          { xRel: 82, yRel: 238, w: 28, h: 40, lit: true, amberTint: 0xfbbf24 }
        ]
      },
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
          { xRel: 72, yRel: 100, w: 26, h: 26, arched: true, lit: true, amberTint: 0xfef08a },
          { xRel: 28, yRel: 165, w: 32, h: 42, lit: true, amberTint: 0xfbbf24 },
          { xRel: 110, yRel: 168, w: 32, h: 42, lit: true, amberTint: 0xf59e0b }
        ]
      },
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

      midGfx.fillGradientStyle(0x382c23, 0x382c23, 0x140e0a, 0x140e0a, 0.92, 0.92, 1.0, 1.0);
      midGfx.beginPath();
      midGfx.moveTo(mb.x, 720);
      midGfx.lineTo(leftEaveX, eaveY);

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
        midGfx.lineTo(rightEaveX, eaveY);
      } else {
        drawQuad(midGfx, leftEaveX, eaveY, (leftEaveX + peakX) / 2 - 4, (eaveY + roofPeakY) / 2 + mb.sag, peakX, roofPeakY);
        drawQuad(midGfx, peakX, roofPeakY, (peakX + rightEaveX) / 2 + 4, (roofPeakY + eaveY) / 2 + mb.sag, rightEaveX, eaveY);
      }

      midGfx.lineTo(mb.x + mb.w, 720);
      midGfx.closePath();
      midGfx.fillPath();

      midGfx.fillGradientStyle(0x18120e, 0x18120e, 0x0c0806, 0x0c0806, 0, 0, 0.55, 0.55);
      midGfx.fillRect(mb.x, 640, mb.w, 80);

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
        drawQuad(midGfx, leftEaveX, eaveY, (leftEaveX + peakX) / 2 - 4, (eaveY + roofPeakY) / 2 + mb.sag, peakX, roofPeakY);
        drawQuad(midGfx, peakX, roofPeakY, (peakX + rightEaveX) / 2 + 4, (roofPeakY + eaveY) / 2 + mb.sag, rightEaveX, eaveY);
      }
      midGfx.strokePath();

      const chX = mb.x + mb.chimney.xRel;
      const chY = roofPeakY - mb.chimney.h + 15;
      midGfx.fillStyle(0x1a130f, 1);
      midGfx.fillRect(chX, chY, mb.chimney.w, mb.chimney.h);

      if (mb.chimney.style === 'brick') {
        midGfx.fillStyle(0x120d0a, 1);
        midGfx.fillRect(chX - 3, chY - 4, mb.chimney.w + 6, 6);
      } else if (mb.chimney.style === 'pot') {
        midGfx.fillStyle(0x5c2b09, 1);
        midGfx.fillRect(chX + 2, chY - 8, 6, 8);
        midGfx.fillRect(chX + mb.chimney.w - 8, chY - 8, 6, 8);
      } else {
        midGfx.fillStyle(0x0a0c10, 1);
        midGfx.fillRect(chX - 2, chY - 5, mb.chimney.w + 4, 4);
      }

      midGfx.fillStyle(0x475569, 0.08);
      midGfx.fillCircle(chX + mb.chimney.w / 2 + 6, chY - 14, 8);
      midGfx.fillStyle(0x475569, 0.05);
      midGfx.fillCircle(chX + mb.chimney.w / 2 + 16, chY - 28, 13);
      midGfx.fillStyle(0x475569, 0.03);
      midGfx.fillCircle(chX + mb.chimney.w / 2 + 30, chY - 45, 18);

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

      for (const win of mb.windows) {
        const wx = mb.x + win.xRel;
        const wy = bTop + win.yRel;

        midGfx.fillStyle(0x110d0a, 0.95);
        if (win.arched) {
          midGfx.fillRect(wx - 2, wy + win.w / 2 - 2, win.w + 4, win.h - win.w / 2 + 4);
          midGfx.fillCircle(wx + win.w / 2, wy + win.w / 2, win.w / 2 + 2);
        } else {
          midGfx.fillRect(wx - 3, wy - 3, win.w + 6, win.h + 6);
        }

        if (win.lit) {
          const amberColor = win.amberTint ?? 0xf59e0b;
          midGfx.fillStyle(amberColor, 0.95);
          if (win.arched) {
            midGfx.fillRect(wx, wy + win.w / 2, win.w, win.h - win.w / 2);
            midGfx.fillCircle(wx + win.w / 2, wy + win.w / 2, win.w / 2);
          } else {
            midGfx.fillRect(wx, wy, win.w, win.h);
          }

          midGfx.fillStyle(amberColor, 0.12);
          midGfx.fillCircle(wx + win.w / 2, wy + win.h / 2, Math.max(win.w, win.h) * 0.85);

          midGfx.fillStyle(0x1c1511, 0.95);
          midGfx.fillRect(wx + Math.floor(win.w / 2) - 1, wy, 2, win.h);
          midGfx.fillRect(wx, wy + Math.floor(win.h / 2) - 1, win.w, 2);
        } else {
          midGfx.fillStyle(0x1c1714, 0.95);
          if (win.arched) {
            midGfx.fillRect(wx, wy + win.w / 2, win.w, win.h - win.w / 2);
            midGfx.fillCircle(wx + win.w / 2, wy + win.w / 2, win.w / 2);
          } else {
            midGfx.fillRect(wx, wy, win.w, win.h);
          }
          midGfx.fillStyle(0x120d0a, 0.8);
          midGfx.fillRect(wx + Math.floor(win.w / 2) - 1, wy, 2, win.h);
        }
      }

      if (mb.hasSign) {
        const signX = mb.x + mb.w - 38;
        const signY = bTop + mb.roofHeight + 85;

        midGfx.lineStyle(2, 0x111113, 0.95);
        midGfx.beginPath();
        midGfx.moveTo(signX - 8, signY);
        midGfx.lineTo(signX + 34, signY);
        midGfx.strokePath();

        midGfx.fillStyle(0x5c2b09, 1);
        midGfx.fillRect(signX - 4, signY + 3, 36, 22);
        midGfx.fillStyle(0xfbbf24, 0.95);
        midGfx.fillRect(signX, signY + 7, 28, 14);

        midGfx.fillStyle(0x451a03, 1);
        midGfx.fillRect(signX + 4, signY + 12, 20, 4);
      }

      if (mb.hasLantern) {
        const lanX = mb.x + 14;
        const lanY = bTop + mb.roofHeight + 95;

        midGfx.lineStyle(1.5, 0x18181b, 1);
        midGfx.beginPath();
        midGfx.moveTo(mb.x, lanY - 8);
        midGfx.lineTo(lanX + 4, lanY - 8);
        midGfx.lineTo(lanX + 4, lanY);
        midGfx.strokePath();

        midGfx.fillStyle(0x090a0f, 1);
        midGfx.fillRect(lanX, lanY, 9, 13);
        midGfx.fillStyle(0xfef08a, 0.95);
        midGfx.fillRect(lanX + 1.5, lanY + 2, 6, 8);

        midGfx.fillStyle(0xf59e0b, 0.22);
        midGfx.fillCircle(lanX + 4.5, lanY + 6, 24);
        midGfx.fillStyle(0xf59e0b, 0.08);
        midGfx.fillCircle(lanX + 4.5, lanY + 6, 48);
      }
    }

    midGfx.generateTexture('bg_midground_act1', 2560, 720);
    midGfx.destroy();
  }

  // Act 2: The Crooked Canals — Venetian arched stone bridges spanning water gaps, flat docks with mooring poles, canal palazzos
  private createMidgroundAct2(): void {
    const midGfx = this.make.graphics({ x: 0, y: 0 });

    interface CanalStructure {
      type: 'palazzo' | 'bridge' | 'dock' | 'tower';
      x: number;
      w: number;
      h: number;
      roofType?: 'venetian_gable' | 'campanile' | 'terrace' | 'mansard';
      bridgeArch?: { archW: number; archH: number };
      dockPosts?: number[];
      windows?: { xRel: number; yRel: number; w: number; h: number; trefoil?: boolean; lit: boolean }[];
    }

    const canalStructures: CanalStructure[] = [
      {
        type: 'palazzo', x: 0, w: 185, h: 465, roofType: 'venetian_gable',
        windows: [
          { xRel: 28, yRel: 130, w: 26, h: 48, trefoil: true, lit: true },
          { xRel: 72, yRel: 130, w: 26, h: 48, trefoil: true, lit: true },
          { xRel: 118, yRel: 130, w: 26, h: 48, trefoil: true, lit: false },
          { xRel: 45, yRel: 240, w: 32, h: 44, trefoil: false, lit: true },
          { xRel: 105, yRel: 240, w: 32, h: 44, trefoil: false, lit: false }
        ]
      },
      {
        type: 'bridge', x: 180, w: 175, h: 360,
        bridgeArch: { archW: 110, archH: 65 }
      },
      {
        type: 'dock', x: 350, w: 190, h: 430,
        dockPosts: [30, 85, 145]
      },
      {
        type: 'tower', x: 535, w: 155, h: 520, roofType: 'campanile'
      },
      {
        type: 'palazzo', x: 685, w: 195, h: 445, roofType: 'terrace',
        windows: [
          { xRel: 30, yRel: 140, w: 24, h: 42, trefoil: true, lit: false },
          { xRel: 75, yRel: 140, w: 24, h: 42, trefoil: true, lit: true },
          { xRel: 125, yRel: 140, w: 24, h: 42, trefoil: true, lit: true }
        ]
      },
      {
        type: 'bridge', x: 875, w: 170, h: 370,
        bridgeArch: { archW: 105, archH: 70 }
      },
      {
        type: 'palazzo', x: 1040, w: 195, h: 480, roofType: 'venetian_gable',
        windows: [
          { xRel: 35, yRel: 120, w: 28, h: 48, trefoil: true, lit: true },
          { xRel: 80, yRel: 120, w: 28, h: 48, trefoil: true, lit: true },
          { xRel: 125, yRel: 120, w: 28, h: 48, trefoil: true, lit: false }
        ]
      },
      {
        type: 'dock', x: 1230, w: 175, h: 425,
        dockPosts: [25, 75, 135]
      },
      {
        type: 'tower', x: 1400, w: 160, h: 530, roofType: 'campanile'
      },
      {
        type: 'bridge', x: 1555, w: 180, h: 365,
        bridgeArch: { archW: 115, archH: 60 }
      },
      {
        type: 'palazzo', x: 1730, w: 190, h: 450, roofType: 'terrace',
        windows: [
          { xRel: 32, yRel: 135, w: 26, h: 44, trefoil: true, lit: true },
          { xRel: 82, yRel: 135, w: 26, h: 44, trefoil: true, lit: false },
          { xRel: 132, yRel: 135, w: 26, h: 44, trefoil: true, lit: true }
        ]
      },
      {
        type: 'palazzo', x: 1915, w: 170, h: 475, roofType: 'venetian_gable',
        windows: [
          { xRel: 30, yRel: 145, w: 30, h: 46, trefoil: true, lit: true },
          { xRel: 95, yRel: 145, w: 30, h: 46, trefoil: true, lit: false }
        ]
      },
      {
        type: 'dock', x: 2080, w: 180, h: 430,
        dockPosts: [35, 90, 145]
      },
      {
        type: 'palazzo', x: 2255, w: 310, h: 465, roofType: 'terrace',
        windows: [
          { xRel: 40, yRel: 130, w: 28, h: 48, trefoil: true, lit: true },
          { xRel: 95, yRel: 130, w: 28, h: 48, trefoil: true, lit: true },
          { xRel: 150, yRel: 130, w: 28, h: 48, trefoil: true, lit: false },
          { xRel: 215, yRel: 130, w: 28, h: 48, trefoil: true, lit: true }
        ]
      }
    ];

    for (const cs of canalStructures) {
      const topY = 720 - cs.h;

      // Deep waterlogged moss-green stone gradient
      midGfx.fillGradientStyle(0x1a332d, 0x1a332d, 0x0c1c17, 0x0c1c17, 0.92, 0.92, 1.0, 1.0);

      if (cs.type === 'bridge') {
        const arch = cs.bridgeArch ?? { archW: 100, archH: 60 };
        const bridgeArchLeft = cs.x + (cs.w - arch.archW) / 2;
        const bridgeArchRight = bridgeArchLeft + arch.archW;
        const archCenterY = 640 - arch.archH;

        // 1. Dark Water Canal Cut beneath the bridge
        midGfx.fillStyle(0x061118, 1);
        midGfx.fillRect(cs.x, 560, cs.w, 160);

        // Water reflection wash
        midGfx.fillStyle(0x10b981, 0.15);
        midGfx.fillRect(cs.x + 8, 620, cs.w - 16, 25);

        // 2. Venetian Humpback Stone Bridge Body
        midGfx.fillGradientStyle(0x2d4a3e, 0x2d4a3e, 0x162a22, 0x162a22, 0.95, 0.95, 1.0, 1.0);
        midGfx.beginPath();
        midGfx.moveTo(cs.x, 720);
        midGfx.lineTo(cs.x, 570);
        // Humpback crest curve
        drawQuad(midGfx, cs.x, 570, cs.x + cs.w / 2, 510, cs.x + cs.w, 570, 10);
        midGfx.lineTo(cs.x + cs.w, 720);
        midGfx.lineTo(bridgeArchRight, 640);
        // Curved under-arch
        drawQuad(midGfx, bridgeArchRight, 640, cs.x + cs.w / 2, archCenterY, bridgeArchLeft, 640, 10);
        midGfx.lineTo(cs.x, 720);
        midGfx.closePath();
        midGfx.fillPath();

        // 3. Stone Balustrade on Bridge Crest
        midGfx.lineStyle(3, 0x0f1c16, 0.95);
        midGfx.beginPath();
        midGfx.moveTo(cs.x, 570);
        drawQuad(midGfx, cs.x, 570, cs.x + cs.w / 2, 510, cs.x + cs.w, 570, 10);
        midGfx.strokePath();

        // Keystone block at apex of bridge arch
        midGfx.fillStyle(0x3e5f50, 1);
        midGfx.fillRect(cs.x + cs.w / 2 - 8, archCenterY - 6, 16, 14);

      } else if (cs.type === 'dock') {
        // Flat dock warehouse with timber decking
        midGfx.beginPath();
        midGfx.moveTo(cs.x, 720);
        midGfx.lineTo(cs.x, topY + 40);
        midGfx.lineTo(cs.x + cs.w / 2, topY);
        midGfx.lineTo(cs.x + cs.w, topY + 40);
        midGfx.lineTo(cs.x + cs.w, 720);
        midGfx.closePath();
        midGfx.fillPath();

        // Flat wooden dock stage at water edge (y = 560 to 585)
        midGfx.fillStyle(0x382415, 1);
        midGfx.fillRect(cs.x - 4, 565, cs.w + 8, 16);
        midGfx.fillStyle(0x78350f, 0.85);
        midGfx.fillRect(cs.x - 2, 565, cs.w + 4, 3);

        // Mooring Posts (Briccole: wooden poles with spiral rope wrap)
        if (cs.dockPosts) {
          for (const postXRel of cs.dockPosts) {
            const px = cs.x + postXRel;
            midGfx.fillStyle(0x27170b, 1);
            midGfx.fillRect(px, 510, 8, 85);
            // Spiral rope binding
            midGfx.lineStyle(1.5, 0xd97706, 0.85);
            midGfx.beginPath();
            midGfx.moveTo(px - 1, 528); midGfx.lineTo(px + 9, 532);
            midGfx.moveTo(px - 1, 538); midGfx.lineTo(px + 9, 542);
            midGfx.moveTo(px - 1, 548); midGfx.lineTo(px + 9, 552);
            midGfx.strokePath();
          }
        }

        // Arched water boathouse door
        midGfx.fillStyle(0x0a1410, 1);
        midGfx.fillRect(cs.x + 35, 470, cs.w - 70, 95);
        midGfx.fillCircle(cs.x + cs.w / 2, 470, (cs.w - 70) / 2);

      } else if (cs.type === 'tower') {
        // Tall Venetian Campanile (Bell Tower)
        midGfx.fillRect(cs.x, topY, cs.w, cs.h);

        // Pyramidal copper spire roof with verdigris patina
        midGfx.fillStyle(0x10b981, 0.95);
        midGfx.beginPath();
        midGfx.moveTo(cs.x - 4, topY);
        midGfx.lineTo(cs.x + cs.w / 2, topY - 75);
        midGfx.lineTo(cs.x + cs.w + 4, topY);
        midGfx.closePath();
        midGfx.fillPath();

        // Open belfry arcade
        midGfx.fillStyle(0x091410, 1);
        midGfx.fillRect(cs.x + 18, topY + 25, cs.w - 36, 50);
        midGfx.fillCircle(cs.x + cs.w / 2, topY + 25, (cs.w - 36) / 2);

        // Hanging bronze bell silhouette
        midGfx.fillStyle(0xd97706, 0.8);
        midGfx.fillCircle(cs.x + cs.w / 2, topY + 45, 10);

      } else {
        // Palazzo facade with Venetian pointed / trefoil windows
        midGfx.beginPath();
        midGfx.moveTo(cs.x, 720);
        midGfx.lineTo(cs.x, topY + 30);

        if (cs.roofType === 'venetian_gable') {
          // Venetian Gothic stepped or crest roof
          midGfx.lineTo(cs.x + 20, topY + 30);
          midGfx.lineTo(cs.x + 20, topY + 10);
          midGfx.lineTo(cs.x + cs.w / 2, topY - 15);
          midGfx.lineTo(cs.x + cs.w - 20, topY + 10);
          midGfx.lineTo(cs.x + cs.w - 20, topY + 30);
        } else {
          // Balustrade terrace roofline
          midGfx.lineTo(cs.x, topY);
          midGfx.lineTo(cs.x + cs.w, topY);
        }
        midGfx.lineTo(cs.x + cs.w, 720);
        midGfx.closePath();
        midGfx.fillPath();

        // Water-level landing steps at bottom
        midGfx.fillStyle(0x1e362c, 0.95);
        midGfx.fillRect(cs.x, 565, cs.w, 15);

        // Venetian Windows
        if (cs.windows) {
          for (const win of cs.windows) {
            const wx = cs.x + win.xRel;
            const wy = topY + win.yRel;

            if (win.trefoil) {
              // Venetian Gothic pointed trefoil window
              midGfx.fillStyle(0x0e1b16, 0.95);
              midGfx.fillRect(wx - 2, wy + 10, win.w + 4, win.h - 10);
              midGfx.fillCircle(wx + win.w / 2, wy + 10, win.w / 2 + 2);

              midGfx.fillStyle(win.lit ? 0x2dd4bf : 0x0f2922, 0.95);
              midGfx.fillRect(wx, wy + 10, win.w, win.h - 10);
              midGfx.fillCircle(wx + win.w / 2, wy + 10, win.w / 2);

              if (win.lit) {
                midGfx.fillStyle(0x2dd4bf, 0.15);
                midGfx.fillCircle(wx + win.w / 2, wy + win.h / 2, win.w);
              }
            } else {
              midGfx.fillStyle(win.lit ? 0xf59e0b : 0x14201c, 0.9);
              midGfx.fillRect(wx, wy, win.w, win.h);
            }
          }
        }
      }

      // Emerald waterline algae wash
      midGfx.fillStyle(0x10b981, 0.18);
      midGfx.fillRect(cs.x, 620, cs.w, 35);
    }

    midGfx.generateTexture('bg_midground_act2', 2560, 720);
    midGfx.destroy();
  }

  // Act 3: The Marketplace — Sweeping canvas awnings using bezierCurveTo and market stalls
  private createMidgroundAct3(): void {
    const midGfx = this.make.graphics({ x: 0, y: 0 });

    interface MarketBuilding {
      x: number;
      w: number;
      h: number;
      roofPeak: number;
      awning: { yRel: number; w: number; h: number; stripe1: number; stripe2: number; sag: number };
      stallShelves?: boolean;
      lanterns?: { xRel: number; yRel: number; color: number }[];
    }

    const marketBuildings: MarketBuilding[] = [
      {
        x: 0, w: 180, h: 450, roofPeak: 70,
        awning: { yRel: 340, w: 165, h: 45, stripe1: 0xb91c1c, stripe2: 0xf59e0b, sag: 18 },
        stallShelves: true,
        lanterns: [{ xRel: 25, yRel: 330, color: 0xf59e0b }, { xRel: 145, yRel: 330, color: 0xf97316 }]
      },
      {
        x: 175, w: 160, h: 420, roofPeak: 65,
        awning: { yRel: 320, w: 150, h: 42, stripe1: 0xc2410c, stripe2: 0xfef08a, sag: 16 },
        stallShelves: true,
        lanterns: [{ xRel: 80, yRel: 310, color: 0xfbbf24 }]
      },
      {
        x: 330, w: 195, h: 490, roofPeak: 95,
        awning: { yRel: 360, w: 180, h: 48, stripe1: 0x991b1b, stripe2: 0xf59e0b, sag: 20 },
        stallShelves: true,
        lanterns: [{ xRel: 35, yRel: 350, color: 0xf59e0b }, { xRel: 155, yRel: 350, color: 0xfbbf24 }]
      },
      {
        x: 520, w: 155, h: 410, roofPeak: 60,
        awning: { yRel: 300, w: 145, h: 40, stripe1: 0xb45309, stripe2: 0xfef3c7, sag: 15 },
        stallShelves: true
      },
      {
        x: 670, w: 185, h: 520, roofPeak: 110,
        awning: { yRel: 380, w: 170, h: 46, stripe1: 0x7f1d1d, stripe2: 0xfbbf24, sag: 18 },
        lanterns: [{ xRel: 90, yRel: 360, color: 0xf59e0b }]
      },
      {
        x: 850, w: 170, h: 440, roofPeak: 75,
        awning: { yRel: 330, w: 155, h: 44, stripe1: 0xb91c1c, stripe2: 0xfef08a, sag: 17 },
        stallShelves: true
      },
      {
        x: 1015, w: 190, h: 465, roofPeak: 80,
        awning: { yRel: 350, w: 175, h: 48, stripe1: 0xc2410c, stripe2: 0xf59e0b, sag: 19 },
        stallShelves: true,
        lanterns: [{ xRel: 30, yRel: 340, color: 0xf97316 }, { xRel: 160, yRel: 340, color: 0xfbbf24 }]
      },
      {
        x: 1200, w: 160, h: 405, roofPeak: 60,
        awning: { yRel: 305, w: 145, h: 40, stripe1: 0x991b1b, stripe2: 0xfef3c7, sag: 16 },
        stallShelves: true
      },
      {
        x: 1355, w: 180, h: 480, roofPeak: 85,
        awning: { yRel: 360, w: 165, h: 45, stripe1: 0xb45309, stripe2: 0xf59e0b, sag: 18 },
        stallShelves: true
      },
      {
        x: 1530, w: 165, h: 430, roofPeak: 70,
        awning: { yRel: 325, w: 150, h: 42, stripe1: 0xb91c1c, stripe2: 0xfef08a, sag: 17 },
        stallShelves: true
      },
      {
        x: 1690, w: 190, h: 510, roofPeak: 100,
        awning: { yRel: 375, w: 175, h: 48, stripe1: 0x7f1d1d, stripe2: 0xf59e0b, sag: 20 },
        stallShelves: true,
        lanterns: [{ xRel: 40, yRel: 360, color: 0xfbbf24 }, { xRel: 150, yRel: 360, color: 0xf59e0b }]
      },
      {
        x: 1875, w: 160, h: 415, roofPeak: 65,
        awning: { yRel: 310, w: 145, h: 42, stripe1: 0xc2410c, stripe2: 0xfef3c7, sag: 16 },
        stallShelves: true
      },
      {
        x: 2030, w: 185, h: 470, roofPeak: 80,
        awning: { yRel: 350, w: 170, h: 46, stripe1: 0xb91c1c, stripe2: 0xf59e0b, sag: 18 },
        stallShelves: true
      },
      {
        x: 2210, w: 355, h: 460, roofPeak: 75,
        awning: { yRel: 345, w: 330, h: 46, stripe1: 0x991b1b, stripe2: 0xfef08a, sag: 19 },
        stallShelves: true,
        lanterns: [{ xRel: 60, yRel: 330, color: 0xf59e0b }, { xRel: 280, yRel: 330, color: 0xfbbf24 }]
      }
    ];

    for (const mb of marketBuildings) {
      const topY = 720 - mb.h;

      // 1. Facade Base: Rich terracotta/crimson bazaar wash
      midGfx.fillGradientStyle(0x421818, 0x421818, 0x1a0a0a, 0x1a0a0a, 0.92, 0.92, 1.0, 1.0);
      midGfx.beginPath();
      midGfx.moveTo(mb.x, 720);
      midGfx.lineTo(mb.x + 8, topY + mb.roofPeak);
      midGfx.lineTo(mb.x + mb.w / 2, topY);
      midGfx.lineTo(mb.x + mb.w - 8, topY + mb.roofPeak);
      midGfx.lineTo(mb.x + mb.w, 720);
      midGfx.closePath();
      midGfx.fillPath();

      // 2. Sweeping Canvas Awnings using bezierCurveTo
      const awn = mb.awning;
      const awnX = mb.x + 8;
      const awnY = topY + awn.yRel;
      const awnW = awn.w;
      const awnH = awn.h;

      // Scalloped billowed canvas canopy using bezierCurveTo
      const stripes = 8;
      const stripeW = awnW / stripes;

      for (let s = 0; s < stripes; s++) {
        const sx1 = awnX + s * stripeW;
        const sx2 = sx1 + stripeW;
        const color = (s % 2 === 0) ? awn.stripe1 : awn.stripe2;

        midGfx.fillStyle(color, 0.95);
        midGfx.beginPath();
        midGfx.moveTo(sx1, awnY);
        // Top forward slope
        bezierCurveTo(
          midGfx,
          sx1, awnY,
          sx1 + 4, awnY + awnH * 0.4,
          sx1 + stripeW * 0.2, awnY + awnH * 0.8,
          sx1, awnY + awnH,
          6
        );
        // Scalloped ruffled bottom hem
        bezierCurveTo(
          midGfx,
          sx1, awnY + awnH,
          (sx1 + sx2) / 2, awnY + awnH + 8,
          (sx1 + sx2) / 2, awnY + awnH + 8,
          sx2, awnY + awnH,
          6
        );
        // Back upward slope
        bezierCurveTo(
          midGfx,
          sx2, awnY + awnH,
          sx2 - stripeW * 0.2, awnY + awnH * 0.8,
          sx2 - 4, awnY + awnH * 0.4,
          sx2, awnY,
          6
        );
        midGfx.closePath();
        midGfx.fillPath();
      }

      // Wooden awning support posts
      midGfx.lineStyle(2, 0x241008, 0.9);
      midGfx.beginPath();
      midGfx.moveTo(awnX + 2, awnY + awnH);
      midGfx.lineTo(awnX + 2, 580);
      midGfx.moveTo(awnX + awnW - 2, awnY + awnH);
      midGfx.lineTo(awnX + awnW - 2, 580);
      midGfx.strokePath();

      // Market stall counter & merchandise crates underneath awning
      if (mb.stallShelves) {
        midGfx.fillStyle(0x27140b, 1);
        midGfx.fillRect(awnX + 10, 520, awnW - 20, 55);
        // Display goods / spice baskets
        midGfx.fillStyle(0xf59e0b, 0.85);
        midGfx.fillCircle(awnX + 25, 515, 8);
        midGfx.fillStyle(0xef4444, 0.85);
        midGfx.fillCircle(awnX + 50, 515, 7);
        midGfx.fillStyle(0x10b981, 0.85);
        midGfx.fillCircle(awnX + 75, 515, 8);
      }

      // Hanging paper/brass lanterns
      if (mb.lanterns) {
        for (const lan of mb.lanterns) {
          const lx = mb.x + lan.xRel;
          const ly = topY + lan.yRel;

          midGfx.lineStyle(1, 0x18181b, 0.9);
          midGfx.beginPath();
          midGfx.moveTo(lx, ly - 10);
          midGfx.lineTo(lx, ly);
          midGfx.strokePath();

          midGfx.fillStyle(lan.color, 0.95);
          midGfx.fillCircle(lx, ly + 5, 6);
          midGfx.fillStyle(lan.color, 0.2);
          midGfx.fillCircle(lx, ly + 5, 20);
        }
      }
    }

    midGfx.generateTexture('bg_midground_act3', 2560, 720);
    midGfx.destroy();
  }

  // Act 4: The Industrial Noir — Tall narrow factory smokestacks and riveted iron cross-braces
  private createMidgroundAct4(): void {
    const midGfx = this.make.graphics({ x: 0, y: 0 });

    interface IndustrialStructure {
      type: 'factory' | 'smokestack' | 'tower' | 'viaduct';
      x: number;
      w: number;
      h: number;
      smokestackH?: number;
      crossBraces?: { xRel: number; yRel: number; w: number; h: number }[];
      sawtoothBays?: number;
    }

    const industrialStructures: IndustrialStructure[] = [
      {
        type: 'factory', x: 0, w: 180, h: 470, sawtoothBays: 2,
        crossBraces: [{ xRel: 20, yRel: 180, w: 60, h: 65 }, { xRel: 100, yRel: 180, w: 60, h: 65 }]
      },
      {
        type: 'smokestack', x: 180, w: 130, h: 580, smokestackH: 580
      },
      {
        type: 'factory', x: 310, w: 200, h: 450, sawtoothBays: 3,
        crossBraces: [{ xRel: 25, yRel: 160, w: 70, h: 70 }, { xRel: 105, yRel: 160, w: 70, h: 70 }]
      },
      {
        type: 'tower', x: 510, w: 170, h: 520,
        crossBraces: [{ xRel: 20, yRel: 120, w: 130, h: 90 }, { xRel: 20, yRel: 230, w: 130, h: 90 }]
      },
      {
        type: 'factory', x: 680, w: 155, h: 430,
        crossBraces: [{ xRel: 25, yRel: 150, w: 105, h: 75 }]
      },
      {
        type: 'smokestack', x: 835, w: 135, h: 590, smokestackH: 590
      },
      {
        type: 'factory', x: 970, w: 210, h: 485,
        crossBraces: [{ xRel: 30, yRel: 170, w: 70, h: 75 }, { xRel: 110, yRel: 170, w: 70, h: 75 }]
      },
      {
        type: 'factory', x: 1180, w: 160, h: 440,
        crossBraces: [{ xRel: 20, yRel: 140, w: 120, h: 70 }]
      },
      {
        type: 'tower', x: 1340, w: 190, h: 525,
        crossBraces: [{ xRel: 25, yRel: 140, w: 140, h: 95 }, { xRel: 25, yRel: 255, w: 140, h: 95 }]
      },
      {
        type: 'smokestack', x: 1530, w: 130, h: 575, smokestackH: 575
      },
      {
        type: 'factory', x: 1660, w: 200, h: 460, sawtoothBays: 3,
        crossBraces: [{ xRel: 25, yRel: 170, w: 70, h: 70 }, { xRel: 105, yRel: 170, w: 70, h: 70 }]
      },
      {
        type: 'factory', x: 1860, w: 165, h: 505,
        crossBraces: [{ xRel: 20, yRel: 160, w: 125, h: 80 }]
      },
      {
        type: 'factory', x: 2025, w: 175, h: 445,
        crossBraces: [{ xRel: 25, yRel: 150, w: 125, h: 75 }]
      },
      {
        type: 'viaduct', x: 2200, w: 365, h: 495,
        crossBraces: [
          { xRel: 30, yRel: 180, w: 90, h: 85 },
          { xRel: 140, yRel: 180, w: 90, h: 85 },
          { xRel: 250, yRel: 180, w: 90, h: 85 }
        ]
      }
    ];

    for (const ind of industrialStructures) {
      const topY = 720 - ind.h;

      // Dark soot iron/brick wash
      midGfx.fillGradientStyle(0x212530, 0x212530, 0x0c0e14, 0x0c0e14, 0.95, 0.95, 1.0, 1.0);

      if (ind.type === 'smokestack') {
        // Tall, narrow tapering industrial smokestack
        const stackWBase = 36;
        const stackWTop = 24;
        const stackXCenter = ind.x + ind.w / 2;
        const stackTopY = 720 - (ind.smokestackH ?? 580);

        // Smokestack body
        midGfx.beginPath();
        midGfx.moveTo(stackXCenter - stackWBase / 2, 720);
        midGfx.lineTo(stackXCenter - stackWTop / 2, stackTopY);
        midGfx.lineTo(stackXCenter + stackWTop / 2, stackTopY);
        midGfx.lineTo(stackXCenter + stackWBase / 2, 720);
        midGfx.closePath();
        midGfx.fillPath();

        // Corbelled iron rim cap at top
        midGfx.fillStyle(0x0e1017, 1);
        midGfx.fillRect(stackXCenter - stackWTop / 2 - 4, stackTopY - 6, stackWTop + 8, 8);

        // Iron reinforcement banding rings
        midGfx.fillStyle(0x181a22, 1);
        for (let ringY = stackTopY + 45; ringY < 680; ringY += 55) {
          const t = (ringY - stackTopY) / (720 - stackTopY);
          const currW = stackWTop + (stackWBase - stackWTop) * t;
          midGfx.fillRect(stackXCenter - currW / 2 - 2, ringY, currW + 4, 4);
        }

        // Billowing dark industrial smoke clouds
        midGfx.fillStyle(0x18181b, 0.25);
        midGfx.fillCircle(stackXCenter + 12, stackTopY - 18, 16);
        midGfx.fillStyle(0x27272a, 0.18);
        midGfx.fillCircle(stackXCenter + 28, stackTopY - 36, 26);
        midGfx.fillStyle(0x3f3f46, 0.12);
        midGfx.fillCircle(stackXCenter + 52, stackTopY - 58, 38);

      } else {
        // Factory Building with Sawtooth roof or industrial parapet
        midGfx.beginPath();
        midGfx.moveTo(ind.x, 720);

        if (ind.sawtoothBays) {
          // Sawtooth roofline with vertical skylights
          const bayW = ind.w / ind.sawtoothBays;
          for (let b = 0; b < ind.sawtoothBays; b++) {
            const bx = ind.x + b * bayW;
            midGfx.lineTo(bx, topY + 45);
            midGfx.lineTo(bx + bayW * 0.75, topY);
            midGfx.lineTo(bx + bayW, topY + 45);
          }
        } else {
          midGfx.lineTo(ind.x, topY);
          midGfx.lineTo(ind.x + ind.w, topY);
        }

        midGfx.lineTo(ind.x + ind.w, 720);
        midGfx.closePath();
        midGfx.fillPath();

        // Industrial cross-bracing (riveted steel X-braces)
        if (ind.crossBraces) {
          for (const cb of ind.crossBraces) {
            const cbx = ind.x + cb.xRel;
            const cby = topY + cb.yRel;

            // Recessed bay window frame
            midGfx.fillStyle(0x0e1017, 0.95);
            midGfx.fillRect(cbx, cby, cb.w, cb.h);

            // Cold electric cyan / purple industrial window glow
            midGfx.fillStyle(0x06b6d4, 0.2);
            midGfx.fillRect(cbx + 3, cby + 3, cb.w - 6, cb.h - 6);

            // Riveted Iron X-Cross-Braces
            midGfx.lineStyle(3, 0x27272a, 1);
            midGfx.beginPath();
            midGfx.moveTo(cbx, cby);
            midGfx.lineTo(cbx + cb.w, cby + cb.h);
            midGfx.moveTo(cbx + cb.w, cby);
            midGfx.lineTo(cbx, cby + cb.h);
            midGfx.strokePath();

            // Rivet plates at corners and center intersection
            midGfx.fillStyle(0x52525b, 1);
            midGfx.fillCircle(cbx + cb.w / 2, cby + cb.h / 2, 4);
            midGfx.fillCircle(cbx + 4, cby + 4, 2.5);
            midGfx.fillCircle(cbx + cb.w - 4, cby + 4, 2.5);
            midGfx.fillCircle(cbx + 4, cby + cb.h - 4, 2.5);
            midGfx.fillCircle(cbx + cb.w - 4, cby + cb.h - 4, 2.5);
          }
        }
      }
    }

    midGfx.generateTexture('bg_midground_act4', 2560, 720);
    midGfx.destroy();
  }

  // Act 5: The Sunrise Overlook — Ornate balconies, cupolas, and open balustrades
  private createMidgroundAct5(): void {
    const midGfx = this.make.graphics({ x: 0, y: 0 });

    interface OverlookStructure {
      x: number;
      w: number;
      h: number;
      hasCupola?: boolean;
      cupolaW?: number;
      cupolaH?: number;
      balcony?: { xRel: number; yRel: number; w: number; h: number };
      balustrades?: { xRel: number; yRel: number; w: number; h: number };
      windows?: { xRel: number; yRel: number; w: number; h: number; pediment?: 'triangular' | 'rounded' }[];
    }

    const overlookStructures: OverlookStructure[] = [
      {
        x: 0, w: 190, h: 480,
        balcony: { xRel: 25, yRel: 240, w: 140, h: 22 },
        balustrades: { xRel: 10, yRel: 40, w: 170, h: 18 },
        windows: [
          { xRel: 35, yRel: 120, w: 32, h: 56, pediment: 'triangular' },
          { xRel: 80, yRel: 120, w: 32, h: 56, pediment: 'rounded' },
          { xRel: 125, yRel: 120, w: 32, h: 56, pediment: 'triangular' }
        ]
      },
      {
        x: 185, w: 155, h: 565, hasCupola: true, cupolaW: 75, cupolaH: 85,
        balcony: { xRel: 20, yRel: 320, w: 115, h: 20 }
      },
      {
        x: 335, w: 205, h: 470,
        balcony: { xRel: 30, yRel: 230, w: 145, h: 22 },
        balustrades: { xRel: 15, yRel: 35, w: 175, h: 18 }
      },
      {
        x: 535, w: 175, h: 515, hasCupola: true, cupolaW: 85, cupolaH: 90,
        balcony: { xRel: 25, yRel: 280, w: 125, h: 20 }
      },
      {
        x: 705, w: 195, h: 455,
        balustrades: { xRel: 15, yRel: 30, w: 165, h: 18 },
        balcony: { xRel: 35, yRel: 210, w: 125, h: 22 }
      },
      {
        x: 895, w: 160, h: 585, hasCupola: true, cupolaW: 80, cupolaH: 95,
        balcony: { xRel: 25, yRel: 340, w: 110, h: 20 }
      },
      {
        x: 1050, w: 200, h: 480,
        balcony: { xRel: 35, yRel: 240, w: 130, h: 22 },
        balustrades: { xRel: 15, yRel: 40, w: 170, h: 18 }
      },
      {
        x: 1245, w: 170, h: 445,
        balustrades: { xRel: 15, yRel: 30, w: 140, h: 18 },
        balcony: { xRel: 25, yRel: 210, w: 120, h: 20 }
      },
      {
        x: 1410, w: 185, h: 545, hasCupola: true, cupolaW: 90, cupolaH: 90,
        balcony: { xRel: 30, yRel: 300, w: 125, h: 20 }
      },
      {
        x: 1590, w: 175, h: 465,
        balustrades: { xRel: 15, yRel: 35, w: 145, h: 18 },
        balcony: { xRel: 25, yRel: 225, w: 125, h: 22 }
      },
      {
        x: 1760, w: 195, h: 520, hasCupola: true, cupolaW: 85, cupolaH: 95,
        balcony: { xRel: 30, yRel: 290, w: 135, h: 20 }
      },
      {
        x: 1950, w: 165, h: 455,
        balustrades: { xRel: 15, yRel: 35, w: 135, h: 18 },
        balcony: { xRel: 20, yRel: 220, w: 125, h: 20 }
      },
      {
        x: 2110, w: 175, h: 555, hasCupola: true, cupolaW: 80, cupolaH: 90,
        balcony: { xRel: 25, yRel: 310, w: 125, h: 20 }
      },
      {
        x: 2280, w: 285, h: 495,
        balustrades: { xRel: 20, yRel: 40, w: 245, h: 20 },
        balcony: { xRel: 40, yRel: 250, w: 205, h: 22 }
      }
    ];

    for (const os of overlookStructures) {
      const topY = 720 - os.h;

      // 1. Facade Base: Elegant Neoclassical / Dawn Rose Sandstone
      midGfx.fillGradientStyle(0x3e2837, 0x3e2837, 0x191018, 0x191018, 0.92, 0.92, 1.0, 1.0);
      midGfx.beginPath();
      midGfx.moveTo(os.x, 720);
      midGfx.lineTo(os.x, topY + 40);
      midGfx.lineTo(os.x + os.w, topY + 40);
      midGfx.lineTo(os.x + os.w, 720);
      midGfx.closePath();
      midGfx.fillPath();

      // 2. Classical Domed Cupolas with Gilded Finials
      if (os.hasCupola) {
        const cW = os.cupolaW ?? 80;
        const cH = os.cupolaH ?? 85;
        const cXCenter = os.x + os.w / 2;
        const cBaseY = topY + 40;
        const cTopY = cBaseY - cH;

        // Cupola drum / base arcade
        midGfx.fillStyle(0x2d1c28, 1);
        midGfx.fillRect(cXCenter - cW / 2 + 6, cBaseY - 25, cW - 12, 25);

        // Curved dome profile using drawQuad
        midGfx.fillStyle(0xd97706, 0.95);
        midGfx.beginPath();
        midGfx.moveTo(cXCenter - cW / 2, cBaseY - 25);
        drawQuad(midGfx, cXCenter - cW / 2, cBaseY - 25, cXCenter - cW * 0.35, cTopY, cXCenter, cTopY, 8);
        drawQuad(midGfx, cXCenter, cTopY, cXCenter + cW * 0.35, cTopY, cXCenter + cW / 2, cBaseY - 25, 8);
        midGfx.closePath();
        midGfx.fillPath();

        // Gilded pinnacle finial spire
        midGfx.fillStyle(0xfbbf24, 1);
        midGfx.fillRect(cXCenter - 2, cTopY - 22, 4, 22);
        midGfx.fillCircle(cXCenter, cTopY - 22, 4);
      }

      // 3. Rooftop Open Balustrades (Classical Baluster Pillars)
      if (os.balustrades) {
        const bX = os.x + os.balustrades.xRel;
        const bY = topY + os.balustrades.yRel;
        const bW = os.balustrades.w;
        const bH = os.balustrades.h;

        // Top coping rail & bottom base plinth
        midGfx.fillStyle(0x4c3343, 1);
        midGfx.fillRect(bX, bY, bW, 4);
        midGfx.fillRect(bX, bY + bH - 3, bW, 3);

        // Open balusters
        const balusterSpacing = 12;
        midGfx.fillStyle(0x6b495f, 1);
        for (let bx = bX + 6; bx < bX + bW - 6; bx += balusterSpacing) {
          midGfx.fillRect(bx - 1.5, bY + 4, 3, bH - 7);
          midGfx.fillCircle(bx, bY + bH / 2, 2.5);
        }
      }

      // 4. Ornate Cantilevered Wrought-Iron Balconies
      if (os.balcony) {
        const balX = os.x + os.balcony.xRel;
        const balY = topY + os.balcony.yRel;
        const balW = os.balcony.w;
        const balH = os.balcony.h;

        // Balcony cantilever stone base corbels
        midGfx.fillStyle(0x2a1725, 1);
        midGfx.fillRect(balX - 4, balY + balH - 4, balW + 8, 6);
        midGfx.fillRect(balX + 10, balY + balH + 2, 12, 10);
        midGfx.fillRect(balX + balW - 22, balY + balH + 2, 12, 10);

        // Ornate wrought-iron filigree railing with scrolls
        midGfx.lineStyle(2, 0x18181b, 0.95);
        midGfx.strokeRect(balX, balY, balW, balH - 4);

        // Decorative iron balusters & gold-tipped finials
        midGfx.fillStyle(0xfbbf24, 0.85);
        for (let ix = balX + 8; ix < balX + balW; ix += 14) {
          midGfx.lineStyle(1.5, 0x18181b, 0.9);
          midGfx.lineBetween(ix, balY, ix, balY + balH - 4);
          midGfx.fillCircle(ix, balY - 1, 2);
        }
      }

      // 5. Windows with classical pediments
      if (os.windows) {
        for (const win of os.windows) {
          const wx = os.x + win.xRel;
          const wy = topY + win.yRel;

          midGfx.fillStyle(0xfef08a, 0.92);
          midGfx.fillRect(wx, wy, win.w, win.h);

          // Classical pediment above window
          midGfx.fillStyle(0x4c3343, 1);
          if (win.pediment === 'triangular') {
            midGfx.beginPath();
            midGfx.moveTo(wx - 4, wy - 2);
            midGfx.lineTo(wx + win.w / 2, wy - 16);
            midGfx.lineTo(wx + win.w + 4, wy - 2);
            midGfx.closePath();
            midGfx.fillPath();
          } else {
            midGfx.beginPath();
            midGfx.moveTo(wx - 4, wy - 2);
            drawQuad(midGfx, wx - 4, wy - 2, wx + win.w / 2, wy - 20, wx + win.w + 4, wy - 2, 6);
            midGfx.closePath();
            midGfx.fillPath();
          }
        }
      }
    }

    midGfx.generateTexture('bg_midground_act5', 2560, 720);
    midGfx.destroy();
  }

  // -------------------------------------------------------------
  // Layer 4: Weathered European Cobblestone Alleyway (1280x720)
  // -------------------------------------------------------------
  private createStreetTexture(): void {
    const streetGfx = this.make.graphics({ x: 0, y: 0 });

    streetGfx.fillStyle(0x181c24, 1);
    streetGfx.fillRect(0, 560, 1280, 24);

    let curbX = 0;
    const curbWidths = [85, 70, 95, 80, 75, 90, 85, 100, 70, 80, 90, 85, 75, 95, 85];
    for (let i = 0; curbX < 1280; i++) {
      const cw = curbWidths[i % curbWidths.length];
      const isAlt = (i % 2 === 0);

      streetGfx.fillStyle(isAlt ? 0x242a35 : 0x1f242e, 1);
      streetGfx.fillRect(curbX, 560, cw, 24);

      streetGfx.fillStyle(0x4b5568, 0.55);
      streetGfx.fillRect(curbX + 3, 560, cw - 6, 3);

      streetGfx.fillStyle(0x0e1117, 0.95);
      streetGfx.fillRect(curbX + cw - 2, 560, 2, 24);

      curbX += cw;
    }

    streetGfx.fillStyle(0x0e1014, 1);
    streetGfx.fillRect(0, 584, 1280, 136);

    const cobblestonePalettes = [
      0x242934, 0x1b1e26, 0x28231f, 0x1e222a, 0x2b2723, 0x181a21
    ];

    let seed = 42891;
    const deterministicRandom = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    const rowConfigs = [
      { y: 588, h: 17 }, { y: 609, h: 18 }, { y: 631, h: 19 },
      { y: 654, h: 20 }, { y: 678, h: 21 }, { y: 703, h: 22 }
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

        const stoneW = Math.round(28 + randVal * 24);
        const stoneH = Math.round(baseH + (randVal2 - 0.5) * 3);
        const jitterY = (randVal3 - 0.5) * 3;
        const gap = Math.round(3 + randVal4 * 3);

        const colorIndex = Math.floor(deterministicRandom() * cobblestonePalettes.length);
        const stoneColor = cobblestonePalettes[colorIndex];
        const stoneAlpha = 0.72 + deterministicRandom() * 0.24;
        const cornerRadius = Math.round(3 + deterministicRandom() * 3);

        streetGfx.fillStyle(stoneColor, stoneAlpha);
        streetGfx.fillRoundedRect(currX, rowY + jitterY, stoneW, stoneH, cornerRadius);

        const highlightW = Math.max(8, stoneW - 10);
        const hasAmberReflection = (deterministicRandom() > 0.82);

        if (hasAmberReflection) {
          streetGfx.fillStyle(0xf59e0b, 0.18);
          streetGfx.fillRect(currX + 4, rowY + jitterY + 2, highlightW, 2.5);
        } else {
          streetGfx.fillStyle(0x64748b, 0.32);
          streetGfx.fillRect(currX + 4, rowY + jitterY + 2, highlightW, 2);
        }

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
  }

  // -------------------------------------------------------------
  // Layer 5: Foreground Atmosphere, Streetlamp & Mist (1280x720)
  // -------------------------------------------------------------
  private createForegroundTexture(): void {
    const fgGfx = this.make.graphics({ x: 0, y: 0 });
    const lampX = 980;

    fgGfx.fillStyle(0x0e1014, 1);
    fgGfx.fillRect(lampX, 410, 14, 170);
    fgGfx.fillRect(lampX - 6, 570, 26, 14);
    fgGfx.fillRect(lampX - 10, 360, 34, 52);

    fgGfx.fillStyle(0xfef08a, 0.95);
    fgGfx.fillRect(lampX - 5, 370, 24, 34);

    fgGfx.fillStyle(0xf59e0b, 0.22);
    fgGfx.fillCircle(lampX + 7, 387, 85);
    fgGfx.fillStyle(0xf59e0b, 0.08);
    fgGfx.fillCircle(lampX + 7, 387, 165);

    fgGfx.fillGradientStyle(0x000000, 0x000000, 0x181e2b, 0x181e2b, 0, 0, 0.28, 0.28);
    fgGfx.fillRect(0, 640, 1280, 80);

    fgGfx.generateTexture('bg_foreground', 1280, 720);
    fgGfx.destroy();
  }

  // -------------------------------------------------------------
  // Item: Glowing Copper Tip Gear (32x32)
  // -------------------------------------------------------------
  private createItemTextures(): void {
    const gearGfx = this.make.graphics({ x: 0, y: 0 });
    const cx = 16;
    const cy = 16;

    gearGfx.fillStyle(0xf59e0b, 0.3);
    gearGfx.fillCircle(cx, cy, 15);
    gearGfx.fillStyle(0xfbbf24, 0.45);
    gearGfx.fillCircle(cx, cy, 11);

    gearGfx.fillStyle(0xb45309, 1);
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const tx = cx + Math.cos(angle) * 9;
      const ty = cy + Math.sin(angle) * 9;
      gearGfx.fillCircle(tx, ty, 3.2);
    }

    gearGfx.fillStyle(0xd97706, 1);
    gearGfx.fillCircle(cx, cy, 8.5);

    gearGfx.lineStyle(1.5, 0x18181b, 0.95);
    gearGfx.strokeCircle(cx, cy, 8.5);

    gearGfx.fillStyle(0x18181b, 1);
    gearGfx.fillCircle(cx, cy, 3.2);
    gearGfx.fillStyle(0xfef08a, 1);
    gearGfx.fillCircle(cx - 0.5, cy - 0.5, 1.2);

    gearGfx.generateTexture('item_tip_gear', 32, 32);
    gearGfx.destroy();
  }

  // -------------------------------------------------------------
  // Power-Ups: Floating Procedural Buff Entities (32x32)
  // -------------------------------------------------------------
  private createPowerupTextures(): void {
    const cx = 16;
    const cy = 16;

    // 1. Golden Sunflower: 2x Tip Multiplier
    const flowerGfx = this.make.graphics({ x: 0, y: 0 });
    // Radiant golden halo
    flowerGfx.fillStyle(0xf59e0b, 0.25);
    flowerGfx.fillCircle(cx, cy, 15);
    flowerGfx.fillStyle(0xfbbf24, 0.35);
    flowerGfx.fillCircle(cx, cy, 12);

    // Sunflower golden petals (10 radiating petals)
    flowerGfx.fillStyle(0xfbbf24, 1);
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5;
      const px = cx + Math.cos(angle) * 9.5;
      const py = cy + Math.sin(angle) * 9.5;
      flowerGfx.fillCircle(px, py, 3.2);
    }
    // Inner petal highlight ring
    flowerGfx.fillStyle(0xf59e0b, 1);
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5 + Math.PI / 10;
      const px = cx + Math.cos(angle) * 7.5;
      const py = cy + Math.sin(angle) * 7.5;
      flowerGfx.fillCircle(px, py, 2.4);
    }

    // Roasted seed center disk
    flowerGfx.fillStyle(0x451a03, 1);
    flowerGfx.fillCircle(cx, cy, 5.5);
    flowerGfx.lineStyle(1.2, 0x18181b, 0.95);
    flowerGfx.strokeCircle(cx, cy, 5.5);

    // Spiraled golden pollen dots
    flowerGfx.fillStyle(0xfde68a, 1);
    flowerGfx.fillCircle(cx, cy, 1.2);
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      flowerGfx.fillCircle(cx + Math.cos(a) * 3, cy + Math.sin(a) * 3, 0.9);
    }

    flowerGfx.generateTexture('powerup_sunflower', 32, 32);
    flowerGfx.destroy();

    // 2. Flask of Gypsy Brandy: +50% Balance Stability
    const brandyGfx = this.make.graphics({ x: 0, y: 0 });
    // Amber spirit aura
    brandyGfx.fillStyle(0xd97706, 0.22);
    brandyGfx.fillCircle(cx, cy, 14.5);
    brandyGfx.fillStyle(0xf59e0b, 0.3);
    brandyGfx.fillCircle(cx, cy + 2, 11);

    // Flask glass bulbous silhouette
    brandyGfx.fillStyle(0x1c1917, 0.9);
    brandyGfx.fillRoundedRect(7, 10, 18, 17, 6);

    // Rich amber brandy liquor fill
    brandyGfx.fillStyle(0xb45309, 1);
    brandyGfx.fillRoundedRect(8, 14, 16, 12, 4);
    brandyGfx.fillStyle(0xd97706, 0.9);
    brandyGfx.fillRect(9, 14, 14, 4);

    // Meniscus liquid shine line
    brandyGfx.lineStyle(1, 0xfef08a, 0.85);
    brandyGfx.strokeLineShape(new Phaser.Geom.Line(9, 14, 23, 14));

    // Flask neck
    brandyGfx.fillStyle(0x27272a, 1);
    brandyGfx.fillRect(13, 6, 6, 5);

    // Brass neck band
    brandyGfx.fillStyle(0xf59e0b, 1);
    brandyGfx.fillRect(12, 9, 8, 2);

    // Turned wood / cork bung stopper
    brandyGfx.fillStyle(0x78350f, 1);
    brandyGfx.fillRoundedRect(12, 2.5, 8, 4.5, 1.5);

    // Glass specular reflection glint
    brandyGfx.lineStyle(1.5, 0xffffff, 0.65);
    brandyGfx.strokeLineShape(new Phaser.Geom.Line(9, 13, 10, 22));

    // Outer sketch contour
    brandyGfx.lineStyle(1.2, 0x18181b, 0.95);
    brandyGfx.strokeRoundedRect(7, 10, 18, 17, 6);

    brandyGfx.generateTexture('powerup_brandy', 32, 32);
    brandyGfx.destroy();

    // 3. Glowing Blue Steam Cog: Super Jump + Hazard Invulnerability
    const steamGfx = this.make.graphics({ x: 0, y: 0 });
    // Electric cyan outer vapor halo
    steamGfx.fillStyle(0x06b6d4, 0.28);
    steamGfx.fillCircle(cx, cy, 15);
    steamGfx.fillStyle(0x22d3ee, 0.4);
    steamGfx.fillCircle(cx, cy, 11);

    // 8 clockwork gear teeth
    steamGfx.fillStyle(0x0e7490, 1);
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const tx = cx + Math.cos(angle) * 10;
      const ty = cy + Math.sin(angle) * 10;
      steamGfx.fillCircle(tx, ty, 3.0);
    }

    // Main gear body & high-voltage rim
    steamGfx.fillStyle(0x0891b2, 1);
    steamGfx.fillCircle(cx, cy, 8.8);
    steamGfx.lineStyle(1.5, 0x67e8f9, 0.95);
    steamGfx.strokeCircle(cx, cy, 8.8);

    // Center steam aperture
    steamGfx.fillStyle(0x164e63, 1);
    steamGfx.fillCircle(cx, cy, 4.8);

    // Glowing white-hot steam core nozzle
    steamGfx.fillStyle(0xe0f2fe, 1);
    steamGfx.fillCircle(cx, cy, 2.8);
    steamGfx.fillStyle(0xffffff, 1);
    steamGfx.fillCircle(cx - 0.5, cy - 0.5, 1.4);

    // 4 steam relief vent pinholes
    steamGfx.fillStyle(0x67e8f9, 0.9);
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + Math.PI / 4;
      steamGfx.fillCircle(cx + Math.cos(a) * 6.5, cy + Math.sin(a) * 6.5, 0.9);
    }

    steamGfx.generateTexture('powerup_steam', 32, 32);
    steamGfx.destroy();
  }

  // -------------------------------------------------------------
  // Hazards: Biome-Specific Crates & Puddles (Acts 1 to 5)
  // -------------------------------------------------------------
  private createHazardTextures(): void {
    this.createHazardCrates();
    this.createHazardPuddles();
  }

  private createHazardCrates(): void {
    // ---------------------------------------------------------
    // Act 1: Tavern Beer Keg / Wine Barrel (44x44)
    // ---------------------------------------------------------
    const crate1Gfx = this.make.graphics({ x: 0, y: 0 });
    // Barrel bulging body
    crate1Gfx.fillStyle(0x451a03, 1);
    crate1Gfx.beginPath();
    crate1Gfx.moveTo(8, 4);
    drawQuad(crate1Gfx, 8, 4, 3, 22, 8, 40, 6);
    crate1Gfx.lineTo(36, 40);
    drawQuad(crate1Gfx, 36, 40, 41, 22, 36, 4, 6);
    crate1Gfx.closePath();
    crate1Gfx.fillPath();

    // Wood staves fill
    crate1Gfx.fillStyle(0x78350f, 1);
    crate1Gfx.fillRect(9, 6, 26, 32);

    // Stave vertical seams
    crate1Gfx.lineStyle(1, 0x3d1704, 0.8);
    crate1Gfx.strokeLineShape(new Phaser.Geom.Line(16, 5, 15, 39));
    crate1Gfx.strokeLineShape(new Phaser.Geom.Line(22, 4, 22, 40));
    crate1Gfx.strokeLineShape(new Phaser.Geom.Line(28, 5, 29, 39));

    // Iron hoops
    crate1Gfx.fillStyle(0x1c1917, 1);
    crate1Gfx.fillRect(6, 8, 32, 4);
    crate1Gfx.fillRect(4, 18, 36, 4);
    crate1Gfx.fillRect(4, 26, 36, 4);
    crate1Gfx.fillRect(6, 34, 32, 4);

    // Brass bung & rivets
    crate1Gfx.fillStyle(0xf59e0b, 1);
    crate1Gfx.fillCircle(22, 22, 2.5);
    crate1Gfx.fillCircle(8, 20, 1.2);
    crate1Gfx.fillCircle(36, 20, 1.2);

    crate1Gfx.generateTexture('hazard_crate_act1', 44, 44);
    crate1Gfx.destroy();

    // ---------------------------------------------------------
    // Act 2: Waterlogged Canal Fish Crate with Rope Netting (44x44)
    // ---------------------------------------------------------
    const crate2Gfx = this.make.graphics({ x: 0, y: 0 });
    // Water-soaked dark timber box
    crate2Gfx.fillStyle(0x1c2826, 1);
    crate2Gfx.fillRect(4, 4, 36, 36);

    crate2Gfx.fillStyle(0x2d3a36, 1);
    crate2Gfx.fillRect(6, 6, 32, 32);

    // Horizontal wet planks
    crate2Gfx.lineStyle(1.5, 0x131e1c, 0.9);
    crate2Gfx.strokeLineShape(new Phaser.Geom.Line(6, 16, 38, 16));
    crate2Gfx.strokeLineShape(new Phaser.Geom.Line(6, 27, 38, 27));

    // Criss-cross hemp rope netting
    crate2Gfx.lineStyle(2, 0xd97706, 0.95);
    crate2Gfx.strokeLineShape(new Phaser.Geom.Line(5, 5, 39, 39));
    crate2Gfx.strokeLineShape(new Phaser.Geom.Line(39, 5, 5, 39));
    crate2Gfx.strokeLineShape(new Phaser.Geom.Line(5, 22, 39, 22));

    // Green algae / seaweed corner accents
    crate2Gfx.fillStyle(0x10b981, 0.85);
    crate2Gfx.fillCircle(8, 36, 3.5);
    crate2Gfx.fillCircle(35, 8, 3);

    crate2Gfx.generateTexture('hazard_crate_act2', 44, 44);
    crate2Gfx.destroy();

    // ---------------------------------------------------------
    // Act 3: Marketplace Burlap Spice Sack (44x44)
    // ---------------------------------------------------------
    const crate3Gfx = this.make.graphics({ x: 0, y: 0 });
    // Bulging burlap sack silhouette
    const sackPts: [number, number][] = [
      [22, 4], [28, 12], [38, 22], [36, 38], [22, 40], [8, 38], [6, 22], [16, 12]
    ];
    crate3Gfx.fillStyle(0x78350f, 1);
    crate3Gfx.beginPath();
    drawSmoothClosedSpline(crate3Gfx, sackPts);
    crate3Gfx.closePath();
    crate3Gfx.fillPath();

    crate3Gfx.fillStyle(0x92400e, 1);
    crate3Gfx.fillCircle(22, 26, 13);

    // Tied rope neck cinch
    crate3Gfx.fillStyle(0xf59e0b, 1);
    crate3Gfx.fillRect(16, 11, 12, 4);

    // Spilling golden saffron/paprika dust
    crate3Gfx.fillStyle(0xfbbf24, 0.95);
    crate3Gfx.fillCircle(22, 6, 3.5);
    crate3Gfx.fillCircle(32, 35, 3);
    crate3Gfx.fillCircle(36, 37, 2);

    // Coarse burlap cross-hatching
    crate3Gfx.lineStyle(1, 0x451a03, 0.5);
    crate3Gfx.strokeLineShape(new Phaser.Geom.Line(14, 20, 30, 20));
    crate3Gfx.strokeLineShape(new Phaser.Geom.Line(12, 28, 32, 28));

    crate3Gfx.generateTexture('hazard_crate_act3', 44, 44);
    crate3Gfx.destroy();

    // ---------------------------------------------------------
    // Act 4: Industrial Riveted Steel Container with Caution Stripes (44x44)
    // ---------------------------------------------------------
    const crate4Gfx = this.make.graphics({ x: 0, y: 0 });
    // Dark gunmetal steel plate
    crate4Gfx.fillStyle(0x18181b, 1);
    crate4Gfx.fillRect(4, 4, 36, 36);

    crate4Gfx.fillStyle(0x27272a, 1);
    crate4Gfx.fillRect(6, 6, 32, 32);

    // Diagonal hazard warning stripes across center band
    crate4Gfx.fillStyle(0xeab308, 0.95);
    crate4Gfx.fillRect(6, 16, 32, 12);

    crate4Gfx.fillStyle(0x09090b, 1);
    crate4Gfx.beginPath();
    crate4Gfx.moveTo(8, 28); crate4Gfx.lineTo(14, 28); crate4Gfx.lineTo(20, 16); crate4Gfx.lineTo(14, 16); crate4Gfx.closePath(); crate4Gfx.fillPath();
    crate4Gfx.beginPath();
    crate4Gfx.moveTo(20, 28); crate4Gfx.lineTo(26, 28); crate4Gfx.lineTo(32, 16); crate4Gfx.lineTo(26, 16); crate4Gfx.closePath(); crate4Gfx.fillPath();

    // Perimeter riveted steel brackets
    crate4Gfx.fillStyle(0x71717a, 1);
    crate4Gfx.fillCircle(8, 8, 1.8);
    crate4Gfx.fillCircle(36, 8, 1.8);
    crate4Gfx.fillCircle(8, 36, 1.8);
    crate4Gfx.fillCircle(36, 36, 1.8);

    crate4Gfx.lineStyle(1.5, 0x09090b, 1);
    crate4Gfx.strokeRect(4, 4, 36, 36);

    crate4Gfx.generateTexture('hazard_crate_act4', 44, 44);
    crate4Gfx.destroy();

    // ---------------------------------------------------------
    // Act 5: Sunrise Overlook Polished Mahogany Travel Trunk (44x44)
    // ---------------------------------------------------------
    const crate5Gfx = this.make.graphics({ x: 0, y: 0 });
    // Rich polished mahogany body with domed trunk lid
    crate5Gfx.fillStyle(0x451a03, 1);
    crate5Gfx.fillRect(4, 14, 36, 26);
    crate5Gfx.beginPath();
    crate5Gfx.moveTo(4, 14);
    drawQuad(crate5Gfx, 4, 14, 22, 6, 40, 14, 6);
    crate5Gfx.closePath();
    crate5Gfx.fillPath();

    crate5Gfx.fillStyle(0x78350f, 1);
    crate5Gfx.fillRect(6, 16, 32, 22);

    // Gilded brass corner clasps
    crate5Gfx.fillStyle(0xfbbf24, 1);
    crate5Gfx.fillRect(4, 14, 6, 6);
    crate5Gfx.fillRect(34, 14, 6, 6);
    crate5Gfx.fillRect(4, 34, 6, 6);
    crate5Gfx.fillRect(34, 34, 6, 6);

    // Vertical reinforcing brass straps
    crate5Gfx.fillStyle(0xd97706, 1);
    crate5Gfx.fillRect(14, 10, 4, 29);
    crate5Gfx.fillRect(26, 10, 4, 29);

    // Center ornate lock plate
    crate5Gfx.fillStyle(0xfef08a, 1);
    crate5Gfx.fillCircle(22, 24, 3);
    crate5Gfx.fillStyle(0x18181b, 1);
    crate5Gfx.fillRect(21, 24, 2, 3);

    crate5Gfx.generateTexture('hazard_crate_act5', 44, 44);
    crate5Gfx.destroy();
  }

  private createHazardPuddles(): void {
    const puddlePts: [number, number][] = [
      [7, 9], [13, 4.5], [24, 3], [37, 3.5], [49, 5.5],
      [55, 9.5], [48, 14], [35, 15.5], [21, 15], [11, 13]
    ];

    // ---------------------------------------------------------
    // Act 1: Murky Tavern Rainwater with Amber Glint (60x18)
    // ---------------------------------------------------------
    const pud1Gfx = this.make.graphics({ x: 0, y: 0 });
    pud1Gfx.fillStyle(0x090a0f, 0.85);
    pud1Gfx.beginPath();
    drawSmoothClosedSpline(pud1Gfx, puddlePts);
    pud1Gfx.closePath();
    pud1Gfx.fillPath();

    pud1Gfx.fillStyle(0x162032, 0.92);
    pud1Gfx.beginPath();
    drawSmoothClosedSpline(pud1Gfx, puddlePts, 0, -0.5);
    pud1Gfx.closePath();
    pud1Gfx.fillPath();

    pud1Gfx.fillStyle(0xf59e0b, 0.38);
    pud1Gfx.beginPath();
    pud1Gfx.moveTo(27, 9);
    drawQuad(pud1Gfx, 27, 9, 39, 7.5, 48, 10.5, 8);
    drawQuad(pud1Gfx, 48, 10.5, 38, 12, 27, 9, 8);
    pud1Gfx.closePath();
    pud1Gfx.fillPath();

    pud1Gfx.lineStyle(1.5, 0x0f172a, 0.85);
    pud1Gfx.beginPath();
    drawSmoothClosedSpline(pud1Gfx, puddlePts);
    pud1Gfx.closePath();
    pud1Gfx.strokePath();

    pud1Gfx.generateTexture('hazard_puddle_act1', 60, 18);
    pud1Gfx.destroy();

    // ---------------------------------------------------------
    // Act 2: Canal Brackish Water Spill with Emerald Algae (60x18)
    // ---------------------------------------------------------
    const pud2Gfx = this.make.graphics({ x: 0, y: 0 });
    pud2Gfx.fillStyle(0x05120e, 0.85);
    pud2Gfx.beginPath();
    drawSmoothClosedSpline(pud2Gfx, puddlePts);
    pud2Gfx.closePath();
    pud2Gfx.fillPath();

    pud2Gfx.fillStyle(0x0e281e, 0.92);
    pud2Gfx.beginPath();
    drawSmoothClosedSpline(pud2Gfx, puddlePts, 0, -0.5);
    pud2Gfx.closePath();
    pud2Gfx.fillPath();

    // Emerald canal algae sheen
    pud2Gfx.fillStyle(0x10b981, 0.45);
    pud2Gfx.beginPath();
    pud2Gfx.moveTo(18, 8);
    drawQuad(pud2Gfx, 18, 8, 32, 5.5, 46, 8.5, 8);
    drawQuad(pud2Gfx, 46, 8.5, 32, 11, 18, 8, 8);
    pud2Gfx.closePath();
    pud2Gfx.fillPath();

    pud2Gfx.lineStyle(1.5, 0x041f17, 0.85);
    pud2Gfx.beginPath();
    drawSmoothClosedSpline(pud2Gfx, puddlePts);
    pud2Gfx.closePath();
    pud2Gfx.strokePath();

    pud2Gfx.generateTexture('hazard_puddle_act2', 60, 18);
    pud2Gfx.destroy();

    // ---------------------------------------------------------
    // Act 3: Marketplace Spilled Wine / Spice Dye Puddle (60x18)
    // ---------------------------------------------------------
    const pud3Gfx = this.make.graphics({ x: 0, y: 0 });
    pud3Gfx.fillStyle(0x1a060b, 0.85);
    pud3Gfx.beginPath();
    drawSmoothClosedSpline(pud3Gfx, puddlePts);
    pud3Gfx.closePath();
    pud3Gfx.fillPath();

    // Deep madder / wine core
    pud3Gfx.fillStyle(0x3b0716, 0.92);
    pud3Gfx.beginPath();
    drawSmoothClosedSpline(pud3Gfx, puddlePts, 0, -0.5);
    pud3Gfx.closePath();
    pud3Gfx.fillPath();

    // Magenta & saffron turmeric oil sheen
    pud3Gfx.fillStyle(0xec4899, 0.4);
    pud3Gfx.beginPath();
    pud3Gfx.moveTo(16, 7);
    drawQuad(pud3Gfx, 16, 7, 28, 4.5, 40, 7.5, 8);
    drawQuad(pud3Gfx, 40, 7.5, 28, 9.5, 16, 7, 8);
    pud3Gfx.closePath();
    pud3Gfx.fillPath();

    pud3Gfx.fillStyle(0xf59e0b, 0.35);
    pud3Gfx.beginPath();
    pud3Gfx.moveTo(27, 9);
    drawQuad(pud3Gfx, 27, 9, 39, 7.5, 48, 10.5, 8);
    drawQuad(pud3Gfx, 48, 10.5, 38, 12, 27, 9, 8);
    pud3Gfx.closePath();
    pud3Gfx.fillPath();

    pud3Gfx.lineStyle(1.5, 0x24040d, 0.85);
    pud3Gfx.beginPath();
    drawSmoothClosedSpline(pud3Gfx, puddlePts);
    pud3Gfx.closePath();
    pud3Gfx.strokePath();

    pud3Gfx.generateTexture('hazard_puddle_act3', 60, 18);
    pud3Gfx.destroy();

    // ---------------------------------------------------------
    // Act 4: Industrial Machine Oil Sump / Chemical Pool (60x18)
    // ---------------------------------------------------------
    const pud4Gfx = this.make.graphics({ x: 0, y: 0 });
    // Jet black motor oil core
    pud4Gfx.fillStyle(0x050508, 0.9);
    pud4Gfx.beginPath();
    drawSmoothClosedSpline(pud4Gfx, puddlePts);
    pud4Gfx.closePath();
    pud4Gfx.fillPath();

    pud4Gfx.fillStyle(0x0f1118, 0.95);
    pud4Gfx.beginPath();
    drawSmoothClosedSpline(pud4Gfx, puddlePts, 0, -0.5);
    pud4Gfx.closePath();
    pud4Gfx.fillPath();

    // Iridescent neon cyan and purple toxic fuel sheen
    pud4Gfx.fillStyle(0x06b6d4, 0.45);
    pud4Gfx.beginPath();
    pud4Gfx.moveTo(15, 8);
    drawQuad(pud4Gfx, 15, 8, 28, 5, 42, 8, 8);
    drawQuad(pud4Gfx, 42, 8, 28, 10, 15, 8, 8);
    pud4Gfx.closePath();
    pud4Gfx.fillPath();

    pud4Gfx.fillStyle(0xc084fc, 0.4);
    pud4Gfx.beginPath();
    pud4Gfx.moveTo(24, 10);
    drawQuad(pud4Gfx, 24, 10, 36, 8, 50, 11, 8);
    drawQuad(pud4Gfx, 50, 11, 36, 13, 24, 10, 8);
    pud4Gfx.closePath();
    pud4Gfx.fillPath();

    pud4Gfx.lineStyle(1.5, 0x06070a, 0.85);
    pud4Gfx.beginPath();
    drawSmoothClosedSpline(pud4Gfx, puddlePts);
    pud4Gfx.closePath();
    pud4Gfx.strokePath();

    pud4Gfx.generateTexture('hazard_puddle_act4', 60, 18);
    pud4Gfx.destroy();

    // ---------------------------------------------------------
    // Act 5: Sunrise Terrace Clear Dew Pool with Dawn Highlights (60x18)
    // ---------------------------------------------------------
    const pud5Gfx = this.make.graphics({ x: 0, y: 0 });
    // Crystalline clean water base
    pud5Gfx.fillStyle(0x13121d, 0.85);
    pud5Gfx.beginPath();
    drawSmoothClosedSpline(pud5Gfx, puddlePts);
    pud5Gfx.closePath();
    pud5Gfx.fillPath();

    pud5Gfx.fillStyle(0x1e2436, 0.92);
    pud5Gfx.beginPath();
    drawSmoothClosedSpline(pud5Gfx, puddlePts, 0, -0.5);
    pud5Gfx.closePath();
    pud5Gfx.fillPath();

    // Sparkling golden sunrise and rose sky reflection
    pud5Gfx.fillStyle(0xfef08a, 0.45);
    pud5Gfx.beginPath();
    pud5Gfx.moveTo(20, 8);
    drawQuad(pud5Gfx, 20, 8, 34, 5.5, 48, 8.5, 8);
    drawQuad(pud5Gfx, 48, 8.5, 34, 11, 20, 8, 8);
    pud5Gfx.closePath();
    pud5Gfx.fillPath();

    pud5Gfx.fillStyle(0xf472b6, 0.35);
    pud5Gfx.beginPath();
    pud5Gfx.moveTo(14, 9);
    drawQuad(pud5Gfx, 14, 9, 25, 7, 36, 10, 8);
    drawQuad(pud5Gfx, 36, 10, 25, 12, 14, 9, 8);
    pud5Gfx.closePath();
    pud5Gfx.fillPath();

    pud5Gfx.lineStyle(1.5, 0x111625, 0.85);
    pud5Gfx.beginPath();
    drawSmoothClosedSpline(pud5Gfx, puddlePts);
    pud5Gfx.closePath();
    pud5Gfx.strokePath();

    pud5Gfx.generateTexture('hazard_puddle_act5', 60, 18);
    pud5Gfx.destroy();
  }
}
