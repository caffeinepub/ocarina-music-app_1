import { useState, useRef, useCallback, useEffect } from 'react';
import type { ScoreNote } from './useScoreEditor';
import { useAudioPlayback } from './useAudioPlayback';

export type PlaybackState = 'stopped' | 'playing' | 'paused';

interface PlaybackHook {
  playbackState: PlaybackState;
  currentNoteIndex: number | null;
  repeat: boolean;
  setRepeat: (v: boolean) => void;
  play: (notes: ScoreNote[], customSamples?: Record<string, string>) => void;
  pause: () => void;
  stop: () => void;
  tempo: number;
  setTempo: (v: number) => void;
}

export function usePlayback(): PlaybackHook {
  const [playbackState, setPlaybackState] = useState<PlaybackState>('stopped');
  const [currentNoteIndex, setCurrentNoteIndex] = useState<number | null>(null);
  const [repeat, setRepeat] = useState(false);
  const [tempo, setTempo] = useState(100); // percentage of original speed

  const { playNote, stopAll } = useAudioPlayback();
  const playbackRef = useRef<{ cancelled: boolean; paused: boolean }>({ cancelled: false, paused: false });
  const pauseIndexRef = useRef<number>(0);
  const notesRef = useRef<ScoreNote[]>([]);
  const samplesRef = useRef<Record<string, string>>({});

  const stop = useCallback(() => {
    playbackRef.current.cancelled = true;
    playbackRef.current.paused = false;
    stopAll();
    setPlaybackState('stopped');
    setCurrentNoteIndex(null);
    pauseIndexRef.current = 0;
  }, [stopAll]);

  const pause = useCallback(() => {
    if (playbackState === 'playing') {
      playbackRef.current.paused = true;
      stopAll();
      setPlaybackState('paused');
    } else if (playbackState === 'paused') {
      // Resume
      playbackRef.current.paused = false;
      setPlaybackState('playing');
      const notes = notesRef.current;
      const samples = samplesRef.current;
      const startIndex = pauseIndexRef.current;

      const runPlayback = async (startIdx: number) => {
        for (let i = startIdx; i < notes.length; i++) {
          if (playbackRef.current.cancelled || playbackRef.current.paused) {
            pauseIndexRef.current = i;
            return;
          }
          const note = notes[i];
          setCurrentNoteIndex(i);
          const durationMs = Number(note.duration) * (100 / tempo);
          const sampleUrl = samples[note.pitch];
          await playNote(note.pitch, durationMs, sampleUrl);
          if (playbackRef.current.cancelled || playbackRef.current.paused) {
            pauseIndexRef.current = i + 1;
            return;
          }
        }
        if (repeat && !playbackRef.current.cancelled && !playbackRef.current.paused) {
          pauseIndexRef.current = 0;
          runPlayback(0);
        } else {
          setPlaybackState('stopped');
          setCurrentNoteIndex(null);
          pauseIndexRef.current = 0;
        }
      };

      runPlayback(startIndex);
    }
  }, [playbackState, playNote, stopAll, repeat, tempo]);

  const play = useCallback((notes: ScoreNote[], customSamples: Record<string, string> = {}) => {
    if (notes.length === 0) return;

    playbackRef.current.cancelled = true;
    stopAll();

    setTimeout(() => {
      playbackRef.current = { cancelled: false, paused: false };
      notesRef.current = notes;
      samplesRef.current = customSamples;
      pauseIndexRef.current = 0;
      setPlaybackState('playing');
      setCurrentNoteIndex(null);

      const runPlayback = async (startIdx: number) => {
        for (let i = startIdx; i < notes.length; i++) {
          if (playbackRef.current.cancelled || playbackRef.current.paused) {
            pauseIndexRef.current = i;
            return;
          }
          const note = notes[i];
          setCurrentNoteIndex(i);
          const durationMs = Number(note.duration) * (100 / tempo);
          const sampleUrl = customSamples[note.pitch];
          await playNote(note.pitch, durationMs, sampleUrl);
          if (playbackRef.current.cancelled || playbackRef.current.paused) {
            pauseIndexRef.current = i + 1;
            return;
          }
        }
        if (repeat && !playbackRef.current.cancelled && !playbackRef.current.paused) {
          pauseIndexRef.current = 0;
          runPlayback(0);
        } else {
          setPlaybackState('stopped');
          setCurrentNoteIndex(null);
          pauseIndexRef.current = 0;
        }
      };

      runPlayback(0);
    }, 50);
  }, [playNote, stopAll, repeat, tempo]);

  useEffect(() => {
    return () => {
      playbackRef.current.cancelled = true;
      stopAll();
    };
  }, [stopAll]);

  return {
    playbackState,
    currentNoteIndex,
    repeat,
    setRepeat,
    play,
    pause,
    stop,
    tempo,
    setTempo,
  };
}
