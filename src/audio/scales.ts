import type { ScaleDefinition, ScaleName } from './types.ts';

/**
 * Modal scale definitions for Eastern European & Balkan Gypsy Folk
 * Centered on Root D
 */
export const SCALES: Record<ScaleName, ScaleDefinition> = {
  D_PHRYGIAN_DOMINANT: {
    name: 'D_PHRYGIAN_DOMINANT',
    displayName: 'D Phrygian Dominant (Freygish / Hijaz)',
    root: 'D',
    // Intervals in semitones: 1, b2, 3, 4, 5, b6, b7
    intervals: [0, 1, 4, 5, 7, 8, 10],
    octaves: {
      2: ['D2', 'Eb2', 'F#2', 'G2', 'A2', 'Bb2', 'C2'],
      3: ['D3', 'Eb3', 'F#3', 'G3', 'A3', 'Bb3', 'C3'],
      4: ['D4', 'Eb4', 'F#4', 'G4', 'A4', 'Bb4', 'C4'],
      5: ['D5', 'Eb5', 'F#5', 'G5', 'A5', 'Bb5', 'C5'],
      6: ['D6', 'Eb6', 'F#6', 'G6', 'A6', 'Bb6', 'C6'],
    },
    characteristicMood: 'Iconic Balkan/Flamenco/Klezmer sound with exotic major 3rd (F#) and flat 2nd (Eb)',
  },

  D_HARMONIC_MINOR: {
    name: 'D_HARMONIC_MINOR',
    displayName: 'D Harmonic Minor (Czardas Folk)',
    root: 'D',
    // Intervals in semitones: 1, 2, b3, 4, 5, b6, 7
    intervals: [0, 2, 3, 5, 7, 8, 11],
    octaves: {
      2: ['D2', 'E2', 'F2', 'G2', 'A2', 'Bb2', 'C#2'],
      3: ['D3', 'E3', 'F3', 'G3', 'A3', 'Bb3', 'C#3'],
      4: ['D4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'C#4'],
      5: ['D5', 'E5', 'F5', 'G5', 'A5', 'Bb5', 'C#5'],
      6: ['D6', 'E6', 'F6', 'G6', 'A6', 'Bb6', 'C#6'],
    },
    characteristicMood: 'Melancholic Classical/Eastern European minor with leading tone (C#)',
  },
};

/**
 * Returns notes array for a given scale and octave (default octave: 4).
 */
export function getScaleNotes(scaleName: ScaleName, octave = 4): string[] {
  const scale = SCALES[scaleName];
  const clampedOctave = Math.max(2, Math.min(6, octave));
  return scale.octaves[clampedOctave] ?? scale.octaves[4] ?? [];
}

/**
 * Resolves a 1-indexed scale degree to a note string, handling octave wrapping.
 * E.g., degree 1 -> 'D4', degree 8 -> 'D5', degree 3 -> 'F#4' (in Phrygian Dominant)
 */
export function getScaleDegreeNote(scaleName: ScaleName, degree: number, baseOctave = 4): string {
  const scale = SCALES[scaleName];
  const zeroIndex = degree - 1;
  const octaveShift = Math.floor(zeroIndex / 7);
  const normalizedIndex = ((zeroIndex % 7) + 7) % 7;
  const targetOctave = Math.max(2, Math.min(6, baseOctave + octaveShift));
  const octaveNotes = scale.octaves[targetOctave] ?? scale.octaves[4] ?? [];
  return octaveNotes[normalizedIndex] ?? `${scale.root}${targetOctave}`;
}

/**
 * Generates a triad chord (Root, 3rd, 5th) on a given scale degree.
 */
export function getTriadChord(scaleName: ScaleName, degree: number, baseOctave = 3): string[] {
  return [
    getScaleDegreeNote(scaleName, degree, baseOctave),
    getScaleDegreeNote(scaleName, degree + 2, baseOctave),
    getScaleDegreeNote(scaleName, degree + 4, baseOctave),
  ];
}

/**
 * Selects a random note from the active scale within an octave range.
 */
export function getRandomScaleNote(scaleName: ScaleName, minOctave = 3, maxOctave = 5): string {
  const octave = Math.floor(Math.random() * (maxOctave - minOctave + 1)) + minOctave;
  const notes = getScaleNotes(scaleName, octave);
  const randomIndex = Math.floor(Math.random() * notes.length);
  return notes[randomIndex] ?? `${SCALES[scaleName].root}${octave}`;
}

/**
 * Checks if a note string exists in the specified scale.
 */
export function isNoteInScale(scaleName: ScaleName, note: string): boolean {
  const scale = SCALES[scaleName];
  for (const octaveNotes of Object.values(scale.octaves)) {
    if (octaveNotes.includes(note)) {
      return true;
    }
  }
  return false;
}
