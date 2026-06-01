import { pipeline, RawImage } from "@xenova/transformers";

let extractor: any;

async function getExtractor() {
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
