import * as Tone from 'tone';
import { BaseInstrument } from './BaseInstrument.ts';

export interface ClarinetSynthParams {
  volume?: number;
  portamento?: number;
}

/**
 * KlezmerClarinetSynth - single-reed woodwind voice.
 *
 * Square wave for the clarinet's odd-harmonic character, a reed filter envelope
 * for bite, and a krekhts ornament (the klezmer sob: a fast scoop up into the
 * note) implemented as a detune ramp so it needs no scheduled cleanup.
 */
export class KlezmerClarinetSynth extends BaseInstrument {
  private readonly synth: Tone.MonoSynth;
  private readonly woodFilter: Tone.Filter;

  /** Scoop starts this many cents below the target and arrives over KREKHTS_SCOOP_SEC. */
  private static readonly KREKHTS_SCOOP_CENTS = -300;
  private static readonly KREKHTS_SCOOP_SEC = 0.08;

  constructor(params?: ClarinetSynthParams) {
    super(params?.volume ?? 0);

    this.synth = this.track(
      new Tone.MonoSynth({
        oscillator: { type: 'square' },
        envelope: { attack: 0.032, decay: 0.14, sustain: 0.82, release: 0.16 },
        filter: { Q: 2.0, type: 'lowpass', rolloff: -24 },
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
      }),
    );

    this.woodFilter = this.track(new Tone.Filter({ frequency: 1600, type: 'bandpass', Q: 1.6 }));

    this.synth.connect(this.woodFilter);
    this.woodFilter.connect(this.output);
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

  /** Plays a note with a krekhts: a quick upward scoop into the target pitch. */
  public triggerKrekhts(targetNote: string, time?: Tone.Unit.Time, duration: Tone.Unit.Time = '8n'): void {
    const t = time !== undefined ? Tone.Time(time).toSeconds() : Tone.now();
    const detune = this.synth.detune;
    detune.cancelScheduledValues(t);
    detune.setValueAtTime(KlezmerClarinetSynth.KREKHTS_SCOOP_CENTS, t);
    detune.linearRampToValueAtTime(0, t + KlezmerClarinetSynth.KREKHTS_SCOOP_SEC);
    this.synth.triggerAttackRelease(targetNote, duration, t, 0.9);
  }

  public setPortamento(glideSeconds: number): void {
    this.synth.portamento = Math.max(0, Math.min(0.5, glideSeconds));
  }
}
