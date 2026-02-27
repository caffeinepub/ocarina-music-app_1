import React, { useState, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Music2, BookOpen, Upload, ScanLine, Heart, Settings2 } from 'lucide-react';

import { PianoKeyboard } from './components/PianoKeyboard';
import { OcarinaVisual } from './components/OcarinaVisual';
import { SheetMusic } from './components/SheetMusic';
import { NoteEditor } from './components/NoteEditor';
import { PlaybackControls } from './components/PlaybackControls';
import { ScoreLoadDialog } from './components/ScoreLoadDialog';
import { PresetSongLibrary } from './components/PresetSongLibrary';
import { SampleUploadPanel } from './components/SampleUploadPanel';
import { ImageRecognitionPanel } from './components/ImageRecognitionPanel';
import { FingeringSettingsPanel } from './components/FingeringSettingsPanel';
import { OcarinaShowcasePanel } from './components/OcarinaShowcasePanel';

import { useScoreEditor } from './hooks/useScoreEditor';
import { usePlayback } from './hooks/usePlayback';
import { useFingeringMap } from './hooks/useFingeringMap';
import type { ScoreNote } from './hooks/useScoreEditor';
import type { OcarinaProfile } from './backend';

const DEFAULT_ADD_PITCH = 'C5';
const DEFAULT_ADD_DURATION = 500;

const queryClient = new QueryClient();

