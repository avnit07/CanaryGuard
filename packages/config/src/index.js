// ═══════════════════════════════════════════════════════
// CanaryGuard — Shared Configuration & Constants
// ═══════════════════════════════════════════════════════
// ─── Default Canary Steps ────────────────────────────
export const CANARY_STEPS = [5, 25, 50, 100];
// ─── Default Health Thresholds ───────────────────────
export const DEFAULT_THRESHOLDS = {
    errorRate: 5, // percent
    p99Latency: 1000, // milliseconds
    observationWindow: 120, // seconds
};
// ─── Worker Configuration ────────────────────────────
export const WORKER_CONFIG = {
    evaluationIntervalMs: 10000, // 10 seconds
    defaultServiceTargetUrl: process.env.SERVICE_TARGET_URL || "http://localhost:8080",
};
// ─── API Configuration ──────────────────────────────
export const API_CONFIG = {
    port: parseInt(process.env.API_PORT || "4000", 10),
    host: process.env.API_HOST || "0.0.0.0",
    corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:3000").split(","),
};
// ─── Deployment State Machine ────────────────────────
// Defines valid transitions between deployment statuses
export const VALID_TRANSITIONS = {
    PENDING: ["BUILDING", "DEPLOYING", "CANARY", "FAILED", "ROLLED_BACK"],
    BUILDING: ["DEPLOYING", "FAILED", "ROLLED_BACK"],
    DEPLOYING: ["CANARY", "CANARY_ACTIVE", "FAILED", "ROLLED_BACK"],
    CANARY: ["CANARY_ACTIVE", "CANARY_HEALTHY", "CANARY_DEGRADED", "CANARY_PAUSED", "OBSERVING", "PROMOTING", "PROMOTED", "ROLLED_BACK", "FAILED"],
    CANARY_ACTIVE: ["CANARY_HEALTHY", "CANARY_DEGRADED", "CANARY_PAUSED", "PROMOTING", "PROMOTED", "ROLLED_BACK", "FAILED"],
    CANARY_HEALTHY: ["CANARY_ACTIVE", "CANARY_DEGRADED", "CANARY_PAUSED", "PROMOTING", "PROMOTED", "ROLLED_BACK", "FAILED"],
    CANARY_DEGRADED: ["INVESTIGATING", "CANARY_PAUSED", "ROLLED_BACK", "FAILED"],
    CANARY_PAUSED: ["CANARY_ACTIVE", "CANARY_HEALTHY", "PROMOTING", "PROMOTED", "ROLLED_BACK", "FAILED"],
    OBSERVING: ["INVESTIGATING", "PROMOTING", "PROMOTED", "ROLLED_BACK", "FAILED"],
    INVESTIGATING: ["AWAITING_APPROVAL", "CANARY_PAUSED", "PROMOTING", "PROMOTED", "ROLLING_BACK", "ROLLED_BACK", "FAILED"],
    AWAITING_APPROVAL: ["ROLLING_BACK", "ROLLED_BACK", "PROMOTING", "PROMOTED", "FAILED"],
    PROMOTING: ["PROMOTED", "FAILED", "ROLLED_BACK"],
    ROLLING_BACK: ["ROLLED_BACK", "FAILED"],
    PROMOTED: [],
    ROLLED_BACK: [],
    FAILED: [],
};
// ─── Agent Configuration ─────────────────────────────
export const AGENT_CONFIG = {
    confidenceThreshold: 0.8,
    maxInvestigationDuration: 60, // seconds
    model: process.env.AI_MODEL || "gemini-1.5-flash",
};
//# sourceMappingURL=index.js.map