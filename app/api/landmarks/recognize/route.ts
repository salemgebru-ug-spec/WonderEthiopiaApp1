import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Landmark from "@/models/Landmark";
import { cosineSimilarity } from "./utils";

export const runtime = "nodejs";
export const maxDuration = 60; 
export const memory = 1024;    

// lazy ML loader utilizing runtime require
// lazy ML loader utilizing runtime dynamic imports
async function getML() {
  // 1. Change local utils import to dynamic import
  const { getImageEmbedding, getExtractor } = await import("./utils");
  
  // 2. Change transformers import to dynamic import
  const { RawImage } = await import("@xenova/transformers");

  return { getImageEmbedding, getExtractor, RawImage };
}

// ───────────────────────────────────────────────────
// 🔄 RE-EMBED ALL LANDMARKS
// ───────────────────────────────────────────────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  if (searchParams.get("action") !== "reembed") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  await dbConnect();

  const { getExtractor, RawImage } = await getML();
  const ext = await getExtractor();

  const landmarks = await Landmark.find();
  const results = { success: 0, failed: 0, skipped: 0 };

  for (const landmark of landmarks) {
    const imageUrl = landmark.gallery?.[0];

    if (!imageUrl) {
      results.skipped++;
      continue;
    }

    try {
      const response = await fetch(imageUrl);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      const blob = new Blob([buffer]);
      const img = await RawImage.fromBlob(blob);

      const output = await ext(img, {
        pooling: "mean",
        normalize: true,
      });

      landmark.embedding = Array.from(output.data as Float32Array);
      await landmark.save();

      console.log(`✓ ${landmark.name}`);
      results.success++;
    } catch (e: any) {
      console.error(`✗ ${landmark.name}:`, e.message);
      results.failed++;
    }
  }

  return NextResponse.json({ done: true, ...results });
}

// ───────────────────────────────────────────────────
// 🔍 IMAGE SEARCH
// ───────────────────────────────────────────────────
export async function POST(req: Request) {
  await dbConnect();

  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No image file" },
        { status: 400 }
      );
    }

    console.log(`Processing: ${file.name}`);

    const { getImageEmbedding } = await getML();

    const bytes = await file.arrayBuffer();
    const imageEmbedding = await getImageEmbedding(bytes);

    const landmarks = await Landmark.find({
      embedding: { $exists: true, $not: { $size: 0 } },
    });

    const results = landmarks
      .map((l) => {
        if (!l.embedding) return null;

        const similarity = cosineSimilarity(
          imageEmbedding,
          l.embedding
        );

        return {
          ...l.toObject(),
          similarity,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.similarity - a.similarity);

    return NextResponse.json(results.slice(0, 5));
  } catch (error: any) {
    console.error("Search error:", error);

    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
