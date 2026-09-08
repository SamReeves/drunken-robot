import * as Tone from 'tone';
import { audioEngine } from '../engine.ts';

export interface BassSynthParams {
  volume?: number;
  decay?: number;
  bodyResonance?: number;
}

/**
 * UprightBassSynth - Procedural Acoustic Double Bass
 *
 * Models physical acoustic upright bass:
 * 1. Warm sub-fundamental tone with lowpass filter pluck envelope.
 * 2. Wooden acoustic body chamber resonant filter peak at ~180 Hz.
 * 3. Short percussive pluck attack with warm organic decay.
 */
export class UprightBassSynth {
  private synth: Tone.MonoSynth;
  private bodyFilter: Tone.Filter;
  private outputVolume: Tone.Volume;

  constructor(params?: BassSynthParams) {
    // 1. Core MonoSynth with pluck filter envelope
    this.synth = new Tone.MonoSynth({
      oscillator: {
        type: 'triangle',
      },
      envelope: {
        attack: 0.008,
        decay: params?.decay ?? 0.38,
        sustain: 0.15,
        release: 0.3,
      },
      filter: {
        Q: 2.2,
        type: 'lowpass',
        rolloff: -24,
      },
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
    });

    // 2. Wooden acoustic body formant filter (peaks around 180 Hz)
    this.bodyFilter = new Tone.Filter({
      frequency: 180,
      type: 'peaking',
      gain: params?.bodyResonance ?? 4.5,
      Q: 1.8,
    });

    // 3. Output Gain Stage
    this.outputVolume = new Tone.Volume(params?.volume ?? 0);

    // Signal Routing: MonoSynth -> Body Filter -> Output Volume -> Master Bus
    this.synth.connect(this.bodyFilter);
    this.bodyFilter.connect(this.outputVolume);
    this.outputVolume.connect(audioEngine.getMasterBus());
  }

  public triggerAttack(
    note: Tone.Unit.Frequency,
    time?: Tone.Unit.Time,
    velocity = 0.85
  ): void {
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
    this.synth.dispose();
    this.bodyFilter.dispose();
    this.outputVolume.dispose();
  }
}
