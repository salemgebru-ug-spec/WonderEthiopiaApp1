// app/api/landmarks/recognize/utils.ts
import { pipeline, RawImage } from "@xenova/transformers";

let extractor: any;

export async function getExtractor() {
  if (!extractor) {
    console.log("Loading CLIP model...");
    extractor = await pipeline(
      "image-feature-extraction",
      "Xenova/clip-vit-base-patch32"
    );
    console.log("CLIP model loaded");
  }
  return extractor;
}

export async function getImageEmbedding(image: ArrayBuffer): Promise<number[]> {
  const ext = await getExtractor();
  const blob = new Blob([image]);
  const img = await RawImage.fromBlob(blob);
  const output = await ext(img, { pooling: "mean", normalize: true });
  return Array.from(output.data as Float32Array);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    console.error(`Dimension mismatch: query=${a.length}, db=${b.length}`);
    return 0;
  }
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}
