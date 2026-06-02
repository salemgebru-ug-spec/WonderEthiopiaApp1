import { env, pipeline, RawImage } from "@xenova/transformers";

// Force TypeScript to treat the ONNX config as 'any' to bypass strict compilation checks
const onnxConfig = env.backends.onnx as any;

if (onnxConfig) {
  // 1. Tell the engine to use a single thread for WASM execution on Vercel
  if (onnxConfig.wasm) {
    onnxConfig.wasm.numThreads = 1;
  }
  
  // 2. Disable the native C++ CPU/GPU binaries that throw the missing .so file error
  if (onnxConfig.cpu) {
    onnxConfig.cpu.disabled = true;
  }
  if (onnxConfig.gpu) {
    onnxConfig.gpu.disabled = true;
  }
}

// Disable local file caching so it reads strictly from cloud memory structures
env.allowLocalModels = false;

let extractor: any = null;
// ... rest of your utils.ts file remains the same

export async function getExtractor() {
  if (!extractor) {
    // Using a light, quantized model so Vercel functions boot up faster
    extractor = await pipeline("feature-extraction", "Xenova/clip-vit-base-patch32");
  }
  return extractor;
}

export async function getImageEmbedding(buffer: ArrayBuffer): Promise<number[]> {
  const ext = await getExtractor();
  const blob = new Blob([buffer]);
  const img = await RawImage.fromBlob(blob);
  
  const output = await ext(img, { pooling: "mean", normalize: true });
  return Array.from(output.data as Float32Array);
}

export function cosineSimilarity(v1: number[], v2: number[]): number {
  let dotProduct = 0;
  let mA = 0;
  let mB = 0;
  for (let i = 0; i < v1.length; i++) {
    dotProduct += v1[i] * v2[i];
    mA += v1[i] * v1[i];
    mB += v2[i] * v2[i];
  }
  return dotProduct / (Math.sqrt(mA) * Math.sqrt(mB));
}
