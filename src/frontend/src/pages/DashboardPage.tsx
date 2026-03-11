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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import {
  BarChart3,
  CheckCircle,
  Edit2,
  Key,
  Loader2,
  Lock,
  Music,
  Music2,
  Plus,
  RefreshCw,
  Save,
  Settings,
  ShoppingBag,
  Trash2,
  XCircle,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { HoleConfig, ScaleMode } from "../backend";
import { useActor } from "../hooks/useActor";
import { useFingeringMap } from "../hooks/useFingeringMap";
import {
  useDeleteHolePreset,
  useGetHolePresets,
  useSaveHolePreset,
} from "../hooks/useQueries";
import { DIATONIC_NOTES } from "../utils/fingeringMap";

const ADMIN_HASH = "MTk5NjIwMjY="; // btoa('19962026')

const OCTAVE_OPTIONS: Array<{
  label: string;
  value: string;
  size: string;
  baseNote: string;
}> = [
  { label: "Low Bass", value: "C3", size: "Low Bass", baseNote: "C3" },
  { label: "Bass", value: "C4", size: "Bass", baseNote: "C4" },
  { label: "Alto (C5)", value: "C5", size: "Alto", baseNote: "C5" },
  { label: "Soprano", value: "C6", size: "Soprano", baseNote: "C6" },
];

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length: 8 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

const DEFAULT_PRODUCTS = [
  {
    id: "alto-c",
    name: "Alto C Ocarina",
    price: 4500,
    priceLabel: "$45 AUD",
    description: "Rich, warm mid-range tones. Perfect for beginners.",
    image: "/assets/generated/ocarina-alto-blue.dim_600x600.jpg",
  },
  {
    id: "soprano",
    name: "Soprano Ocarina",
    price: 3800,
    priceLabel: "$38 AUD",
    description: "Bright and clear. Hand-painted floral design.",
    image: "/assets/generated/ocarina-soprano-white.dim_600x600.jpg",
  },
  {
    id: "bass",
    name: "Bass Ocarina",
    price: 5500,
    priceLabel: "$55 AUD",
    description: "Deep resonant bass tones. Artisan clay craftsmanship.",
    image: "/assets/generated/ocarina-bass-brown.dim_600x600.jpg",
  },
];

// ─── Mini Hole Diagram ────────────────────────────────────────────────────────
function MiniHoleDiagram({
  holes,
  onToggle,
  editable = false,
  chromatic = false,
}: {
  holes: boolean[];
  onToggle?: (idx: number) => void;
  editable?: boolean;
  chromatic?: boolean;
}) {
  const count = chromatic ? 5 : 4;
  return (
    <div className="relative inline-flex flex-col gap-1">
      <div className="grid grid-cols-2 gap-1.5">
        {Array.from({ length: 4 }).map((_, idx) => (
          <button
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed length
            key={idx}
            type="button"
            onClick={() => editable && onToggle?.(idx)}
            className={`w-5 h-5 rounded-full border-2 transition-colors ${
              holes[idx]
                ? "bg-foreground border-foreground"
                : "bg-transparent border-foreground/40 hover:border-foreground/70"
            } ${editable ? "cursor-pointer" : "cursor-default"}`}
          />
        ))}
      </div>
      {chromatic && count === 5 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => editable && onToggle?.(4)}
            className={`w-3 h-3 rounded-full border-2 transition-colors ${
              holes[4]
                ? "bg-amber-400 border-amber-400"
                : "bg-transparent border-amber-400/40 hover:border-amber-400/70"
            } ${editable ? "cursor-pointer" : "cursor-default"}`}
          />
        </div>
      )}
    </div>
  );
}

