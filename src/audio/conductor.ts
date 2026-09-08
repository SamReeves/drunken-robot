import * as Tone from 'tone';
import { audioEngine } from './engine.ts';
import { EnsembleMixer } from './mixer.ts';
import { AccordionSynth } from './synths/accordion.ts';
import { UprightBassSynth } from './synths/bass.ts';
import { PercussionSynth } from './synths/percussion.ts';
import { FlamencoGuitarSynth } from './synths/guitar.ts';
import { GypsyViolinSynth } from './synths/violin.ts';
import { KlezmerClarinetSynth } from './synths/clarinet.ts';
import { getScaleNotes, getScaleDegreeNote, getTriadChord } from './scales.ts';
import type {
  ConductorListener,
  ConductorStepEvent,
  InstrumentId,
  MeterType,
  ScaleName,
} from './types.ts';

interface MeterStructure {
  totalSteps: number;
  groups: number[]; // e.g. [3, 2, 2]
  groupStartSteps: number[]; // e.g. [0, 3, 5]
  accents: number[]; // e.g. [0, 3, 5]
}

const METER_CONFIGS: Record<'4/4' | '7/8_322' | '7/8_223', MeterStructure> = {
  '4/4': {
    totalSteps: 8,
    groups: [2, 2, 2, 2],
    groupStartSteps: [0, 2, 4, 6],
    accents: [0, 4],
  },
  '7/8_322': {
    totalSteps: 7,
    groups: [3, 2, 2],
    groupStartSteps: [0, 3, 5],
    accents: [0, 3, 5],
  },
  '7/8_223': {
    totalSteps: 7,
    groups: [2, 2, 3],
    groupStartSteps: [0, 2, 4],
    accents: [0, 2, 4],
  },
};

/**
 * Conductor - Multi-Instrument Balkan Rhythmic Orchestrator & Master Clock
 *
 * Coordinates 6 procedural ensemble instruments across 4/4 and 7/8 Balkan meters:
 * 1. Accordion (Lead & bellows chords)
 * 2. Upright Bass (Grounding root/5th sub-pulse)
 * 3. Percussion (Tavern boot stomp, castanets, and shaker)
 * 4. Flamenco Guitar (Plucked rasgueado chords & syncopation)
 * 5. Gypsy Violin (Expressive high-register vibrato melodies)
 * 6. Klezmer Clarinet (Woody counterpoint & krekhts sobbing glissandi)
 */
export class Conductor {
  public readonly mixer: EnsembleMixer;
  public readonly accordion: AccordionSynth;
  public readonly bass: UprightBassSynth;
  public readonly percussion: PercussionSynth;
  public readonly guitar: FlamencoGuitarSynth;
  public readonly violin: GypsyViolinSynth;
  public readonly clarinet: KlezmerClarinetSynth;

  private activeMeter: MeterType = '7/8_322';
  private activeScale: ScaleName = 'D_PHRYGIAN_DOMINANT';

  private repeatEventId: number | null = null;
  private currentStep = 0;
  private measureCount = 0;
  private listeners: Set<ConductorListener> = new Set();
  private melodyIndex = 0;

  constructor(
    mixer?: EnsembleMixer,
    synths?: {
      accordion?: AccordionSynth;
      bass?: UprightBassSynth;
      percussion?: PercussionSynth;
      guitar?: FlamencoGuitarSynth;
      violin?: GypsyViolinSynth;
      clarinet?: KlezmerClarinetSynth;
    }
  ) {
    this.mixer = mixer ?? new EnsembleMixer();

    // Instantiate or accept provided synthesizers
    this.accordion = synths?.accordion ?? new AccordionSynth();
    this.bass = synths?.bass ?? new UprightBassSynth();
    this.percussion = synths?.percussion ?? new PercussionSynth();
    this.guitar = synths?.guitar ?? new FlamencoGuitarSynth();
    this.violin = synths?.violin ?? new GypsyViolinSynth();
    this.clarinet = synths?.clarinet ?? new KlezmerClarinetSynth();

    // Connect all synthesizers directly into the EnsembleMixer channel strips
    this.accordion.connect(this.mixer.getChannelInput('accordion'));
    this.bass.connect(this.mixer.getChannelInput('bass'));
    this.percussion.connect(this.mixer.getChannelInput('percussion'));
    this.guitar.connect(this.mixer.getChannelInput('guitar'));
    this.violin.connect(this.mixer.getChannelInput('violin'));
    this.clarinet.connect(this.mixer.getChannelInput('clarinet'));
  }

  public get meter(): MeterType {
    return this.activeMeter;
  }

  public get scale(): ScaleName {
    return this.activeScale;
  }

  public setMeter(meter: MeterType): void {
    this.activeMeter = meter;
    this.currentStep = 0;
  }

  public setScale(scale: ScaleName): void {
    this.activeScale = scale;
  }

  public setBpm(bpm: number): void {
    audioEngine.setBpm(bpm);
  }

  public getBpm(): number {
    return audioEngine.getBpm();
  }

  public isPlaying(): boolean {
    return Tone.getTransport().state === 'started';
  }

