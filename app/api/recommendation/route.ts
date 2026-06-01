import { NextResponse } from "next/server";
import hf from "@/lib/huggingface";

const CATEGORY_NORMALIZER: Record<string, string> = {
  Cultural: "culture",
  "Cultural/Religious": "culture",
  Urban: "culture",
  City: "culture",
  Natural: "nature",
  Nature: "nature",
  "National Park": "nature",
  Park: "nature",
  Landscape: "nature",
  Adventure: "adventure",
  Trekking: "adventure",
  Hiking: "adventure",
  Sport: "adventure",
  Religious: "religious",
  Spiritual: "religious",
  Pilgrimage: "religious",
  Coffee: "coffee",
  "Coffee Farm": "coffee",
  Plantation: "coffee",
  Modern: "modern",
  Contemporary: "modern",
  Archaeological: "modern",
  Historical: "modern",
};

const USER_PREF_MAP: Record<string, Record<string, number>> = {
  culture:   { culture: 0.25, modern: 0.1 },
  nature:    { nature: 0.25, adventure: 0.1 },
  adventure: { adventure: 0.25, nature: 0.1 },
  religious: { religious: 0.25, culture: 0.1 },
  coffee:    { coffee: 0.25, nature: 0.05 },
  modern:    { modern: 0.25, culture: 0.05 },
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const preferencesParam = searchParams.get("preferences");

    // Build the base URL for the internal destinations API
    // Use relative path for same-origin calls in production
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

    // --- No preferences: return the full destination list ---
    if (!preferencesParam || preferencesParam.trim() === "") {
      const res = await fetch(`${baseUrl}/api/destinations`, { cache: "no-store" });
      if (!res.ok) {
        return NextResponse.json({ error: "Failed to fetch destinations" }, { status: res.status });
      }
      const destinations = await res.json();
      return NextResponse.json(destinations);
    }

    // --- Has preferences: run recommendation engine ---
    const intents = preferencesParam
      .split(",")
      .map((p) => p.trim().toLowerCase())
      .filter(Boolean);

    const res = await fetch(`${baseUrl}/api/destinations`, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch destinations" }, { status: res.status });
    }

    const destinations = await res.json();

    // Generate embeddings for any destination that doesn't have one yet
    for (const place of destinations) {
      if (!place.embedding) {
        place.embedding = await getEmbeddings(place.description ?? place.name);
      }
    }

    const userEmbedding = await getEmbeddings(intents.join(", "));
    const results = recommend(userEmbedding, destinations, intents);

    return NextResponse.json(results.slice(0, 9));
  } catch (error: any) {
    console.error("Recommendation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function getEmbeddings(text: string): Promise<number[]> {
  const embedding = await hf.featureExtraction({
    model: "sentence-transformers/all-MiniLM-L6-v2",
    inputs: text,
  });
  return Array.isArray(embedding[0]) ? (embedding[0] as number[]) : (embedding as number[]);
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function recommend(userEmbedding: number[], places: any[], intents: string[]) {
  return places
    .map((place) => {
      const similarity = cosineSimilarity(userEmbedding, place.embedding);
      const category = CATEGORY_NORMALIZER[place.category] ?? "other";

      let categoryBoost = 0;
      for (const intent of intents) {
        const weights = USER_PREF_MAP[intent];
        if (weights?.[category]) categoryBoost += weights[category];
      }

      return { ...place, similarity, score: similarity + categoryBoost };
    })
    .sort((a, b) => b.score - a.score);
}
