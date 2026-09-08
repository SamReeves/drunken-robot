import * as Tone from 'tone';
import { audioEngine } from '../engine.ts';

export interface GuitarSynthParams {
  volume?: number;
}

/**
 * FlamencoGuitarSynth - Polyphonic Plucked Acoustic Guitar Simulation
 *
 * Models nylon/steel acoustic string physics:
 * 1. Plucked Transient: Sharp attack with exponential decay envelope.
 * 2. Acoustic Soundboard: Resonant peaking filter network for Spanish guitar wood body.
 * 3. Rasgueado Engine: Rapid micro-staggered strumming simulation.
 */
export class FlamencoGuitarSynth {
  private polySynth: Tone.PolySynth<Tone.Synth>;
  private bodyFilter: Tone.Filter;
  private outputVolume: Tone.Volume;

  constructor(params?: GuitarSynthParams) {
    // 1. Polyphonic Pluck Synthesizer Voice
    this.polySynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'triangle',
      },
      envelope: {
        attack: 0.003,
        decay: 0.35,
        sustain: 0.08,
        release: 0.22,
      },
      volume: -3,
    });

    // 2. Spanish Guitar Soundboard Filter
    this.bodyFilter = new Tone.Filter({
      frequency: 2600,
      type: 'lowpass',
      rolloff: -12,
      Q: 1.4,
    });

    // 3. Output Gain Stage
    this.outputVolume = new Tone.Volume(params?.volume ?? 0);

    // Routing: PolySynth -> Body Filter -> Output Volume -> Master Bus
    this.polySynth.connect(this.bodyFilter);
    this.bodyFilter.connect(this.outputVolume);
    this.outputVolume.connect(audioEngine.getMasterBus());
  }

  /**
   * Triggers a chord or single note simultaneously.
   */
  public triggerAttack(
    notes: Tone.Unit.Frequency | Tone.Unit.Frequency[],
    time?: Tone.Unit.Time,
    velocity = 0.8
  ): void {
    this.polySynth.triggerAttack(notes, time, velocity);
  }

  public triggerRelease(
    notes: Tone.Unit.Frequency | Tone.Unit.Frequency[],
    time?: Tone.Unit.Time
  ): void {
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
   * Executes an authentic Flamenco rasgueado or strum across chord notes.
   * Micro-staggers the note start times by `speed` (default ~18ms per string).
   *
   * @param notes Array of note strings (e.g. ['D3', 'A3', 'D4', 'F#4'])
   * @param time Base trigger time (defaults to Tone.now())
   * @param direction 'down' (low to high string) or 'up' (high to low string)
   * @param speed Delay between strings in seconds (e.g. 0.015 - 0.030)
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
      // Slight natural velocity variation (+-10%) across the strum sweep
      const velocityVariation = 0.75 + Math.random() * 0.15;
      this.polySynth.triggerAttackRelease(note, duration, noteTime, velocityVariation);
    });
  }

  public releaseAll(time?: Tone.Unit.Time): void {
    this.polySynth.releaseAll(time);
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
    this.polySynth.dispose();
    this.bodyFilter.dispose();
    this.outputVolume.dispose();
  }
}
