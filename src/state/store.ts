import type { InstrumentId, MeterType, ScaleName } from '../audio/types.ts';
import { eventBus } from './eventBus.ts';

export interface GameState {
  tips: number;
  momentum: number; // 0.0 to 100.0
  momentumTier: number; // 0 to 4
  tierName: string;
  activeInstruments: InstrumentId[];
  distanceTraveled: number;
  activeAct: number; // 1 to 5
  actName: string;
  game_over: boolean;
  victory: boolean;
}

export interface TierDefinition {
  tier: number;
  minMomentum: number;
  name: string;
  instruments: InstrumentId[];
}

export interface ActDefinition {
  act: number;
  name: string;
  subtitle: string;
  minDistance: number;
  visualPalette: {
    sky: number;
    distant: number;
    midground: number;
    street: number;
    foreground: number;
  };
  audioConfig: {
    scale: ScaleName;
    meter: MeterType;
    bpm: number;
    description: string;
  };
}

export const VICTORY_DISTANCE = 108000; // 5 acts * 21600px (180px/s * 120s)

export const ACT_DEFINITIONS: ActDefinition[] = [
  {
    act: 1,
    name: 'The Tavern Exit',
    subtitle: 'Steamy windows & rainy cobblestones',
    minDistance: 0,
    visualPalette: {
      sky: 0xffffff,
      distant: 0xffffff,
      midground: 0xffffff,
      street: 0xffffff,
      foreground: 0xffffff,
    },
    audioConfig: {
      scale: 'D_PHRYGIAN_DOMINANT',
      meter: '4/4',
      bpm: 120,
      description: 'Intimate, raw Czárdás. Rowdy accordion lead, simple kick drum.',
    },
  },
  {
    act: 2,
    name: 'The Crooked Canals',
    subtitle: 'Misty waterways & stone bridges',
    minDistance: 21600,
    visualPalette: {
      sky: 0x1e3a5f, // Indigo blue
      distant: 0x1b4332, // Moss green shadow
      midground: 0x2d6a4f, // Moss green
      street: 0xbbf7d0, // Tarnished brass / stone green tint
      foreground: 0x52b788, // Emerald mist
    },
    audioConfig: {
      scale: 'D_HARMONIC_MINOR',
      meter: '7/8_322',
      bpm: 115,
      description: 'Melancholic Klezmer Waltzes. Flowing upright bass, searing violin.',
    },
  },
  {
    act: 3,
    name: 'The Marketplace',
    subtitle: 'Shuttered stalls & paper lanterns',
    minDistance: 43200,
    visualPalette: {
      sky: 0x4c0519, // Crimson night
      distant: 0x881337, // Deep Paprika
      midground: 0xb91c1c, // Crimson stalls
      street: 0xfed7aa, // Ochre cobblestones
      foreground: 0xf97316, // Paprika / lantern warm haze
    },
    audioConfig: {
      scale: 'D_PHRYGIAN_DOMINANT',
      meter: '7/8_223',
      bpm: 138,
      description: 'Polyrhythmic Balkan Chaos. Rapid rasgueado (flamenco guitar), castanets.',
    },
  },
  {
    act: 4,
    name: 'The Industrial Noir',
    subtitle: 'Iron frameworks & electric signs',
    minDistance: 64800,
    visualPalette: {
      sky: 0x09090b, // Charcoal black
      distant: 0x2e1065, // Deep violet
      midground: 0x581c87, // Electric violet
      street: 0x06b6d4, // Neon cyan
      foreground: 0x22d3ee, // Bright cyan mist
    },
    audioConfig: {
      scale: 'D_HARMONIC_MINOR',
      meter: '7/8_322',
      bpm: 126,
      description: 'Suspenseful Noir-Folk. Dissonant chords clashing with folk instruments.',
    },
  },
  {
    act: 5,
    name: 'The Sunrise Overlook',
    subtitle: 'Chimney smoke & waking songbirds',
    minDistance: 86400,
    visualPalette: {
      sky: 0x701a75, // Lavender mist dawn
      distant: 0xc084fc, // Soft lavender
      midground: 0xfb7185, // Rose gold
      street: 0xfed7aa, // Peach sunrise cobblestone
      foreground: 0xfef08a, // Golden morning light
    },
    audioConfig: {
      scale: 'D_PHRYGIAN_DOMINANT',
      meter: '4/4',
      bpm: 180,
      description: 'Triumphant Full Ensemble. Major key modulation, 180 BPM czárdás finale.',
    },
  },
];

export const TIERS: TierDefinition[] = [
  {
    tier: 0,
    minMomentum: 0,
    name: 'Solo Accordion',
    instruments: ['accordion'],
  },
  {
    tier: 1,
    minMomentum: 25,
    name: 'Rhythm Duo',
    instruments: ['accordion', 'bass'],
  },
  {
    tier: 2,
    minMomentum: 50,
    name: 'Tavern Trio',
    instruments: ['accordion', 'bass', 'percussion'],
  },
  {
    tier: 3,
    minMomentum: 75,
    name: 'Quartet',
    instruments: ['accordion', 'bass', 'percussion', 'guitar'],
  },
  {
    tier: 4,
    minMomentum: 95,
    name: 'Full Balkan Band',
    instruments: ['accordion', 'bass', 'percussion', 'guitar', 'violin', 'clarinet'],
  },
];

