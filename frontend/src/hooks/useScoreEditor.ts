import { useState, useCallback } from 'react';
import type { Note } from '../backend';
import { DIATONIC_NOTES } from '../utils/fingeringMap';

export interface ScoreNote extends Note {
  lyrics?: string;
}

export interface ScoreEditorState {
  notes: ScoreNote[];
  selectedNoteIndex: number | null;
  scoreName: string;
}

export interface ScoreEditorActions {
  addNote: (pitch: string, duration: number) => void;
  deleteNote: (index: number) => void;
  updateNote: (index: number, changes: Partial<ScoreNote>) => void;
  selectNote: (index: number | null) => void;
  setScoreName: (name: string) => void;
  loadScore: (notes: ScoreNote[], name?: string) => void;
  clearScore: () => void;
  insertNoteAt: (index: number, pitch: string, duration: number) => void;
}

export function useScoreEditor(): ScoreEditorState & ScoreEditorActions {
  const [notes, setNotes] = useState<ScoreNote[]>([]);
  const [selectedNoteIndex, setSelectedNoteIndex] = useState<number | null>(null);
  const [scoreName, setScoreNameState] = useState<string>('My Ocarina Song');

  const addNote = useCallback((pitch: string, duration: number) => {
    const newNote: ScoreNote = {
      pitch,
      duration: BigInt(duration),
      fingering: [],
      lyrics: '',
    };
    setNotes(prev => {
      const insertAt = selectedNoteIndex !== null ? selectedNoteIndex + 1 : prev.length;
      const updated = [...prev];
      updated.splice(insertAt, 0, newNote);
      return updated;
    });
    setSelectedNoteIndex(prev => {
      const insertAt = prev !== null ? prev + 1 : notes.length;
      return insertAt;
    });
  }, [selectedNoteIndex, notes.length]);

  const insertNoteAt = useCallback((index: number, pitch: string, duration: number) => {
    const newNote: ScoreNote = {
      pitch,
      duration: BigInt(duration),
      fingering: [],
      lyrics: '',
    };
    setNotes(prev => {
      const updated = [...prev];
      updated.splice(index, 0, newNote);
      return updated;
    });
    setSelectedNoteIndex(index);
  }, []);

  const deleteNote = useCallback((index: number) => {
    setNotes(prev => prev.filter((_, i) => i !== index));
    setSelectedNoteIndex(prev => {
      if (prev === null) return null;
      if (prev === index) return prev > 0 ? prev - 1 : null;
      if (prev > index) return prev - 1;
      return prev;
    });
  }, []);

  const updateNote = useCallback((index: number, changes: Partial<ScoreNote>) => {
    setNotes(prev => prev.map((note, i) => i === index ? { ...note, ...changes } : note));
  }, []);

  const selectNote = useCallback((index: number | null) => {
    setSelectedNoteIndex(index);
  }, []);

  const setScoreName = useCallback((name: string) => {
    setScoreNameState(name);
  }, []);

  const loadScore = useCallback((newNotes: ScoreNote[], name?: string) => {
    setNotes(newNotes);
    setSelectedNoteIndex(null);
    if (name) setScoreNameState(name);
  }, []);

  const clearScore = useCallback(() => {
    setNotes([]);
    setSelectedNoteIndex(null);
  }, []);

  return {
    notes,
    selectedNoteIndex,
    scoreName,
    addNote,
    deleteNote,
    updateNote,
    selectNote,
    setScoreName,
    loadScore,
    clearScore,
    insertNoteAt,
  };
}

export const DURATION_OPTIONS = [
  { label: 'Whole (2s)', value: 2000 },
  { label: 'Half (1s)', value: 1000 },
  { label: 'Dotted Quarter (750ms)', value: 750 },
  { label: 'Quarter (500ms)', value: 500 },
  { label: 'Eighth (250ms)', value: 250 },
];

export { DIATONIC_NOTES };
