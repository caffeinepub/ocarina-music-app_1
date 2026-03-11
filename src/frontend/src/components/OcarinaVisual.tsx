import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Lock, LockOpen, Save, Upload, X } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useOcarinaSound } from "../hooks/useOcarinaSound";

export interface HoleConfigLocal {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  size: number; // percentage 0-100
  note: string;
}

export type ScaleModeLocal = "diatonic" | "chromatic";

interface OcarinaVisualProps {
  currentNote?: string;
  fingeringMap?: Record<string, boolean[]>;
  className?: string;
  style?: React.CSSProperties;
  externalImageUrl?: string;
  onHolePlay?: (note: string) => void;
  customSamples?: Record<string, string>;
  initialScaleMode?: ScaleModeLocal;
  initialHoleConfigs?: HoleConfigLocal[];
  onHoleConfigsChange?: (
    configs: HoleConfigLocal[],
    scaleMode: ScaleModeLocal,
  ) => void;
}

const DEFAULT_DIATONIC_HOLES: HoleConfigLocal[] = [
  { id: "tl", x: 35, y: 30, size: 18, note: "C5" },
  { id: "tr", x: 65, y: 30, size: 18, note: "D5" },
  { id: "bl", x: 35, y: 65, size: 18, note: "E5" },
  { id: "br", x: 65, y: 65, size: 18, note: "G5" },
];

const CHROMATIC_EXTRA: HoleConfigLocal = {
  id: "extra",
  x: 75,
  y: 82,
  size: 11,
  note: "F#5",
};

const ALL_NOTES = [
  "C3",
  "D3",
  "E3",
  "F3",
  "F#3",
  "G3",
  "A3",
  "B3",
  "C4",
  "D4",
  "E4",
  "F4",
  "F#4",
  "G4",
  "A4",
  "B4",
  "C5",
  "D5",
  "E5",
  "F5",
  "F#5",
  "G5",
  "A5",
  "B5",
  "C6",
  "D6",
  "E6",
  "F6",
  "F#6",
  "G6",
];

const ADMIN_HASH = "MTk5NjIwMjY="; // btoa('19962026')

const LS_KEY_HOLES = "ocarina_hole_configs";
const LS_KEY_SCALE = "ocarina_scale_mode";

function loadFromStorage(): {
  holes: HoleConfigLocal[] | null;
  scale: ScaleModeLocal | null;
} {
  try {
    const h = localStorage.getItem(LS_KEY_HOLES);
    const s = localStorage.getItem(LS_KEY_SCALE);
    return {
      holes: h ? (JSON.parse(h) as HoleConfigLocal[]) : null,
      scale:
        s === "chromatic" ? "chromatic" : s === "diatonic" ? "diatonic" : null,
    };
  } catch {
    return { holes: null, scale: null };
  }
}

