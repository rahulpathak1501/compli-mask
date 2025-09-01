// src/server/ai.ts
import { GoogleGenerativeAI } from "@google/generative-ai"; // optional, depends on your setup
import type { MaskLevel } from "../shared/types";

const API_KEY = process.env.GOOGLE_API_KEY;
let circuitOpen = false;
let lastFailure = 0;
const CIRCUIT_TIMEOUT_MS = 1000 * 60 * 5; // 5 minutes

export async function aiSuggestMaskLevel(
  value: string,
  dataType: string,
  role: string
): Promise<MaskLevel | undefined> {
  if (!API_KEY) return undefined;
  if (circuitOpen && Date.now() - lastFailure < CIRCUIT_TIMEOUT_MS)
    return undefined;
  try {
    // instantiate client lazily
    const gen = new GoogleGenerativeAI(API_KEY);
    const model = gen.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Return only one token level from: FULL, NONE, MASK_ALL, PARTIAL_LAST4, PARTIAL_LAST3 for:
value=${value}
dataType=${dataType}
role=${role}
Respond with exactly the level text.`;
    const result = (await Promise.race([
      model.generateContent(prompt),
      new Promise((_r, rej) =>
        setTimeout(() => rej(new Error("AI timeout")), 3000)
      ),
    ])) as any;
    const text = result?.response?.text?.()?.trim?.();
    if (!text) return undefined;
    if (
      ["FULL", "NONE", "MASK_ALL", "PARTIAL_LAST4", "PARTIAL_LAST3"].includes(
        text
      )
    )
      return text as MaskLevel;
    return undefined;
  } catch (err) {
    lastFailure = Date.now();
    circuitOpen = true;
    console.error("AI suggest failed:", err);
    return undefined;
  }
}
