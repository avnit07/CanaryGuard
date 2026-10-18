// ═══════════════════════════════════════════════════════
// CanaryGuard API — Deployment Routes
// Core deployment lifecycle management
// ═══════════════════════════════════════════════════════

import { Router, Request, Response } from "express";
import { db, Prisma } from "@canaryguard/db";
import { VALID_TRANSITIONS } from "@canaryguard/config";
import { dispatchNotification } from "../lib/notifications.js";

const router = Router();

// ─── GET /api/deployments ───────────────────────────
// List all deployments with service info

router.get("/", async (req: Request, res: Response) => {
  try {
    const { serviceId, status, limit } = req.query;

    const deployments = await db.deployment.findMany({
      where: {
        ...(serviceId ? { serviceId: String(serviceId) } : {}),
        ...(status ? { status: String(status) } : {}),
      },
      include: {
        service: {
          select: { id: true, name: true, repository: true },
        },
        _count: {
          select: { steps: true, agentRuns: true },
        },
      },
      orderBy: { startedAt: "desc" },
      take: limit ? parseInt(String(limit), 10) : 50,
    });

    res.json({ data: deployments });
  } catch (error) {
    console.error("Failed to fetch deployments:", error);
    res.status(500).json({ error: "Failed to fetch deployments" });
  }
});

// ─── GET /api/deployments/:id ───────────────────────
// Get full deployment detail with steps, agent runs, approvals, audit trail

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const deployment = await db.deployment.findUnique({
      where: { id: req.params.id as string },
      include: {
        service: true,
        steps: {
          orderBy: { startedAt: "asc" },
        },
        agentRuns: {
          include: {
            evidence: {
              orderBy: { createdAt: "asc" },
            },
          },
          orderBy: { startedAt: "desc" },
        },
        approvals: {
          orderBy: { requestedAt: "desc" },
        },
        auditLogs: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!deployment) {
      res.status(404).json({ error: "Deployment not found" });
      return;
    }

    res.json({ data: deployment });
  } catch (error) {
    console.error("Failed to fetch deployment:", error);
    res.status(500).json({ error: "Failed to fetch deployment" });
  }
});

// ─── POST /api/deployments ──────────────────────────
// Start a new deployment — creates record + initial pipeline steps + audit entry

router.post("/", async (req: Request, res: Response) => {
  try {
    const { serviceId, version, gitCommit, image, triggeredBy } = req.body;

    if (!serviceId || !version) {
      res.status(400).json({ error: "serviceId and version are required" });
      return;
    }

    // Create deployment with its pipeline steps in a transaction
    const deployment = await db.$transaction(async (tx: Prisma.TransactionClient) => {
      const dep = await tx.deployment.create({
        data: {
          serviceId,
          version,
          gitCommit: gitCommit || "unknown",
          image: image || `${version}`,
          triggeredBy: triggeredBy || "system",
          status: "PENDING",
        },
      });

      // Create standard pipeline steps
      const stepTypes = ["BUILD", "DEPLOY", "CANARY", "OBSERVE", "DECIDE"];
      await tx.deploymentStep.createMany({
        data: stepTypes.map((stepType) => ({
          deploymentId: dep.id,
          stepType,
          status: "PENDING",
        })),
      });

      // Record the deployment start in audit log
      await tx.auditLog.create({
        data: {
          deploymentId: dep.id,
          actorType: "USER",
          actorId: triggeredBy || "system",
          action: "DEPLOYMENT_STARTED",
          metadata: { version, serviceId },
        },
      });

      return dep;
    });

    // Fetch complete deployment with relations
    const full = await db.deployment.findUnique({
      where: { id: deployment.id },
      include: {
        service: { select: { name: true } },
        steps: { orderBy: { startedAt: "asc" } },
      },
    });

    res.status(201).json({ data: full });
  } catch (error) {
    console.error("Failed to create deployment:", error);
    res.status(500).json({ error: "Failed to create deployment" });
  }
});

// ─── PATCH /api/deployments/:id ─────────────────────
// Update deployment status, canary traffic weight, or failure reason

