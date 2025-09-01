// src/server/routes/unmask.ts
import express from "express";
import {
  loadPolicySync,
  getMaskLevelFromPolicy,
} from "../../shared/policyLoader";

const router = express.Router();

router.post("/unmask", async (req, res) => {
  try {
    const { recordId, field, role } = req.body as {
      recordId: string;
      field: string;
      role: string;
      purpose?: string;
    };

    if (!recordId || !field || !role)
      return res.status(400).json({ error: "missing params" });

    // Security: enforce server-side role checks from policy
    const policy = loadPolicySync();
    // get policy level that applies to this role+field
    const level = getMaskLevelFromPolicy(role, field);
    const risk = policy.riskByType?.[field] ?? "LOW";

    // HIGH risk: only Administrator with step-up token allowed full reveal (example)
    if (risk === "HIGH" && role !== "Administrator") {
      // deny full unmask: return PARTIAL_LAST4
      // In real world: query DB for recordId, return only partial masked content
      return res.status(403).json({
        allowed: false,
        reason: "High risk data requires privileged access",
        level: "PARTIAL_LAST4",
      });
    }

    // For demo: allow reveal per policy
    // In a real app: check audit, rate limits, step-up 2FA, etc.
    // Return minimally revealed output (server queries DB normally)
    // Here we return a placeholder "revealed" which should come from DB with redaction rules applied.
    return res.json({
      allowed: true,
      revealed: "REDACTED_FOR_DEMO",
      level: level ?? "MASK_ALL",
      reason: "Server-side reveal (demo).",
    });
  } catch (err) {
    console.error("unmask error", err);
    return res.status(500).json({ error: "internal" });
  }
});

export default router;
