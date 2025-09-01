// src/server/cache.ts
import * as crypto from "crypto";

// Simple in-memory cache for now - will be replaced with abstraction layer
const CACHE = new Map<string, any>();
const SALT = process.env.CACHE_SALT ?? "dev-salt";

export function makeCacheKey(value: string, dataType: string, role: string) {
  const h = crypto
    .createHash("sha256")
    .update(SALT + "|" + dataType + "|" + role + "|" + value)
    .digest("hex");
  return h;
}

export function cacheGet(key: string) {
  return CACHE.get(key);
}

export function cacheSet(key: string, val: any, ttlMs = 1000 * 60 * 60) {
  CACHE.set(key, val);
  setTimeout(() => CACHE.delete(key), ttlMs);
}

// Aliases for consistency
export const cacheGetSync = cacheGet;
export const cacheSetSync = cacheSet;
