export async function getImageEmbedding(bytes: ArrayBuffer): Promise<number[]> {
  const base64 = Buffer.from(bytes).toString("base64");

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/run/@cf/llava-hf/llava-1.5-7b-hf`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: Array.from(new Uint8Array(bytes)),
        prompt: "Describe this landmark image in detail",
        max_tokens: 256,
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`CF API error: ${response.status} — ${text}`);
  }

  const data = await response.json();
  
  // Convert text description to embedding using BGE
  const embedResponse = await fetch(
    https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/run/@cf/baai/bge-large-en-v1.5,
    {
      method: "POST",
      headers: {
        Authorization: Bearer ${process.env.CF_API_TOKEN},
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: data.result.response }),
    }
  );

  const embedData = await embedResponse.json();
  return embedData.result.data[0];
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