async function handleUpdateDeployment(req: Request, res: Response) {
  try {
    const deploymentId = req.params.id as string;
    const { status, canaryWeight, notes, reason } = req.body;

    if (!status && canaryWeight === undefined && !notes && !reason) {
      res.status(400).json({ error: "At least one of status, canaryWeight, or notes is required" });
      return;
    }

    const deployment = await db.deployment.findUnique({
      where: { id: deploymentId },
      include: { service: { select: { name: true } } },
    });

    if (!deployment) {
      res.status(404).json({ error: "Deployment not found" });
      return;
    }

    const nextStatus = status || deployment.status;
    const nextWeight = canaryWeight !== undefined ? Number(canaryWeight) : deployment.canaryWeight;

    // Validate state machine transition if status is changing
    if (status && status !== deployment.status) {
      const allowed = VALID_TRANSITIONS[deployment.status] || [];
      if (allowed.length > 0 && !allowed.includes(status)) {
        res.status(400).json({
          error: `Invalid transition: ${deployment.status} → ${status}`,
          allowedTransitions: allowed,
        });
        return;
      }
    }

    const isTerminal = ["PROMOTED", "ROLLED_BACK", "FAILED"].includes(nextStatus);

    const updated = await db.$transaction(async (tx: Prisma.TransactionClient) => {
      const dep = await tx.deployment.update({
        where: { id: deploymentId },
        data: {
          status: nextStatus,
          canaryWeight: nextWeight,
          ...(isTerminal ? { completedAt: new Date() } : {}),
          ...(notes || reason ? { failureReason: notes || reason } : {}),
        },
      });

      // If promoted, update service version
      if (nextStatus === "PROMOTED") {
        await tx.service.update({
          where: { id: dep.serviceId },
          data: {
            currentVersion: dep.version,
            healthStatus: "HEALTHY",
          },
        });

        await tx.deploymentStep.updateMany({
          where: { deploymentId: dep.id, status: { in: ["PENDING", "RUNNING"] } },
          data: { status: "COMPLETED", completedAt: new Date() },
        });
      }

      // If rolled back, skip pending steps
      if (nextStatus === "ROLLED_BACK") {
        await tx.deploymentStep.updateMany({
          where: { deploymentId: dep.id, status: "RUNNING" },
          data: { status: "COMPLETED", completedAt: new Date() },
        });
        await tx.deploymentStep.updateMany({
          where: { deploymentId: dep.id, status: "PENDING" },
          data: { status: "SKIPPED" },
        });
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          deploymentId: dep.id,
          actorType: "USER",
          actorId: "canaryguard-control-plane",
          action: status ? `DEPLOYMENT_${status}` : "DEPLOYMENT_WEIGHT_UPDATED",
          metadata: {
            previousStatus: deployment.status,
            newStatus: nextStatus,
            previousWeight: deployment.canaryWeight,
            newWeight: nextWeight,
          } as Prisma.InputJsonValue,
        },
      });

      return dep;
    });

    if (status && status !== deployment.status && isTerminal) {
      await dispatchNotification({
        event: status === "ROLLED_BACK" ? "AUTO_ROLLBACK" : "CANARY_PROMOTED",
        serviceName: deployment.service.name,
        version: deployment.version,
        deploymentId: deployment.id,
        summary: `Deployment transitioned to ${status} (Traffic Weight: ${nextWeight}%)`,
      });
    }

    res.json({ data: updated });
  } catch (error) {
    console.error("Failed to update deployment:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to update deployment" });
  }
}

router.patch("/:id", handleUpdateDeployment);
router.patch("/:id/status", handleUpdateDeployment);

// ─── POST /api/deployments/:id/approve ──────────────
// Approve or reject a pending action (e.g. rollback)

router.post("/:id/approve", async (req: Request, res: Response) => {
  try {
    const { action, respondedBy, status, reason } = req.body;

    if (!action || !status) {
      res.status(400).json({ error: "action and status are required" });
      return;
    }

    const deploymentId = req.params.id as string;
    const result = await db.$transaction(async (tx: Prisma.TransactionClient) => {
      const approval = await tx.approval.create({
        data: {
          deploymentId,
          action: action || "ROLLBACK",
          respondedBy: respondedBy || "engineer",
          respondedAt: new Date(),
          status,
          reason: reason || null,
        },
      });

      if (status === "APPROVED" && action === "ROLLBACK") {
        await tx.deployment.update({
          where: { id: deploymentId },
          data: { status: "ROLLING_BACK" },
        });

        await tx.auditLog.create({
          data: {
            deploymentId,
            actorType: "USER",
            actorId: respondedBy || "engineer",
            action: "ROLLBACK_APPROVED",
            metadata: { reason },
          },
        });
      }

      if (status === "REJECTED") {
        await tx.auditLog.create({
          data: {
            deploymentId,
            actorType: "USER",
            actorId: respondedBy || "engineer",
            action: "ROLLBACK_REJECTED",
            metadata: { reason },
          },
        });
      }

      return approval;
    });

    res.json({ data: result });
  } catch (error) {
    console.error("Failed to process approval:", error);
    res.status(500).json({ error: "Failed to process approval" });
  }
});

export { router as deploymentRoutes };
