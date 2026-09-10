import * as Tone from 'tone';
import { BaseInstrument } from './BaseInstrument.ts';

export interface BassSynthParams {
  volume?: number;
  decay?: number;
  bodyResonance?: number;
}

/**
 * UprightBassSynth - plucked double bass voice.
 *
 * Triangle core with a pluck filter envelope and a peaking "body" resonance
 * around 180 Hz for wooden warmth.
 */
export class UprightBassSynth extends BaseInstrument {
  private readonly synth: Tone.MonoSynth;
  private readonly bodyFilter: Tone.Filter;

  constructor(params?: BassSynthParams) {
    super(params?.volume ?? 0);

    this.synth = this.track(
      new Tone.MonoSynth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.008, decay: params?.decay ?? 0.38, sustain: 0.15, release: 0.3 },
        filter: { Q: 2.2, type: 'lowpass', rolloff: -24 },
        filterEnvelope: {
          attack: 0.005,
          decay: 0.28,
          sustain: 0.1,
          release: 0.25,
          baseFrequency: 75,
          octaves: 3.2,
          exponent: 2,
        },
        volume: -2,
      })
    );

    this.bodyFilter = this.track(
      new Tone.Filter({ frequency: 180, type: 'peaking', gain: params?.bodyResonance ?? 4.5, Q: 1.8 })
    );

    this.synth.connect(this.bodyFilter);
    this.bodyFilter.connect(this.output);
  }

  public triggerAttack(note: Tone.Unit.Frequency, time?: Tone.Unit.Time, velocity = 0.85): void {
    this.synth.triggerAttack(note, time, velocity);
  }

  public triggerRelease(time?: Tone.Unit.Time): void {
    this.synth.triggerRelease(time);
  }

  public triggerAttackRelease(
    note: Tone.Unit.Frequency,
    duration: Tone.Unit.Time,
    time?: Tone.Unit.Time,
    velocity = 0.85
  ): void {
    this.synth.triggerAttackRelease(note, duration, time, velocity);
  }
}
