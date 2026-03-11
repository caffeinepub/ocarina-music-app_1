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
export interface UserProfile {
    favoriteScores: Array<string>;
    name: string;
}
export interface Note {
    fingering: Array<string>;
    duration: bigint;
    pitch: string;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface HoleConfig {
    x: bigint;
    y: bigint;
    id: string;
    note: string;
    size: bigint;
}
export interface Score {
    lyrics?: string;
    name: string;
    notes: Array<Note>;
}
export interface HolePreset {
    id: string;
    holeConfigs: Array<HoleConfig>;
    scaleMode: ScaleMode;
    name: string;
    octave: bigint;
}
export interface PresetSong {
    id: string;
    displayName: string;
    score: Score;
}
export interface OcarinaProfile {
    id: string;
    holeConfigs: Array<HoleConfig>;
    scaleMode: ScaleMode;
    name: string;
    size: SizePreset;
    description: string;
    shape: string;
    category: string;
    octave: bigint;
    image: ExternalBlob;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface OcarinaProfileForm {
    holeConfigs: Array<HoleConfig>;
    scaleMode: ScaleMode;
    name: string;
    size: SizePreset;
    description: string;
    shape: string;
    category: string;
    octave: bigint;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface SampleAssignment {
    blob: ExternalBlob;
    note: string;
}
export interface HolePresetForm {
    holeConfigs: Array<HoleConfig>;
    scaleMode: ScaleMode;
    name: string;
    octave: bigint;
}
export enum ScaleMode {
    diatonic = "diatonic",
    chromatic = "chromatic"
}
export enum SizePreset {
    alto = "alto",
    bass = "bass",
    lowBass = "lowBass",
    soprano = "soprano"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addPresetSong(id: string, displayName: string, score: Score): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    bulkCreateOcarinaProfiles(entries: Array<[string, OcarinaProfileForm, ExternalBlob]>, password: string): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createOcarinaProfile(id: string, profileData: OcarinaProfileForm, image: ExternalBlob, password: string): Promise<void>;
    deleteHolePreset(id: string, password: string): Promise<void>;
    deleteOcarinaProfile(id: string, password: string): Promise<void>;
    deleteSampleAssignment(note: string): Promise<void>;
    deleteScore(name: string): Promise<void>;
    getAllSampleAssignments(): Promise<Array<SampleAssignment>>;
    getAllScores(): Promise<Array<Score>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getHolePresets(): Promise<Array<HolePreset>>;
    getOcarinaProfile(id: string): Promise<OcarinaProfile>;
    getOcarinaProfiles(): Promise<Array<OcarinaProfile>>;
    getPresetSong(id: string): Promise<PresetSong>;
    getPresetSongList(): Promise<Array<{
        id: string;
        displayName: string;
    }>>;
    getSampleAssignment(note: string): Promise<ExternalBlob | null>;
    getScore(name: string): Promise<Score>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    loadFingeringMap(): Promise<Array<[string, Array<boolean>]>>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveFingeringMap(newMap: Array<[string, Array<boolean>]>): Promise<void>;
    saveHolePreset(preset: HolePresetForm, password: string): Promise<void>;
    saveScore(name: string, score: Score): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateOcarinaProfile(id: string, updatedProfile: OcarinaProfileForm, image: ExternalBlob | null, password: string): Promise<void>;
    uploadSample(note: string, blob: ExternalBlob): Promise<void>;
}
