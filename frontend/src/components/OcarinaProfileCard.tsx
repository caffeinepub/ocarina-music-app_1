import React from "react";
import { OcarinaProfile, SizePreset } from "../backend";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pencil, Trash2 } from "lucide-react";

interface SizeInfo {
  label: string;
  scale: string;
  color: string;
}

export const SIZE_PRESET_INFO: Record<SizePreset, SizeInfo> = {
  [SizePreset.lowBass]: { label: "Low Bass", scale: "C3", color: "bg-accent/20 text-accent-foreground border-accent/40" },
  [SizePreset.bass]: { label: "Bass", scale: "C4", color: "bg-secondary/30 text-secondary-foreground border-secondary/40" },
  [SizePreset.alto]: { label: "Alto", scale: "C5", color: "bg-primary/20 text-primary border-primary/40" },
  [SizePreset.soprano]: { label: "Soprano", scale: "C6", color: "bg-muted text-muted-foreground border-border" },
};

interface OcarinaProfileCardProps {
  profile: OcarinaProfile;
  onPlay: (profile: OcarinaProfile) => void;
  onEdit?: (profile: OcarinaProfile) => void;
  onDelete?: (profile: OcarinaProfile) => void;
  showActions?: boolean;
}

export function OcarinaProfileCard({
  profile,
  onPlay,
  onEdit,
  onDelete,
  showActions = false,
}: OcarinaProfileCardProps) {
  const sizeInfo = SIZE_PRESET_INFO[profile.size] ?? SIZE_PRESET_INFO[SizePreset.alto];
  const imageUrl = profile.image.getDirectURL();

  return (
    <div className="flex-shrink-0 w-52 rounded-xl overflow-hidden border border-border bg-card shadow-sm hover:shadow-md transition-shadow group">
      {/* Image */}
      <div className="relative h-36 bg-muted overflow-hidden">
        <img
          src={imageUrl}
          alt={profile.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/assets/generated/fp-hands-ocarina.dim_600x400.png";
          }}
        />
        {showActions && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                onClick={() => onEdit(profile)}
                className="p-1 rounded-md bg-background/80 hover:bg-background text-foreground shadow-sm"
                title="Edit profile"
              >
                <Pencil className="w-3 h-3" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(profile)}
                className="p-1 rounded-md bg-background/80 hover:bg-destructive hover:text-destructive-foreground text-foreground shadow-sm"
                title="Delete profile"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3 space-y-2">
        <p className="font-semibold text-sm text-card-foreground truncate" title={profile.name}>
          {profile.name}
        </p>
        {profile.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{profile.description}</p>
        )}

        {/* Size/Pitch footer */}
        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${sizeInfo.color}`}>
          <span>{sizeInfo.label}</span>
          <span className="opacity-60">·</span>
          <span>{sizeInfo.scale}</span>
        </div>
      </div>

      {/* Play button */}
      <div className="px-3 pb-3">
        <Button
          size="sm"
          className="w-full gap-1.5"
          onClick={() => onPlay(profile)}
        >
          <Play className="w-3 h-3" />
          Play Ocarina
        </Button>
      </div>
    </div>
  );
}
