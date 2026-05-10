import { NextResponse } from "next/server";
// Use your centralized openai instance
import hf from '@/lib/huggingface'; 

const CATEGORY_NORMALIZER: Record<string, string> = {
  // Culture
  "Cultural": "culture",
  "Cultural/Religious": "culture",
  "Urban": "culture",
  "City": "culture",

  // Nature
  "Natural": "nature",
  "Nature": "nature",
  "National Park": "nature",
  "Park": "nature",
  "Landscape": "nature",

  // Adventure
  "Adventure": "adventure",
  "Trekking": "adventure",
  "Hiking": "adventure",
  "Sport": "adventure",

  // Religious
  "Religious": "religious",
  "Spiritual": "religious",
  "Pilgrimage": "religious",

  // Coffee
  "Coffee": "coffee",
  "Coffee Farm": "coffee",
  "Plantation": "coffee",

  // Modern
  "Modern": "modern",
  "Contemporary": "modern",
  "Archaeological": "modern", // or remap to a more fitting key
  "Historical": "modern",     // remove if you want a separate historical bucket
};

const USER_PREF_MAP: Record<string, Record<string, number>> = {
  culture: {
    culture: 0.25,
    modern: 0.1,
  },
  nature: {
    nature: 0.25,
    adventure: 0.1,
  },
  adventure: {
    adventure: 0.25,
    nature: 0.1,
  },
  religious: {
    religious: 0.25,
    culture: 0.1,
  },
  coffee: {
    coffee: 0.25,
    nature: 0.05,
  },
  modern: {
    modern: 0.25,
    culture: 0.05,
  },
};

export async function GET(request: Request) {
  try {
    // 1. Get preferences from the URL query string
    const { searchParams } = new URL(request.url);
    const preferences = searchParams.get("preferences");

    if (!preferences) {
      return NextResponse.json({ error: "No preferences provided" }, { status: 400 });
    }

    const intents = preferences
  .split(",")
  .map(p => p.trim().toLowerCase());

    // 2. Fetch destinations
    const response = await fetch("http://localhost:3000/api/destinations", {
      cache: 'no-store' // Ensure fresh data
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch destinations" }, { status: response.status });
    }

    const destinations = await response.json(); 
    for (let place of destinations) {
  if (!place.embedding) {
    place.embedding = await getEmbeddings(place.description);
  }
}

    destinations.forEach((p, i) => {
  console.log("DEST", i, p.embedding);
});


    // 3. Generate embedding for the user's input
    const userEmbedding = await getEmbeddings(preferences);
    
    

    // 4. Calculate similarity and sort
    const results = recommend(userEmbedding, destinations, intents);

    // 5. Return the top 5
    return NextResponse.json(results.slice(0, 5));

  } catch (error: any) {
    console.error("Recommendation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function getEmbeddings(text: string) {
  
   const embedding = await hf.featureExtraction({
    model: "sentence-transformers/all-MiniLM-L6-v2",
    inputs: text,
  });
  // Return the actual vector (array of numbers)
   console.log("RAW:", embedding);
    return Array.isArray(embedding[0]) ? embedding[0] : embedding;
}

function cosineSimilarity(a: number[], b: number[]) {
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

function recommend(userEmbedding: number[], places: any[], intents: string[]) {
  return places
    .map(place => {
      const similarity = cosineSimilarity(userEmbedding, place.embedding);

      const category = CATEGORY_NORMALIZER[place.category] ?? "other";

      // category boost from user intent
      let categoryBoost = 0;

      for (const intent of intents) {
        const weights = USER_PREF_MAP[intent];
        if (weights?.[category]) {
          categoryBoost += weights[category];
        }
      }

      return {
        ...place,
        similarity,
        score: similarity + categoryBoost,
      };
    })
    .sort((a, b) => b.score - a.score);
}