import type { MaskLevel, DecideResult, Role, DataType } from "./types";
import { applyMaskByLevel } from "./operators";
import { getMaskLevelFromPolicy, getRisk } from "./policyLoader";

// Extensible masking logic
export function decideMask(
  value: string,
  role: Role,
  dataType: DataType,
  aiSuggestLevel?: MaskLevel,
  customMasker?: (val: string) => string,
  customPattern?: RegExp,
  customLevel?: MaskLevel
): DecideResult {
  if (customMasker) {
    return {
      masked: customMasker(value),
      level: "CUSTOM_REGEX",
      reason: "Custom masker used.",
      source: "Custom",
    };
  }
  if (customPattern) {
    return {
      masked: value.replace(customPattern, "*"),
      level: "CUSTOM_REGEX",
      reason: "Custom regex pattern used.",
      source: "Custom",
    };
  }
  if (customLevel) {
    return {
      masked: applyMaskByLevel(customLevel, value),
      level: customLevel,
      reason: "Custom level override.",
      source: "Custom",
    };
  }
  // Existing policy/AI logic
  const policyLevel = getMaskLevelFromPolicy(role, dataType);
  const risk = getRisk(dataType);
  const baseLevel: MaskLevel = policyLevel ?? "MASK_ALL";
  let chosen: MaskLevel = baseLevel;
  let source: DecideResult["source"] = "Policy";
  let reason = `Policy level ${baseLevel} applied. Risk=${risk}.`;

  if (aiSuggestLevel) {
    // Clamp by risk if needed (your capByRisk logic here)
    chosen = aiSuggestLevel; // optionally clamp to risk
    source = "AI";
    reason = `AI suggested ${aiSuggestLevel}.`;
  }

  const masked = applyMaskByLevel(chosen, value);
  return { masked, level: chosen, reason, source };
}
