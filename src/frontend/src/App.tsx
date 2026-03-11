import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { ThemeProvider } from "next-themes";
import React, { useState, useCallback } from "react";
import type { OcarinaProfile } from "./backend";
import { ImageRecognitionPanel } from "./components/ImageRecognitionPanel";
import { NoteEditor } from "./components/NoteEditor";
import { OcarinaShowcasePanel } from "./components/OcarinaShowcasePanel";
import OcarinaVisual from "./components/OcarinaVisual";
import { PianoKeyboard } from "./components/PianoKeyboard";
import { PlaybackControls } from "./components/PlaybackControls";
import { PresetSongLibrary } from "./components/PresetSongLibrary";
import { SampleUploadPanel } from "./components/SampleUploadPanel";
import { ScoreLoadDialog } from "./components/ScoreLoadDialog";
import { SheetMusic } from "./components/SheetMusic";
import { useFingeringMap } from "./hooks/useFingeringMap";
import { usePlayback } from "./hooks/usePlayback";
import { useScoreEditor } from "./hooks/useScoreEditor";
import type { ScoreNote } from "./hooks/useScoreEditor";
import { AppPage } from "./pages/AppPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LandingPage } from "./pages/LandingPage";
import { PaymentFailurePage } from "./pages/PaymentFailurePage";
import { PaymentSuccessPage } from "./pages/PaymentSuccessPage";

const DEFAULT_ADD_PITCH = "C5";
const DEFAULT_ADD_DURATION = 500;

const queryClient = new QueryClient();

export function AppContent() {
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [customSamples, setCustomSamples] = useState<Record<string, string>>(
    {},
  );
  const [externalImageUrl, setExternalImageUrl] = useState<string | null>(null);

  const editor = useScoreEditor();
  const playback = usePlayback();
  const { fingeringMap } = useFingeringMap();

  const handleNotePlay = useCallback(
    (pitch: string) => {
      setActiveNote(pitch);
      editor.addNote(pitch, DEFAULT_ADD_DURATION);
      setTimeout(() => setActiveNote(null), 400);
    },
    [editor],
  );

  const currentPlayingNote =
    playback.currentNoteIndex !== null
      ? (editor.notes[playback.currentNoteIndex]?.pitch ?? null)
      : null;

  const displayNote = activeNote ?? currentPlayingNote ?? undefined;

  const handlePlay = useCallback(() => {
    playback.play(editor.notes, customSamples);
  }, [playback, editor.notes, customSamples]);

  const handlePause = useCallback(() => {
    playback.pause();
  }, [playback]);
  const handleStop = useCallback(() => {
    playback.stop();
  }, [playback]);

  const handleLoadScore = useCallback(
    (notes: ScoreNote[], name: string) => {
      editor.loadScore(notes, name);
      playback.stop();
    },
    [editor, playback],
  );

  const handleSamplesChange = useCallback((samples: Record<string, string>) => {
    setCustomSamples(samples);
  }, []);

  const handlePlayProfile = useCallback((profile: OcarinaProfile) => {
    setExternalImageUrl(profile.image.getDirectURL());
  }, []);

  const selectedNote =
    editor.selectedNoteIndex !== null
      ? (editor.notes[editor.selectedNoteIndex] ?? null)
      : null;

  const handleHolePlay = useCallback((pitch: string) => {
    setActiveNote(pitch);
    setTimeout(() => setActiveNote(null), 400);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-bold">
                ♪
              </span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">OcarinaTab</h1>
              <p className="text-xs text-muted-foreground">
                Interactive Ocarina Tablature
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/dashboard"
              className="text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1"
            >
              Admin
            </a>
            <button
              type="button"
              data-ocid="app.logout_button"
              onClick={() => {
                localStorage.removeItem("ocarina_access");
                window.location.href = "/";
              }}
              className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded border border-border hover:border-primary/50 transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 space-y-6">
        <OcarinaShowcasePanel onPlayProfile={handlePlayProfile} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <SheetMusic
              notes={editor.notes}
              selectedNoteIndex={editor.selectedNoteIndex}
              currentPlayingIndex={playback.currentNoteIndex}
              onNoteSelect={editor.selectNote}
              onAddNoteAt={(idx) =>
                editor.insertNoteAt(
                  idx,
                  DEFAULT_ADD_PITCH,
                  DEFAULT_ADD_DURATION,
                )
              }
              fingeringMap={fingeringMap}
            />

            <div className="bg-card rounded-2xl border border-border p-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Note Editor
              </h2>
              <NoteEditor
                selectedNote={selectedNote}
                selectedIndex={editor.selectedNoteIndex}
                onUpdate={editor.updateNote}
                onDelete={editor.deleteNote}
              />
            </div>

            <div className="bg-card rounded-2xl border border-border p-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Playback
              </h2>
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
            </div>

            <div className="bg-card rounded-2xl border border-border p-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Piano Keyboard
              </h2>
              <PianoKeyboard
                onNotePlay={handleNotePlay}
                activeNote={displayNote ?? null}
                customSamples={customSamples}
                disabled={playback.playbackState === "playing"}
              />
            </div>

            <div className="bg-card rounded-2xl border border-border p-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Folk Song Library
              </h2>
              <PresetSongLibrary onLoad={handleLoadScore} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Ocarina View
              </h2>
              <OcarinaVisual
                currentNote={displayNote}
                fingeringMap={fingeringMap}
                className="w-full"
                style={{ minHeight: 220 }}
                externalImageUrl={externalImageUrl ?? undefined}
                onHolePlay={handleHolePlay}
                customSamples={customSamples}
              />
            </div>

            <div className="bg-card rounded-2xl border border-border p-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Custom Samples
              </h2>
              <SampleUploadPanel onSamplesChange={handleSamplesChange} />
            </div>

            <div className="bg-card rounded-2xl border border-border p-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Sheet Music Scanner
              </h2>
              <ImageRecognitionPanel onLoadRecognized={handleLoadScore} />
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-card/30 py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} OcarinaTab</span>
          <span className="flex items-center gap-1">
            Built with <Heart className="w-3 h-3 fill-primary text-primary" />{" "}
            using{" "}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "ocarinatab")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </span>
        </div>
      </footer>

      <ScoreLoadDialog
        open={loadDialogOpen}
        onClose={() => setLoadDialogOpen(false)}
        onLoad={handleLoadScore}
      />
    </div>
  );
}

// ─── Router setup ─────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/app",
  beforeLoad: () => {
    const access = localStorage.getItem("ocarina_access");
    if (!access) throw redirect({ to: "/" });
  },
  component: AppPage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: DashboardPage,
});

const paymentSuccessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/payment-success",
  component: PaymentSuccessPage,
});

const paymentFailureRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/payment-failure",
  component: PaymentFailurePage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  appRoute,
  dashboardRoute,
  paymentSuccessRoute,
  paymentFailureRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
        <RouterProvider router={router} />
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
