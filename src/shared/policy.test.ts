import type { MaskLevel, RiskLevel, PolicyConfig } from "./types";
import { loadPolicySync } from "./policyLoader";
import { MaskingLevel } from "./enums";

export class PolicyEngine {
  private policy: PolicyConfig;

  constructor() {
    this.policy = loadPolicySync();
  }

  getMaskLevel(role: string, dataType: string): MaskLevel | null {
    return this.policy.policy[role]?.[dataType] ?? null;
  }

  getRisk(dataType: string): RiskLevel {
    return this.policy.riskByType[dataType] ?? "LOW";
  }

  capByRisk(level: MaskLevel, risk: RiskLevel, role: string): MaskLevel {
    if (
      risk === "HIGH" &&
      (level === MaskingLevel.FULL || level === MaskingLevel.NONE)
    ) {
      return MaskingLevel.PARTIAL_LAST4;
    }
    return level;
  }

  isUnmaskAllowed(role: string, dataType: string): boolean {
    const risk = this.getRisk(dataType);
    if (risk === "HIGH") {
      return role === "Administrator";
    }
    if (risk === "MEDIUM") {
      return ["Administrator", "Regional Manager", "Manager"].includes(role);
    }
    return true;
  }

  getEffectiveMaskLevel(
    role: string,
    dataType: string
  ): { level: MaskLevel; reason: string } {
    const base = this.getMaskLevel(role, dataType) ?? MaskingLevel.MASK_ALL;
    const risk = this.getRisk(dataType);
    const effective = this.capByRisk(base, risk, role);
    const reason =
      effective !== base
        ? `Policy ${base} capped to ${effective} due to ${risk} risk`
        : `Policy ${base} applied for ${role} on ${dataType}`;
    return { level: effective, reason };
  }

  getMaxRevealLevel(
    role: string,
    dataType: string,
    hasStepUp: boolean = false
  ): MaskLevel {
    const risk = this.getRisk(dataType);
    if (risk === "HIGH") {
      if (role === "Administrator" && hasStepUp) return MaskingLevel.FULL;
      return MaskingLevel.PARTIAL_LAST4;
    }
    if (risk === "MEDIUM") {
      return ["Administrator", "Regional Manager", "Manager"].includes(role)
        ? MaskingLevel.FULL
        : MaskingLevel.PARTIAL_LAST4;
    }
    return MaskingLevel.FULL;
  }
}

export const policyEngine = new PolicyEngine();