  /**
   * Starts the rhythmic loop and begins audio playback.
   */
  public async start(): Promise<void> {
    await audioEngine.init();

    if (this.repeatEventId === null) {
      this.setupSchedule();
    }

    audioEngine.startTransport();
  }

  /**
   * Pauses playback without resetting measure position.
   */
  public pause(): void {
    audioEngine.pauseTransport();
  }

  /**
   * Stops playback and resets step and measure counters.
   */
  public stop(): void {
    audioEngine.stopTransport();
    this.currentStep = 0;
    this.measureCount = 0;
    this.melodyIndex = 0;
    this.accordion.releaseAll();
    this.guitar.releaseAll();
    this.bass.triggerRelease();
    this.violin.triggerRelease();
    this.clarinet.triggerRelease();
  }

  /**
   * Subscribes a listener to receive step and subdivision events.
   */
  public onStep(listener: ConductorListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private resolveActiveStructure(): { config: MeterStructure; currentMeterLabel: MeterType } {
    if (this.activeMeter === 'ALTERNATING') {
      const isEvenMeasure = this.measureCount % 2 === 0;
      return {
        config: isEvenMeasure ? METER_CONFIGS['4/4'] : METER_CONFIGS['7/8_322'],
        currentMeterLabel: isEvenMeasure ? '4/4' : '7/8_322',
      };
    }
    return {
      config: METER_CONFIGS[this.activeMeter],
      currentMeterLabel: this.activeMeter,
    };
  }

  private setupSchedule(): void {
    this.repeatEventId = Tone.getTransport().scheduleRepeat((time) => {
      const { config, currentMeterLabel } = this.resolveActiveStructure();
      const step = this.currentStep;
      const measure = this.measureCount;

      // Determine grouping
      let groupIndex = 0;
      let groupLength = config.groups[0] ?? 2;
      for (let i = 0; i < config.groupStartSteps.length; i++) {
        const startStep = config.groupStartSteps[i] ?? 0;
        if (step >= startStep) {
          groupIndex = i;
          groupLength = config.groups[i] ?? 2;
        }
      }

      const isGroupStart = config.groupStartSteps.includes(step);
      const isAccent = config.accents.includes(step);

      const triggers: Partial<Record<InstrumentId, string>> = {};

      // ==========================================
      // 1. UPRIGHT BASS SCHEDULING
      // ==========================================
      if (isGroupStart) {
        if (step === 0) {
          // Downbeat anchor: Root D2 (long duration)
          const bassNote = 'D2';
          this.bass.triggerAttackRelease(bassNote, '4n', time, 0.95);
          triggers.bass = bassNote;
        } else if (groupIndex === 1) {
          // Second pulse: 5th (A1) or dominant degree
          const bassNote = 'A1';
          this.bass.triggerAttackRelease(bassNote, '8n', time, 0.85);
          triggers.bass = bassNote;
        } else {
          // Third pulse: Modal passing tone (F#2 in Phrygian Dom or F2 in Harmonic Minor or C2/Bb1)
          const degree = this.activeScale === 'D_PHRYGIAN_DOMINANT' ? 3 : 3;
          const bassNote = getScaleDegreeNote(this.activeScale, degree, 2);
          this.bass.triggerAttackRelease(bassNote, '8n', time, 0.8);
          triggers.bass = bassNote;
        }
      } else if (config.totalSteps === 8 && step === 6) {
        // 4/4 Walking Bass turnaround step
        const passingNote = this.activeScale === 'D_PHRYGIAN_DOMINANT' ? 'C2' : 'C#2';
        this.bass.triggerAttackRelease(passingNote, '16n', time, 0.7);
        triggers.bass = passingNote;
      }

      // ==========================================
      // 2. STREET PERCUSSION & CASTANETS SCHEDULING
      // ==========================================
      // A. Tavern Boot Stomp on heavy downbeats
      if (step === 0 || (config.totalSteps === 8 && step === 4)) {
        this.percussion.triggerStomp(time, 0.95);
        triggers.percussion = triggers.percussion ? `${triggers.percussion} + Stomp` : 'Stomp';
      }

      // B. Castanet Snaps on syncopated subdivision pulses
      if (isGroupStart && step > 0) {
        this.percussion.triggerCastanet(time, 0.85);
        triggers.percussion = triggers.percussion ? `${triggers.percussion} + Castanet` : 'Castanet';
      } else if (step === 2 && groupLength === 3) {
        // Asymmetric anticipation click in 3-length pulse
        this.percussion.triggerCastanet(time, 0.6);
        triggers.percussion = triggers.percussion ? `${triggers.percussion} + Castanet Roll` : 'Castanet Roll';
      }

      // C. Continuous Shaker / Tambourine subdivision
      this.percussion.triggerShaker(time, isAccent ? 0.7 : 0.4);

      // ==========================================
      // 3. FLAMENCO GUITAR SCHEDULING
      // ==========================================
      if (step === 0) {
        // Downbeat Rasgueado Strum: Tonic Triad
        const chord = getTriadChord(this.activeScale, 1, 3);
        this.guitar.strumChord(chord, time, 'down', 0.016, '8n');
        triggers.guitar = `Rasgueado [${chord.join(',')}]`;
      } else if (isGroupStart) {
        // Offbeat Flamenco Chord Stab (bII or V)
        const chordDegree = this.activeScale === 'D_PHRYGIAN_DOMINANT' ? 2 : 5;
        const chord = getTriadChord(this.activeScale, chordDegree, 3);
        this.guitar.triggerAttackRelease(chord, '16n', time, 0.75);
        triggers.guitar = `Stab Deg ${chordDegree}`;
      } else if (step === config.totalSteps - 1) {
        // Bar turnaround upward strum
        const chord = getTriadChord(this.activeScale, 1, 3);
        this.guitar.strumChord(chord, time, 'up', 0.012, '16n');
        triggers.guitar = 'Turnaround';
      }

      // ==========================================
      // 4. ACCORDION SCHEDULING (Lead & Chords)
      // ==========================================
      if (isGroupStart) {
        if (step === 0) {
          const chord = getTriadChord(this.activeScale, 1, 3);
          this.accordion.triggerAttackRelease(chord, '8n', time, 0.8);
          triggers.accordion = `Chord [${chord.join(',')}]`;
        } else if (groupIndex === 1) {
          const chordDegree = this.activeScale === 'D_PHRYGIAN_DOMINANT' ? 2 : 5;
          const chord = getTriadChord(this.activeScale, chordDegree, 3);
          this.accordion.triggerAttackRelease(chord, '16n', time, 0.65);
          triggers.accordion = `Chord Deg ${chordDegree}`;
        } else {
          const scaleNotes = getScaleNotes(this.activeScale, 4);
          const leadNote = scaleNotes[this.melodyIndex % scaleNotes.length] ?? 'D4';
          this.melodyIndex = (this.melodyIndex + 1) % scaleNotes.length;
          this.accordion.triggerAttackRelease(leadNote, '8n', time, 0.8);
          triggers.accordion = leadNote;
        }
      }

      // ==========================================
      // 5. GYPSY VIOLIN SCHEDULING
      // ==========================================
      // Sings expressive high-register melodies on downbeats & flourishes
      if (step === 0) {
        const leadDegree = (measure % 4 === 0) ? 1 : (measure % 4 === 1) ? 3 : (measure % 4 === 2) ? 5 : 8;
        const violinNote = getScaleDegreeNote(this.activeScale, leadDegree, 5);
        this.violin.triggerAttackRelease(violinNote, '4n', time, 0.85);
        triggers.violin = violinNote;
      } else if (isGroupStart && groupIndex === 2) {
        // High melodic flourish
        const violinNote = getScaleDegreeNote(this.activeScale, 5, 5); // A5
        this.violin.triggerAttackRelease(violinNote, '8n', time, 0.8);
        triggers.violin = violinNote;
      }

      // ==========================================
      // 6. KLEZMER CLARINET SCHEDULING
      // ==========================================
      // Counter-melodic phrases & expressive weeping bends (krekhts)
      if (step === 2 || (config.totalSteps === 8 && step === 4)) {
        const clarinetNote = getScaleDegreeNote(this.activeScale, 4, 4); // G4
        this.clarinet.triggerAttackRelease(clarinetNote, '8n', time, 0.75);
        triggers.clarinet = clarinetNote;
      } else if (step === config.totalSteps - 2 && measure % 2 === 1) {
        // Weeping Krekhts scoop into tonic or 5th
        const targetNote = getScaleDegreeNote(this.activeScale, 1, 5); // D5
        this.clarinet.triggerKrekhts(targetNote, time, '8n');
        triggers.clarinet = `Krekhts ${targetNote}`;
      }

      const eventPayload: ConductorStepEvent = {
        stepIndex: step,
        totalSteps: config.totalSteps,
        measureCount: measure,
        isAccent,
        groupIndex,
        groupLength,
        meter: currentMeterLabel,
        scale: this.activeScale,
        note: triggers.accordion,
        triggers,
      };

      // Dispatch UI update via Tone.Draw for frame-perfect visual sync
      Tone.getDraw().schedule(() => {
        for (const listener of this.listeners) {
          try {
            listener(eventPayload);
          } catch (err) {
            console.error('[Conductor] Error in listener:', err);
          }
        }
      }, time);

      // Advance step counter
      this.currentStep++;
      if (this.currentStep >= config.totalSteps) {
        this.currentStep = 0;
        this.measureCount++;
      }
    }, '8n');
  }

  /**
   * Cleans up transport schedule and nodes.
   */
  public dispose(): void {
    if (this.repeatEventId !== null) {
      Tone.getTransport().clear(this.repeatEventId);
      this.repeatEventId = null;
    }
    this.listeners.clear();
    this.accordion.dispose();
    this.bass.dispose();
    this.percussion.dispose();
    this.guitar.dispose();
    this.violin.dispose();
    this.clarinet.dispose();
    this.mixer.dispose();
  }
}
