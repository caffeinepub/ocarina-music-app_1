import React, { useEffect, useCallback } from 'react';
import { DIATONIC_NOTES, NOTE_LABELS, KEYBOARD_SHORTCUTS } from '../utils/fingeringMap';
import { useAudioPlayback } from '../hooks/useAudioPlayback';

interface PianoKeyboardProps {
  onNotePlay: (pitch: string) => void;
  activeNote: string | null;
  customSamples?: Record<string, string>;
  disabled?: boolean;
}

const KEY_COLORS: Record<string, string> = {
  'C5': 'white', 'D5': 'white', 'E5': 'white', 'F5': 'white',
  'G5': 'white', 'A5': 'white', 'B5': 'white', 'C6': 'white',
};

export const PianoKeyboard: React.FC<PianoKeyboardProps> = ({
  onNotePlay,
  activeNote,
  customSamples = {},
  disabled = false,
}) => {
  const { playNote } = useAudioPlayback();

  const handleNotePlay = useCallback((pitch: string) => {
    if (disabled) return;
    onNotePlay(pitch);
    const sampleUrl = customSamples[pitch];
    playNote(pitch, 600, sampleUrl);
  }, [disabled, onNotePlay, playNote, customSamples]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || disabled) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const pitch = KEYBOARD_SHORTCUTS[e.key.toLowerCase()];
      if (pitch) {
        handleNotePlay(pitch);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNotePlay, disabled]);

  const shortcutKeys = Object.entries(KEYBOARD_SHORTCUTS).reduce<Record<string, string>>(
    (acc, [key, pitch]) => { acc[pitch] = key.toUpperCase(); return acc; },
    {}
  );

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-end gap-1 px-4 py-3 bg-card rounded-lg border border-border shadow-parchment">
        {DIATONIC_NOTES.map((note) => {
          const isActive = activeNote === note;
          return (
            <button
              key={note}
              onMouseDown={() => handleNotePlay(note)}
              disabled={disabled}
              className={`
                relative flex flex-col items-center justify-end
                w-14 h-36 rounded-b-md cursor-pointer select-none
                transition-all duration-75
                piano-key-white
                ${isActive ? 'active' : ''}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                focus:outline-none focus:ring-2 focus:ring-ring
              `}
              aria-label={`Play ${note}`}
              aria-pressed={isActive}
            >
              {/* Active glow */}
              {isActive && (
                <div className="absolute inset-0 rounded-b-md bg-terracotta opacity-20 pointer-events-none" />
              )}

              {/* Note label */}
              <div className="mb-2 flex flex-col items-center gap-1">
                <span className="text-xs font-body font-bold text-warm-brown">
                  {NOTE_LABELS[note]}
                </span>
                <span className="text-xs font-body text-muted-foreground opacity-70">
                  {shortcutKeys[note]}
                </span>
              </div>

              {/* Active indicator dot */}
              {isActive && (
                <div className="absolute top-3 w-3 h-3 rounded-full bg-terracotta shadow-sm" />
              )}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground font-body">
        Press keyboard keys <span className="font-semibold">A S D F G H J K</span> to play notes
      </p>
    </div>
  );
};
