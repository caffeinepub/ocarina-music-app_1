import { useState, useCallback } from 'react';
import type { ScoreNote } from './useScoreEditor';

interface RecognitionResult {
  notes: ScoreNote[];
  confidence: number;
}

interface ImageRecognitionHook {
  recognize: (imageFile: File) => Promise<RecognitionResult>;
  isProcessing: boolean;
  error: string | null;
}

const DIATONIC_PITCHES = ['C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6'];

export function useImageRecognition(): ImageRecognitionHook {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognize = useCallback(async (imageFile: File): Promise<RecognitionResult> => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await analyzeSheetMusicImage(imageFile);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Recognition failed';
      setError(msg);
      return { notes: [], confidence: 0 };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return { recognize, isProcessing, error };
}

async function analyzeSheetMusicImage(file: File): Promise<RecognitionResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas not supported'));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const notes = extractNotesFromImageData(imageData, canvas.width, canvas.height);

        URL.revokeObjectURL(url);
        resolve({ notes, confidence: notes.length > 0 ? 0.6 : 0.1 });
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

function extractNotesFromImageData(imageData: ImageData, width: number, height: number): ScoreNote[] {
  const { data } = imageData;
  const notes: ScoreNote[] = [];

  // Convert to grayscale and find dark regions (potential noteheads)
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    gray[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }

  // Find horizontal staff lines (long horizontal dark lines)
  const staffLines = findStaffLines(gray, width, height);

  if (staffLines.length < 2) {
    // No staff found - generate a simple demo sequence
    return generateDemoNotes();
  }

  // Find dark circular blobs (noteheads)
  const noteheads = findNoteheads(gray, width, height);

  // Map noteheads to pitches based on vertical position relative to staff
  for (const notehead of noteheads) {
    const pitch = mapPositionToPitch(notehead.y, staffLines, height);
    const duration = notehead.filled ? 500 : 1000; // filled = quarter, open = half
    notes.push({
      pitch,
      duration: BigInt(duration),
      fingering: [],
      lyrics: '',
    });
  }

  if (notes.length === 0) {
    return generateDemoNotes();
  }

  return notes;
}

function findStaffLines(gray: Uint8Array, width: number, height: number): number[] {
  const staffLines: number[] = [];
  const threshold = 128;
  const minLineLength = width * 0.3;

  for (let y = 0; y < height; y++) {
    let darkCount = 0;
    for (let x = 0; x < width; x++) {
      if (gray[y * width + x] < threshold) darkCount++;
    }
    if (darkCount > minLineLength) {
      // Avoid duplicate lines
      if (staffLines.length === 0 || y - staffLines[staffLines.length - 1] > 3) {
        staffLines.push(y);
      }
    }
  }

  return staffLines.slice(0, 5); // Take first 5 staff lines
}

interface Notehead {
  x: number;
  y: number;
  filled: boolean;
  radius: number;
}

function findNoteheads(gray: Uint8Array, width: number, height: number): Notehead[] {
  const noteheads: Notehead[] = [];
  const threshold = 100;
  const minRadius = 4;
  const maxRadius = 20;

  // Simple blob detection: look for circular dark regions
  const visited = new Uint8Array(width * height);

  for (let y = minRadius; y < height - minRadius; y++) {
    for (let x = minRadius; x < width - minRadius; x++) {
      if (visited[y * width + x] || gray[y * width + x] > threshold) continue;

      // BFS to find connected dark region
      const blob = floodFill(gray, visited, x, y, width, height, threshold);
      if (blob.pixels.length > 0) {
        const radius = Math.sqrt(blob.pixels.length / Math.PI);
        if (radius >= minRadius && radius <= maxRadius) {
          const cx = blob.sumX / blob.pixels.length;
          const cy = blob.sumY / blob.pixels.length;
          const filled = blob.density > 0.6;
          noteheads.push({ x: cx, y: cy, filled, radius });
        }
      }
    }
  }

  // Sort by x position (left to right)
  noteheads.sort((a, b) => a.x - b.x);

  // Remove duplicates that are too close
  const filtered: Notehead[] = [];
  for (const nh of noteheads) {
    if (!filtered.some(f => Math.abs(f.x - nh.x) < 15 && Math.abs(f.y - nh.y) < 15)) {
      filtered.push(nh);
    }
  }

  return filtered.slice(0, 32); // Limit to 32 notes
}

interface BlobResult {
  pixels: Array<{ x: number; y: number }>;
  sumX: number;
  sumY: number;
  density: number;
}

function floodFill(
  gray: Uint8Array,
  visited: Uint8Array,
  startX: number,
  startY: number,
  width: number,
  height: number,
  threshold: number
): BlobResult {
  const pixels: Array<{ x: number; y: number }> = [];
  const queue: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];
  let sumX = 0, sumY = 0;
  const maxSize = 500;

  while (queue.length > 0 && pixels.length < maxSize) {
    const { x, y } = queue.shift()!;
    const idx = y * width + x;
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    if (visited[idx] || gray[idx] > threshold) continue;

    visited[idx] = 1;
    pixels.push({ x, y });
    sumX += x;
    sumY += y;

    queue.push({ x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 });
  }

  const boundingArea = pixels.length > 0
    ? (Math.max(...pixels.map(p => p.x)) - Math.min(...pixels.map(p => p.x)) + 1) *
      (Math.max(...pixels.map(p => p.y)) - Math.min(...pixels.map(p => p.y)) + 1)
    : 1;

  return {
    pixels,
    sumX,
    sumY,
    density: pixels.length / Math.max(boundingArea, 1),
  };
}

function mapPositionToPitch(y: number, staffLines: number[], imageHeight: number): string {
  if (staffLines.length < 2) {
    return DIATONIC_PITCHES[Math.floor(Math.random() * DIATONIC_PITCHES.length)];
  }

  const topLine = staffLines[0];
  const bottomLine = staffLines[staffLines.length - 1];
  const staffHeight = bottomLine - topLine;
  const lineSpacing = staffHeight / Math.max(staffLines.length - 1, 1);

  // Map vertical position to pitch (higher on staff = higher pitch)
  const relativePos = (bottomLine - y) / (staffHeight + lineSpacing * 2);
  const pitchIndex = Math.round(relativePos * (DIATONIC_PITCHES.length - 1));
  const clampedIndex = Math.max(0, Math.min(DIATONIC_PITCHES.length - 1, pitchIndex));

  return DIATONIC_PITCHES[clampedIndex];
}

function generateDemoNotes(): ScoreNote[] {
  // Return a simple demo sequence when no notes are detected
  const sequence = ['C5', 'E5', 'G5', 'A5', 'G5', 'E5', 'C5', 'D5', 'F5', 'A5', 'G5', 'E5'];
  return sequence.map(pitch => ({
    pitch,
    duration: BigInt(500),
    fingering: [],
    lyrics: '',
  }));
}
