import React from 'react';
import { FolderOpen, Loader2, Music, Trash2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGetAllScores, useDeleteScore } from '../hooks/useQueries';
import type { ScoreNote } from '../hooks/useScoreEditor';
import { toast } from 'sonner';

interface ScoreLoadDialogProps {
  open: boolean;
  onClose: () => void;
  onLoad: (notes: ScoreNote[], name: string) => void;
}

export const ScoreLoadDialog: React.FC<ScoreLoadDialogProps> = ({ open, onClose, onLoad }) => {
  const { data: scores, isLoading } = useGetAllScores();
  const deleteScore = useDeleteScore();

  const handleLoad = (score: { name: string; notes: Array<{ pitch: string; duration: bigint; fingering: string[] }>; lyrics?: string }) => {
    const lyricsArr = score.lyrics ? score.lyrics.split('|') : [];
    const notes: ScoreNote[] = score.notes.map((n, i) => ({
      pitch: n.pitch,
      duration: n.duration,
      fingering: n.fingering,
      lyrics: lyricsArr[i] ?? '',
    }));
    onLoad(notes, score.name);
    onClose();
    toast.success(`Loaded "${score.name}"`);
  };

  const handleDelete = async (name: string) => {
    try {
      await deleteScore.mutateAsync(name);
      toast.success(`Deleted "${name}"`);
    } catch {
      toast.error('Failed to delete score');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Load Saved Score</DialogTitle>
          <DialogDescription className="font-body text-sm">
            Select a previously saved score to load into the editor.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !scores || scores.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
            <FolderOpen className="w-10 h-10 opacity-40" />
            <p className="text-sm font-body italic">No saved scores yet</p>
          </div>
        ) : (
          <ScrollArea className="max-h-72">
            <div className="flex flex-col gap-2 pr-2">
              {scores.map((score) => (
                <div
                  key={score.name}
                  className="flex items-center gap-2 p-3 rounded-md border border-border bg-secondary hover:bg-muted transition-colors"
                >
                  <Music className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body font-semibold truncate">{score.name}</p>
                    <p className="text-xs text-muted-foreground">{score.notes.length} notes</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleLoad(score)}
                    className="flex-shrink-0 h-7 text-xs"
                  >
                    Load
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(score.name)}
                    disabled={deleteScore.isPending}
                    className="flex-shrink-0 h-7 w-7"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};
