import * as Tone from 'tone';
import { audioEngine } from '../engine.ts';

export interface ViolinSynthParams {
  volume?: number;
  vibratoFrequency?: number;
  vibratoDepth?: number;
  portamento?: number;
}

/**
 * GypsyViolinSynth - Expressive Solo Folk Violin Synthesizer
 *
 * Models physical acoustic bowed violin mechanics:
 * 1. Bow-Friction Transient: Dynamic envelope simulating horsehair on gut/steel strings.
 * 2. LFO Vibrato Engine: Authentic 5-6 Hz pitch modulation with natural depth.
 * 3. Formant Filter: Peaking wood resonance modeling the acoustic violin cavity.
 * 4. Portamento: Expressive pitch glides for emotive Gypsy/Balkan flourishes.
 */
export class GypsyViolinSynth {
  private synth: Tone.Synth;
  private vibratoLfo: Tone.LFO;
  private bodyFilter: Tone.Filter;
  private outputVolume: Tone.Volume;

  constructor(params?: ViolinSynthParams) {
    // 1. Core Bowed String Synthesizer
    this.synth = new Tone.Synth({
      oscillator: {
        type: 'sawtooth',
      },
      envelope: {
        attack: 0.045, // Bow friction bite
        decay: 0.12,
        sustain: 0.85,
        release: 0.18,
      },
      portamento: params?.portamento ?? 0.04,
      volume: -4,
    });

    // 2. Continuous Vibrato LFO connected to Detune
    const vibratoFreq = params?.vibratoFrequency ?? 5.5;
    const vibratoDepth = params?.vibratoDepth ?? 18; // cents
    this.vibratoLfo = new Tone.LFO(vibratoFreq, -vibratoDepth, vibratoDepth);
    this.vibratoLfo.connect(this.synth.detune);
    this.vibratoLfo.start();

    // 3. Spruce Body Formant Resonance Filter
    this.bodyFilter = new Tone.Filter({
      frequency: 2400,
      type: 'bandpass',
      Q: 2.2,
    });

    // 4. Output Stage
    this.outputVolume = new Tone.Volume(params?.volume ?? 0);

    // Routing: Synth -> Formant Filter -> Output Volume -> Master Bus
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

  public setVibrato(frequency: number, depthCents: number): void {
    this.vibratoLfo.frequency.value = frequency;
    this.vibratoLfo.min = -depthCents;
    this.vibratoLfo.max = depthCents;
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
    this.vibratoLfo.stop();
    this.vibratoLfo.dispose();
    this.synth.dispose();
    this.bodyFilter.dispose();
    this.outputVolume.dispose();
  }
}