// ─── Fingering Tab ────────────────────────────────────────────────────────────
function FingeringTab() {
  const {
    fingeringMap,
    toggleHole,
    resetToDefaults,
    saveToBackend,
    isDirty,
    isSaving,
    isLoadingFromBackend,
  } = useFingeringMap();

  const [chromaticMode, setChromaticMode] = useState(false);
  const [extraHoles, setExtraHoles] = useState<Record<string, boolean[]>>({});

  const notes = DIATONIC_NOTES as unknown as string[];
  const chromaticExtras = ["C#5", "D#5", "F#5", "G#5", "A#5"];
  const displayNotes = chromaticMode
    ? [
        "C5",
        "C#5",
        "D5",
        "D#5",
        "E5",
        "F5",
        "F#5",
        "G5",
        "G#5",
        "A5",
        "A#5",
        "B5",
        "C6",
      ]
    : notes;

  const getHoles = (note: string): boolean[] => {
    if (note in fingeringMap)
      return (fingeringMap as Record<string, boolean[]>)[note];
    if (note in extraHoles) return extraHoles[note];
    return [false, false, false, false];
  };

  const handleToggle = (note: string, idx: number) => {
    if (DIATONIC_NOTES.includes(note as (typeof DIATONIC_NOTES)[number])) {
      toggleHole(note, idx);
    } else {
      setExtraHoles((prev) => {
        const current = prev[note] ?? [false, false, false, false];
        const updated = [...current];
        updated[idx] = !updated[idx];
        return { ...prev, [note]: updated };
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">
            Fingering Map
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Click holes to toggle open/closed for each note.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-secondary rounded-full px-1 py-0.5 border border-border">
            <button
              type="button"
              onClick={() => setChromaticMode(false)}
              className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                !chromaticMode
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Diatonic
            </button>
            <button
              type="button"
              onClick={() => setChromaticMode(true)}
              className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                chromaticMode
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Chromatic
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefaults}
            className="border-border text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={saveToBackend}
            disabled={!isDirty || isSaving}
            className="bg-primary text-primary-foreground text-xs"
            data-ocid="fingering.save_button"
          >
            {isSaving ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <Save className="w-3 h-3 mr-1" />
            )}
            {isDirty ? "Save Changes" : "Saved"}
          </Button>
        </div>
      </div>

      {isLoadingFromBackend ? (
        <div
          className="flex items-center gap-2 text-muted-foreground"
          data-ocid="fingering.loading_state"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading fingering map...
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {displayNotes.map((note) => (
            <div
              key={note}
              className={`bg-card border rounded-xl p-3 space-y-2 ${
                chromaticExtras.includes(note)
                  ? "border-amber-500/30"
                  : "border-border"
              }`}
            >
              <p className="text-xs font-bold text-center text-foreground">
                {note}
              </p>
              <div className="flex justify-center">
                <MiniHoleDiagram
                  holes={getHoles(note)}
                  onToggle={(idx) => handleToggle(note, idx)}
                  editable
                  chromatic={chromaticMode}
                />
              </div>
              <p className="text-xs text-center text-muted-foreground">
                {getHoles(note)
                  .map((h, i) => (h ? ["TL", "TR", "BL", "BR", "●"][i] : null))
                  .filter(Boolean)
                  .join(" ")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Octave Tab ───────────────────────────────────────────────────────────────
function OctaveTab() {
  const [selectedOctave, setSelectedOctave] = useState(() => {
    return localStorage.getItem("ocarina_base_octave") ?? "C5";
  });

  const handleSave = () => {
    localStorage.setItem("ocarina_base_octave", selectedOctave);
    toast.success(`Base octave set to ${selectedOctave}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold text-foreground">
          Octave & Scale Settings
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Set the base octave for the ocarina. This determines the pitch range
          and matches the physical ocarina size.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {OCTAVE_OPTIONS.map((opt) => (
          <button
            type="button"
            key={opt.value}
            onClick={() => setSelectedOctave(opt.value)}
            className={`bg-card border rounded-2xl p-5 text-left transition-all hover:border-primary/60 ${
              selectedOctave === opt.value
                ? "border-primary bg-primary/5 shadow-[0_0_16px_oklch(0.75_0.15_85/0.15)]"
                : "border-border"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-heading text-lg font-bold text-foreground">
                {opt.label}
              </span>
              {selectedOctave === opt.value && (
                <CheckCircle className="w-5 h-5 text-primary" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Scale starting from{" "}
              <span className="text-primary font-semibold">{opt.baseNote}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Size: {opt.size}
            </p>
          </button>
        ))}
      </div>

      <Button
        onClick={handleSave}
        className="bg-primary text-primary-foreground hover:bg-primary/90"
        data-ocid="octave.save_button"
      >
        <Save className="w-4 h-4 mr-2" />
        Save Octave Setting
      </Button>

      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="font-semibold text-sm text-foreground">
          Note Range Reference
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Low Bass", range: "C3 – C4", color: "text-blue-400" },
            { label: "Bass", range: "C4 – C5", color: "text-green-400" },
            { label: "Alto", range: "C5 – C6", color: "text-primary" },
            { label: "Soprano", range: "C6 – C7", color: "text-red-400" },
          ].map((r) => (
            <div
              key={r.label}
              className="text-center p-2 bg-secondary/50 rounded-lg"
            >
              <p className={`font-bold text-sm ${r.color}`}>{r.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{r.range}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Hole Presets Tab ──────────────────────────────────────────────────────────
function HolePresetsTab() {
  const { data: presets = [], isLoading } = useGetHolePresets();
  const savePreset = useSaveHolePreset();
  const deletePreset = useDeleteHolePreset();
  const [saveOpen, setSaveOpen] = useState(false);
  const [presetName, setPresetName] = useState("");

  const ADMIN_PW = "19962026";

  const handleSave = async () => {
    if (!presetName.trim()) {
      toast.error("Enter a preset name");
      return;
    }
    const storedHoles = localStorage.getItem("ocarina_hole_configs");
    const storedScale = localStorage.getItem("ocarina_scale_mode");
    const storedOctave = localStorage.getItem("ocarina_base_octave");
    const octaveNum = storedOctave
      ? Number.parseInt(storedOctave.replace(/\D/g, ""), 10)
      : 5;

    let holeConfigs: HoleConfig[] = [];
    if (storedHoles) {
      try {
        const parsed = JSON.parse(storedHoles);
        holeConfigs = parsed.map(
          (h: {
            id: string;
            x: number;
            y: number;
            size: number;
            note: string;
          }) => ({
            id: h.id,
            x: BigInt(Math.round(h.x)),
            y: BigInt(Math.round(h.y)),
            size: BigInt(Math.round(h.size)),
            note: h.note,
          }),
        );
      } catch {
        holeConfigs = [];
      }
    }

    try {
      await savePreset.mutateAsync({
        preset: {
          name: presetName,
          holeConfigs,
          scaleMode:
            storedScale === "chromatic"
              ? ("chromatic" as ScaleMode)
              : ("diatonic" as ScaleMode),
          octave: BigInt(octaveNum),
        },
        password: ADMIN_PW,
      });
      toast.success(`Preset "${presetName}" saved`);
      setPresetName("");
      setSaveOpen(false);
    } catch {
      toast.error("Failed to save preset");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await deletePreset.mutateAsync({ id, password: ADMIN_PW });
      toast.success(`Preset "${name}" deleted`);
    } catch {
      toast.error("Failed to delete preset");
    }
  };

  const handleLoad = useCallback((preset: (typeof presets)[number]) => {
    const holes = preset.holeConfigs.map((h) => ({
      id: h.id,
      x: Number(h.x),
      y: Number(h.y),
      size: Number(h.size),
      note: h.note,
    }));
    localStorage.setItem("ocarina_hole_configs", JSON.stringify(holes));
    localStorage.setItem("ocarina_scale_mode", preset.scaleMode);
    localStorage.setItem("ocarina_base_octave", `C${Number(preset.octave)}`);
    toast.success(`Preset "${preset.name}" loaded. Refresh the app to apply.`);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">
            Hole Presets
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Save and restore hole position/note configurations.
          </p>
        </div>
        <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-ocid="presets.open_modal_button"
            >
              <Plus className="w-4 h-4 mr-2" />
              Save Current
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-heading text-foreground">
                Save Hole Preset
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground">Preset Name</Label>
                <Input
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="e.g. Alto C Chromatic"
                  className="bg-secondary border-border"
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  data-ocid="presets.input"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Saves the current hole positions, sizes, note assignments, scale
                mode, and octave from localStorage.
              </p>
              <Button
                onClick={handleSave}
                disabled={savePreset.isPending || !presetName.trim()}
                className="w-full bg-primary text-primary-foreground"
                data-ocid="presets.submit_button"
              >
                {savePreset.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Preset
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div
          className="flex items-center gap-2 text-muted-foreground"
          data-ocid="presets.loading_state"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading presets...
        </div>
      ) : presets.length === 0 ? (
        <div
          className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl"
          data-ocid="presets.empty_state"
        >
          No presets saved yet. Configure holes in the ocarina view, then save
          them here.
        </div>
      ) : (
        <div className="space-y-3">
          {presets.map((preset, i) => (
            <div
              key={preset.id}
              data-ocid={`presets.item.${i + 1}`}
              className="bg-card border border-border rounded-xl p-4 flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">{preset.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {String(preset.scaleMode)} · Octave C{String(preset.octave)} ·{" "}
                  {preset.holeConfigs.length} holes
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLoad(preset)}
                  className="border-primary/40 text-primary hover:bg-primary/10"
                  data-ocid={`presets.secondary_button.${i + 1}`}
                >
                  Load
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(preset.id, preset.name)}
                  disabled={deletePreset.isPending}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  data-ocid={`presets.delete_button.${i + 1}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Stripe Tab ───────────────────────────────────────────────────────────────
function StripeTab() {
  const { actor } = useActor();
  const [secretKey, setSecretKey] = useState("");
  const [countries, setCountries] = useState("AU,US,GB,NZ");
  const [configured, setConfigured] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      const countryArray = countries
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      await (actor as any).setStripeConfiguration(
        {
          secretKey,
          allowedCountries: countryArray,
        },
        "19962026",
      );
    },
    onSuccess: () => {
      toast.success("Stripe configuration saved");
      setConfigured(true);
    },
    onError: () => toast.error("Failed to save Stripe config"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="font-heading text-xl font-bold text-foreground">
          Stripe Configuration
        </h2>
        <Badge
          className={
            configured
              ? "bg-green-500/20 text-green-400 border-green-500/40"
              : "bg-yellow-500/20 text-yellow-400 border-yellow-500/40"
          }
        >
          {configured ? "Configured" : "Not Configured"}
        </Badge>
      </div>
      {configured ? (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-green-300">
            Stripe is configured and active.
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfigured(false)}
            className="ml-auto border-border"
          >
            Reconfigure
          </Button>
        </div>
      ) : (
        <div className="space-y-4 bg-card border border-border rounded-xl p-6">
          <div className="space-y-2">
            <Label className="text-foreground">Stripe Secret Key</Label>
            <Input
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="sk_live_..."
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">
              Allowed Countries (comma-separated)
            </Label>
            <Input
              value={countries}
              onChange={(e) => setCountries(e.target.value)}
              placeholder="AU,US,GB,NZ"
              className="bg-secondary border-border"
            />
          </div>
          <Button
            data-ocid="dashboard.stripe_save_button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !secretKey}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {saveMutation.isPending ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Save Stripe Configuration
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Subscription Tab ─────────────────────────────────────────────────────────
function SubscriptionTab() {
  const [planName, setPlanName] = useState("OcarinaTab Full Access");
  const [price, setPrice] = useState("7");
  const [description, setDescription] = useState(
    "One-off lifetime access to the OcarinaTab platform.",
  );

  useEffect(() => {
    try {
      const stored = localStorage.getItem("ocarina_plan_config");
      if (stored) {
        const cfg = JSON.parse(stored);
        if (cfg.planName) setPlanName(cfg.planName);
        if (cfg.price) setPrice(cfg.price);
        if (cfg.description) setDescription(cfg.description);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const save = () => {
    localStorage.setItem(
      "ocarina_plan_config",
      JSON.stringify({ planName, price, description }),
    );
    toast.success("Plan configuration saved");
  };

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-bold text-foreground">
        Subscription Plan
      </h2>
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="space-y-2">
          <Label className="text-foreground">Plan Name</Label>
          <Input
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            className="bg-secondary border-border"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">Price (AUD)</Label>
          <Input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="bg-secondary border-border"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-secondary border-border resize-none"
            rows={3}
          />
        </div>
        <Button
          onClick={save}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Save Plan Config
        </Button>
      </div>
    </div>
  );
}

// ─── Access Codes Tab ─────────────────────────────────────────────────────────
function AccessCodesTab() {
  const [codes, setCodes] = useState<string[]>([]);
  const [usedCodes, setUsedCodes] = useState<string[]>([]);

  useEffect(() => {
    const c = localStorage.getItem("ocarina_access_codes");
    const u = localStorage.getItem("ocarina_used_codes");
    if (c) setCodes(JSON.parse(c));
    if (u) setUsedCodes(JSON.parse(u));
  }, []);

  const saveCodes = (newCodes: string[]) => {
    setCodes(newCodes);
    localStorage.setItem("ocarina_access_codes", JSON.stringify(newCodes));
  };

  const generateNew = () => {
    const code = generateCode();
    const updated = [...codes, code];
    saveCodes(updated);
    toast.success(`Code generated: ${code}`);
  };

  const revokeCode = (code: string) => {
    saveCodes(codes.filter((c) => c !== code));
    toast.success("Code revoked");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-foreground">
          Access Codes
        </h2>
        <Button
          data-ocid="codes.generate_button"
          onClick={generateNew}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Generate Code
        </Button>
      </div>
      {codes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
          No codes generated yet.
        </div>
      ) : (
        <div data-ocid="codes.table">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Code</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.map((code, i) => (
                <TableRow
                  key={code}
                  className="border-border hover:bg-secondary/30"
                >
                  <TableCell className="font-mono text-foreground font-semibold tracking-wider">
                    {code}
                  </TableCell>
                  <TableCell>
                    {usedCodes.includes(code) ? (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/40">
                        Used
                      </Badge>
                    ) : (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/40">
                        Available
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      data-ocid={`codes.delete_button.${i + 1}`}
                      onClick={() => revokeCode(code)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ─── Shop Products Tab ────────────────────────────────────────────────────────
function ShopTab() {
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
  });

  useEffect(() => {
    const stored = localStorage.getItem("ocarina_shop_products");
    if (stored) {
      try {
        setProducts(JSON.parse(stored));
      } catch {
        /* ignore */
      }
    } else {
      localStorage.setItem(
        "ocarina_shop_products",
        JSON.stringify(DEFAULT_PRODUCTS),
      );
    }
  }, []);

  const saveProducts = (updated: typeof products) => {
    setProducts(updated);
    localStorage.setItem("ocarina_shop_products", JSON.stringify(updated));
  };

  const addProduct = () => {
    const p = {
      id: `product-${Date.now()}`,
      name: form.name,
      description: form.description,
      price: Number.parseInt(form.price) * 100,
      priceLabel: `$${form.price} AUD`,
      image: form.image,
    };
    saveProducts([...products, p]);
    setForm({ name: "", description: "", price: "", image: "" });
    setAddOpen(false);
    toast.success("Product added");
  };

  const deleteProduct = (id: string) => {
    saveProducts(products.filter((p) => p.id !== id));
    toast.success("Product removed");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-foreground">
          Shop Products
        </h2>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button
              data-ocid="shop.add_button"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-heading text-foreground">
                Add Product
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground">Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="bg-secondary border-border resize-none"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">
                  Price (AUD, whole number)
                </Label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Image URL</Label>
                <Input
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  placeholder="/assets/generated/..."
                  className="bg-secondary border-border"
                />
              </div>
              <Button
                onClick={addProduct}
                disabled={!form.name || !form.price}
                className="w-full bg-primary text-primary-foreground"
              >
                Add Product
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-3">
        {products.map((product, i) => (
          <div
            key={product.id}
            data-ocid={`shop.item.${i + 1}`}
            className="bg-card border border-border rounded-xl p-4 flex items-center gap-4"
          >
            <img
              src={product.image}
              alt={product.name}
              className="w-14 h-14 object-cover rounded-lg bg-muted"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">
                {product.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {product.priceLabel ||
                  `$${(product.price / 100).toFixed(0)} AUD`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                data-ocid={`shop.edit_button.${i + 1}`}
                className="text-muted-foreground hover:text-foreground"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                data-ocid={`shop.delete_button.${i + 1}`}
                onClick={() => deleteProduct(product.id)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stats Tab ────────────────────────────────────────────────────────────────
function StatsTab() {
  const codes = JSON.parse(
    localStorage.getItem("ocarina_access_codes") || "[]",
  ) as string[];
  const used = JSON.parse(
    localStorage.getItem("ocarina_used_codes") || "[]",
  ) as string[];
  const stripeUnlocks = Number.parseInt(
    localStorage.getItem("ocarina_stripe_unlocks") || "0",
    10,
  );

  const stats = [
    { label: "Total Codes Generated", value: codes.length, icon: Key },
    { label: "Codes Redeemed", value: used.length, icon: CheckCircle },
    { label: "Codes Available", value: codes.length - used.length, icon: Lock },
    { label: "App Unlocks via Stripe", value: stripeUnlocks, icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-bold text-foreground">
        Platform Stats
      </h2>
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-card border border-border rounded-xl p-5 space-y-3"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <stat.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-heading text-3xl font-bold text-foreground">
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main dashboard page ──────────────────────────────────────────────────────
export function DashboardPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem("dash_auth") === ADMIN_HASH,
  );
  const [error, setError] = useState("");

  const handleAuth = () => {
    if (btoa(password) === ADMIN_HASH) {
      sessionStorage.setItem("dash_auth", ADMIN_HASH);
      setAuthed(true);
    } else {
      setError("Incorrect password");
    }
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-card border border-border rounded-3xl p-8 space-y-6">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-foreground">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Enter your admin password to continue
            </p>
          </div>
          <div className="space-y-3">
            <Input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="Admin password"
              className="bg-secondary border-border"
              onKeyDown={(e) => e.key === "Enter" && handleAuth()}
              data-ocid="dashboard.input"
            />
            {error && (
              <p
                className="text-destructive text-sm"
                data-ocid="dashboard.error_state"
              >
                {error}
              </p>
            )}
            <Button
              onClick={handleAuth}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              data-ocid="dashboard.submit_button"
            >
              Unlock Dashboard
            </Button>
          </div>
          <div className="text-center">
            <a
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground"
              data-ocid="dashboard.link"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
              ♪
            </div>
            <div>
              <span className="font-heading font-bold text-foreground">
                OcarinaTab
              </span>
              <span className="text-muted-foreground text-sm ml-2">
                Admin Dashboard
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <a
              href="/app"
              className="text-sm text-muted-foreground hover:text-foreground"
              data-ocid="dashboard.app_link"
            >
              ← App
            </a>
            <a
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground"
              data-ocid="dashboard.home_link"
            >
              ← Home
            </a>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                sessionStorage.removeItem("dash_auth");
                setAuthed(false);
              }}
              className="text-muted-foreground hover:text-foreground"
              data-ocid="dashboard.secondary_button"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <Tabs defaultValue="fingering">
          <TabsList
            className="bg-card border border-border mb-8 flex-wrap h-auto gap-1 p-1"
            data-ocid="dashboard.tab"
          >
            <TabsTrigger
              value="fingering"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Music2 className="w-4 h-4 mr-1.5" />
              Fingering
            </TabsTrigger>
            <TabsTrigger
              value="octave"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Music className="w-4 h-4 mr-1.5" />
              Octave
            </TabsTrigger>
            <TabsTrigger
              value="holepresets"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Settings className="w-4 h-4 mr-1.5" />
              Hole Presets
            </TabsTrigger>
            <TabsTrigger
              value="stripe"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Settings className="w-4 h-4 mr-1.5" />
              Stripe
            </TabsTrigger>
            <TabsTrigger
              value="subscription"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <BarChart3 className="w-4 h-4 mr-1.5" />
              Subscription
            </TabsTrigger>
            <TabsTrigger
              value="codes"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Key className="w-4 h-4 mr-1.5" />
              Access Codes
            </TabsTrigger>
            <TabsTrigger
              value="shop"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <ShoppingBag className="w-4 h-4 mr-1.5" />
              Shop
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <BarChart3 className="w-4 h-4 mr-1.5" />
              Stats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fingering">
            <FingeringTab />
          </TabsContent>
          <TabsContent value="octave">
            <OctaveTab />
          </TabsContent>
          <TabsContent value="holepresets">
            <HolePresetsTab />
          </TabsContent>
          <TabsContent value="stripe">
            <StripeTab />
          </TabsContent>
          <TabsContent value="subscription">
            <SubscriptionTab />
          </TabsContent>
          <TabsContent value="codes">
            <AccessCodesTab />
          </TabsContent>
          <TabsContent value="shop">
            <ShopTab />
          </TabsContent>
          <TabsContent value="stats">
            <StatsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
