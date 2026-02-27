import type { Note } from '../backend';

export interface PresetSongData {
  id: string;
  displayName: string;
  notes: Note[];
}

// Helper to create a note
function n(pitch: string, durationMs: number): Note {
  return {
    pitch,
    duration: BigInt(durationMs),
    fingering: [],
  };
}

// Quarter note = 500ms (120 BPM), Half = 1000ms, Whole = 2000ms, Eighth = 250ms
const Q = 500;
const H = 1000;
const W = 2000;
const E = 250;
const DQ = 750; // dotted quarter

// Scarborough Fair - Am/Dm modal, 3/4 time
const scarboroughFair: Note[] = [
  n('A5', Q), n('C5', H),
  n('D5', Q), n('D5', Q), n('E5', Q),
  n('F5', H), n('E5', Q),
  n('D5', H), n('C5', Q),
  n('E5', Q), n('G5', Q), n('E5', Q),
  n('D5', H+Q),
  n('A5', Q), n('C5', H),
  n('D5', Q), n('D5', Q), n('E5', Q),
  n('F5', H), n('A5', Q),
  n('G5', H), n('F5', Q),
  n('E5', H+Q),
  n('C5', Q), n('D5', Q), n('E5', Q),
  n('F5', H), n('E5', Q),
  n('D5', Q), n('C5', Q), n('D5', Q),
  n('E5', H+Q),
  n('A5', Q), n('C5', H),
  n('D5', Q), n('D5', Q), n('E5', Q),
  n('F5', H), n('E5', Q),
  n('D5', H), n('C5', Q),
  n('E5', Q), n('G5', Q), n('E5', Q),
  n('D5', H+Q),
  n('A5', Q), n('C5', H),
  n('D5', Q), n('D5', Q), n('E5', Q),
  n('F5', H), n('A5', Q),
  n('G5', H), n('F5', Q),
  n('E5', H+Q),
  n('C5', Q), n('D5', Q), n('E5', Q),
  n('F5', H), n('E5', Q),
  n('D5', Q), n('C5', Q), n('D5', Q),
  n('E5', H+Q),
];

// Greensleeves - 3/4 time, minor feel
const greensleeves: Note[] = [
  n('A5', Q), 
  n('C6', DQ), n('D5', E), n('E5', H),
  n('F5', Q), n('E5', DQ), n('D5', E),
  n('C5', H), n('A5', Q),
  n('A5', DQ), n('B5', E), n('C6', H),
  n('D5', Q), n('C5', DQ), n('B5', E),
  n('A5', H), n('G5', Q),
  n('F5', DQ), n('G5', E), n('A5', H),
  n('E5', H+Q),
  n('C6', DQ), n('D5', E), n('E5', H),
  n('F5', Q), n('E5', DQ), n('D5', E),
  n('C5', H), n('A5', Q),
  n('A5', DQ), n('B5', E), n('C6', H),
  n('D5', Q), n('C5', DQ), n('B5', E),
  n('A5', H), n('G5', Q),
  n('F5', DQ), n('G5', E), n('A5', H),
  n('E5', H+Q),
  n('G5', DQ), n('A5', E), n('B5', H),
  n('C6', Q), n('B5', DQ), n('A5', E),
  n('G5', H), n('E5', Q),
  n('F5', DQ), n('G5', E), n('A5', H),
  n('E5', H+Q),
  n('G5', DQ), n('A5', E), n('B5', H),
  n('C6', Q), n('B5', DQ), n('A5', E),
  n('G5', H), n('F5', Q),
  n('E5', DQ), n('D5', E), n('C5', H),
  n('A5', H+Q),
];

