import React, { useRef, useState, useEffect, useCallback } from "react";
import { OcarinaProfile } from "../backend";
import { OcarinaProfileCard } from "./OcarinaProfileCard";
import { OcarinaProfileForm } from "./OcarinaProfileForm";
import { CreatorPasswordDialog } from "./CreatorPasswordDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Plus,
  Music2,
} from "lucide-react";
import { useGetOcarinaProfiles, useDeleteOcarinaProfile } from "../hooks/useQueries";
import { toast } from "sonner";

interface OcarinaShowcasePanelProps {
  onPlayProfile: (profile: OcarinaProfile) => void;
}

const CARD_WIDTH = 224; // w-52 = 208px + gap
const SCROLL_STEP = CARD_WIDTH + 16;
const AUTO_SCROLL_INTERVAL = 3000;

export function OcarinaShowcasePanel({ onPlayProfile }: OcarinaShowcasePanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<OcarinaProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OcarinaProfile | null>(null);
  const [deletePasswordError, setDeletePasswordError] = useState<string | null>(null);
  const [scrollPos, setScrollPos] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: profiles = [], isLoading } = useGetOcarinaProfiles();
  const deleteMutation = useDeleteOcarinaProfile();

  // Auto-scroll
  const scrollRight = useCallback(() => {
    if (!stripRef.current) return;
    const maxScroll = stripRef.current.scrollWidth - stripRef.current.clientWidth;
    const next = scrollPos + SCROLL_STEP;
    if (next >= maxScroll) {
      // Loop back to start
      stripRef.current.scrollTo({ left: 0, behavior: "smooth" });
      setScrollPos(0);
    } else {
      stripRef.current.scrollTo({ left: next, behavior: "smooth" });
      setScrollPos(next);
    }
  }, [scrollPos]);

  const scrollLeft = useCallback(() => {
    if (!stripRef.current) return;
    const next = Math.max(0, scrollPos - SCROLL_STEP);
    stripRef.current.scrollTo({ left: next, behavior: "smooth" });
    setScrollPos(next);
  }, [scrollPos]);

  useEffect(() => {
    if (!expanded || isHovered || profiles.length <= 2) return;
    autoScrollRef.current = setInterval(scrollRight, AUTO_SCROLL_INTERVAL);
    return () => {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    };
  }, [expanded, isHovered, scrollRight, profiles.length]);

  const handleEdit = (profile: OcarinaProfile) => {
    setEditingProfile(profile);
    setFormOpen(true);
  };

  const handleDeleteRequest = (profile: OcarinaProfile) => {
    setDeleteTarget(profile);
    setDeletePasswordError(null);
  };

  const handleDeleteConfirm = async (encodedPassword: string) => {
    if (!deleteTarget) return;
    setDeletePasswordError(null);
    try {
      await deleteMutation.mutateAsync({ id: deleteTarget.id, password: encodedPassword });
      toast.success(`"${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      if (msg.toLowerCase().includes("password") || msg.toLowerCase().includes("invalid")) {
        setDeletePasswordError("Incorrect password.");
      } else {
        setDeletePasswordError(msg || "Failed to delete.");
      }
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingProfile(null);
  };

  return (
    <>
      <div className="w-full border-b border-border bg-card/50 backdrop-blur-sm">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <Music2 className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm text-foreground">Ocarina Gallery</span>
            {profiles.length > 0 && (
              <span className="text-xs text-muted-foreground">({profiles.length})</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 h-7 text-xs"
              onClick={() => {
                setEditingProfile(null);
                setFormOpen(true);
              }}
            >
              <Plus className="w-3 h-3" />
              Upload
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => setExpanded((v) => !v)}
              title={expanded ? "Collapse gallery" : "Expand gallery"}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Expandable strip */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            expanded ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="relative px-4 pb-4">
            {isLoading ? (
              <div className="flex gap-4 py-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="flex-shrink-0 w-52 h-64 rounded-xl" />
                ))}
              </div>
            ) : profiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Music2 className="w-10 h-10 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No ocarina profiles yet.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click <strong>Upload</strong> to add your first ocarina!
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* Left arrow */}
                <Button
                  size="icon"
                  variant="outline"
                  className="flex-shrink-0 h-8 w-8 rounded-full shadow-sm"
                  onClick={scrollLeft}
                  disabled={scrollPos <= 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                {/* Scrollable strip */}
                <div
                  ref={stripRef}
                  className="flex gap-4 overflow-x-hidden py-2 flex-1 scroll-smooth"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  onScroll={(e) => setScrollPos((e.target as HTMLDivElement).scrollLeft)}
                >
                  {profiles.map((profile) => (
                    <OcarinaProfileCard
                      key={profile.id}
                      profile={profile}
                      onPlay={onPlayProfile}
                      onEdit={handleEdit}
                      onDelete={handleDeleteRequest}
                      showActions
                    />
                  ))}
                </div>

                {/* Right arrow */}
                <Button
                  size="icon"
                  variant="outline"
                  className="flex-shrink-0 h-8 w-8 rounded-full shadow-sm"
                  onClick={scrollRight}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload / Edit form */}
      <OcarinaProfileForm
        open={formOpen}
        onClose={handleFormClose}
        editingProfile={editingProfile}
      />

      {/* Delete confirmation */}
      <CreatorPasswordDialog
        open={!!deleteTarget}
        onClose={() => {
          setDeleteTarget(null);
          setDeletePasswordError(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Ocarina Profile"
        description={`Enter the creator password to delete "${deleteTarget?.name}". This cannot be undone.`}
        isLoading={deleteMutation.isPending}
        error={deletePasswordError}
      />
    </>
  );
}
