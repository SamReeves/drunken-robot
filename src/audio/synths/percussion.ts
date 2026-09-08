import * as Tone from 'tone';
import { audioEngine } from '../engine.ts';

export type PercussionSoundType = 'castanet' | 'stomp' | 'shaker' | 'metal';

export interface PercussionSynthParams {
  volume?: number;
}

/**
 * PercussionSynth - Procedural Balkan Street Percussion & Castanets Engine
 *
 * Implements 4 distinct organic street percussion voices:
 * 1. Castanets: Sharp resonant wooden clack with highpass noise transient.
 * 2. Tavern Stomp: Deep acoustic kick / boot stomping on tavern wood planks.
 * 3. Shaker / Tambourine: Polyrhythmic highpass noise envelope.
 * 4. Metal Clicks: High metallic ring simulating tambourine jingles or triangle.
 */
export class PercussionSynth {
  private castanetNoise: Tone.NoiseSynth;
  private castanetFilter: Tone.Filter;
  private stompMembrane: Tone.MembraneSynth;
  private shakerNoise: Tone.NoiseSynth;
  private metalSynth: Tone.MetalSynth;
  private outputVolume: Tone.Volume;

  constructor(params?: PercussionSynthParams) {
    // 1. Castanets (High-frequency bandpass wood clack)
    this.castanetFilter = new Tone.Filter({
      frequency: 2800,
      type: 'bandpass',
      Q: 4.0,
    });

    this.castanetNoise = new Tone.NoiseSynth({
      noise: {
        type: 'pink',
      },
      envelope: {
        attack: 0.001,
        decay: 0.04,
        sustain: 0,
      },
      volume: 3,
    });
    this.castanetNoise.connect(this.castanetFilter);

    // 2. Tavern Boot Stomp (Deep wooden acoustic kick)
    this.stompMembrane = new Tone.MembraneSynth({
      pitchDecay: 0.04,
      octaves: 3.5,
      oscillator: {
        type: 'sine',
      },
      envelope: {
        attack: 0.002,
        decay: 0.22,
        sustain: 0.01,
        release: 0.2,
      },
      volume: -2,
    });

    // 3. Shaker / Tambourine (Crisp highpass brush)
    this.shakerNoise = new Tone.NoiseSynth({
      noise: {
        type: 'white',
      },
      envelope: {
        attack: 0.005,
        decay: 0.065,
        sustain: 0,
      },
      volume: -6,
    });

    // 4. Metal Jingle / Click (Tambourine jingles)
    this.metalSynth = new Tone.MetalSynth({
      envelope: {
        attack: 0.001,
        decay: 0.08,
        release: 0.05,
      },
      harmonicity: 4.8,
      modulationIndex: 28,
      resonance: 4000,
      octaves: 1.2,
      volume: -14,
    });
    this.metalSynth.frequency.value = 380;

    // 5. Output Stage
    this.outputVolume = new Tone.Volume(params?.volume ?? 0);

    // Routing all percussive voices to the unified channel output volume
    this.castanetFilter.connect(this.outputVolume);
    this.stompMembrane.connect(this.outputVolume);
    this.shakerNoise.connect(this.outputVolume);
    this.metalSynth.connect(this.outputVolume);

    this.outputVolume.connect(audioEngine.getMasterBus());
  }

  public triggerCastanet(time?: Tone.Unit.Time, velocity = 0.85): void {
    this.castanetNoise.triggerAttackRelease('32n', time, velocity);
  }

  public triggerStomp(time?: Tone.Unit.Time, velocity = 0.9): void {
    this.stompMembrane.triggerAttackRelease('D1', '8n', time, velocity);
  }

  public triggerShaker(time?: Tone.Unit.Time, velocity = 0.6): void {
    this.shakerNoise.triggerAttackRelease('16n', time, velocity);
  }

  public triggerMetal(time?: Tone.Unit.Time, velocity = 0.5): void {
    this.metalSynth.triggerAttackRelease(380, '32n', time, velocity);
  }

  public trigger(
    type: PercussionSoundType,
    time?: Tone.Unit.Time,
    velocity?: number
  ): void {
    switch (type) {
      case 'castanet':
        this.triggerCastanet(time, velocity);
        break;
      case 'stomp':
        this.triggerStomp(time, velocity);
        break;
      case 'shaker':
        this.triggerShaker(time, velocity);
        break;
      case 'metal':
        this.triggerMetal(time, velocity);
        break;
    }
  }

  public setVolume(decibels: number, rampTime = 0.05): void {
    if (rampTime > 0) {
      this.outputVolume.volume.rampTo(decibels, rampTime);
    } else {
      this.outputVolume.volume.value = decibels;
    }
  }

  public connect(destination: Tone.ToneAudioNode): this {
    this.outputVolume.disconnect();
    this.outputVolume.connect(destination);
    return this;
  }

  public dispose(): void {
    this.castanetNoise.dispose();
    this.castanetFilter.dispose();
    this.stompMembrane.dispose();
    this.shakerNoise.dispose();
    this.metalSynth.dispose();
    this.outputVolume.dispose();
  }
}
