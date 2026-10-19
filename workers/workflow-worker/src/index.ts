// ═══════════════════════════════════════════════════════
// CanaryGuard — Workflow Worker Service Entry Point
// ═══════════════════════════════════════════════════════

import "dotenv/config";
import { canaryWorker, workerRollback, investigationWorker } from "./worker.js";
import { QUEUE_NAMES } from "./queues.js";

console.log(`
╔══════════════════════════════════════════════════╗
║                                                  ║
║   ⚙️ CanaryGuard Background Workflow Worker       ║
║   Listening on Redis (port 6379)                 ║
║                                                  ║
║   - Queue: ${QUEUE_NAMES.CANARY_EVALUATION}       ║
║   - Queue: ${QUEUE_NAMES.AI_INVESTIGATION}          ║
║   - Queue: ${QUEUE_NAMES.ROLLBACK}                  ║
║                                                  ║
╚══════════════════════════════════════════════════╝
`);

async function shutdown() {
  console.log("\n[Worker] Shutting down workers gracefully...");
  await Promise.all([
    canaryWorker.close(),
    workerRollback.close(),
    investigationWorker.close(),
  ]);
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
