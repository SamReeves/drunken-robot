import * as Tone from 'tone';
import { BaseInstrument } from './BaseInstrument.ts';

export interface ViolinSynthParams {
  volume?: number;
  vibratoFrequency?: number;
  vibratoDepth?: number;
  portamento?: number;
}

/**
 * GypsyViolinSynth - bowed folk violin voice.
 *
 * Sawtooth core with a bow-bite attack, an LFO on detune for vibrato, and a
 * body resonance filter. Portamento gives the expressive slides.
 */
export class GypsyViolinSynth extends BaseInstrument {
  private readonly synth: Tone.Synth;
  private readonly vibratoLfo: Tone.LFO;
  private readonly bodyFilter: Tone.Filter;

  constructor(params?: ViolinSynthParams) {
    super(params?.volume ?? 0);

    this.synth = this.track(
      new Tone.Synth({
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.045, decay: 0.12, sustain: 0.85, release: 0.18 },
        portamento: params?.portamento ?? 0.04,
        volume: -4,
      }),
    );

    const vibratoFreq = params?.vibratoFrequency ?? 5.5;
    const vibratoDepth = params?.vibratoDepth ?? 18; // cents
    this.vibratoLfo = this.track(new Tone.LFO(vibratoFreq, -vibratoDepth, vibratoDepth));
    this.vibratoLfo.connect(this.synth.detune);
    this.vibratoLfo.start();

    this.bodyFilter = this.track(new Tone.Filter({ frequency: 2400, type: 'bandpass', Q: 2.2 }));

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
    velocity = 0.85,
  ): void {
    this.synth.triggerAttackRelease(note, duration, time, velocity);
  }

  /** A short falling slide, for a splash into a puddle. */
  public triggerSlideDown(time?: Tone.Unit.Time, velocity = 0.7): void {
    const t = time !== undefined ? Tone.Time(time).toSeconds() : Tone.now();
    const detune = this.synth.detune;
    detune.cancelScheduledValues(t);
    detune.setValueAtTime(0, t);
    detune.linearRampToValueAtTime(-700, t + 0.35);
    detune.setValueAtTime(0, t + 0.4);
    this.synth.triggerAttackRelease('A4', 0.35, t, velocity);
  }

  public setVibrato(frequency: number, depthCents: number): void {
    this.vibratoLfo.frequency.value = frequency;
    this.vibratoLfo.min = -depthCents;
    this.vibratoLfo.max = depthCents;
  }

  public setPortamento(glideSeconds: number): void {
    this.synth.portamento = Math.max(0, Math.min(0.5, glideSeconds));
  }

  public override dispose(): void {
    this.vibratoLfo.stop();
    super.dispose();
  }
}
