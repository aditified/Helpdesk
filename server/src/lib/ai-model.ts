import { google } from "@ai-sdk/google";
import { generateText as baseGenerateText } from "ai";

const MODELS = [
  "gemini-3.6-flash",
  "gemini-3.7-flash",
  "gemini-3.5-flash",
  "gemini-3.8-flash",
];

export async function generateTextWithFallback(
  options: {
    system?: string;
    prompt: string;
  }
) {
  let lastError: any;

  for (const modelName of MODELS) {
    try {
      const result = await baseGenerateText({
        model: google(modelName),
        system: options.system,
        prompt: options.prompt,
      });
      return result;
    } catch (err: any) {
      lastError = err;
      const isQuotaOrRateLimit =
        err?.statusCode === 429 ||
        err?.message?.includes("quota") ||
        err?.message?.includes("rate limit") ||
        err?.message?.includes("RESOURCE_EXHAUSTED");

      if (isQuotaOrRateLimit) {
        console.warn(`[AI] Model ${modelName} quota exceeded, falling back to next model...`);
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}
