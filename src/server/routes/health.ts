import express from "express";
import { maskPatternRegistry } from "../../shared/maskPatterns";
import { loadPolicySync } from "../../shared/policyLoader";

const router = express.Router();

// Health check endpoint for Kubernetes/Docker
router.get("/healthz", (_req, res) => {
  try {
    // Basic health checks
    const policy = loadPolicySync();
    const patterns = maskPatternRegistry.list();
    
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "unknown",
      checks: {
        policy: policy ? "ok" : "error",
        patterns: patterns.length > 0 ? "ok" : "error",
        cache: "ok", // Basic check - could be enhanced
      },
    };

    res.json(health);
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Readiness check endpoint for Kubernetes
router.get("/readyz", (_req, res) => {
  try {
    // More thorough readiness checks
    const policy = loadPolicySync();
    const patterns = maskPatternRegistry.list();
    
    const readiness = {
      status: "ready",
      timestamp: new Date().toISOString(),
      components: {
        policy: {
          status: policy ? "ready" : "not_ready",
          roles: policy?.roles?.length || 0,
          dataTypes: Object.keys(policy?.riskByType || {}).length,
        },
        patterns: {
          status: patterns.length > 0 ? "ready" : "not_ready",
          count: patterns.length,
        },
        cache: {
          status: "ready",
          provider: process.env.CACHE_PROVIDER || "memory",
        },
      },
    };

    const allReady = Object.values(readiness.components).every(
      (comp: any) => comp.status === "ready"
    );

    if (allReady) {
      res.json(readiness);
    } else {
      res.status(503).json(readiness);
    }
  } catch (error) {
    res.status(503).json({
      status: "not_ready",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Basic Prometheus-style metrics endpoint
router.get("/metrics", (_req, res) => {
  try {
    const policy = loadPolicySync();
    const patterns = maskPatternRegistry.list();
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();

    // Generate Prometheus-style metrics
    const metrics = [
      `# HELP compli_mask_uptime_seconds Total uptime in seconds`,
      `# TYPE compli_mask_uptime_seconds counter`,
      `compli_mask_uptime_seconds ${uptime}`,
      "",
      `# HELP compli_mask_policy_roles_total Number of roles in policy`,
      `# TYPE compli_mask_policy_roles_total gauge`,
      `compli_mask_policy_roles_total ${policy?.roles?.length || 0}`,
      "",
      `# HELP compli_mask_patterns_total Number of registered mask patterns`,
      `# TYPE compli_mask_patterns_total gauge`,
      `compli_mask_patterns_total ${patterns.length}`,
      "",
      `# HELP compli_mask_memory_usage_bytes Memory usage in bytes`,
      `# TYPE compli_mask_memory_usage_bytes gauge`,
      `compli_mask_memory_usage_bytes{type="rss"} ${memUsage.rss}`,
      `compli_mask_memory_usage_bytes{type="heapTotal"} ${memUsage.heapTotal}`,
      `compli_mask_memory_usage_bytes{type="heapUsed"} ${memUsage.heapUsed}`,
      `compli_mask_memory_usage_bytes{type="external"} ${memUsage.external}`,
      "",
    ].join("\n");

    res.set("Content-Type", "text/plain; charset=utf-8");
    res.send(metrics);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Information endpoint for API discovery
router.get("/info", (_req, res) => {
  try {
    const policy = loadPolicySync();
    const patterns = maskPatternRegistry.list();

    const info = {
      name: "compli-mask",
      version: process.env.npm_package_version || "unknown",
      description: "Compliance-focused data masking service",
      timestamp: new Date().toISOString(),
      api: {
        endpoints: {
          mask: "POST /api/mask",
          unmask: "POST /api/unmask",
          health: "GET /api/healthz",
          readiness: "GET /api/readyz",
          metrics: "GET /api/metrics",
          info: "GET /api/info",
        },
      },
      configuration: {
        roles: policy?.roles || [],
        dataTypes: Object.keys(policy?.riskByType || {}),
        patterns: patterns.map(p => ({
          id: p.id,
          name: p.name,
          level: p.level,
          dataTypes: p.dataTypes || ["all"],
        })),
        cache: {
          provider: process.env.CACHE_PROVIDER || "memory",
          ttl: process.env.CACHE_TTL_MS || "3600000",
        },
      },
    };

    res.json(info);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;