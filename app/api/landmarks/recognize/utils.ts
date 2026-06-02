// app/api/search-by-image/utils.ts
export async function getImageEmbedding(bytes: ArrayBuffer): Promise<number[]> {
  const response = await fetch(
    "https://api-inference.huggingface.co/models/openai/clip-vit-base-patch32",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/octet-stream",
      },
      body: bytes,
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HF API error: ${response.status} — ${text}`);
  }

  const data = await response.json();
  // HF returns { embeddings: number[][] } for feature-extraction
  return data.embeddings?.[0] ?? data;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
