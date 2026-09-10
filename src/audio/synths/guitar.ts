import * as Tone from 'tone';
import { BaseInstrument } from './BaseInstrument.ts';

export interface GuitarSynthParams {
  volume?: number;
}

/**
 * FlamencoGuitarSynth - polyphonic plucked guitar voice with a strum helper.
 */
export class FlamencoGuitarSynth extends BaseInstrument {
  private readonly polySynth: Tone.PolySynth<Tone.Synth>;
  private readonly bodyFilter: Tone.Filter;

  constructor(params?: GuitarSynthParams) {
    super(params?.volume ?? 0);

    this.polySynth = this.track(
      new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.003, decay: 0.35, sustain: 0.08, release: 0.22 },
        volume: -3,
      })
    );

    this.bodyFilter = this.track(new Tone.Filter({ frequency: 2600, type: 'lowpass', rolloff: -12, Q: 1.4 }));

    this.polySynth.connect(this.bodyFilter);
    this.bodyFilter.connect(this.output);
  }

  public triggerAttack(
    notes: Tone.Unit.Frequency | Tone.Unit.Frequency[],
    time?: Tone.Unit.Time,
    velocity = 0.8
  ): void {
    this.polySynth.triggerAttack(notes, time, velocity);
  }

  public triggerRelease(notes: Tone.Unit.Frequency | Tone.Unit.Frequency[], time?: Tone.Unit.Time): void {
    this.polySynth.triggerRelease(notes, time);
  }

  public triggerAttackRelease(
    notes: Tone.Unit.Frequency | Tone.Unit.Frequency[],
    duration: Tone.Unit.Time,
    time?: Tone.Unit.Time,
    velocity = 0.8
  ): void {
    this.polySynth.triggerAttackRelease(notes, duration, time, velocity);
  }

  /**
   * Strums chord notes with a per-string stagger.
   * @param direction 'down' plays low to high; 'up' plays high to low.
   * @param speed seconds between strings (0.015 to 0.030 is natural).
   */
  public strumChord(
    notes: string[],
    time?: Tone.Unit.Time,
    direction: 'down' | 'up' = 'down',
    speed = 0.018,
    duration: Tone.Unit.Time = '8n'
  ): void {
    const baseTime = time !== undefined ? Tone.Time(time).toSeconds() : Tone.now();
    const orderedNotes = direction === 'down' ? [...notes] : [...notes].reverse();

    orderedNotes.forEach((note, index) => {
      const noteTime = baseTime + index * speed;
      const velocity = 0.75 + Math.random() * 0.15; // 0.75 to 0.90 across the sweep
      this.polySynth.triggerAttackRelease(note, duration, noteTime, velocity);
    });
  }

  public releaseAll(time?: Tone.Unit.Time): void {
    this.polySynth.releaseAll(time);
  }
}
