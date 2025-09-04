import {
  setAIMaskingProviders,
  aiSuggestMaskLevel,
  setDefaultNoopProvider,
} from "./ai";
import type { AIMaskingProvider } from "./ai";

// Example: Google AI provider
const googleProvider: AIMaskingProvider = async (value, dataType, role) => {
  // Use Google Generative AI SDK here
  // Return masking level, e.g., "MASK_ALL", or undefined if failure
  // (pseudocode below)
  // const result = await googleAI.getMaskLevel(value, dataType, role);
  // return result.level;
  return "MASK_ALL";
};

// Example: OpenAI provider
const openAIProvider: AIMaskingProvider = async (value, dataType, role) => {
  // Use OpenAI SDK here
  // Return masking level, e.g., "FULL"
  // (pseudocode below)
  // const result = await openai.getMaskLevel({value, dataType, role});
  // return result.level;
  return "FULL";
};

// Example: Custom local rule provider
const customProvider: AIMaskingProvider = async (value, dataType, role) => {
  if (dataType === "EMAIL") return "PARTIAL_LAST3";
  return undefined; // let next provider handle it
};

// Register providers (order matters: first to return non-undefined wins)
setAIMaskingProviders([
  customProvider, // Try custom rules first
  googleProvider, // Then Google AI
  openAIProvider, // Then OpenAI
]);

// Usage in masking code
async function getMaskingLevelForUserField(
  value: string,
  dataType: string,
  role: string
) {
  const level = await aiSuggestMaskLevel(value, dataType, role);
  // level could be "MASK_ALL", "FULL", "PARTIAL_LAST3", etc. or undefined
  if (level === undefined) {
    // Fallback to policy or default masking
    return "MASK_ALL";
  }
  return Array.isArray(level) ? level[0] : level;
}

// Set a default no-op provider (disables all AI, always returns undefined)
setDefaultNoopProvider();
