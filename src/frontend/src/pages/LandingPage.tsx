import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import {
  CheckCircle,
  FileMusic,
  Lock,
  Mic,
  Music,
  Music2,
  Play,
  ScanLine,
  ShoppingCart,
  Star,
  Upload,
} from "lucide-react";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import OcarinaVisual from "../components/OcarinaVisual";
import { useActor } from "../hooks/useActor";
import { useFingeringMap } from "../hooks/useFingeringMap";

// ─── Constants ────────────────────────────────────────────────────────────────
const PRESET_SONGS = [
  "Scarborough Fair",
  "Greensleeves",
  "Danny Boy",
  "Amazing Grace",
  "House of the Rising Sun",
  "Ode to Joy",
  "Canon in D",
  "Twinkle Twinkle",
  "Silent Night",
];

const OCTAVE_NOTES = [
  {
    label: "C",
    pitch: "C5",
    holes: [false, false, false, false],
    freq: 523.25,
  },
  { label: "D", pitch: "D5", holes: [false, false, false, true], freq: 587.33 },
  { label: "E", pitch: "E5", holes: [false, false, true, true], freq: 659.25 },
  { label: "F", pitch: "F5", holes: [false, true, true, true], freq: 698.46 },
  { label: "G", pitch: "G5", holes: [true, true, true, true], freq: 783.99 },
  { label: "A", pitch: "A5", holes: [true, true, true, false], freq: 880.0 },
  { label: "B", pitch: "B5", holes: [true, true, false, false], freq: 987.77 },
  {
    label: "C'",
    pitch: "C6",
    holes: [false, false, false, true],
    freq: 1046.5,
  },
];

const NOTE_SYMBOLS = ["♩", "♪", "♫", "♬", "𝄞", "𝄢"];

const DEFAULT_PRODUCTS = [
  {
    id: "alto-c",
    name: "Alto C Ocarina",
    price: 4500,
    priceLabel: "$45 AUD",
    description:
      "Rich, warm mid-range tones. Perfect for beginners and intermediate players.",
    image: "/assets/generated/ocarina-alto-blue.dim_600x600.jpg",
  },
  {
    id: "soprano",
    name: "Soprano Ocarina",
    price: 3800,
    priceLabel: "$38 AUD",
    description:
      "Bright and clear. Hand-painted floral design. Ideal for melody play.",
    image: "/assets/generated/ocarina-soprano-white.dim_600x600.jpg",
  },
  {
    id: "bass",
    name: "Bass Ocarina",
    price: 5500,
    priceLabel: "$55 AUD",
    description:
      "Deep resonant bass tones. Artisan clay craftsmanship. For advanced players.",
    image: "/assets/generated/ocarina-bass-brown.dim_600x600.jpg",
  },
];

const FEATURES = [
  {
    icon: Music,
    title: "Interactive Tablature",
    desc: "Piano keyboard triggers ocarina holes in real-time",
  },
  {
    icon: FileMusic,
    title: "Sheet Music Editor",
    desc: "Add, edit, and notate your songs with full tablature",
  },
  {
    icon: Music2,
    title: "Folk Song Library",
    desc: "9 preset folk songs ready to play and learn from",
  },
  {
    icon: Mic,
    title: "Custom Sound Upload",
    desc: "Record your own ocarina sounds and assign to notes",
  },
  {
    icon: Upload,
    title: "MIDI Import",
    desc: "Auto-convert MIDI files to editable tablature",
  },
  {
    icon: ScanLine,
    title: "Sheet Music Scanner",
    desc: "Image recognition for converting scores",
  },
];

