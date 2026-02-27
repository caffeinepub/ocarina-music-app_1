// 4-hole ocarina fingering map for diatonic C5-C6 scale
// Holes are arranged in a 2x2 grid:
// [top-left, top-right, bottom-left, bottom-right]
// true = closed (covered), false = open (uncovered)

export type Fingering = [boolean, boolean, boolean, boolean];

export const DIATONIC_NOTES = ['C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6'] as const;
export type DiatomicNote = typeof DIATONIC_NOTES[number];

// Fingering patterns for 4-hole ocarina (simplified from standard 4-hole charts)
// Based on standard 4-hole ocarina fingering where:
// C5 = all covered, progressively open holes going up the scale
const FINGERING_MAP: Record<string, Fingering> = {
  'C5': [true,  true,  true,  true],   // All covered
  'D5': [true,  true,  true,  false],  // Bottom-right open
  'E5': [true,  true,  false, false],  // Bottom row open
  'F5': [true,  false, false, false],  // Only top-left covered
  'G5': [true,  true,  false, true],   // Special fingering
  'A5': [false, true,  false, false],  // Only top-right covered
  'B5': [false, false, true,  false],  // Only bottom-left covered
  'C6': [false, false, false, false],  // All open
};

export function getFingeringForPitch(pitch: string): Fingering {
  return FINGERING_MAP[pitch] ?? [false, false, false, false];
}

export function getNoteFrequency(pitch: string): number {
  const FREQ_MAP: Record<string, number> = {
    'C5': 523.25,
    'D5': 587.33,
    'E5': 659.25,
    'F5': 698.46,
    'G5': 783.99,
    'A5': 880.00,
    'B5': 987.77,
    'C6': 1046.50,
  };
  return FREQ_MAP[pitch] ?? 523.25;
}

export const NOTE_LABELS: Record<string, string> = {
  'C5': 'C',
  'D5': 'D',
  'E5': 'E',
  'F5': 'F',
  'G5': 'G',
  'A5': 'A',
  'B5': 'B',
  'C6': 'C\'',
};

// Staff position (semitones above C4 for treble clef positioning)
// Used to determine vertical position on staff
export const STAFF_POSITIONS: Record<string, number> = {
  'C5': 0,  // ledger line below staff
  'D5': 1,
  'E5': 2,
  'F5': 3,
  'G5': 4,
  'A5': 5,
  'B5': 6,
  'C6': 7,
};

export const KEYBOARD_SHORTCUTS: Record<string, string> = {
  'a': 'C5',
  's': 'D5',
  'd': 'E5',
  'f': 'F5',
  'g': 'G5',
  'h': 'A5',
  'j': 'B5',
  'k': 'C6',
};
