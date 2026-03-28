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
export interface Prediction {
    name: string;
    confidence: bigint;
}
export interface FoodAnalysis {
    topPredictions: Array<Prediction>;
    freshnessLabel: string;
    statusMessage: string;
    confidencePercent: bigint;
    aiResponse: string;
    foodName: string;
}
export interface HistoryRecord {
    id: bigint;
    freshnessLabel: string;
    timestamp: bigint;
    image?: ExternalBlob;
    confidencePercent: bigint;
    foodName: string;
}
export interface backendInterface {
    analyzeFood(imageSize: bigint, textQuery: string): Promise<FoodAnalysis>;
    getHistory(): Promise<Array<HistoryRecord>>;
    saveAnalysis(foodName: string, freshnessLabel: string, confidencePercent: bigint, image: ExternalBlob | null): Promise<void>;
}