export default function OcarinaVisual({
  currentNote,
  fingeringMap,
  className = "",
  style,
  externalImageUrl,
  onHolePlay,
  customSamples = {},
  initialScaleMode,
  initialHoleConfigs,
  onHoleConfigsChange,
}: OcarinaVisualProps) {
  const stored = loadFromStorage();

  const [scaleMode, setScaleMode] = useState<ScaleModeLocal>(
    initialScaleMode ?? stored.scale ?? "diatonic",
  );

  const [diatonicHoles, setDiatonicHoles] = useState<HoleConfigLocal[]>(
    initialHoleConfigs ?? stored.holes ?? DEFAULT_DIATONIC_HOLES,
  );

  const [chromaticHoles, setChromaticHoles] = useState<HoleConfigLocal[]>(
    () => {
      const base = initialHoleConfigs ?? stored.holes ?? DEFAULT_DIATONIC_HOLES;
      const hasExtra = base.find((h) => h.id === "extra");
      return hasExtra ? base : [...base.slice(0, 4), CHROMATIC_EXTRA];
    },
  );

  const activeHoles = scaleMode === "diatonic" ? diatonicHoles : chromaticHoles;

  const setActiveHoles = useCallback(
    (updater: (prev: HoleConfigLocal[]) => HoleConfigLocal[]) => {
      if (scaleMode === "diatonic") {
        setDiatonicHoles(updater);
      } else {
        setChromaticHoles(updater);
      }
    },
    [scaleMode],
  );

  // Admin mode
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Drag & resize
  const [draggingHole, setDraggingHole] = useState<number | null>(null);
  const [resizingHole, setResizingHole] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Image
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Active hole flash
  const [activeHoleId, setActiveHoleId] = useState<string | null>(null);

  const { playNote } = useOcarinaSound();

  const displayImageUrl = customImageUrl ?? externalImageUrl ?? null;

  const getHoleClosed = useCallback(
    (idx: number): boolean => {
      if (!currentNote) return false;
      const fm = fingeringMap ?? {};
      const fingering = fm[currentNote];
      if (fingering && fingering[idx] !== undefined) return fingering[idx];
      return false;
    },
    [currentNote, fingeringMap],
  );

  const handleHoleClick = useCallback(
    (hole: HoleConfigLocal) => {
      if (isAdminMode) return;
      const sampleUrl = customSamples[hole.note];
      playNote(hole.note, sampleUrl);
      setActiveHoleId(hole.id);
      setTimeout(() => setActiveHoleId(null), 350);
      onHolePlay?.(hole.note);
    },
    [isAdminMode, customSamples, playNote, onHolePlay],
  );

  const handleAdminUnlock = useCallback(() => {
    if (btoa(passwordInput) === ADMIN_HASH) {
      setIsAdminMode(true);
      setShowPasswordPrompt(false);
      setPasswordInput("");
      setPasswordError("");
      toast.success("Admin mode enabled");
    } else {
      setPasswordError("Incorrect password");
    }
  }, [passwordInput]);

  const handleScaleModeToggle = useCallback((mode: ScaleModeLocal) => {
    setScaleMode(mode);
    localStorage.setItem(LS_KEY_SCALE, mode);
  }, []);

  const handleNoteChange = useCallback(
    (holeIndex: number, note: string) => {
      setActiveHoles((prev) =>
        prev.map((h, i) => (i === holeIndex ? { ...h, note } : h)),
      );
    },
    [setActiveHoles],
  );

  const handleSaveConfig = useCallback(() => {
    const holes = scaleMode === "diatonic" ? diatonicHoles : chromaticHoles;
    localStorage.setItem(LS_KEY_HOLES, JSON.stringify(holes));
    localStorage.setItem(LS_KEY_SCALE, scaleMode);
    onHoleConfigsChange?.(holes, scaleMode);
    toast.success("Hole configuration saved");
  }, [diatonicHoles, chromaticHoles, scaleMode, onHoleConfigsChange]);

  const handlePointerDownHole = useCallback(
    (e: React.PointerEvent, index: number) => {
      if (!isAdminMode) return;
      e.preventDefault();
      e.stopPropagation();
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const xPct = ((e.clientX - rect.left) / rect.width) * 100;
      const yPct = ((e.clientY - rect.top) / rect.height) * 100;
      setDraggingHole(index);
      setDragOffset({
        x: xPct - activeHoles[index].x,
        y: yPct - activeHoles[index].y,
      });
      (e.target as Element).setPointerCapture(e.pointerId);
    },
    [isAdminMode, activeHoles],
  );

  const handlePointerMoveHole = useCallback(
    (e: React.PointerEvent, index: number) => {
      if (!isAdminMode) return;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();

      if (draggingHole === index) {
        const xPct = ((e.clientX - rect.left) / rect.width) * 100;
        const yPct = ((e.clientY - rect.top) / rect.height) * 100;
        setActiveHoles((prev) =>
          prev.map((h, i) =>
            i === index
              ? {
                  ...h,
                  x: Math.max(5, Math.min(95, xPct - dragOffset.x)),
                  y: Math.max(5, Math.min(95, yPct - dragOffset.y)),
                }
              : h,
          ),
        );
      }

      if (resizingHole === index) {
        const hole = activeHoles[index];
        const centerX = (hole.x / 100) * rect.width + rect.left;
        const centerY = (hole.y / 100) * rect.height + rect.top;
        const dist = Math.sqrt(
          (e.clientX - centerX) ** 2 + (e.clientY - centerY) ** 2,
        );
        const sizePct = (dist / rect.width) * 100 * 2.2;
        setActiveHoles((prev) =>
          prev.map((h, i) =>
            i === index
              ? { ...h, size: Math.max(4, Math.min(32, sizePct)) }
              : h,
          ),
        );
      }
    },
    [
      isAdminMode,
      draggingHole,
      resizingHole,
      dragOffset,
      activeHoles,
      setActiveHoles,
    ],
  );

  const handlePointerUpHole = useCallback((e: React.PointerEvent) => {
    (e.target as Element).releasePointerCapture(e.pointerId);
    setDraggingHole(null);
    setResizingHole(null);
  }, []);

  const handleContextMenuHole = useCallback(
    (e: React.MouseEvent, index: number) => {
      if (!isAdminMode) return;
      e.preventDefault();
      setResizingHole(index);
    },
    [isAdminMode],
  );

  const handleFileUpload = (file: File) => {
    if (file?.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setCustomImageUrl(url);
    }
  };

  useEffect(() => {
    return () => {
      if (customImageUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(customImageUrl);
      }
    };
  }, [customImageUrl]);

  const renderHoleLabel = (hole: HoleConfigLocal, idx: number) => {
    if (!isAdminMode) return null;
    return (
      // biome-ignore lint/a11y/useKeyWithClickEvents: container only intercepts stopPropagation, children are keyboard-accessible
      <div
        className="absolute"
        style={{
          left: `${hole.x}%`,
          top: `${hole.y + hole.size / 2 + 2}%`,
          transform: "translateX(-50%)",
          zIndex: 20,
          pointerEvents: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Select
          value={hole.note}
          onValueChange={(val) => handleNoteChange(idx, val)}
        >
          <SelectTrigger className="h-5 text-xs px-1 py-0 bg-black/80 border-amber-500/60 text-amber-300 w-16">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border max-h-40">
            {ALL_NOTES.map((n) => (
              <SelectItem key={n} value={n} className="text-xs">
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  const renderHole = (hole: HoleConfigLocal, idx: number) => {
    const isClosed = getHoleClosed(idx);
    const isActive = activeHoleId === hole.id;
    const isChromatic = hole.id === "extra";

    return (
      <div key={hole.id}>
        <div
          role="button"
          tabIndex={0}
          aria-label={`Hole ${idx + 1} — ${hole.note}${
            isClosed ? " (closed)" : " (open)"
          }`}
          data-ocid={`ocarina.hole.${idx + 1}`}
          className={`absolute rounded-full border-2 transition-all duration-100 select-none
            ${
              isAdminMode
                ? "cursor-move border-amber-400 bg-amber-400/10 hover:bg-amber-400/20"
                : isClosed
                  ? "cursor-pointer bg-foreground border-foreground shadow-inner scale-95"
                  : isActive
                    ? "cursor-pointer bg-primary/60 border-primary shadow-[0_0_12px_oklch(0.75_0.15_85/0.8)]"
                    : "cursor-pointer bg-transparent border-foreground/60 hover:border-primary hover:bg-primary/10 hover:scale-110"
            }
            ${isChromatic ? "ring-1 ring-amber-500/40" : ""}
          `}
          style={{
            left: `${hole.x}%`,
            top: `${hole.y}%`,
            width: `${hole.size}%`,
            height: `${hole.size}%`,
            aspectRatio: "1",
            transform: "translate(-50%, -50%)",
            touchAction: "none",
          }}
          onPointerDown={(e) => {
            if (isAdminMode) {
              handlePointerDownHole(e, idx);
            } else if (e.pointerType === "touch") {
              e.preventDefault();
              handleHoleClick(hole);
            }
          }}
          onPointerMove={(e) => handlePointerMoveHole(e, idx)}
          onPointerUp={handlePointerUpHole}
          onContextMenu={(e) => handleContextMenuHole(e, idx)}
          onClick={() => {
            if (!isAdminMode) handleHoleClick(hole);
          }}
          onKeyDown={(e) => {
            if (!isAdminMode && (e.key === "Enter" || e.key === " "))
              handleHoleClick(hole);
          }}
        />
        {renderHoleLabel(hole, idx)}
      </div>
    );
  };

  const scaleToggle = (
    <div className="flex items-center gap-1 bg-black/40 border border-border rounded-full px-1 py-0.5">
      <button
        type="button"
        onClick={() => handleScaleModeToggle("diatonic")}
        className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
          scaleMode === "diatonic"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Diatonic
      </button>
      <button
        type="button"
        onClick={() => handleScaleModeToggle("chromatic")}
        className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
          scaleMode === "chromatic"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Chromatic ●
      </button>
    </div>
  );

  const adminControls = (
    <div className="flex items-center gap-2">
      {isAdminMode ? (
        <>
          <button
            type="button"
            onClick={handleSaveConfig}
            className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
          >
            <Save className="w-3 h-3" />
            Save
          </button>
          <button
            type="button"
            onClick={() => setIsAdminMode(false)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Lock className="w-3 h-3" />
            Lock
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setShowPasswordPrompt(true)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-amber-400 transition-colors"
          title="Admin mode"
        >
          <LockOpen className="w-3 h-3" />
        </button>
      )}
    </div>
  );

  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleFileUpload(file);
      }}
    />
  );

  const passwordPromptEl = showPasswordPrompt ? (
    <PasswordPrompt
      value={passwordInput}
      onChange={(v) => {
        setPasswordInput(v);
        setPasswordError("");
      }}
      onSubmit={handleAdminUnlock}
      onCancel={() => {
        setShowPasswordPrompt(false);
        setPasswordInput("");
        setPasswordError("");
      }}
      error={passwordError}
    />
  ) : null;

  if (displayImageUrl) {
    return (
      <div className={`space-y-2 ${className}`} style={style}>
        <div className="flex items-center justify-between">
          {scaleToggle}
          <div className="flex items-center gap-2">
            {isAdminMode && (
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-3 h-3" />
                Change image
              </button>
            )}
            {adminControls}
          </div>
        </div>

        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-xl"
          style={{ minHeight: 240 }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingFile(true);
          }}
          onDragLeave={() => setIsDraggingFile(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingFile(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFileUpload(file);
          }}
        >
          <img
            src={displayImageUrl}
            alt="Ocarina"
            className="w-full h-full object-contain"
            draggable={false}
          />
          {activeHoles.map((hole, idx) => renderHole(hole, idx))}
          {customImageUrl && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-background/80 hover:bg-background"
              onClick={() => setCustomImageUrl(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          {isDraggingFile && (
            <div className="absolute inset-0 bg-primary/20 border-2 border-dashed border-primary rounded-xl flex items-center justify-center">
              <p className="text-primary font-medium">Drop image here</p>
            </div>
          )}
        </div>
        {passwordPromptEl}
        {fileInput}
      </div>
    );
  }

  // Plain floating-holes view
  return (
    <div className={`space-y-2 ${className}`} style={style}>
      <div className="flex items-center justify-between">
        {scaleToggle}
        <div className="flex items-center gap-2">
          {isAdminMode && (
            <button
              type="button"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-3 h-3" />
              Add image
            </button>
          )}
          {adminControls}
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative"
        style={{ height: 200 }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingFile(true);
        }}
        onDragLeave={() => setIsDraggingFile(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDraggingFile(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFileUpload(file);
        }}
      >
        {activeHoles.map((hole, idx) => renderHole(hole, idx))}
        {isDraggingFile && (
          <div className="absolute inset-0 bg-primary/20 border-2 border-dashed border-primary rounded-xl flex items-center justify-center">
            <p className="text-primary font-medium">Drop image here</p>
          </div>
        )}
        {isAdminMode && (
          <p className="absolute bottom-1 left-0 right-0 text-center text-xs text-amber-500/60">
            Drag holes to reposition • Right-click drag to resize
          </p>
        )}
      </div>
      {passwordPromptEl}
      {fileInput}
    </div>
  );
}

// ─── Password Prompt ──────────────────────────────────────────────────────────
function PasswordPrompt({
  value,
  onChange,
  onSubmit,
  onCancel,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  error: string;
}) {
  return (
    <div className="bg-card border border-amber-500/30 rounded-xl p-4 space-y-3">
      <Label className="text-amber-400 text-sm font-semibold">
        🔐 Admin Password
      </Label>
      <div className="flex gap-2">
        <Input
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter admin password"
          className="bg-secondary border-border text-sm"
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          // biome-ignore lint/a11y/noAutofocus: intentional focus for password dialog
          autoFocus
        />
        <Button
          size="sm"
          onClick={onSubmit}
          className="bg-primary text-primary-foreground"
        >
          Unlock
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
