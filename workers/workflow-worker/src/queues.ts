// ═══════════════════════════════════════════════════════
// CanaryGuard — BullMQ Queue Definitions
// ═══════════════════════════════════════════════════════

import { Queue } from "bullmq";
import { Redis } from "ioredis";

export const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  maxRetriesPerRequest: null,
};

export const redisConnection = new Redis(REDIS_CONFIG);

// ─── Queue Names ─────────────────────────────────────

export const QUEUE_NAMES = {
  CANARY_EVALUATION: "canary-evaluation-queue",
  AI_INVESTIGATION: "ai-investigation-queue",
  ROLLBACK: "rollback-queue",
} as const;

// ─── Job Payloads ─────────────────────────────────────

export interface CanaryEvaluationJobData {
  deploymentId: string;
  targetUrl: string; // canary target e.g. "http://localhost:8081"
  stepIndex: number; // 0 -> 5%, 1 -> 25%, 2 -> 50%, 3 -> 100%
  observationWindowSeconds?: number;
}

export interface AIInvestigationJobData {
  deploymentId: string;
  reason: string;
  breaches?: Array<{ type: string; message: string }>;
  metrics?: { errorRate: number; latencyP99Ms: number };
}

export interface RollbackJobData {
  deploymentId: string;
  reason: string;
  autoRollback: boolean;
  targetWeight?: number; // default 0
}

// ─── Queues ──────────────────────────────────────────

export const canaryEvaluationQueue = new Queue<CanaryEvaluationJobData>(
  QUEUE_NAMES.CANARY_EVALUATION,
  { connection: redisConnection }
);

export const aiInvestigationQueue = new Queue<AIInvestigationJobData>(
  QUEUE_NAMES.AI_INVESTIGATION,
  { connection: redisConnection }
);

export const rollbackQueue = new Queue<RollbackJobData>(
  QUEUE_NAMES.ROLLBACK,
  { connection: redisConnection }
);
