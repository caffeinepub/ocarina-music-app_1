import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Score, SampleAssignment } from '../backend';
import { ExternalBlob } from '../backend';

// ─── Scores ───────────────────────────────────────────────────────────────────

export function useGetAllScores() {
  const { actor, isFetching } = useActor();
  return useQuery<Score[]>({
    queryKey: ['scores'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllScores();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveScore() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, score }: { name: string; score: Score }) => {
      if (!actor) throw new Error('Actor not ready');
      return actor.saveScore(name, score);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scores'] });
    },
  });
}

export function useDeleteScore() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error('Actor not ready');
      return actor.deleteScore(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scores'] });
    },
  });
}

// ─── Sample Assignments ───────────────────────────────────────────────────────

export function useGetAllSampleAssignments() {
  const { actor, isFetching } = useActor();
  return useQuery<SampleAssignment[]>({
    queryKey: ['sampleAssignments'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSampleAssignments();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUploadSample() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ note, blob }: { note: string; blob: ExternalBlob }) => {
      if (!actor) throw new Error('Actor not ready');
      return actor.uploadSample(note, blob);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sampleAssignments'] });
    },
  });
}

export function useDeleteSampleAssignment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (note: string) => {
      if (!actor) throw new Error('Actor not ready');
      return actor.deleteSampleAssignment(note);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sampleAssignments'] });
    },
  });
}

// ─── Preset Songs ─────────────────────────────────────────────────────────────

export function useGetPresetSongList() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<{ id: string; displayName: string }>>({
    queryKey: ['presetSongList'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPresetSongList();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetPresetSong() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not ready');
      return actor.getPresetSong(id);
    },
  });
}

export function useAddPresetSong() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, displayName, score }: { id: string; displayName: string; score: Score }) => {
      if (!actor) throw new Error('Actor not ready');
      return actor.addPresetSong(id, displayName, score);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presetSongList'] });
    },
  });
}

// ─── Fingering Map ────────────────────────────────────────────────────────────

export function useLoadFingeringMap() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[string, Array<boolean>]>>({
    queryKey: ['fingeringMap'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.loadFingeringMap();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveFingeringMap() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newMap: Array<[string, Array<boolean>]>) => {
      if (!actor) throw new Error('Actor not ready');
      return actor.saveFingeringMap(newMap);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fingeringMap'] });
    },
  });
}
