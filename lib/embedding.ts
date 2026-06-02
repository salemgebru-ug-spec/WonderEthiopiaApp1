export async function getImageEmbedding(bytes: ArrayBuffer): Promise<number[]> {
  const base64 = Buffer.from(bytes).toString("base64");

  // Step 1: Describe image with LLaVA
  const visionResponse = await fetch(
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
  const visionData = await visionResponse.json();
  const description = visionData?.result?.description ?? "a landmark or historical site";

  // Step 2: Convert description to embedding
  const embedResponse = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/run/@cf/baai/bge-large-en-v1.5`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: [description] }),
    }
  );
  const embedData = await embedResponse.json();
  return embedData?.result?.data?.[0] ?? [];
}
