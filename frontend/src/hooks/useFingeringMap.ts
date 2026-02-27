import { useState, useCallback, useEffect, useRef } from 'react';
import type { Fingering } from '../utils/fingeringMap';
import { DIATONIC_NOTES } from '../utils/fingeringMap';
import { useLoadFingeringMap, useSaveFingeringMap } from './useQueries';

// Default fingering map (matches fingeringMap.ts)
const DEFAULT_FINGERING_MAP: Record<string, Fingering> = {
  'C5': [true,  true,  true,  true],
  'D5': [true,  true,  true,  false],
  'E5': [true,  true,  false, false],
  'F5': [true,  false, false, false],
  'G5': [true,  true,  false, true],
  'A5': [false, true,  false, false],
  'B5': [false, false, true,  false],
  'C6': [false, false, false, false],
};

export type FingeringMap = Record<string, Fingering>;

export interface UseFingeringMapReturn {
  fingeringMap: FingeringMap;
  getFingeringForNote: (note: string) => Fingering;
  toggleHole: (note: string, holeIndex: number) => void;
  resetToDefaults: () => void;
  saveToBackend: () => Promise<void>;
  isDirty: boolean;
  isSaving: boolean;
  isLoadingFromBackend: boolean;
}

function buildDefaultMap(): FingeringMap {
  const copy: FingeringMap = {};
  for (const note of DIATONIC_NOTES) {
    copy[note] = [...DEFAULT_FINGERING_MAP[note]] as Fingering;
  }
  return copy;
}

function tupleArrayToMap(data: Array<[string, Array<boolean>]>): FingeringMap | null {
  if (!data || data.length === 0) return null;
  const map: FingeringMap = {};
  for (const [note, holes] of data) {
    if (holes.length === 4) {
      map[note] = holes as Fingering;
    }
  }
  // Ensure all diatonic notes are present
  for (const note of DIATONIC_NOTES) {
    if (!map[note]) {
      map[note] = [...DEFAULT_FINGERING_MAP[note]] as Fingering;
    }
  }
  return map;
}

export function useFingeringMap(): UseFingeringMapReturn {
  const [fingeringMap, setFingeringMap] = useState<FingeringMap>(buildDefaultMap);
  const [isDirty, setIsDirty] = useState(false);

  // Track whether we've already hydrated from backend to avoid overwriting user edits
  const hydratedRef = useRef(false);

  const { data: backendData, isLoading: isLoadingFromBackend } = useLoadFingeringMap();
  const saveMapMutation = useSaveFingeringMap();

  // Hydrate from backend once data arrives
  useEffect(() => {
    if (hydratedRef.current) return;
    if (backendData === undefined) return;

    const loaded = tupleArrayToMap(backendData);
    if (loaded) {
      setFingeringMap(loaded);
    }
    hydratedRef.current = true;
    setIsDirty(false);
  }, [backendData]);

  const getFingeringForNote = useCallback(
    (note: string): Fingering => {
      return fingeringMap[note] ?? [false, false, false, false];
    },
    [fingeringMap]
  );

  const toggleHole = useCallback((note: string, holeIndex: number) => {
    setFingeringMap((prev) => {
      const current = prev[note] ?? [false, false, false, false];
      const updated = [...current] as Fingering;
      updated[holeIndex] = !updated[holeIndex];
      return { ...prev, [note]: updated };
    });
    setIsDirty(true);
  }, []);

  const resetToDefaults = useCallback(() => {
    setFingeringMap(buildDefaultMap());
    setIsDirty(true);
  }, []);

  const saveToBackend = useCallback(async () => {
    const tuples: Array<[string, Array<boolean>]> = DIATONIC_NOTES.map((note) => [
      note,
      [...(fingeringMap[note] ?? DEFAULT_FINGERING_MAP[note])],
    ]);
    await saveMapMutation.mutateAsync(tuples);
    setIsDirty(false);
  }, [fingeringMap, saveMapMutation]);

  return {
    fingeringMap,
    getFingeringForNote,
    toggleHole,
    resetToDefaults,
    saveToBackend,
    isDirty,
    isSaving: saveMapMutation.isPending,
    isLoadingFromBackend,
  };
}
