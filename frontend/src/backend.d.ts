import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Note {
    fingering: Array<string>;
    duration: bigint;
    pitch: string;
}
export interface OcarinaProfileForm {
    name: string;
    size: SizePreset;
    description: string;
    shape: string;
    category: string;
}
export interface Score {
    lyrics?: string;
    name: string;
    notes: Array<Note>;
}
export interface PresetSong {
    id: string;
    displayName: string;
    score: Score;
}
export interface SampleAssignment {
    blob: ExternalBlob;
    note: string;
}
export interface OcarinaProfile {
    id: string;
    name: string;
    size: SizePreset;
    description: string;
    shape: string;
    category: string;
    image: ExternalBlob;
}
export enum SizePreset {
    alto = "alto",
    bass = "bass",
    lowBass = "lowBass",
    soprano = "soprano"
}
export interface backendInterface {
    addPresetSong(id: string, displayName: string, score: Score): Promise<void>;
    bulkCreateOcarinaProfiles(entries: Array<[string, OcarinaProfileForm, ExternalBlob]>, password: string): Promise<void>;
    createOcarinaProfile(id: string, profileData: OcarinaProfileForm, image: ExternalBlob, password: string): Promise<void>;
    deleteOcarinaProfile(id: string, password: string): Promise<void>;
    deleteSampleAssignment(note: string): Promise<void>;
    deleteScore(name: string): Promise<void>;
    getAllSampleAssignments(): Promise<Array<SampleAssignment>>;
    getAllScores(): Promise<Array<Score>>;
    getOcarinaProfile(id: string): Promise<OcarinaProfile>;
    getOcarinaProfiles(): Promise<Array<OcarinaProfile>>;
    getPresetSong(id: string): Promise<PresetSong>;
    getPresetSongList(): Promise<Array<{
        id: string;
        displayName: string;
    }>>;
    getSampleAssignment(note: string): Promise<ExternalBlob | null>;
    getScore(name: string): Promise<Score>;
    loadFingeringMap(): Promise<Array<[string, Array<boolean>]>>;
    saveFingeringMap(newMap: Array<[string, Array<boolean>]>): Promise<void>;
    saveScore(name: string, score: Score): Promise<void>;
    updateOcarinaProfile(id: string, updatedProfile: OcarinaProfileForm, image: ExternalBlob | null, password: string): Promise<void>;
    uploadSample(note: string, blob: ExternalBlob): Promise<void>;
}
