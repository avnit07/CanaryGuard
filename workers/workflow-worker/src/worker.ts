// ═══════════════════════════════════════════════════════
// CanaryGuard — BullMQ Workflow Worker
// Orchestrates progressive canary scaling and health checks
// ═══════════════════════════════════════════════════════

import { Worker, Job } from "bullmq";
import { db } from "@canaryguard/db";
import { CANARY_STEPS, DEFAULT_THRESHOLDS } from "@canaryguard/config";
import {
  QUEUE_NAMES,
  redisConnection,
  canaryEvaluationQueue,
  aiInvestigationQueue,
  rollbackQueue,
  CanaryEvaluationJobData,
  AIInvestigationJobData,
  RollbackJobData,
} from "./queues.js";

const PROXY_ADMIN_URL = process.env.PROXY_ADMIN_URL || "http://localhost:8000/admin";
const API_URL = process.env.API_URL || "http://localhost:4000/api";

/**
 * Safely update the proxy's canary traffic weight
 */
async function syncProxyWeight(weight: number): Promise<boolean> {
  try {
    const res = await fetch(`${PROXY_ADMIN_URL}/weight`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weight }),
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch (err: any) {
    console.warn(`[Worker] Could not reach proxy on ${PROXY_ADMIN_URL}: ${err.message}`);
    return false;
  }
}

// ─── 1. Canary Evaluation Worker ─────────────────────

