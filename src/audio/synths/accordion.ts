import * as Tone from 'tone';
import { audioEngine } from '../engine.ts';
import type { AccordionParams } from '../types.ts';

/**
 * AccordionSynth - Procedural Dual-FM Free-Reed Synthesizer
 *
 * Models physical acoustic accordion mechanics:
 * 1. Dual-Reed Voice Architecture: Center reed + detuned Musette reed (beating effect)
 * 2. Dynamic Bellows Pressure Modulation: Modulates air velocity, harmonic brightness
 *    (FM modulation index), filter cutoff resonance, and amplitude dynamics
 * 3. Polyphonic support for bass accompaniment and right-hand melodies
 */
export class AccordionSynth {
  private centerVoice: Tone.PolySynth<Tone.FMSynth>;
  private musetteVoice: Tone.PolySynth<Tone.FMSynth>;
  private bellowsFilter: Tone.Filter;
  private bellowsGain: Tone.Gain;
  private outputVolume: Tone.Volume;

  private currentBellowsPressure = 0.75;
  private currentMusetteDetune = 6; // cents

  constructor(customParams?: Partial<AccordionParams>) {
    // 1. Center Reed PolySynth (Main pitch fundamental)
    this.centerVoice = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 1.0,
      modulationIndex: 3.0,
      oscillator: {
        type: 'sawtooth',
      },
      envelope: {
        attack: 0.03,
        decay: 0.1,
        sustain: 0.9,
        release: 0.12,
      },
      modulation: {
        type: 'triangle',
      },
      modulationEnvelope: {
        attack: 0.04,
        decay: 0.2,
        sustain: 0.8,
        release: 0.15,
      },
      volume: -4,
    });

    // 2. Musette Reed PolySynth (Detuned for acoustic folk beating)
    this.musetteVoice = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 1.0,
      modulationIndex: 2.8,
      detune: this.currentMusetteDetune,
      oscillator: {
        type: 'sawtooth',
      },
      envelope: {
        attack: 0.035,
        decay: 0.1,
        sustain: 0.85,
        release: 0.12,
      },
      modulation: {
        type: 'triangle',
      },
      modulationEnvelope: {
        attack: 0.05,
        decay: 0.2,
        sustain: 0.75,
        release: 0.15,
      },
      volume: -5,
    });

    // 3. Dynamic Bellows Air Acoustic Filter
    this.bellowsFilter = new Tone.Filter({
      frequency: 2400,
      type: 'lowpass',
      rolloff: -24,
      Q: 1.2,
    });

    // 4. Bellows Dynamic Airflow Gain
    this.bellowsGain = new Tone.Gain(0.85);

    // 5. Output Stage
    this.outputVolume = new Tone.Volume(customParams?.volume ?? -3);

    // Routing: Dual Voices -> Bellows Filter -> Bellows Gain -> Output -> Master Bus
    this.centerVoice.connect(this.bellowsFilter);
    this.musetteVoice.connect(this.bellowsFilter);
    this.bellowsFilter.connect(this.bellowsGain);
    this.bellowsGain.connect(this.outputVolume);
    this.outputVolume.connect(audioEngine.getMasterBus());

    // Apply initial custom params if provided
    if (customParams) {
      if (customParams.bellowsPressure !== undefined) {
        this.setBellowsPressure(customParams.bellowsPressure);
      }
      if (customParams.musetteDetune !== undefined) {
        this.setMusetteDetune(customParams.musetteDetune);
      }
    }
  }

  /**
   * Sets dynamic bellows air pressure in range [0.0, 1.0].
   * Dynamically modulates FM harmonic richness, filter brightness, and volume.
   */
  public setBellowsPressure(pressure: number, rampTime = 0.05): void {
    const clamped = Math.max(0.05, Math.min(1.0, pressure));
    this.currentBellowsPressure = clamped;

    // Filter cutoff sweeps from 600 Hz (soft closed reed) to 8500 Hz (open brassy reed)
    const targetFreq = 600 + Math.pow(clamped, 1.6) * 7900;
    // Bellows gain amplitude
    const targetGain = 0.15 + clamped * 0.85;
    // Modulation index: 1.2 (mellow) -> 6.0 (rich metallic rasp)
    const targetModIndex = 1.2 + clamped * 4.8;

    if (rampTime > 0) {
      this.bellowsFilter.frequency.rampTo(targetFreq, rampTime);
      this.bellowsGain.gain.rampTo(targetGain, rampTime);
    } else {
      this.bellowsFilter.frequency.value = targetFreq;
      this.bellowsGain.gain.value = targetGain;
    }

    // Update voice modulation index and attack responsiveness
    const voiceAttack = 0.06 - clamped * 0.035; // faster attack on high pressure
    this.centerVoice.set({
      modulationIndex: targetModIndex,
      envelope: { attack: voiceAttack },
    });
    this.musetteVoice.set({
      modulationIndex: targetModIndex * 0.95,
      envelope: { attack: voiceAttack + 0.005 },
    });
  }

  public getBellowsPressure(): number {
    return this.currentBellowsPressure;
  }

  /**
   * Sets the Musette detuning in cents (0 = dry single reed, 6-12 = sweet folk, 20 = wide wet).
   */
  public setMusetteDetune(cents: number): void {
    const clamped = Math.max(0, Math.min(30, cents));
    this.currentMusetteDetune = clamped;
    this.musetteVoice.set({
      detune: clamped,
    });
  }

  public getMusetteDetune(): number {
    return this.currentMusetteDetune;
  }

  /**
   * Triggers note attack (single note or chord array).
   */
  public triggerAttack(
    notes: Tone.Unit.Frequency | Tone.Unit.Frequency[],
    time?: Tone.Unit.Time,
    velocity = 0.8
  ): void {
    this.centerVoice.triggerAttack(notes, time, velocity);
    this.musetteVoice.triggerAttack(notes, time, velocity * 0.9);
  }

  /**
   * Triggers note release.
   */
  public triggerRelease(
    notes: Tone.Unit.Frequency | Tone.Unit.Frequency[],
    time?: Tone.Unit.Time
  ): void {
    this.centerVoice.triggerRelease(notes, time);
    this.musetteVoice.triggerRelease(notes, time);
  }

  /**
   * Triggers a timed note or chord.
   */
  public triggerAttackRelease(
    notes: Tone.Unit.Frequency | Tone.Unit.Frequency[],
    duration: Tone.Unit.Time,
    time?: Tone.Unit.Time,
    velocity = 0.8
  ): void {
    this.centerVoice.triggerAttackRelease(notes, duration, time, velocity);
    this.musetteVoice.triggerAttackRelease(notes, duration, time, velocity * 0.9);
  }

  /**
   * Releases all active ringing notes.
   */
  public releaseAll(time?: Tone.Unit.Time): void {
    this.centerVoice.releaseAll(time);
    this.musetteVoice.releaseAll(time);
  }

  /**
   * Direct output routing to an external AudioNode.
   */
  public connect(destination: Tone.ToneAudioNode): this {
    this.outputVolume.disconnect();
    this.outputVolume.connect(destination);
    return this;
  }

  /**
   * Disposes all synth and FX nodes to prevent memory leaks.
   */
  public dispose(): void {
    this.centerVoice.dispose();
    this.musetteVoice.dispose();
    this.bellowsFilter.dispose();
    this.bellowsGain.dispose();
    this.outputVolume.dispose();
  }
}
