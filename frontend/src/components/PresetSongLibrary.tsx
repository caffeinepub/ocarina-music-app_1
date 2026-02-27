import React, { useEffect } from 'react';
import { Music, Loader2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useGetPresetSongList, useGetPresetSong, useAddPresetSong } from '../hooks/useQueries';
import type { ScoreNote } from '../hooks/useScoreEditor';
import { PRESET_SONGS } from '../utils/presetSongs';
import { toast } from 'sonner';

interface PresetSongLibraryProps {
  onLoad: (notes: ScoreNote[], name: string) => void;
}

export const PresetSongLibrary: React.FC<PresetSongLibraryProps> = ({ onLoad }) => {
  const { data: presetList, isLoading } = useGetPresetSongList();
  const getPresetSong = useGetPresetSong();
  const addPresetSong = useAddPresetSong();

  // Seed preset songs into backend if not present
  useEffect(() => {
    if (!presetList) return;
    const existingIds = new Set(presetList.map(s => s.id));
    const missing = PRESET_SONGS.filter(s => !existingIds.has(s.id));

    missing.forEach(async (song) => {
      try {
        await addPresetSong.mutateAsync({
          id: song.id,
          displayName: song.displayName,
          score: {
            name: song.displayName,
            notes: song.notes,
            lyrics: undefined,
          },
        });
      } catch {
        // Silently ignore - may already exist
      }
    });
  }, [presetList]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoadPreset = async (id: string, displayName: string) => {
    try {
      const song = await getPresetSong.mutateAsync(id);
      const notes: ScoreNote[] = song.score.notes.map(n => ({
        pitch: n.pitch,
        duration: n.duration,
        fingering: n.fingering,
        lyrics: '',
      }));
      onLoad(notes, song.displayName);
      toast.success(`Loaded "${displayName}"`);
    } catch {
      // Try loading from local presets
      const localSong = PRESET_SONGS.find(s => s.id === id);
      if (localSong) {
        const notes: ScoreNote[] = localSong.notes.map(n => ({
          pitch: n.pitch,
          duration: n.duration,
          fingering: n.fingering,
          lyrics: '',
        }));
        onLoad(notes, localSong.displayName);
        toast.success(`Loaded "${displayName}"`);
      } else {
        toast.error('Failed to load preset song');
      }
    }
  };

  // Merge backend list with local presets for display
  const displayList = presetList && presetList.length > 0
    ? presetList
    : PRESET_SONGS.map(s => ({ id: s.id, displayName: s.displayName }));

  const getTotalDuration = (id: string): string => {
    const song = PRESET_SONGS.find(s => s.id === id);
    if (!song) return '';
    const totalMs = song.notes.reduce((sum, n) => sum + Number(n.duration), 0);
    const secs = Math.round(totalMs / 1000);
    return `~${secs}s`;
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-body">
          {displayList.length} folk songs
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ScrollArea className="max-h-64">
          <div className="flex flex-col gap-1.5 pr-1">
            {displayList.map((song) => {
              const duration = getTotalDuration(song.id);
              return (
                <button
                  key={song.id}
                  onClick={() => handleLoadPreset(song.id, song.displayName)}
                  disabled={getPresetSong.isPending}
                  className="flex items-center gap-2 p-2.5 rounded-md border border-border bg-secondary hover:bg-muted text-left transition-colors disabled:opacity-50 group"
                >
                  <Music className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 group-hover:text-foreground transition-colors" />
                  <span className="text-sm font-body flex-1 truncate">{song.displayName}</span>
                  {duration && (
                    <Badge variant="outline" className="text-xs flex-shrink-0 h-5">
                      {duration}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