export class GameStore {
  private elapsedTime = 0;
  private state: GameState = {
    tips: 0,
    momentum: 35,
    momentumTier: 1,
    tierName: TIERS[1].name,
    activeInstruments: [...TIERS[1].instruments],
    distanceTraveled: 0,
    activeAct: 1,
    actName: ACT_DEFINITIONS[0].name,
    game_over: false,
    victory: false,
  };

  private listeners: Set<(state: GameState) => void> = new Set();

  public getState(): Readonly<GameState> {
    return { ...this.state, activeInstruments: [...this.state.activeInstruments] };
  }

  public getElapsedTime(): number {
    return this.elapsedTime;
  }

  public addTips(count = 1): void {
    if (this.state.game_over || this.state.victory) return;
    this.state.tips += count;
    // Each tip collected grants a momentum surge (+8%)
    this.adjustMomentum(8 * count);

    eventBus.emit('TIP_COLLECTED', {
      x: 0,
      y: 0,
      totalTips: this.state.tips,
      momentum: this.state.momentum,
    });
  }

  public adjustMomentum(delta: number): void {
    if (this.state.game_over || this.state.victory) return;

    const prevMomentum = this.state.momentum;
    const prevTier = this.state.momentumTier;
    const newMomentum = Math.max(0, Math.min(100, prevMomentum + delta));

    if (newMomentum === prevMomentum && delta !== 0) {
      if (this.elapsedTime >= 10 && newMomentum <= 0) {
        this.triggerGameOver();
      }
      return;
    }

    this.state.momentum = newMomentum;
    this.updateTier();

    eventBus.emit('MOMENTUM_CHANGE', {
      momentum: this.state.momentum,
      previousMomentum: prevMomentum,
      tier: this.state.momentumTier,
    });

    if (this.state.momentumTier !== prevTier) {
      eventBus.emit('TIER_CHANGE', {
        tier: this.state.momentumTier,
        tierName: this.state.tierName,
        activeInstruments: [...this.state.activeInstruments],
      });
    }

    if (this.elapsedTime >= 10 && this.state.momentum <= 0) {
      this.triggerGameOver();
    }

    this.notify();
  }

  public setMomentum(value: number): void {
    const delta = value - this.state.momentum;
    this.adjustMomentum(delta);
  }

  public applyStumblePenalty(): void {
    this.adjustMomentum(-25);
  }

  public decayMomentum(dt: number): void {
    if (this.state.game_over || this.state.victory) return;
    this.elapsedTime += dt;

    if (this.state.momentum > 0) {
      // Gentle continuous decay (-1.5% / sec)
      this.adjustMomentum(-1.5 * dt);
    } else if (this.elapsedTime >= 10) {
      this.triggerGameOver();
    }
  }

  public updateDistance(scrollX: number): void {
    if (this.state.game_over || this.state.victory) return;
    const distance = Math.max(0, Math.floor(scrollX));
    if (distance === this.state.distanceTraveled) return;

    this.state.distanceTraveled = distance;
    this.checkActProgression();

    if (this.state.distanceTraveled >= VICTORY_DISTANCE) {
      this.triggerVictory();
    }
  }

  public getActDefinition(act: number): ActDefinition {
    return ACT_DEFINITIONS.find((a) => a.act === act) ?? ACT_DEFINITIONS[0];
  }

  public getCurrentActDefinition(): ActDefinition {
    return this.getActDefinition(this.state.activeAct);
  }

  private triggerGameOver(): void {
    if (this.state.game_over || this.state.victory) return;
    this.state.game_over = true;
    eventBus.emit('GAME_OVER', {
      distanceTraveled: this.state.distanceTraveled,
      tips: this.state.tips,
    });
    this.notify();
  }

  private triggerVictory(): void {
    if (this.state.victory || this.state.game_over) return;
    this.state.victory = true;
    eventBus.emit('VICTORY', {
      distanceTraveled: this.state.distanceTraveled,
      tips: this.state.tips,
    });
    this.notify();
  }

  private checkActProgression(): void {
    const prevAct = this.state.activeAct;
    let matchedAct = ACT_DEFINITIONS[0];

    for (const actDef of ACT_DEFINITIONS) {
      if (this.state.distanceTraveled >= actDef.minDistance) {
        matchedAct = actDef;
      }
    }

    if (matchedAct.act !== prevAct) {
      this.state.activeAct = matchedAct.act;
      this.state.actName = matchedAct.name;

      eventBus.emit('ACT_CHANGE', {
        act: matchedAct.act,
        name: matchedAct.name,
      });

      this.notify();
    }
  }

  public reset(): void {
    this.elapsedTime = 0;
    this.state = {
      tips: 0,
      momentum: 35,
      momentumTier: 1,
      tierName: TIERS[1].name,
      activeInstruments: [...TIERS[1].instruments],
      distanceTraveled: 0,
      activeAct: 1,
      actName: ACT_DEFINITIONS[0].name,
      game_over: false,
      victory: false,
    };
    this.notify();
  }

  public subscribe(listener: (state: GameState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private updateTier(): void {
    let matchedTier = TIERS[0];
    for (const t of TIERS) {
      if (this.state.momentum >= t.minMomentum) {
        matchedTier = t;
      }
    }

    this.state.momentumTier = matchedTier.tier;
    this.state.tierName = matchedTier.name;
    this.state.activeInstruments = [...matchedTier.instruments];
  }

  private notify(): void {
    const current = this.getState();
    for (const listener of this.listeners) {
      try {
        listener(current);
      } catch (err) {
        console.error('[GameStore] Error in subscriber callback:', err);
      }
    }
  }
}

export const store = new GameStore();