// ─── Mini hole grid ───────────────────────────────────────────────────────────
function MiniHoleGrid({
  holes,
  active,
}: { holes: boolean[]; active?: boolean }) {
  return (
    <div
      className="grid grid-cols-2 gap-1.5 p-2"
      style={{ transform: "rotate(-90deg)" }}
    >
      {holes.map((filled, i) => (
        <div
          key={`hole-pos-${i}-${filled ? "closed" : "open"}`}
          className={`w-4 h-4 rounded-full border-2 transition-all ${
            filled
              ? active
                ? "bg-gold border-gold shadow-[0_0_8px_oklch(0.75_0.15_85/0.9)]"
                : "bg-primary border-primary"
              : active
                ? "border-gold/60 bg-gold/10"
                : "border-border bg-transparent"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Floating notes background ────────────────────────────────────────────────
function FloatingNotes() {
  const notes = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    symbol: NOTE_SYMBOLS[i % NOTE_SYMBOLS.length],
    left: `${(i * 5.6 + 2) % 100}%`,
    delay: `${(i * 0.7) % 8}s`,
    duration: `${12 + ((i * 1.3) % 10)}s`,
    size: `${0.8 + ((i * 0.15) % 1.2)}rem`,
    opacity: 0.08 + ((i * 0.018) % 0.15),
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {notes.map((note) => (
        <span
          key={note.id}
          className="absolute animate-float-note text-primary select-none"
          style={{
            left: note.left,
            bottom: "-10%",
            fontSize: note.size,
            opacity: note.opacity,
            animationDelay: note.delay,
            animationDuration: note.duration,
          }}
        >
          {note.symbol}
        </span>
      ))}
    </div>
  );
}

// ─── Access code dialog ───────────────────────────────────────────────────────
function AccessCodeDialogContent({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleUnlock = useCallback(() => {
    const stored = localStorage.getItem("ocarina_access_codes");
    const codes: string[] = stored ? JSON.parse(stored) : [];
    const usedStored = localStorage.getItem("ocarina_used_codes");
    const used: string[] = usedStored ? JSON.parse(usedStored) : [];

    if (
      codes.includes(code.toUpperCase()) &&
      !used.includes(code.toUpperCase())
    ) {
      used.push(code.toUpperCase());
      localStorage.setItem("ocarina_used_codes", JSON.stringify(used));
      localStorage.setItem(
        "ocarina_access",
        JSON.stringify({ type: "code", code: code.toUpperCase() }),
      );
      toast.success("Access unlocked! Welcome to OcarinaTab.");
      onClose();
      window.location.href = "/app";
    } else {
      setError("Invalid or already used access code. Please try again.");
    }
  }, [code, onClose]);

  return (
    <div data-ocid="access_code.dialog" className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Enter the access code included with your ocarina purchase.
      </p>
      <Input
        data-ocid="access_code.input"
        value={code}
        onChange={(e) => {
          setCode(e.target.value);
          setError("");
        }}
        placeholder="e.g. OCARINA1"
        className="bg-secondary border-border text-foreground placeholder:text-muted-foreground uppercase"
        onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
      />
      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button
        data-ocid="access_code.submit_button"
        onClick={handleUnlock}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
      >
        <Lock className="w-4 h-4 mr-2" />
        Unlock App
      </Button>
    </div>
  );
}

// ─── Checkout hook ────────────────────────────────────────────────────────────
function useCreateCheckoutSession() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (
      items: Array<{
        name: string;
        amount: number;
        currency: string;
        quantity: number;
      }>,
    ) => {
      if (!actor) throw new Error("Actor not ready");
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const result = await (actor as any).createCheckoutSession(
        items,
        `${baseUrl}/payment-success`,
        `${baseUrl}/payment-failure`,
      );
      const session = JSON.parse(result);
      if (!session?.url) throw new Error("Stripe session missing url");
      return session;
    },
  });
}

// ─── Songs sticky bar ─────────────────────────────────────────────────────────
function SongsBar() {
  return (
    <div
      className="fixed left-0 right-0 z-40 flex items-center gap-3 px-4"
      style={{
        bottom: 80,
        height: 48,
        background: "#111111",
        borderTop: "1px solid oklch(0.75 0.15 85 / 0.15)",
      }}
    >
      {/* Label */}
      <span
        className="text-xs font-semibold uppercase tracking-widest flex-shrink-0"
        style={{ color: "oklch(0.75 0.15 85)" }}
      >
        Songs
      </span>
      {/* Divider */}
      <div
        className="w-px h-5 flex-shrink-0"
        style={{ background: "oklch(0.75 0.15 85 / 0.2)" }}
      />
      {/* Scrollable pills */}
      <div
        className="flex items-center gap-2 overflow-x-auto scrollbar-none flex-1"
        style={{ scrollbarWidth: "none" }}
      >
        {PRESET_SONGS.map((song) => (
          <span
            key={song}
            className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap cursor-default select-none"
            style={{
              border: "1px solid oklch(0.75 0.15 85 / 0.4)",
              color: "oklch(0.75 0.15 85)",
              background: "oklch(0.75 0.15 85 / 0.05)",
            }}
          >
            {song}
          </span>
        ))}
        {/* Trailing hint */}
        <span
          className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap"
          style={{ color: "oklch(0.55 0.02 60)", fontStyle: "italic" }}
        >
          + more inside ↗
        </span>
      </div>
    </div>
  );
}

// ─── Ocarina model sticky bar ─────────────────────────────────────────────────
function OcarinaBar({
  activeNotePitch,
}: { activeNotePitch: string | undefined }) {
  const { fingeringMap } = useFingeringMap();

  return (
    <div
      className="fixed left-0 right-0 z-40 flex items-center gap-4 px-4"
      style={{
        bottom: 0,
        height: 80,
        background: "#0d0d0d",
        borderTop: "1px solid oklch(0.75 0.15 85 / 0.25)",
      }}
    >
      {/* Label */}
      <span
        className="text-xs font-semibold uppercase tracking-widest flex-shrink-0"
        style={{ color: "oklch(0.75 0.15 85)" }}
      >
        Ocarina
      </span>
      {/* Divider */}
      <div
        className="w-px h-10 flex-shrink-0"
        style={{ background: "oklch(0.75 0.15 85 / 0.2)" }}
      />
      {/* Compact OcarinaVisual */}
      <div
        className="flex-shrink-0 overflow-hidden flex items-center justify-center"
        style={{ width: 120, height: 68 }}
      >
        <OcarinaVisual
          currentNote={activeNotePitch}
          fingeringMap={fingeringMap}
          className="w-full h-full"
          style={{ minHeight: 0 }}
        />
      </div>
      {/* Active note label */}
      <div className="flex flex-col justify-center">
        {activeNotePitch ? (
          <>
            <span className="text-xs" style={{ color: "oklch(0.55 0.02 60)" }}>
              Playing
            </span>
            <span
              className="text-base font-bold font-heading leading-tight"
              style={{ color: "oklch(0.75 0.15 85)" }}
            >
              {activeNotePitch}
            </span>
          </>
        ) : (
          <>
            <span className="text-xs" style={{ color: "oklch(0.55 0.02 60)" }}>
              Try the demo
            </span>
            <span
              className="text-xs mt-0.5"
              style={{ color: "oklch(0.4 0.01 60)" }}
            >
              Press a note ↑
            </span>
          </>
        )}
      </div>
      {/* Right CTA */}
      <div className="ml-auto flex items-center gap-3">
        <span
          className="text-xs hidden sm:block"
          style={{ color: "oklch(0.45 0.01 60)" }}
        >
          Subscribe for full access
        </span>
        <a
          href="/app"
          onClick={(e) => {
            e.preventDefault();
            const access = localStorage.getItem("ocarina_access");
            if (access) {
              window.location.href = "/app";
            } else {
              window.location.href = "/#hero";
            }
          }}
          className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
          style={{
            background: "oklch(0.75 0.15 85)",
            color: "oklch(0.1 0.02 55)",
          }}
        >
          Open App
        </a>
      </div>
    </div>
  );
}

// ─── Main landing page ────────────────────────────────────────────────────────
export function LandingPage() {
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [activeDemo, setActiveDemo] = useState<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const checkout = useCreateCheckoutSession();

  // Derive the active note pitch string for sharing with the ocarina bar
  const activeNotePitch =
    activeDemo !== null ? OCTAVE_NOTES[activeDemo]?.pitch : undefined;

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }, []);

  useEffect(
    () => () => {
      audioCtxRef.current?.close();
    },
    [],
  );

  const playDemoNote = useCallback(
    (idx: number, freq: number) => {
      const ctx = getAudioCtx();
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.2);

      setActiveDemo(idx);
      setTimeout(() => setActiveDemo(null), 1200);
    },
    [getAudioCtx],
  );

  const handleSubscribeCheckout = useCallback(async () => {
    try {
      const session = await checkout.mutateAsync([
        {
          name: "OcarinaTab Full Access",
          amount: 700,
          currency: "aud",
          quantity: 1,
        },
      ]);
      window.location.href = session.url;
    } catch {
      toast.error("Checkout unavailable — please try again later.");
    }
  }, [checkout]);

  const handleBuyProduct = useCallback(
    async (product: (typeof DEFAULT_PRODUCTS)[0]) => {
      try {
        const session = await checkout.mutateAsync([
          {
            name: product.name,
            amount: product.price,
            currency: "aud",
            quantity: 1,
          },
        ]);
        window.location.href = session.url;
      } catch {
        toast.error("Checkout unavailable — please try again later.");
      }
    },
    [checkout],
  );

  const getShopProducts = () => {
    try {
      const stored = localStorage.getItem("ocarina_shop_products");
      return stored ? JSON.parse(stored) : DEFAULT_PRODUCTS;
    } catch {
      return DEFAULT_PRODUCTS;
    }
  };

  const shopProducts = getShopProducts();

  return (
    <div className="min-h-screen bg-background text-foreground pb-36">
      {/* ── Sticky header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-base">
              ♪
            </div>
            <span className="font-heading text-xl font-bold text-foreground">
              OcarinaTab
            </span>
          </div>
          <nav className="flex items-center gap-3">
            <a
              href="/dashboard"
              data-ocid="header.dashboard_link"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              Dashboard
            </a>
            <Dialog open={codeDialogOpen} onOpenChange={setCodeDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  data-ocid="header.enter_code_button"
                  className="border-border text-foreground hover:border-primary/50 hover:text-primary"
                >
                  Enter Code
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="font-heading text-foreground">
                    Enter Access Code
                  </DialogTitle>
                </DialogHeader>
                <AccessCodeDialogContent
                  onClose={() => setCodeDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
            <Button
              size="sm"
              data-ocid="header.subscribe_button"
              onClick={handleSubscribeCheckout}
              disabled={checkout.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            >
              Subscribe $7 AUD
            </Button>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section
        id="hero"
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
      >
        <FloatingNotes />
        <div className="hero-glow absolute inset-0" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center space-y-8">
          <Badge className="bg-primary/10 text-primary border border-primary/30 text-sm px-4 py-1.5">
            🎵 Premium Ocarina Platform
          </Badge>
          <h1 className="font-heading text-5xl md:text-7xl font-extrabold leading-tight">
            <span className="shimmer-text">Master the</span>
            <br />
            <span className="text-foreground">Ocarina</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Interactive tablature, sheet music editing, real-time playback &
            more. The complete ocarina learning platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              data-ocid="hero.subscribe_button"
              onClick={handleSubscribeCheckout}
              disabled={checkout.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-lg px-8 py-6 shadow-gold animate-pulse-gold"
            >
              Get Access — $7 AUD
            </Button>
            <Dialog open={codeDialogOpen} onOpenChange={setCodeDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="lg"
                  data-ocid="hero.enter_code_button"
                  className="border-border text-foreground hover:border-primary hover:text-primary font-semibold text-lg px-8 py-6"
                >
                  Enter Access Code
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="font-heading text-foreground">
                    Enter Access Code
                  </DialogTitle>
                </DialogHeader>
                <AccessCodeDialogContent
                  onClose={() => setCodeDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-sm text-muted-foreground">
            Or buy an ocarina from our shop below and get{" "}
            <span className="text-primary font-semibold">
              free app access included
            </span>
          </p>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground animate-bounce">
          <div className="w-px h-12 bg-gradient-to-b from-transparent to-border" />
        </div>
      </section>

      {/* ── Octave Diagram ── */}
      <section className="py-24 px-4 parchment-bg">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-heading text-4xl font-bold text-foreground mb-3">
              The C5–C6 Diatonic Scale
            </h2>
            <p className="text-muted-foreground text-lg">
              8 notes, 4 holes, endless music
            </p>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {OCTAVE_NOTES.map((note, i) => (
              <button
                type="button"
                key={note.pitch}
                className={`bg-card border rounded-xl p-3 flex flex-col items-center gap-2 transition-all card-glow cursor-pointer w-full ${
                  activeDemo === i
                    ? "border-primary shadow-gold"
                    : "border-border"
                }`}
                onClick={() => playDemoNote(i, note.freq)}
              >
                <span
                  className={`font-heading font-bold text-lg ${
                    activeDemo === i ? "text-primary" : "gold-text"
                  }`}
                >
                  {note.label}
                </span>
                <MiniHoleGrid holes={note.holes} active={activeDemo === i} />
                <span className="text-xs text-muted-foreground">
                  {note.pitch}
                </span>
              </button>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">
            Tap any note above to preview the sound and see the hole fingering
          </p>
        </div>
      </section>

      {/* ── Play Demo ── */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-4xl font-bold text-foreground mb-3">
            Try it — Play a Note
          </h2>
          <p className="text-muted-foreground text-lg mb-12">
            Press any key to hear the ocarina tone and see the fingering
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {OCTAVE_NOTES.map((note, i) => (
              <button
                type="button"
                key={note.pitch}
                data-ocid={`demo.note_button.${i + 1}`}
                onClick={() => playDemoNote(i, note.freq)}
                className={`w-16 h-20 rounded-xl border-2 font-heading font-bold text-xl transition-all hover:scale-105 active:scale-95 ${
                  activeDemo === i
                    ? "bg-primary text-primary-foreground border-primary shadow-gold"
                    : "bg-card border-border text-foreground hover:border-primary/50 hover:text-primary"
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <Play
                    className={`w-4 h-4 ${activeDemo === i ? "opacity-100" : "opacity-40"}`}
                  />
                  {note.label}
                </div>
              </button>
            ))}
          </div>
          {activeDemo !== null && (
            <div className="inline-flex items-center gap-4 bg-card border border-primary/30 rounded-2xl p-4">
              <span className="text-muted-foreground text-sm">
                Active fingering for
              </span>
              <span className="font-heading font-bold text-primary text-lg">
                {OCTAVE_NOTES[activeDemo]?.label}
              </span>
              <MiniHoleGrid
                holes={OCTAVE_NOTES[activeDemo]?.holes ?? []}
                active
              />
            </div>
          )}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-4 parchment-bg">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-heading text-4xl font-bold text-foreground mb-3">
              Everything You Need
            </h2>
            <p className="text-muted-foreground text-lg">
              A complete ocarina music studio in your browser
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-card border border-border rounded-2xl p-6 flex gap-4 card-glow transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-foreground mb-1">
                    {f.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Shop ── */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div
            className="relative rounded-3xl overflow-hidden mb-14 h-56 md:h-72"
            style={{
              backgroundImage:
                "url('/assets/generated/ocarina-product-hero.dim_800x600.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
            <div className="absolute bottom-0 left-0 p-8">
              <Badge className="bg-primary/20 text-primary border-primary/40 mb-3">
                🛒 Shop
              </Badge>
              <h2 className="font-heading text-4xl font-bold text-foreground">
                Shop Ocarinas
              </h2>
              <p className="text-muted-foreground mt-1">
                Purchase any ocarina and receive free app access
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {shopProducts.map(
              (product: (typeof DEFAULT_PRODUCTS)[0], i: number) => (
                <div
                  key={product.id}
                  data-ocid={`shop.product.${i + 1}`}
                  className="bg-card border border-border rounded-2xl overflow-hidden card-glow transition-all group"
                >
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-heading font-bold text-foreground text-lg">
                        {product.name}
                      </h3>
                      <span className="text-primary font-bold font-heading">
                        {product.priceLabel ||
                          `$${(product.price / 100).toFixed(0)} AUD`}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {product.description}
                    </p>
                    <div className="flex items-center gap-1 text-primary">
                      {Array.from({ length: 5 }).map((_, si) => (
                        <Star
                          key={`star-${si + 1}`}
                          className="w-3.5 h-3.5 fill-primary"
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-primary/70 bg-primary/5 rounded-lg px-3 py-2">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Free app access included
                    </div>
                    <Button
                      data-ocid={`shop.buy_button.${i + 1}`}
                      onClick={() => handleBuyProduct(product)}
                      disabled={checkout.isPending}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Buy & Get Access
                    </Button>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* ── Subscription CTA ── */}
      <section className="py-24 px-4 parchment-bg">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="font-heading text-4xl font-bold text-foreground">
            Ready to Start Playing?
          </h2>
          <p className="text-muted-foreground text-lg">
            Get instant access to the full OcarinaTab platform for a one-off
            payment. No recurring charges.
          </p>
          <div className="bg-card border border-border rounded-3xl p-8 space-y-4">
            <div className="flex items-center justify-center gap-3">
              <span className="font-heading text-5xl font-extrabold gold-text">
                $7
              </span>
              <div className="text-left">
                <p className="text-foreground font-semibold">AUD</p>
                <p className="text-muted-foreground text-sm">One-off payment</p>
              </div>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2 text-left max-w-xs mx-auto">
              {[
                "Full app access",
                "All folk songs",
                "MIDI import",
                "Custom sound upload",
                "Sheet music scanner",
                "Unlimited playback",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              size="lg"
              onClick={handleSubscribeCheckout}
              disabled={checkout.isPending}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-lg py-6 shadow-gold"
            >
              Get Access — $7 AUD
            </Button>
            <p className="text-xs text-muted-foreground">
              Or buy any ocarina to get free access included
            </p>
          </div>
        </div>
      </section>

      {/* ── Terms ── */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible>
            <AccordionItem value="terms" className="border-border">
              <AccordionTrigger className="text-muted-foreground hover:text-foreground font-heading">
                Terms & Conditions
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                <p>
                  <strong className="text-foreground">App Access:</strong> The
                  $7 AUD payment grants a one-off, lifetime access to the
                  OcarinaTab web application. No recurring billing. Access is
                  non-transferable and for personal use only.
                </p>
                <p>
                  <strong className="text-foreground">Refunds:</strong> Digital
                  access is non-refundable once granted. If you experience
                  technical issues, contact us for support.
                </p>
                <p>
                  <strong className="text-foreground">
                    Physical Ocarinas:
                  </strong>{" "}
                  Orders are processed and shipped within 7–14 business days.
                  Free app access code is delivered via email upon confirmed
                  payment. Physical items may be returned within 14 days if
                  unused and undamaged.
                </p>
                <p>
                  <strong className="text-foreground">Access Codes:</strong>{" "}
                  Each code is single-use. Codes distributed with physical
                  purchases are valid indefinitely. Do not share your code — we
                  cannot reissue codes that have been used by another party.
                </p>
                <p>
                  <strong className="text-foreground">Privacy:</strong> We do
                  not store personal payment information. Payments are processed
                  securely via Stripe. We collect minimal session data for
                  service delivery only.
                </p>
                <p>
                  <strong className="text-foreground">Governing Law:</strong>{" "}
                  These terms are governed by the laws of Australia.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>
            © {new Date().getFullYear()} OcarinaTab. All rights reserved.
          </span>
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Built with ❤️ using caffeine.ai
          </a>
        </div>
      </footer>

      {/* ── Sticky bottom bars (landing page only) ── */}
      <SongsBar />
      <OcarinaBar activeNotePitch={activeNotePitch} />
    </div>
  );
}
