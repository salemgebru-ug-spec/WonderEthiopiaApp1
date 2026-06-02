export async function getImageEmbedding(bytes: ArrayBuffer): Promise<number[]> {
  // Convert to base64
  const base64 = Buffer.from(bytes).toString("base64");

  const response = await fetch(
    https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/run/@cf/unum/uform-gen2-qwen-500m,
    {
      method: "POST",
      headers: {
        Authorization: Bearer ${process.env.CF_API_TOKEN},
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: base64 }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(CF API error: ${response.status} — ${text});
  }

  const data = await response.json();
  return data.result.data[0];
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