const AppInner: React.FC = () => {
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [customSamples, setCustomSamples] = useState<Record<string, string>>({});
  const [loadedProfileImage, setLoadedProfileImage] = useState<string | null>(null);
  const [loadedProfileName, setLoadedProfileName] = useState<string | null>(null);

  const editor = useScoreEditor();
  const playback = usePlayback();
  const fingeringState = useFingeringMap();

  // When a note is played from keyboard, add it to score and update visual
  const handleNotePlay = useCallback((pitch: string) => {
    setActiveNote(pitch);
    editor.addNote(pitch, DEFAULT_ADD_DURATION);
    setTimeout(() => setActiveNote(null), 400);
  }, [editor]);

  // When playback advances, update the active note for the ocarina visual
  const currentPlayingNote = playback.currentNoteIndex !== null
    ? editor.notes[playback.currentNoteIndex]?.pitch ?? null
    : null;

  const displayNote = activeNote ?? currentPlayingNote;

  const handlePlay = useCallback(() => {
    playback.play(editor.notes, customSamples);
  }, [playback, editor.notes, customSamples]);

  const handlePause = useCallback(() => {
    playback.pause();
  }, [playback]);

  const handleStop = useCallback(() => {
    playback.stop();
  }, [playback]);

  const handleLoadScore = useCallback((notes: ScoreNote[], name: string) => {
    editor.loadScore(notes, name);
    playback.stop();
  }, [editor, playback]);

  const handleSamplesChange = useCallback((samples: Record<string, string>) => {
    setCustomSamples(samples);
  }, []);

  const handlePlayProfile = useCallback((profile: OcarinaProfile) => {
    const url = profile.image.getDirectURL();
    setLoadedProfileImage(url);
    setLoadedProfileName(profile.name);
  }, []);

  const selectedNote = editor.selectedNoteIndex !== null
    ? editor.notes[editor.selectedNoteIndex] ?? null
    : null;

  const appId = encodeURIComponent(
    typeof window !== 'undefined' ? window.location.hostname : 'ocarina-music-app'
  );

  return (
    <div className="min-h-screen bg-background parchment-bg flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-0">
          {/* Banner image */}
          <div className="w-full overflow-hidden rounded-b-lg" style={{ maxHeight: '120px' }}>
            <img
              src="/assets/generated/app-header-banner.dim_1200x200.png"
              alt="Ocarina Studio"
              className="w-full object-cover object-center"
              style={{ maxHeight: '120px' }}
            />
          </div>
          <div className="flex items-center gap-3 py-3">
            <Music2 className="w-6 h-6 text-warm-brown flex-shrink-0" />
            <div>
              <h1 className="text-xl font-heading font-bold text-foreground leading-tight">
                Ocarina Studio
              </h1>
              <p className="text-xs text-muted-foreground font-body">
                Folk music composer &amp; player
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Ocarina Gallery Showcase — expandable panel at top of main content */}
      <OcarinaShowcasePanel onPlayProfile={handlePlayProfile} />

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 flex flex-col gap-6">

        {/* Loaded profile banner */}
        {loadedProfileName && (
          <div className="flex items-center justify-between px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 text-sm">
            <span className="text-primary font-medium font-body">
              🎵 Playing: <strong>{loadedProfileName}</strong>
            </span>
            <button
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => {
                setLoadedProfileImage(null);
                setLoadedProfileName(null);
              }}
            >
              ✕ Clear
            </button>
          </div>
        )}

        {/* Top row: Ocarina Visual + Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Ocarina Visual */}
          <Card className="lg:col-span-2 shadow-parchment border-border">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-heading text-foreground">
                Ocarina View
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 flex justify-center">
              <OcarinaVisual
                currentNote={displayNote}
                fingeringMap={fingeringState.fingeringMap}
                className="w-full max-w-xs"
                style={{ height: '300px' }}
                externalImageUrl={loadedProfileImage}
              />
            </CardContent>
          </Card>

          {/* Playback Controls + Note Editor */}
          <Card className="shadow-parchment border-border">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-heading text-foreground">
                Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 flex flex-col gap-4">
              <PlaybackControls
                playbackState={playback.playbackState}
                repeat={playback.repeat}
                tempo={playback.tempo}
                scoreName={editor.scoreName}
                notes={editor.notes}
                onPlay={handlePlay}
                onPause={handlePause}
                onStop={handleStop}
                onRepeatToggle={() => playback.setRepeat(!playback.repeat)}
                onTempoChange={playback.setTempo}
                onScoreNameChange={editor.setScoreName}
                onLoadClick={() => setLoadDialogOpen(true)}
              />
              <Separator />
              <div>
                <p className="text-xs font-heading font-semibold text-foreground mb-2">
                  Note Editor
                </p>
                <NoteEditor
                  selectedNote={selectedNote}
                  selectedIndex={editor.selectedNoteIndex}
                  onUpdate={editor.updateNote}
                  onDelete={editor.deleteNote}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Piano Keyboard */}
        <Card className="shadow-parchment border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-heading text-foreground">
              Piano Keyboard — Click or press A S D F G H J K
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <PianoKeyboard
              onNotePlay={handleNotePlay}
              activeNote={displayNote}
              customSamples={customSamples}
              disabled={playback.playbackState === 'playing'}
            />
          </CardContent>
        </Card>

        {/* Sheet Music */}
        <Card className="shadow-parchment border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-heading text-foreground">
              Sheet Music
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <SheetMusic
              notes={editor.notes}
              selectedNoteIndex={editor.selectedNoteIndex}
              currentPlayingIndex={playback.currentNoteIndex}
              onNoteSelect={editor.selectNote}
              onAddNoteAt={(idx) => editor.insertNoteAt(idx, DEFAULT_ADD_PITCH, DEFAULT_ADD_DURATION)}
              fingeringMap={fingeringState.fingeringMap}
            />
          </CardContent>
        </Card>

        {/* Bottom panels: Presets, Samples, Image Recognition, Fingering Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Preset Songs */}
          <Card className="shadow-parchment border-border">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-heading text-foreground flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Folk Song Library
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <PresetSongLibrary onLoad={handleLoadScore} />
            </CardContent>
          </Card>

          {/* Sample Upload */}
          <Card className="shadow-parchment border-border">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-heading text-foreground flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Custom Samples
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <SampleUploadPanel onSamplesChange={handleSamplesChange} />
            </CardContent>
          </Card>

          {/* Image Recognition */}
          <Card className="shadow-parchment border-border">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-heading text-foreground flex items-center gap-2">
                <ScanLine className="w-4 h-4" />
                Sheet Music Scanner
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <ImageRecognitionPanel onLoadRecognized={handleLoadScore} />
            </CardContent>
          </Card>

          {/* Fingering Settings */}
          <Card className="shadow-parchment border-border">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-heading text-foreground flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                Fingering Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <FingeringSettingsPanel fingeringState={fingeringState} />
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground font-body">
            © {new Date().getFullYear()} Ocarina Studio. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground font-body flex items-center gap-1">
            Built with <Heart className="w-3 h-3 text-terracotta fill-terracotta" /> using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-warm-brown hover:underline font-semibold"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>

      {/* Dialogs */}
      <ScoreLoadDialog
        open={loadDialogOpen}
        onClose={() => setLoadDialogOpen(false)}
        onLoad={handleLoadScore}
      />

      <Toaster richColors position="bottom-right" />
    </div>
  );
};

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <AppInner />
  </QueryClientProvider>
);

export default App;
