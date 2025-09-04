export type Role = string;
export type DataType = "SSN" | "ACCOUNT_NUMBER" | "PHONE" | "EMAIL" | string;

export type MaskLevel =
  | "FULL"
  | "NONE"
  | "MASK_ALL"
  | "PARTIAL_LAST4"
  | "PARTIAL_LAST3"
  | "CUSTOM_REGEX";

export type RiskLevel = "HIGH" | "MEDIUM" | "LOW";

export type DecideResult = {
  masked: string;
  level: MaskLevel;
  reason: string;
  source: "Policy" | "AI" | "Fallback" | "Custom";
};
export type PolicyConfig = {
  roles: Role[];
  policy: Record<Role, Record<DataType, MaskLevel>>;
  riskByType: Record<DataType, RiskLevel>;
};
