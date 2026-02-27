import React, { useState } from 'react';
import {
  Play, Pause, Square, Repeat, Save, FolderOpen,
  Loader2, RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { PlaybackState } from '../hooks/usePlayback';
import type { ScoreNote } from '../hooks/useScoreEditor';
import { useSaveScore } from '../hooks/useQueries';
import type { Score } from '../backend';
import { toast } from 'sonner';

interface PlaybackControlsProps {
  playbackState: PlaybackState;
  repeat: boolean;
  tempo: number;
  scoreName: string;
  notes: ScoreNote[];
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onRepeatToggle: () => void;
  onTempoChange: (v: number) => void;
  onScoreNameChange: (name: string) => void;
  onLoadClick: () => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  playbackState,
  repeat,
  tempo,
  scoreName,
  notes,
  onPlay,
  onPause,
  onStop,
  onRepeatToggle,
  onTempoChange,
  onScoreNameChange,
  onLoadClick,
}) => {
  const saveScore = useSaveScore();
  const [editingName, setEditingName] = useState(false);

  const handleSave = async () => {
    if (notes.length === 0) {
      toast.error('No notes to save');
      return;
    }
    const score: Score = {
      name: scoreName,
      notes: notes.map(n => ({
        pitch: n.pitch,
        duration: n.duration,
        fingering: n.fingering,
      })),
      lyrics: notes.map(n => n.lyrics ?? '').join('|'),
    };
    try {
      await saveScore.mutateAsync({ name: scoreName, score });
      toast.success(`Score "${scoreName}" saved!`);
    } catch {
      toast.error('Failed to save score');
    }
  };

  const isPlaying = playbackState === 'playing';
  const isPaused = playbackState === 'paused';
  const isStopped = playbackState === 'stopped';

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-3">
        {/* Score name */}
        <div className="flex items-center gap-2">
          {editingName ? (
            <Input
              value={scoreName}
              onChange={(e) => onScoreNameChange(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
              className="h-7 text-sm font-heading"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="text-sm font-heading font-semibold text-foreground hover:text-primary transition-colors truncate max-w-48"
              title="Click to rename"
            >
              {scoreName}
            </button>
          )}
          <span className="text-xs text-muted-foreground font-body ml-auto">
            {notes.length} note{notes.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Transport controls */}
        <div className="flex items-center gap-1.5">
          {/* Play/Pause */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant={isPlaying ? 'default' : 'outline'}
                onClick={isPlaying ? onPause : isPaused ? onPause : onPlay}
                disabled={notes.length === 0}
                className="h-9 w-9"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isPlaying ? 'Pause' : isPaused ? 'Resume' : 'Play'}</TooltipContent>
          </Tooltip>

          {/* Stop */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                onClick={onStop}
                disabled={isStopped}
                className="h-9 w-9"
              >
                <Square className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Stop</TooltipContent>
          </Tooltip>

          {/* Repeat */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant={repeat ? 'default' : 'outline'}
                onClick={onRepeatToggle}
                className="h-9 w-9"
              >
                <Repeat className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{repeat ? 'Repeat: On' : 'Repeat: Off'}</TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Save */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                onClick={handleSave}
                disabled={saveScore.isPending || notes.length === 0}
                className="h-9 w-9"
              >
                {saveScore.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save Score</TooltipContent>
          </Tooltip>

          {/* Load */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                onClick={onLoadClick}
                className="h-9 w-9"
              >
                <FolderOpen className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Load Score</TooltipContent>
          </Tooltip>
        </div>

        {/* Tempo control */}
        <div className="flex items-center gap-2">
          <RotateCcw className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-muted-foreground font-body w-12 flex-shrink-0">
            {tempo}%
          </span>
          <Slider
            value={[tempo]}
            onValueChange={([v]) => onTempoChange(v)}
            min={50}
            max={200}
            step={5}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground font-body flex-shrink-0">Tempo</span>
        </div>

        {/* Playback status */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
            isPlaying ? 'bg-forest-green animate-pulse' :
            isPaused ? 'bg-terracotta' :
            'bg-muted-foreground'
          }`} />
          <span className="text-xs text-muted-foreground font-body capitalize">
            {playbackState}
          </span>
        </div>
      </div>
    </TooltipProvider>
  );
};