// Amazing Grace - 3/4 time
const amazingGrace: Note[] = [
  n('C5', Q),
  n('F5', H), n('A5', Q),
  n('F5', H), n('A5', Q),
  n('C6', H), n('A5', Q),
  n('F5', H), n('A5', Q),
  n('E5', H+Q),
  n('D5', H), n('F5', Q),
  n('A5', H), n('G5', Q),
  n('F5', H+Q),
  n('C5', Q),
  n('F5', H), n('A5', Q),
  n('F5', H), n('A5', Q),
  n('C6', H), n('A5', Q),
  n('F5', H), n('A5', Q),
  n('E5', H+Q),
  n('D5', H), n('F5', Q),
  n('A5', H), n('G5', Q),
  n('F5', H+Q),
  n('C5', Q),
  n('F5', H), n('A5', Q),
  n('F5', H), n('A5', Q),
  n('C6', H), n('A5', Q),
  n('F5', H), n('A5', Q),
  n('E5', H+Q),
  n('D5', H), n('F5', Q),
  n('A5', H), n('G5', Q),
  n('F5', H+Q),
];

// Danny Boy - 4/4 time
const dannyBoy: Note[] = [
  n('C5', Q), n('E5', Q),
  n('G5', H), n('E5', Q), n('G5', Q),
  n('A5', H), n('G5', Q), n('E5', Q),
  n('G5', H), n('E5', Q), n('D5', Q),
  n('C5', W),
  n('C5', Q), n('E5', Q),
  n('G5', H), n('E5', Q), n('G5', Q),
  n('A5', H), n('B5', Q), n('C6', Q),
  n('B5', W),
  n('B5', Q), n('C6', Q),
  n('B5', H), n('A5', Q), n('G5', Q),
  n('A5', H), n('G5', Q), n('E5', Q),
  n('G5', W),
  n('G5', Q), n('A5', Q),
  n('B5', H), n('A5', Q), n('G5', Q),
  n('A5', H), n('G5', Q), n('E5', Q),
  n('D5', W),
  n('C5', Q), n('E5', Q),
  n('G5', H), n('E5', Q), n('G5', Q),
  n('A5', H), n('G5', Q), n('E5', Q),
  n('G5', H), n('E5', Q), n('D5', Q),
  n('C5', W),
];

// Ode to Joy - 4/4 time
const odeToJoy: Note[] = [
  n('E5', Q), n('E5', Q), n('F5', Q), n('G5', Q),
  n('G5', Q), n('F5', Q), n('E5', Q), n('D5', Q),
  n('C5', Q), n('C5', Q), n('D5', Q), n('E5', Q),
  n('E5', DQ), n('D5', E), n('D5', H),
  n('E5', Q), n('E5', Q), n('F5', Q), n('G5', Q),
  n('G5', Q), n('F5', Q), n('E5', Q), n('D5', Q),
  n('C5', Q), n('C5', Q), n('D5', Q), n('E5', Q),
  n('D5', DQ), n('C5', E), n('C5', H),
  n('D5', Q), n('D5', Q), n('E5', Q), n('C5', Q),
  n('D5', Q), n('E5', E), n('F5', E), n('E5', Q), n('C5', Q),
  n('D5', Q), n('E5', E), n('F5', E), n('E5', Q), n('D5', Q),
  n('C5', Q), n('D5', Q), n('G5', H),
  n('E5', Q), n('E5', Q), n('F5', Q), n('G5', Q),
  n('G5', Q), n('F5', Q), n('E5', Q), n('D5', Q),
  n('C5', Q), n('C5', Q), n('D5', Q), n('E5', Q),
  n('D5', DQ), n('C5', E), n('C5', H),
];

// Twinkle Twinkle Little Star - 4/4 time
const twinkleTwinkle: Note[] = [
  n('C5', Q), n('C5', Q), n('G5', Q), n('G5', Q),
  n('A5', Q), n('A5', Q), n('G5', H),
  n('F5', Q), n('F5', Q), n('E5', Q), n('E5', Q),
  n('D5', Q), n('D5', Q), n('C5', H),
  n('G5', Q), n('G5', Q), n('F5', Q), n('F5', Q),
  n('E5', Q), n('E5', Q), n('D5', H),
  n('G5', Q), n('G5', Q), n('F5', Q), n('F5', Q),
  n('E5', Q), n('E5', Q), n('D5', H),
  n('C5', Q), n('C5', Q), n('G5', Q), n('G5', Q),
  n('A5', Q), n('A5', Q), n('G5', H),
  n('F5', Q), n('F5', Q), n('E5', Q), n('E5', Q),
  n('D5', Q), n('D5', Q), n('C5', H),
  n('C5', Q), n('C5', Q), n('G5', Q), n('G5', Q),
  n('A5', Q), n('A5', Q), n('G5', H),
  n('F5', Q), n('F5', Q), n('E5', Q), n('E5', Q),
  n('D5', Q), n('D5', Q), n('C5', H),
];

