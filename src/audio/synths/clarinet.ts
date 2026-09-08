import * as Tone from 'tone';
import { audioEngine } from '../engine.ts';

export interface ClarinetSynthParams {
  volume?: number;
  portamento?: number;
}

/**
 * KlezmerClarinetSynth - Procedural Single-Reed Woodwind Synthesizer
 *
 * Models physical acoustic cylindrical-bore single reed mechanics:
 * 1. Odd-Harmonic Tone Generation: Square/Pulse wave characteristic of clarinet bore.
 * 2. Expressive Reed Dynamic Filter: Modulates reed bite and airflow brightness.
 * 3. Klezmer "Krekhts" (Sobbing Pitch Scoop) & Glissando Ornaments.
 */
export class KlezmerClarinetSynth {
  private synth: Tone.MonoSynth;
  private woodFilter: Tone.Filter;
  private outputVolume: Tone.Volume;

  constructor(params?: ClarinetSynthParams) {
    // 1. Core MonoSynth with Square/Pulse waveform for odd harmonics
    this.synth = new Tone.MonoSynth({
      oscillator: {
        type: 'square',
      },
      envelope: {
        attack: 0.032,
        decay: 0.14,
        sustain: 0.82,
        release: 0.16,
      },
      filter: {
        Q: 2.0,
        type: 'lowpass',
        rolloff: -24,
      },
      filterEnvelope: {
        attack: 0.025,
        decay: 0.2,
        sustain: 0.7,
        release: 0.2,
        baseFrequency: 750,
        octaves: 2.6,
        exponent: 1.8,
      },
      portamento: params?.portamento ?? 0.035,
      volume: -4,
    });

    // 2. Woody Formant Filter
    this.woodFilter = new Tone.Filter({
      frequency: 1600,
      type: 'bandpass',
      Q: 1.6,
    });

    // 3. Output Stage
    this.outputVolume = new Tone.Volume(params?.volume ?? 0);

    // Routing: MonoSynth -> Wood Filter -> Output Volume -> Master Bus
    this.synth.connect(this.woodFilter);
    this.woodFilter.connect(this.outputVolume);
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

  /**
   * Triggers a characteristic Klezmer "Krekhts" ornamentation
   * (an expressive sob / microtonal upward scoop into the target note).
   */
  public triggerKrekhts(
    targetNote: string,
    time?: Tone.Unit.Time,
    duration: Tone.Unit.Time = '8n'
  ): void {
    const triggerTime = time !== undefined ? Tone.Time(time).toSeconds() : Tone.now();
    const prevPortamento = this.synth.portamento;

    // Fast upward scoop
    this.synth.portamento = 0.06;
    this.synth.triggerAttackRelease(targetNote, duration, triggerTime, 0.9);

    // Restore portamento shortly after
    Tone.getTransport().scheduleOnce(() => {
      this.synth.portamento = prevPortamento;
    }, triggerTime + 0.1);
  }

  public setPortamento(glideSeconds: number): void {
    this.synth.portamento = Math.max(0, Math.min(0.5, glideSeconds));
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
    this.woodFilter.dispose();
    this.outputVolume.dispose();
  }
}
