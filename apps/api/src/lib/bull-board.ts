// ═══════════════════════════════════════════════════════
// CanaryGuard API — Bull-Board Queue Dashboard Setup
// ═══════════════════════════════════════════════════════

import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { Queue } from "bullmq";
import { Redis } from "ioredis";

const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  maxRetriesPerRequest: null,
};

const redisConnection = new Redis(REDIS_CONFIG);

// ─── Queues for Dashboard ─────────────────────────────

export const canaryEvaluationQueue = new Queue("canary-evaluation-queue", { connection: redisConnection });
export const aiInvestigationQueue = new Queue("ai-investigation-queue", { connection: redisConnection });
export const rollbackQueue = new Queue("rollback-queue", { connection: redisConnection });

// ─── Setup Bull-Board UI Adapter ──────────────────────

export const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [
    new BullMQAdapter(canaryEvaluationQueue),
    new BullMQAdapter(aiInvestigationQueue),
    new BullMQAdapter(rollbackQueue),
  ],
  serverAdapter,
});
