import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Landmark from "@/models/Landmark";
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

export default async function getImageEmbedding(image: ArrayBuffer): Promise<number[]> {
  const ext = await getExtractor();
  const blob = new Blob([image]);
  const img = await RawImage.fromBlob(blob);
  const output = await ext(img, { pooling: "mean", normalize: true });
  return Array.from(output.data as Float32Array);
}

function cosineSimilarity(a: number[], b: number[]): number {
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

// ── Re-embed all landmarks (call via GET /api/search-by-image/reembed) ────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("action") !== "reembed") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  await dbConnect();
  const ext = await getExtractor();
  const landmarks = await Landmark.find();
  const results = { success: 0, failed: 0, skipped: 0 };

  for (const landmark of landmarks) {
    const imageUrl = (landmark as any).gallery?.[0];
    if (!imageUrl) {
      results.skipped++;
      continue;
    }

    try {
      const response = await fetch(imageUrl, {
        headers: {
          Referer: new URL(imageUrl).origin,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const buffer = await response.arrayBuffer();
      const blob = new Blob([buffer]);
      const img = await RawImage.fromBlob(blob);
      const output = await ext(img, { pooling: "mean", normalize: true });

      landmark.embedding = Array.from(output.data as Float32Array);
      await landmark.save();

      console.log(`✓ ${landmark.name} — dim: ${landmark.embedding.length}`);
      results.success++;
    } catch (e: any) {
      console.error(`✗ ${landmark.name}: ${e.message}`);
      results.failed++;
    }
  }

  return NextResponse.json({ done: true, ...results });
}

// ── Image search ──────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  await dbConnect();

  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: `Expected multipart/form-data, got ${contentType}` },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("image") as File;
    if (!file) {
      return NextResponse.json({ error: "No image file" }, { status: 400 });
    }

    console.log(`Processing: ${file.name}, ${file.size} bytes`);

    const bytes = await file.arrayBuffer();
    const imageEmbedding = await getImageEmbedding(bytes);
    console.log(`Image embedding dim: ${imageEmbedding.length}`);

    const landmarks = await Landmark.find({
      embedding: { $exists: true, $not: { $size: 0 } },
    });
    console.log(`Comparing against ${landmarks.length} landmarks`);

    const results = landmarks
      .map((l) => {
        if (!l.embedding || !Array.isArray(l.embedding)) return null;
        const similarity = cosineSimilarity(imageEmbedding, l.embedding);
        return { ...l.toObject(), similarity, score: similarity };
      })
      .filter(Boolean)
      .sort((a, b) => b!.similarity - a!.similarity);

    console.log(`Top: ${results[0]?.name} — ${results[0]?.similarity.toFixed(4)}`);

    return NextResponse.json(results.slice(0, 5));
  } catch (error: any) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}