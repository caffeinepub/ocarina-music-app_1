import React, { useState } from 'react';
import { RotateCcw, Save, CheckCircle2, AlertCircle, Loader2, CloudOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { DIATONIC_NOTES, NOTE_LABELS } from '../utils/fingeringMap';
import type { UseFingeringMapReturn } from '../hooks/useFingeringMap';
import { toast } from 'sonner';

interface FingeringSettingsPanelProps {
  fingeringState: UseFingeringMapReturn;
}

// Labels for each hole position in the 2×2 grid
const HOLE_LABELS = ['TL', 'TR', 'BL', 'BR'];

export const FingeringSettingsPanel: React.FC<FingeringSettingsPanelProps> = ({
  fingeringState,
}) => {
  const {
    fingeringMap,
    toggleHole,
    resetToDefaults,
    saveToBackend,
    isDirty,
    isSaving,
    isLoadingFromBackend,
  } = fingeringState;

  const [lastSaveError, setLastSaveError] = useState<string | null>(null);

  const handleSave = async () => {
    setLastSaveError(null);
    try {
      await saveToBackend();
      toast.success('Fingering map saved!', {
        description: 'Your custom fingering configuration has been saved to the backend.',
        duration: 3000,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setLastSaveError(msg);
      toast.error('Failed to save fingering map', {
        description: msg,
        duration: 5000,
      });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* ── Global Controls ── */}
      <div className="rounded-lg border border-warm-brown/30 bg-parchment/40 px-3 py-2.5 flex flex-col gap-2">
        <p className="text-xs font-heading font-semibold text-warm-brown uppercase tracking-wide">
          Global Controls
        </p>

        {/* Status indicator */}
        <div className="flex items-center gap-1.5 min-h-[18px]">
          {isLoadingFromBackend ? (
            <>
              <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
              <span className="text-xs text-muted-foreground font-body">Loading saved map…</span>
            </>
          ) : lastSaveError ? (
            <>
              <CloudOff className="w-3.5 h-3.5 text-destructive" />
              <span className="text-xs text-destructive font-body">Save failed</span>
            </>
          ) : isDirty ? (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-xs text-amber-700 font-body">Unsaved changes</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              <span className="text-xs text-green-700 font-body">All changes saved</span>
            </>
          )}
        </div>

        {/* Save button */}
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving || isLoadingFromBackend}
          className="h-8 text-xs gap-1.5 w-full bg-warm-brown hover:bg-light-brown text-parchment border-0"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              Save Fingering Map
            </>
          )}
        </Button>
      </div>

      <Separator className="bg-border/60" />

      {/* ── Per-note controls header ── */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-body">
          Click holes to toggle open/closed
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={resetToDefaults}
          className="h-7 text-xs gap-1 border-warm-brown text-warm-brown hover:bg-parchment"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </Button>
      </div>

      {/* ── Note rows ── */}
      <div className="flex flex-col gap-1">
        {DIATONIC_NOTES.map((note) => {
          const fingering = fingeringMap[note] ?? [false, false, false, false];
          return (
            <div
              key={note}
              className="flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-parchment/60 transition-colors"
            >
              {/* Note label */}
              <span className="w-8 text-sm font-heading font-semibold text-warm-brown flex-shrink-0">
                {NOTE_LABELS[note] ?? note}
              </span>
              <span className="w-8 text-xs text-muted-foreground flex-shrink-0 font-body">
                {note}
              </span>

              {/* 2×2 hole grid */}
              <div className="flex flex-col gap-1">
                <div className="flex gap-1">
                  {[0, 1].map((holeIdx) => (
                    <HoleButton
                      key={holeIdx}
                      closed={fingering[holeIdx]}
                      label={HOLE_LABELS[holeIdx]}
                      onClick={() => toggleHole(note, holeIdx)}
                    />
                  ))}
                </div>
                <div className="flex gap-1">
                  {[2, 3].map((holeIdx) => (
                    <HoleButton
                      key={holeIdx}
                      closed={fingering[holeIdx]}
                      label={HOLE_LABELS[holeIdx]}
                      onClick={() => toggleHole(note, holeIdx)}
                    />
                  ))}
                </div>
              </div>

              {/* Pattern description */}
              <span className="text-xs text-muted-foreground font-body ml-1 hidden sm:block">
                {fingering.map((c) => (c ? '●' : '○')).join(' ')}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Legend ── */}
      <div className="flex items-center gap-4 pt-1 border-t border-border">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-warm-brown border-2 border-warm-brown" />
          <span className="text-xs text-muted-foreground font-body">Closed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full border-2 border-warm-brown bg-transparent" />
          <span className="text-xs text-muted-foreground font-body">Open</span>
        </div>
      </div>
    </div>
  );
};

interface HoleButtonProps {
  closed: boolean;
  label: string;
  onClick: () => void;
}

const HoleButton: React.FC<HoleButtonProps> = ({ closed, label, onClick }) => (
  <button
    onClick={onClick}
    title={`${label}: ${closed ? 'Closed (click to open)' : 'Open (click to close)'}`}
    className={`
      w-6 h-6 rounded-full border-2 transition-all duration-150 cursor-pointer
      focus:outline-none focus:ring-2 focus:ring-warm-brown focus:ring-offset-1
      ${closed
        ? 'bg-warm-brown border-warm-brown hover:bg-light-brown hover:border-light-brown'
        : 'bg-transparent border-warm-brown hover:bg-parchment'
      }
    `}
    aria-label={`Hole ${label}: ${closed ? 'closed' : 'open'}`}
    aria-pressed={closed}
  />
);