// House of the Rising Sun - 3/4 time
const houseOfRisingSun: Note[] = [
  n('A5', Q), n('C6', Q), n('D5', Q),
  n('F5', H), n('D5', Q),
  n('F5', Q), n('A5', Q), n('C6', Q),
  n('E5', H+Q),
  n('A5', Q), n('C6', Q), n('D5', Q),
  n('F5', H), n('D5', Q),
  n('A5', H+Q),
  n('A5', Q), n('C6', Q), n('D5', Q),
  n('F5', H), n('D5', Q),
  n('F5', Q), n('A5', Q), n('C6', Q),
  n('E5', H+Q),
  n('E5', Q), n('G5', Q), n('E5', Q),
  n('D5', H), n('C5', Q),
  n('D5', H+Q),
  n('A5', Q), n('C6', Q), n('D5', Q),
  n('F5', H), n('D5', Q),
  n('F5', Q), n('A5', Q), n('C6', Q),
  n('E5', H+Q),
  n('A5', Q), n('C6', Q), n('D5', Q),
  n('F5', H), n('D5', Q),
  n('A5', H+Q),
  n('A5', Q), n('C6', Q), n('D5', Q),
  n('F5', H), n('D5', Q),
  n('F5', Q), n('A5', Q), n('C6', Q),
  n('E5', H+Q),
];

// Auld Lang Syne - 4/4 time
const auldLangSyne: Note[] = [
  n('C5', Q),
  n('F5', Q), n('F5', Q), n('F5', Q), n('A5', Q),
  n('G5', H), n('F5', Q), n('A5', Q),
  n('C6', H), n('A5', Q), n('F5', Q),
  n('A5', H), n('G5', H),
  n('F5', Q), n('F5', Q), n('A5', Q), n('C6', Q),
  n('D5', H), n('C5', Q), n('A5', Q),
  n('F5', H), n('F5', Q), n('A5', Q),
  n('G5', W),
  n('F5', Q), n('F5', Q), n('F5', Q), n('A5', Q),
  n('G5', H), n('F5', Q), n('A5', Q),
  n('C6', H), n('A5', Q), n('F5', Q),
  n('A5', H), n('G5', H),
  n('F5', Q), n('F5', Q), n('A5', Q), n('C6', Q),
  n('D5', H), n('C5', Q), n('A5', Q),
  n('F5', H), n('F5', Q), n('A5', Q),
  n('F5', W),
];

export const PRESET_SONGS: PresetSongData[] = [
  {
    id: 'scarborough-fair',
    displayName: 'Scarborough Fair',
    notes: scarboroughFair,
  },
  {
    id: 'greensleeves',
    displayName: 'Greensleeves',
    notes: greensleeves,
  },
  {
    id: 'amazing-grace',
    displayName: 'Amazing Grace',
    notes: amazingGrace,
  },
  {
    id: 'danny-boy',
    displayName: 'Danny Boy',
    notes: dannyBoy,
  },
  {
    id: 'ode-to-joy',
    displayName: 'Ode to Joy',
    notes: odeToJoy,
  },
  {
    id: 'twinkle-twinkle',
    displayName: 'Twinkle Twinkle Little Star',
    notes: twinkleTwinkle,
  },
  {
    id: 'house-of-rising-sun',
    displayName: 'House of the Rising Sun',
    notes: houseOfRisingSun,
  },
  {
    id: 'auld-lang-syne',
    displayName: 'Auld Lang Syne',
    notes: auldLangSyne,
  },
];
