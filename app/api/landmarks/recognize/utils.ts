import { pipeline, env } from "@xenova/transformers"; // 1. Import 'env'
import { loadImage } from 'canvas';

// 2. Configure Hugging Face environments for Serverless
env.allowLocalModels = false; 
env.backends.onnx.executionProviders = ['wasm']; // Force WebAssembly instead of native binaries

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

  const buffer = Buffer.from(image); // Convert ArrayBuffer to Buffer
  const img = await loadImage(buffer); // Load image using 'canvas'

  const output = await ext(img, { pooling: "mean", normalize: true });
  return Array.from(output.data as Float32Array);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  // FIX: Added backticks around the template literal string
  if (a.length !== b.length) {
    console.error(`Dimension mismatch: query=${a.length}, db=${b.length}`);
    return 0;
  }
  
  // FIX: Removed the smashed file comment snippet from the end of this line
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}
