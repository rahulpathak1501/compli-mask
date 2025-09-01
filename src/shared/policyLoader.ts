import * as fs from "fs";
import * as path from "path";
import type { MaskLevel, RiskLevel, DataType, Role } from "./types";

export type Policy = {
  roles: Role[];
  policy: Record<Role, Record<DataType, MaskLevel>>;
  riskByType: Record<DataType, RiskLevel>;
};

let _policy: Policy | null = null;

export function loadPolicySync(): Policy {
  if (_policy) return _policy;
  const p = path.resolve(process.cwd(), "src/config/policy.json");
  const raw = fs.readFileSync(p, "utf8");
  _policy = JSON.parse(raw) as Policy;
  return _policy;
}

export function getMaskLevelFromPolicy(
  role: Role,
  dataType: DataType
): MaskLevel | undefined {
  const policy = loadPolicySync();
  return policy.policy?.[role]?.[dataType];
}

export function getRisk(dataType: DataType): RiskLevel {
  const policy = loadPolicySync();
  return policy.riskByType?.[dataType] ?? "LOW";
}
