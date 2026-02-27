import React, { useState, useRef, useCallback } from 'react';
import { Upload, ScanLine, Loader2, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useImageRecognition } from '../hooks/useImageRecognition';
import type { ScoreNote } from '../hooks/useScoreEditor';
import { TablatureDiagram } from './TablatureDiagram';
import { getFingeringForPitch } from '../utils/fingeringMap';
import { DURATION_OPTIONS, DIATONIC_NOTES } from '../hooks/useScoreEditor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ImageRecognitionPanelProps {
  onLoadRecognized: (notes: ScoreNote[], name: string) => void;
}

export const ImageRecognitionPanel: React.FC<ImageRecognitionPanelProps> = ({ onLoadRecognized }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [recognizedNotes, setRecognizedNotes] = useState<ScoreNote[] | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { recognize, isProcessing, error } = useImageRecognition();

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.match(/image\/(png|jpeg|jpg)/)) {
      return;
    }
    const url = URL.createObjectURL(file);
    setImageUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    setRecognizedNotes(null);
    setConfidence(0);
  }, []);

  const handleRecognize = useCallback(async () => {
    if (!fileInputRef.current?.files?.[0]) return;
    const file = fileInputRef.current.files[0];
    const result = await recognize(file);
    setRecognizedNotes(result.notes);
    setConfidence(result.confidence);
  }, [recognize]);

  const handleUpdateNote = useCallback((index: number, changes: Partial<ScoreNote>) => {
    setRecognizedNotes(prev => {
      if (!prev) return prev;
      return prev.map((n, i) => i === index ? { ...n, ...changes } : n);
    });
  }, []);

  const handleLoad = useCallback(() => {
    if (!recognizedNotes || recognizedNotes.length === 0) return;
    onLoadRecognized(recognizedNotes, 'Recognized Score');
  }, [recognizedNotes, onLoadRecognized]);

  const handleReset = useCallback(() => {
    setImageUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setRecognizedNotes(null);
    setConfidence(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {/* Upload area */}
      <div
        className="relative border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors bg-secondary"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          className="hidden"
          onChange={handleFileChange}
        />
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Sheet music preview"
            className="max-h-32 mx-auto rounded object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <Upload className="w-8 h-8 text-muted-foreground opacity-60" />
            <p className="text-sm font-body text-muted-foreground">
              Click to upload sheet music image
            </p>
            <p className="text-xs text-muted-foreground opacity-70">PNG or JPEG</p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        {imageUrl && (
          <>
            <Button
              onClick={handleRecognize}
              disabled={isProcessing}
              size="sm"
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <ScanLine className="w-3.5 h-3.5 mr-1.5" />
                  Recognize Notes
                </>
              )}
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {recognizedNotes && recognizedNotes.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-forest-green" />
              <span className="text-sm font-body font-semibold">
                {recognizedNotes.length} notes found
              </span>
            </div>
            <Badge variant="outline" className="text-xs">
              {Math.round(confidence * 100)}% confidence
            </Badge>
          </div>

          {/* Editable note list */}
          <div className="max-h-40 overflow-y-auto scrollbar-thin flex flex-col gap-1 pr-1">
            {recognizedNotes.map((note, i) => {
              const fingering = getFingeringForPitch(note.pitch);
              return (
                <div key={i} className="flex items-center gap-2 p-1.5 rounded border border-border bg-card">
                  <span className="text-xs text-muted-foreground w-5 flex-shrink-0">#{i + 1}</span>
                  <TablatureDiagram fingering={fingering} size="sm" />
                  <Select
                    value={note.pitch}
                    onValueChange={(val) => handleUpdateNote(i, { pitch: val })}
                  >
                    <SelectTrigger className="h-6 w-16 text-xs px-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIATONIC_NOTES.map(n => (
                        <SelectItem key={n} value={n} className="text-xs">{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={String(Number(note.duration))}
                    onValueChange={(val) => handleUpdateNote(i, { duration: BigInt(val) })}
                  >
                    <SelectTrigger className="h-6 flex-1 text-xs px-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATION_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={String(opt.value)} className="text-xs">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>

          <Button onClick={handleLoad} size="sm" className="w-full">
            Load Recognized Score
          </Button>
        </div>
      )}

      {recognizedNotes && recognizedNotes.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            No notes detected. Try a clearer image with visible staff lines.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
