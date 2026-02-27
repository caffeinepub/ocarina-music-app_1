import React, { useState, useCallback } from 'react';
import { X, Loader2, Volume2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DIATONIC_NOTES, NOTE_LABELS } from '../utils/fingeringMap';
import { useGetAllSampleAssignments, useUploadSample, useDeleteSampleAssignment } from '../hooks/useQueries';
import { ExternalBlob } from '../backend';
import { toast } from 'sonner';

interface SampleUploadPanelProps {
  onSamplesChange: (samples: Record<string, string>) => void;
}

export const SampleUploadPanel: React.FC<SampleUploadPanelProps> = ({ onSamplesChange }) => {
  const { data: assignments } = useGetAllSampleAssignments();
  const uploadSample = useUploadSample();
  const deleteSample = useDeleteSampleAssignment();
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  const assignmentMap = React.useMemo(() => {
    const map: Record<string, ExternalBlob> = {};
    assignments?.forEach(a => { map[a.note] = a.blob; });
    return map;
  }, [assignments]);

  // Update parent with sample URLs
  React.useEffect(() => {
    const samples: Record<string, string> = {};
    Object.entries(assignmentMap).forEach(([note, blob]) => {
      samples[note] = blob.getDirectURL();
    });
    onSamplesChange(samples);
  }, [assignmentMap, onSamplesChange]);

  const handleUpload = useCallback(async (note: string, file: File) => {
    if (!file.type.match(/audio\/(wav|mpeg|mp3|ogg|x-wav)/)) {
      toast.error('Please upload a WAV or MP3 file');
      return;
    }

    setUploading(prev => ({ ...prev, [note]: true }));
    setUploadProgress(prev => ({ ...prev, [note]: 0 }));

    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((pct) => {
        setUploadProgress(prev => ({ ...prev, [note]: pct }));
      });

      await uploadSample.mutateAsync({ note, blob });
      toast.success(`Sample uploaded for ${note}`);
    } catch {
      toast.error(`Failed to upload sample for ${note}`);
    } finally {
      setUploading(prev => ({ ...prev, [note]: false }));
      setUploadProgress(prev => ({ ...prev, [note]: 0 }));
    }
  }, [uploadSample]);

  const handleDelete = useCallback(async (note: string) => {
    try {
      await deleteSample.mutateAsync(note);
      toast.success(`Sample removed for ${note}`);
    } catch {
      toast.error('Failed to remove sample');
    }
  }, [deleteSample]);

  return (
    <div className="flex flex-col gap-2">
      {DIATONIC_NOTES.map((note) => {
        const hasCustom = !!assignmentMap[note];
        const isUploading = uploading[note];
        const progress = uploadProgress[note] ?? 0;

        return (
          <div
            key={note}
            className="flex items-center gap-2 p-2 rounded-md border border-border bg-secondary"
          >
            {/* Note label */}
            <div className="w-8 h-8 rounded-md bg-warm-brown flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-heading font-bold text-primary-foreground">
                {NOTE_LABELS[note]}
              </span>
            </div>

            {/* Status */}
            <div className="flex-1 min-w-0">
              {isUploading ? (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-body">Uploading...</p>
                  <Progress value={progress} className="h-1.5" />
                </div>
              ) : hasCustom ? (
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-forest-green flex-shrink-0" />
                  <span className="text-xs font-body text-foreground truncate">Custom sample</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs font-body text-muted-foreground">Default tone</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {hasCustom && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(note)}
                  disabled={deleteSample.isPending}
                  className="h-6 w-6"
                  title="Remove custom sample"
                >
                  <X className="w-3 h-3 text-destructive" />
                </Button>
              )}
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="audio/wav,audio/mpeg,audio/mp3,audio/ogg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(note, file);
                    e.target.value = '';
                  }}
                />
                <span
                  className={`
                    inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-body
                    border border-border bg-card hover:bg-muted transition-colors
                    ${isUploading ? 'opacity-50 pointer-events-none' : ''}
                  `}
                >
                  {isUploading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <span>Upload</span>
                  )}
                </span>
              </label>
            </div>
          </div>
        );
      })}
    </div>
  );
};
