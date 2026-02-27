import React, { useState, useRef } from "react";
import { OcarinaProfile, SizePreset, ExternalBlob } from "../backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { CreatorPasswordDialog } from "./CreatorPasswordDialog";
import { SIZE_PRESET_INFO } from "./OcarinaProfileCard";
import { Upload, X, ImageIcon } from "lucide-react";
import { useCreateOcarinaProfile, useBulkCreateOcarinaProfiles, useUpdateOcarinaProfile } from "../hooks/useQueries";
import { toast } from "sonner";

interface OcarinaProfileFormProps {
  open: boolean;
  onClose: () => void;
  editingProfile?: OcarinaProfile | null;
}

const SIZE_OPTIONS: { value: SizePreset; label: string; scale: string }[] = [
  { value: SizePreset.lowBass, label: "Low Bass", scale: "C3" },
  { value: SizePreset.bass, label: "Bass", scale: "C4" },
  { value: SizePreset.alto, label: "Alto", scale: "C5" },
  { value: SizePreset.soprano, label: "Soprano", scale: "C6" },
];

function generateId(): string {
  return `ocarina-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function OcarinaProfileForm({ open, onClose, editingProfile }: OcarinaProfileFormProps) {
  const [name, setName] = useState(editingProfile?.name ?? "");
  const [description, setDescription] = useState(editingProfile?.description ?? "");
  const [category, setCategory] = useState(editingProfile?.category ?? "");
  const [shape, setShape] = useState(editingProfile?.shape ?? "");
  const [size, setSize] = useState<SizePreset>(editingProfile?.size ?? SizePreset.alto);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingProgress, setSavingProgress] = useState<{ current: number; total: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createMutation = useCreateOcarinaProfile();
  const bulkCreateMutation = useBulkCreateOcarinaProfiles();
  const updateMutation = useUpdateOcarinaProfile();

  const isEditing = !!editingProfile;
  const isLoading = createMutation.isPending || bulkCreateMutation.isPending || updateMutation.isPending;

  // Reset form when dialog opens/closes or editingProfile changes
  React.useEffect(() => {
    if (open) {
      setName(editingProfile?.name ?? "");
      setDescription(editingProfile?.description ?? "");
      setCategory(editingProfile?.category ?? "");
      setShape(editingProfile?.shape ?? "");
      setSize(editingProfile?.size ?? SizePreset.alto);
      setSelectedFiles([]);
      setPreviews([]);
      setPasswordError(null);
      setSavingProgress(null);
    }
  }, [open, editingProfile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setSelectedFiles(files);
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmitClick = () => {
    if (!isEditing && selectedFiles.length === 0) {
      toast.error("Please select at least one image.");
      return;
    }
    if (!name.trim()) {
      toast.error("Please enter a name.");
      return;
    }
    setPasswordDialogOpen(true);
  };

  const handlePasswordConfirm = async (encodedPassword: string) => {
    setPasswordError(null);

    const profileData = {
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      shape: shape.trim(),
      size,
    };

    try {
      if (isEditing) {
        // Update existing profile
        let imageBlob: ExternalBlob | null = null;
        if (selectedFiles.length > 0) {
          const bytes = new Uint8Array(await selectedFiles[0].arrayBuffer());
          imageBlob = ExternalBlob.fromBytes(bytes);
        }
        await updateMutation.mutateAsync({
          id: editingProfile!.id,
          updatedProfile: profileData,
          image: imageBlob,
          password: encodedPassword,
        });
        toast.success("Ocarina profile updated!");
        setPasswordDialogOpen(false);
        onClose();
      } else if (selectedFiles.length === 1) {
        // Single create
        const bytes = new Uint8Array(await selectedFiles[0].arrayBuffer());
        const imageBlob = ExternalBlob.fromBytes(bytes);
        await createMutation.mutateAsync({
          id: generateId(),
          profileData,
          image: imageBlob,
          password: encodedPassword,
        });
        toast.success("Ocarina profile created!");
        setPasswordDialogOpen(false);
        onClose();
      } else {
        // Bulk create
        setSavingProgress({ current: 0, total: selectedFiles.length });
        const entries: Array<[string, typeof profileData, ExternalBlob]> = [];

        for (let i = 0; i < selectedFiles.length; i++) {
          setSavingProgress({ current: i + 1, total: selectedFiles.length });
          const bytes = new Uint8Array(await selectedFiles[i].arrayBuffer());
          const imageBlob = ExternalBlob.fromBytes(bytes);
          const entryName = selectedFiles.length > 1 ? `${profileData.name} ${i + 1}` : profileData.name;
          entries.push([generateId(), { ...profileData, name: entryName }, imageBlob]);
        }

        await bulkCreateMutation.mutateAsync({ entries, password: encodedPassword });
        toast.success(`${selectedFiles.length} ocarina profiles created!`);
        setSavingProgress(null);
        setPasswordDialogOpen(false);
        onClose();
      }
    } catch (err: any) {
      setSavingProgress(null);
      const msg = err?.message ?? String(err);
      if (msg.toLowerCase().includes("password") || msg.toLowerCase().includes("invalid")) {
        setPasswordError("Incorrect password. Please try again.");
      } else {
        setPasswordError(msg || "An error occurred. Please try again.");
        toast.error(msg || "Failed to save profile.");
      }
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && !isLoading && onClose()}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Ocarina Profile" : "Upload Ocarina Profile"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the details for this ocarina profile."
                : "Upload one or more ocarina images to create profiles. Multiple images share the same settings but become independent profiles."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>
                {isEditing ? "Replace Image (optional)" : "Ocarina Image(s)"}
              </Label>
              <div
                className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {isEditing ? "Click to replace image" : "Click to select image(s)"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP supported</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple={!isEditing}
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Previews */}
              {previews.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {previews.map((url, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-md overflow-hidden border border-border">
                      <img src={url} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Existing image preview when editing */}
              {isEditing && selectedFiles.length === 0 && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-muted text-sm text-muted-foreground">
                  <ImageIcon className="w-4 h-4" />
                  <span>Current image will be kept</span>
                </div>
              )}
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="profile-name">
                Name {selectedFiles.length > 1 && <span className="text-muted-foreground text-xs">(will be numbered: Name 1, Name 2…)</span>}
              </Label>
              <Input
                id="profile-name"
                placeholder="e.g. Forest Ocarina"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="profile-description">Description</Label>
              <Textarea
                id="profile-description"
                placeholder="Describe this ocarina…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Category & Shape */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="profile-category">Category</Label>
                <Input
                  id="profile-category"
                  placeholder="e.g. Ceramic"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-shape">Shape</Label>
                <Input
                  id="profile-shape"
                  placeholder="e.g. Transverse"
                  value={shape}
                  onChange={(e) => setShape(e.target.value)}
                />
              </div>
            </div>

            {/* Size / Pitch Preset */}
            <div className="space-y-2">
              <Label>Size / Pitch Preset</Label>
              <Select value={size} onValueChange={(v) => setSize(v as SizePreset)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {SIZE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="font-medium">{opt.label}</span>
                      <span className="ml-2 text-muted-foreground text-xs">– {opt.scale}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Sets the tonal range: Low Bass (C3) · Bass (C4) · Alto (C5) · Soprano (C6)
              </p>
            </div>

            {/* Bulk progress */}
            {savingProgress && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Saving {savingProgress.current} of {savingProgress.total}…
                </p>
                <Progress value={(savingProgress.current / savingProgress.total) * 100} />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSubmitClick} disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Saving…
                </span>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                `Upload${selectedFiles.length > 1 ? ` (${selectedFiles.length})` : ""}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreatorPasswordDialog
        open={passwordDialogOpen}
        onClose={() => {
          setPasswordDialogOpen(false);
          setPasswordError(null);
        }}
        onConfirm={handlePasswordConfirm}
        isLoading={isLoading}
        error={passwordError}
        title={isEditing ? "Confirm Edit" : "Confirm Upload"}
        description="Enter the creator password to save this ocarina profile."
      />
    </>
  );
}
