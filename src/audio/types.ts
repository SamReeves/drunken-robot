/**
 * Audio System Domain Types
 * The Drunken Robot's Journey Home
 */

export type AudioEngineState = 'uninitialized' | 'suspended' | 'running' | 'closed';

export type ScaleName = 'D_PHRYGIAN_DOMINANT' | 'D_HARMONIC_MINOR';

export type MeterType = '4/4' | '7/8_322' | '7/8_223' | 'ALTERNATING';

export type InstrumentId = 'accordion' | 'bass' | 'percussion' | 'guitar' | 'violin' | 'clarinet';

export type EnsemblePreset = 'solo_accordion' | 'rhythm_duo' | 'tavern_trio' | 'full_balkan_band';

export interface ScaleDefinition {
  name: ScaleName;
  displayName: string;
  root: string;
  intervals: number[]; // semitone intervals from root
  octaves: Record<number, string[]>;
  characteristicMood: string;
}

export interface AccordionParams {
  /** Dynamic bellows pressure: 0.0 (idle/gentle) to 1.0 (hard squeeze) */
  bellowsPressure: number;
  /** Musette beating detune in cents (0 - 25) */
  musetteDetune: number;
  /** Attack time in seconds */
  attack: number;
  /** Release time in seconds */
  release: number;
  /** Output volume in decibels */
  volume: number;
}

export interface InstrumentChannelState {
  id: InstrumentId;
  name: string;
  displayName: string;
  role: string;
  color: string;
  recruited: boolean;
  muted: boolean;
  solo: boolean;
  volume: number; // in dB (-60 to +6)
  pan: number; // -1 (left) to +1 (right)
}

export interface ConductorStepEvent {
  /** Current step index in the bar (0-indexed) */
  stepIndex: number;
  /** Total eighth-note steps in the current bar (e.g. 8 for 4/4, 7 for 7/8) */
  totalSteps: number;
  /** Current measure count */
  measureCount: number;
  /** Whether this step is an accented downbeat or subdivision pulse */
  isAccent: boolean;
  /** Sub-beat group index within the asymmetrical bar */
  groupIndex: number;
  /** Sub-beat group length (e.g. 3, 2, or 2 in 3+2+2) */
  groupLength: number;
  /** Active meter representation string */
  meter: MeterType;
  /** Active scale name */
  scale: ScaleName;
  /** Note triggered on main accordion if any */
  note?: string;
  /** Per-instrument triggered notes or description */
  triggers?: Partial<Record<InstrumentId, string>>;
}

export interface ConductorListener {
  (event: ConductorStepEvent): void;
}

