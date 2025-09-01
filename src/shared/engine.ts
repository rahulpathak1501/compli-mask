import { getMaskLevelFromPolicy, getRisk } from "./policyLoader";
import { applyMaskByLevel, ssnMask, phoneMask } from "./operators";
import type {
  MaskLevel,
  RiskLevel,
  DecideResult,
  DataType,
  Role,
} from "./types";

function capByRisk(level: MaskLevel, risk: RiskLevel): MaskLevel {
  if (risk === "HIGH") {
    if (level === "FULL") return "PARTIAL_LAST4";
    return level;
  }
  if (risk === "MEDIUM") return level; // MEDIUM allows FULL
  return level;
}

function maskValueByLevel(level: MaskLevel, dataType: DataType, value: string) {
  // special-case formats
  if (dataType === "SSN") {
    if (level === "FULL" || level === "NONE") return value;
    if (level === "MASK_ALL") return value.replace(/\d/g, "*");
    if (level === "PARTIAL_LAST4" || level === "PARTIAL_LAST3") {
      if (level === "PARTIAL_LAST4") return ssnMask(value);
      const digits = value.replace(/\D/g, "");
      const show = digits.slice(-3);
      return `***-**-*${show}`;
    }
  }
  if (dataType === "PHONE") {
    if (level === "FULL" || level === "NONE") return value;
    if (level === "MASK_ALL") return value.replace(/\d/g, "*");
    if (level === "PARTIAL_LAST4") return phoneMask(value);
    if (level === "PARTIAL_LAST3") return value.replace(/\d(?=\d{3})/g, "*");
  }
  if (dataType === "EMAIL") {
    if (level === "FULL" || level === "NONE") return value;
    if (level === "MASK_ALL") return value.replace(/./g, "*");
    if (level === "PARTIAL_LAST4" || level === "PARTIAL_LAST3") {
      const [local, domain] = value.split("@");
      const keep = level === "PARTIAL_LAST4" ? 4 : 3;
      const localVisible = local.slice(-keep);
      const maskedLocal =
        local.length <= keep
          ? "***"
          : "*".repeat(local.length - keep) + localVisible;
      return `${maskedLocal}@${domain ?? ""}`;
    }
  }
  return applyMaskByLevel(level, value);
}

export function decideMask(
  value: string,
  role: Role,
  dataType: DataType,
  aiSuggestLevel?: MaskLevel
): DecideResult {
  // policy
  const policyLevel = getMaskLevelFromPolicy(role, dataType);
  const risk = getRisk(dataType);
  const baseLevel: MaskLevel = policyLevel ?? "MASK_ALL";

  let chosen: MaskLevel = baseLevel;
  let source: DecideResult["source"] = "Policy";
  let reason = `Policy level ${baseLevel} applied. Risk=${risk}.`;

  if (aiSuggestLevel) {
    const clamped = capByRisk(aiSuggestLevel, risk);
    const permissivenessRank: Record<MaskLevel, number> = {
      MASK_ALL: 0,
      PARTIAL_LAST3: 1,
      PARTIAL_LAST4: 2,
      NONE: 3,
      FULL: 4,
    };
    chosen =
      permissivenessRank[clamped] <= permissivenessRank[baseLevel]
        ? clamped
        : baseLevel;
    source = "AI";
    reason = `AI suggested ${aiSuggestLevel}, clamped to ${chosen} by policy/risk; policy base=${baseLevel}, risk=${risk}.`;
  } else {
    chosen = capByRisk(baseLevel, risk);
    source = "Policy";
    reason = `Policy ${baseLevel} clamped by risk ${risk} => ${chosen}`;
  }

  const masked = maskValueByLevel(chosen, dataType, value);
  return { masked, level: chosen, reason, source };
}
