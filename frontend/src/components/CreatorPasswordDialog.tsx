import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, AlertCircle } from "lucide-react";

interface CreatorPasswordDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (encodedPassword: string) => void;
  title?: string;
  description?: string;
  isLoading?: boolean;
  error?: string | null;
}

// Encode the password for backend comparison — never store plain text
function encodePassword(raw: string): string {
  return btoa(raw);
}

export function CreatorPasswordDialog({
  open,
  onClose,
  onConfirm,
  title = "Creator Access Required",
  description = "Enter the creator password to continue.",
  isLoading = false,
  error = null,
}: CreatorPasswordDialogProps) {
  const [value, setValue] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) {
      setLocalError("Password is required.");
      return;
    }
    setLocalError(null);
    onConfirm(encodePassword(value.trim()));
  };

  const handleClose = () => {
    setValue("");
    setLocalError(null);
    onClose();
  };

  const displayError = error || localError;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="creator-password">Password</Label>
            <Input
              id="creator-password"
              type="password"
              placeholder="Enter creator password"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setLocalError(null);
              }}
              autoFocus
              disabled={isLoading}
            />
            {displayError && (
              <p className="flex items-center gap-1 text-sm text-destructive">
                <AlertCircle className="w-3 h-3" />
                {displayError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Verifying…
                </span>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