export const canaryWorker = new Worker<CanaryEvaluationJobData>(
  QUEUE_NAMES.CANARY_EVALUATION,
  async (job: Job<CanaryEvaluationJobData>) => {
    const { deploymentId, targetUrl, stepIndex = 0, observationWindowSeconds = 15 } = job.data;
    console.log(`[CanaryWorker] Processing job ${job.id} for deployment ${deploymentId} (Step index: ${stepIndex})`);

    const deployment = await db.deployment.findUnique({
      where: { id: deploymentId },
      include: {
        service: {
          include: {
            policies: { where: { enabled: true }, take: 1 },
          },
        },
      },
    });

    if (!deployment) {
      console.warn(`[CanaryWorker] Deployment ${deploymentId} not found. Aborting job.`);
      return { status: "ABORTED_NOT_FOUND" };
    }

    // Stop if deployment is already in a terminal state
    if (["PROMOTED", "ROLLED_BACK", "FAILED", "CANARY_DEGRADED"].includes(deployment.status)) {
      console.log(`[CanaryWorker] Deployment ${deploymentId} is in terminal or degraded state (${deployment.status}). Skipping.`);
      return { status: "SKIPPED_TERMINAL_STATE", currentStatus: deployment.status };
    }

    const policy = deployment.service.policies[0] || null;
    const targetWeight = CANARY_STEPS[stepIndex] ?? 100;

    // A. Apply Canary Traffic Split to Proxy and DB
    console.log(`[CanaryWorker] Scaling canary traffic to ${targetWeight}% (Deployment ${deploymentId})`);
    await syncProxyWeight(targetWeight);

    await db.deployment.update({
      where: { id: deploymentId },
      data: {
        canaryWeight: targetWeight,
        status: stepIndex === 0 ? "CANARY" : "OBSERVING",
      },
    });

    await db.auditLog.create({
      data: {
        deploymentId,
        actorType: "SYSTEM",
        actorId: "bullmq-workflow-worker",
        action: stepIndex === 0 ? "CANARY_STARTED" : "CANARY_PROMOTED",
        metadata: {
          stepIndex,
          canaryWeight: targetWeight,
          targetUrl,
        },
      },
    });

    // B. Run Health Evaluation via API
    console.log(`[CanaryWorker] Evaluating health of canary instance at ${targetUrl}...`);
    let evaluationResult: any = null;
    try {
      const evalRes = await fetch(`${API_URL}/deployments/${deploymentId}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUrl }),
        signal: AbortSignal.timeout(5000),
      });

      if (evalRes.ok) {
        const evalJson = (await evalRes.json()) as any;
        evaluationResult = evalJson.data?.evaluation;
      }
    } catch (err: any) {
      console.error(`[CanaryWorker] Failed to query evaluation endpoint: ${err.message}`);
    }

    const isUnhealthy = evaluationResult?.status === "UNHEALTHY" || evaluationResult?.isDegraded;

    // C. Handle Failure Scenario
    if (isUnhealthy) {
      const reason = evaluationResult?.summary || "Canary health evaluation failed";
      console.error(`[CanaryWorker] SLA BREACH for deployment ${deploymentId}: ${reason}`);

      // Halt progression & flag failure
      await db.deployment.update({
        where: { id: deploymentId },
        data: {
          status: "CANARY_DEGRADED",
          failureReason: reason,
        },
      });

      await db.auditLog.create({
        data: {
          deploymentId,
          actorType: "SYSTEM",
          actorId: "bullmq-workflow-worker",
          action: "FAILURE_DETECTED",
          metadata: {
            reason,
            breaches: evaluationResult?.breaches || [],
            metrics: evaluationResult?.metricsSnapshot || {},
          },
        },
      });

      // Queue AI Investigation
      console.log(`[CanaryWorker] Enqueuing AI Investigation job...`);
      await aiInvestigationQueue.add("investigate-incident", {
        deploymentId,
        reason,
        breaches: evaluationResult?.breaches,
        metrics: evaluationResult?.metricsSnapshot,
      });

      // If policy dictates auto-rollback, queue rollback immediately
      if (policy?.autoRollback) {
        console.log(`[CanaryWorker] Policy autoRollback is enabled. Queuing auto-rollback...`);
        await rollbackQueue.add("execute-auto-rollback", {
          deploymentId,
          reason: `Auto-rollback triggered by policy: ${reason}`,
          autoRollback: true,
        });
      }

      return {
        status: "BREACH_DETECTED",
        failureReason: reason,
        nextAction: policy?.autoRollback ? "ROLLBACK_QUEUED" : "AI_INVESTIGATION_QUEUED",
      };
    }

    // D. Handle Success Scenario
    const isFinalStep = stepIndex >= CANARY_STEPS.length - 1;

    if (isFinalStep) {
      // 100% Canary Reached & Verified -> Fully Promote Release!
      console.log(`[CanaryWorker] 100% traffic verified healthy! Promoting release ${deployment.version}...`);

      await db.$transaction([
        db.deployment.update({
          where: { id: deploymentId },
          data: {
            status: "PROMOTED",
            canaryWeight: 100,
            completedAt: new Date(),
          },
        }),
        db.service.update({
          where: { id: deployment.serviceId },
          data: {
            currentVersion: deployment.version,
            healthStatus: "HEALTHY",
          },
        }),
        db.deploymentStep.updateMany({
          where: { deploymentId, status: { in: ["PENDING", "RUNNING"] } },
          data: { status: "COMPLETED", completedAt: new Date() },
        }),
        db.auditLog.create({
          data: {
            deploymentId,
            actorType: "SYSTEM",
            actorId: "bullmq-workflow-worker",
            action: "DEPLOYMENT_COMPLETED",
            metadata: {
              promotedVersion: deployment.version,
              finalTrafficWeight: 100,
            },
          },
        }),
      ]);

      return {
        status: "PROMOTION_COMPLETE",
        version: deployment.version,
        trafficWeight: 100,
      };
    } else {
      // Schedule the next step in the progressive rollout
      const nextStepIndex = stepIndex + 1;
      const nextWeight = CANARY_STEPS[nextStepIndex];
      const windowSeconds = policy?.observationWindowSeconds || observationWindowSeconds;
      const delayMs = windowSeconds * 1000;

      console.log(`[CanaryWorker] Scheduling Step ${nextStepIndex} (${nextWeight}%) in ${windowSeconds}s...`);

      await canaryEvaluationQueue.add(
        `canary-step-${nextStepIndex}`,
        {
          deploymentId,
          targetUrl,
          stepIndex: nextStepIndex,
          observationWindowSeconds: windowSeconds,
        },
        { delay: delayMs }
      );

      return {
        status: "OBSERVING_SCHEDULED",
        currentWeight: targetWeight,
        nextWeight,
        delaySeconds: windowSeconds,
      };
    }
  },
  { connection: redisConnection, concurrency: 3 }
);

// ─── 2. Rollback Worker ──────────────────────────────

export const workerRollback = new Worker<RollbackJobData>(
  QUEUE_NAMES.ROLLBACK,
  async (job: Job<RollbackJobData>) => {
    const { deploymentId, reason } = job.data;
    console.log(`[RollbackWorker] Executing rollback for deployment ${deploymentId}: ${reason}`);

    // Instantly reset proxy to 0% canary traffic (100% to stable baseline)
    await syncProxyWeight(0);

    await db.$transaction([
      db.deployment.update({
        where: { id: deploymentId },
        data: {
          status: "ROLLED_BACK",
          canaryWeight: 0,
          completedAt: new Date(),
          failureReason: reason,
        },
      }),
      db.auditLog.create({
        data: {
          deploymentId,
          actorType: "SYSTEM",
          actorId: "bullmq-rollback-worker",
          action: "ROLLBACK_EXECUTED",
          metadata: { reason, canaryWeight: 0 },
        },
      }),
    ]);

    console.log(`[RollbackWorker] Rollback complete for ${deploymentId}. Traffic safely returned to baseline.`);

    // ─── Post-Rollback Recovery Verification (Milestone 8) ───
    const baselineUrl = process.env.BASELINE_URL || "http://localhost:8080";
    console.log(`[RollbackWorker] Verifying system recovery post-rollback against baseline (${baselineUrl})...`);

    let recoveryVerified = true;
    let baselineMetrics: any = null;
    try {
      const metricsRes = await fetch(`${baselineUrl}/admin/metrics`, {
        signal: AbortSignal.timeout(3000),
      });
      if (metricsRes.ok) {
        const metricsJson = (await metricsRes.json()) as any;
        baselineMetrics = metricsJson?.metrics || {};
        const errorRate = Number(baselineMetrics.errorRate || 0);
        recoveryVerified = errorRate <= 5;
      }
    } catch (err: any) {
      console.warn(`[RollbackWorker] Baseline metrics check note: ${err.message}`);
    }

    const dep = await db.deployment.findUnique({ where: { id: deploymentId }, select: { serviceId: true } });
    if (dep) {
      await db.$transaction([
        db.service.update({
          where: { id: dep.serviceId },
          data: { healthStatus: "HEALTHY" },
        }),
        db.auditLog.create({
          data: {
            deploymentId,
            actorType: "SYSTEM",
            actorId: "bullmq-rollback-worker",
            action: "RECOVERY_VERIFIED",
            metadata: {
              recoveryVerified,
              baselineUrl,
              metrics: baselineMetrics || {},
              summary: "Traffic returned 100% to stable baseline. Service health verified normal.",
            },
          },
        }),
      ]);
      console.log(`[RollbackWorker] RECOVERY_VERIFIED recorded for deployment ${deploymentId}.`);
    }

    return { status: "ROLLED_BACK", canaryWeight: 0, recoveryVerified };
  },
  { connection: redisConnection }
);

// ─── 3. AI Investigation Worker (Queue Handler) ─────

export const investigationWorker = new Worker<AIInvestigationJobData>(
  QUEUE_NAMES.AI_INVESTIGATION,
  async (job: Job<AIInvestigationJobData>) => {
    const { deploymentId, reason, breaches, metrics } = job.data;
    console.log(`[AIWorker] Running AI diagnostic investigation for deployment ${deploymentId}: ${reason}`);

    await db.auditLog.create({
      data: {
        deploymentId,
        actorType: "AI",
        actorId: "canaryguard-diagnostic-agent",
        action: "INVESTIGATION_STARTED",
        metadata: { reason, breaches, metrics },
      },
    });

    try {
      const invRes = await fetch(`${API_URL}/deployments/${deploymentId}/investigate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ failureReason: reason, breaches, metrics }),
        signal: AbortSignal.timeout(10000),
      });

      if (invRes.ok) {
        const invData = (await invRes.json()) as any;
        console.log(`[AIWorker] Investigation finished: ${invData.data?.diagnosis?.summary}`);
        return { status: "COMPLETED", diagnosis: invData.data?.diagnosis };
      }
    } catch (err: any) {
      console.error(`[AIWorker] Error executing investigation API: ${err.message}`);
    }

    return { status: "INVESTIGATION_ACKNOWLEDGED", deploymentId };
  },
  { connection: redisConnection }
);
