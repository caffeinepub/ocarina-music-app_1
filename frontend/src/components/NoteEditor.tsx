import React from 'react';
import { Trash2, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ScoreNote } from '../hooks/useScoreEditor';
import { DIATONIC_NOTES, DURATION_OPTIONS } from '../hooks/useScoreEditor';
import { TablatureDiagram } from './TablatureDiagram';
import { getFingeringForPitch } from '../utils/fingeringMap';

interface NoteEditorProps {
  selectedNote: ScoreNote | null;
  selectedIndex: number | null;
  onUpdate: (index: number, changes: Partial<ScoreNote>) => void;
  onDelete: (index: number) => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  selectedNote,
  selectedIndex,
  onUpdate,
  onDelete,
}) => {
  if (!selectedNote || selectedIndex === null) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 py-6 text-muted-foreground">
        <Music className="w-8 h-8 opacity-40" />
        <p className="text-sm font-body italic">Select a note to edit its properties</p>
      </div>
    );
  }

  const durationMs = Number(selectedNote.duration);
  const fingering = getFingeringForPitch(selectedNote.pitch);

  return (
    <div className="flex flex-col gap-4 p-1">
      {/* Fingering preview */}
      <div className="flex items-center gap-4">
        <TablatureDiagram fingering={fingering} size="lg" />
        <div>
          <p className="text-lg font-heading font-semibold text-foreground">{selectedNote.pitch}</p>
          <p className="text-xs text-muted-foreground font-body">Note #{selectedIndex + 1}</p>
        </div>
      </div>

      {/* Pitch selector */}
      <div className="space-y-1.5">
        <Label className="text-xs font-body font-semibold text-foreground">Pitch</Label>
        <Select
          value={selectedNote.pitch}
          onValueChange={(val) => onUpdate(selectedIndex, { pitch: val })}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DIATONIC_NOTES.map(note => (
              <SelectItem key={note} value={note}>{note}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Duration selector */}
      <div className="space-y-1.5">
        <Label className="text-xs font-body font-semibold text-foreground">Duration</Label>
        <Select
          value={String(durationMs)}
          onValueChange={(val) => onUpdate(selectedIndex, { duration: BigInt(val) })}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DURATION_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lyrics input */}
      <div className="space-y-1.5">
        <Label className="text-xs font-body font-semibold text-foreground">Lyrics</Label>
        <Input
          value={selectedNote.lyrics ?? ''}
          onChange={(e) => onUpdate(selectedIndex, { lyrics: e.target.value })}
          placeholder="Enter lyric syllable..."
          className="h-8 text-sm"
        />
      </div>

      {/* Delete button */}
      <Button
        variant="destructive"
        size="sm"
        onClick={() => onDelete(selectedIndex)}
        className="w-full mt-1"
      >
        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
        Delete Note
      </Button>
    </div>
  );
};
