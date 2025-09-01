import express from "express";
import { decideMask } from "../../shared/engine";
import { aiSuggestMaskLevel } from "../ai";
import { makeCacheKey, cacheGet, cacheSet } from "../cache";

const router = express.Router();

router.post("/mask", async (req, res) => {
  try {
    const { value, dataType, role } = req.body as {
      value: string;
      dataType: string;
      role: string;
    };
    if (typeof value !== "string")
      return res.status(400).json({ error: "value required" });

    const key = makeCacheKey(value, dataType, role);
    const cached = cacheGet(key);
    if (cached) return res.json({ ...cached, cached: true });

    // try AI suggestion (best-effort)
    const aiLevel = await aiSuggestMaskLevel(value, dataType, role);
    const result = decideMask(value, role, dataType, aiLevel);
    // store cached result (do not store raw value)
    cacheSet(
      key,
      {
        masked: result.masked,
        level: result.level,
        reason: result.reason,
        source: result.source,
      },
      1000 * 60 * 60
    );
    return res.json({
      masked: result.masked,
      level: result.level,
      reason: result.reason,
      source: result.source,
    });
  } catch (err) {
    console.error("mask route error:", err);
    // very safe fallback
    const fallback = {
      masked: "***",
      level: "MASK_ALL",
      reason: "Fallback due to error",
      source: "Fallback",
    };
    return res.status(500).json(fallback);
  }
});

export default router;
