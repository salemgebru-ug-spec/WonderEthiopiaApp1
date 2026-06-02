export const runtime = "nodejs";

let extractor: any = null;
let envReady = false;

/
 * Initialize environment BEFORE pipeline loads
 */
async function initEnv() {
  if (envReady) return;

  // Using standard require hides this block from the Next.js static build workers
  const { env } = require("@xenova/transformers");

  // 🚨 FORCE PURE WASM MODE (CRITICAL FIX)
  env.backends = {
    onnx: {
      wasm: {
        numThreads: 1,
      },
    },
  };

  env.allowLocalModels = false;
  env.useBrowserCache = false;

  // 🚨 VERCEL FIX: Force cache into the only writable directory allocated to serverless functions
  env.cacheDir = "/tmp/transformers-cache";

  envReady = true;
}

/
 * Load model lazily
 */
export async function getExtractor() {
  if (!extractor) {
    await initEnv();

    const { pipeline } = require("@xenova/transformers");

    extractor = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
  }

  return extractor;
}

/
 * Convert image → embedding vector
 */
export async function getImageEmbedding(buffer: ArrayBuffer): Promise<number[]> {
  const { RawImage } = require("@xenova/transformers");

  const model = await getExtractor();

  const blob = new Blob([buffer]);
  const image = await RawImage.fromBlob(blob);

  const output = await model(image, {
    pooling: "mean",
    normalize: true,
  });

  return Array.from(output.data as Float32Array);
}

/
 * Cosine similarity
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}
