// ═══════════════════════════════════════════════════════
// CanaryGuard API — Bull-Board Queue Dashboard Setup
// ═══════════════════════════════════════════════════════

import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { Queue } from "bullmq";
import { Redis } from "ioredis";

function parseRedisUrl(raw?: string): string | undefined {
  if (!raw) return undefined;
  const match = raw.match(/rediss?:\/\/[^\s'"]+/);
  let url = match ? match[0] : raw.trim();
  if (url.includes("upstash.io") && url.startsWith("redis://")) {
    url = url.replace(/^redis:\/\//, "rediss://");
  }
  return url;
}

const redisUrl = parseRedisUrl(process.env.REDIS_URL);

export const redisConnection = redisUrl
  ? new Redis(redisUrl, { maxRetriesPerRequest: null })
  : new Redis({
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: parseInt(process.env.REDIS_PORT || "6379", 10),
      maxRetriesPerRequest: null,
    });

redisConnection.on("error", (err) => {
  console.warn(`[Redis API] Warning: ${err.message}`);
});

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
