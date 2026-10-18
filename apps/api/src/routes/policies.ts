// ═══════════════════════════════════════════════════════
// CanaryGuard API — Policy Routes
// Manage rollback policies and health thresholds
// ═══════════════════════════════════════════════════════

import { Router, Request, Response } from "express";
import { db } from "@canaryguard/db";

const router = Router();

// ─── GET /api/policies ──────────────────────────────
// List all policies with service info

router.get("/", async (_req: Request, res: Response) => {
  try {
    const policies = await db.policy.findMany({
      include: {
        service: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ data: policies });
  } catch (error) {
    console.error("Failed to fetch policies:", error);
    res.status(500).json({ error: "Failed to fetch policies" });
  }
});

// ─── GET /api/policies/:id ──────────────────────────
// Get a single policy

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const policy = await db.policy.findUnique({
      where: { id: req.params.id as string },
      include: {
        service: true,
      },
    });

    if (!policy) {
      res.status(404).json({ error: "Policy not found" });
      return;
    }

    res.json({ data: policy });
  } catch (error) {
    console.error("Failed to fetch policy:", error);
    res.status(500).json({ error: "Failed to fetch policy" });
  }
});

// ─── POST /api/policies ─────────────────────────────
// Create a new rollback policy for a service

router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      serviceId,
      name,
      errorRateThreshold,
      latencyThreshold,
      observationWindowSeconds,
      autoRollback,
      requiresApproval,
    } = req.body;

    if (!serviceId || !name) {
      res.status(400).json({ error: "serviceId and name are required" });
      return;
    }

    const policy = await db.policy.create({
      data: {
        serviceId,
        name,
        errorRateThreshold: errorRateThreshold ?? 5,
        latencyThreshold: latencyThreshold ?? 1000,
        observationWindowSeconds: observationWindowSeconds ?? 120,
        autoRollback: autoRollback ?? false,
        requiresApproval: requiresApproval ?? true,
      },
      include: {
        service: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({ data: policy });
  } catch (error) {
    console.error("Failed to create policy:", error);
    res.status(500).json({ error: "Failed to create policy" });
  }
});

// ─── PUT /api/policies/:id ──────────────────────────
// Update a policy's thresholds or settings

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const {
      name,
      errorRateThreshold,
      latencyThreshold,
      observationWindowSeconds,
      autoRollback,
      requiresApproval,
      enabled,
    } = req.body;

    const policy = await db.policy.update({
      where: { id: req.params.id as string },
      data: {
        ...(name ? { name: String(name).trim() } : {}),
        ...(errorRateThreshold !== undefined ? { errorRateThreshold: Number(errorRateThreshold) } : {}),
        ...(latencyThreshold !== undefined ? { latencyThreshold: Number(latencyThreshold) } : {}),
        ...(observationWindowSeconds !== undefined ? { observationWindowSeconds: Number(observationWindowSeconds) } : {}),
        ...(autoRollback !== undefined ? { autoRollback: Boolean(autoRollback) } : {}),
        ...(requiresApproval !== undefined ? { requiresApproval: Boolean(requiresApproval) } : {}),
        ...(enabled !== undefined ? { enabled: Boolean(enabled) } : {}),
      },
      include: {
        service: { select: { id: true, name: true } },
      },
    });

    res.json({ data: policy });
  } catch (error: any) {
    if (error?.code === "P2025") {
      res.status(404).json({ error: "Policy not found" });
      return;
    }
    console.error("Failed to update policy:", error);
    res.status(500).json({ error: "Failed to update policy" });
  }
});

// ─── DELETE /api/policies/:id ───────────────────────
// Delete a policy

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    await db.policy.delete({
      where: { id: req.params.id as string },
    });

    res.json({ message: "Policy deleted" });
  } catch (error: any) {
    if (error?.code === "P2025") {
      res.status(404).json({ error: "Policy not found" });
      return;
    }
    console.error("Failed to delete policy:", error);
    res.status(500).json({ error: "Failed to delete policy" });
  }
});

export { router as policyRoutes };
