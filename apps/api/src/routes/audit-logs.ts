// ═══════════════════════════════════════════════════════
// CanaryGuard API — Audit Log Routes
// Read-only access to the deployment audit trail
// ═══════════════════════════════════════════════════════

import { Router, Request, Response } from "express";
import { db } from "@canaryguard/db";

const router = Router();

// ─── GET /api/audit-logs ────────────────────────────
// List audit logs with optional filters

router.get("/", async (req: Request, res: Response) => {
  try {
    const { deploymentId, action, actorType, limit } = req.query;

    const logs = await db.auditLog.findMany({
      where: {
        ...(deploymentId ? { deploymentId: String(deploymentId) } : {}),
        ...(action ? { action: String(action) } : {}),
        ...(actorType ? { actorType: String(actorType) } : {}),
      },
      include: {
        deployment: {
          select: {
            id: true,
            version: true,
            service: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit ? parseInt(String(limit), 10) : 50,
    });

    res.json({ data: logs });
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

// ─── GET /api/audit-logs/:id ────────────────────────
// Get a single audit log entry

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const log = await db.auditLog.findUnique({
      where: { id: req.params.id as string },
      include: {
        deployment: {
          include: { service: true },
        },
      },
    });

    if (!log) {
      res.status(404).json({ error: "Audit log not found" });
      return;
    }

    res.json({ data: log });
  } catch (error) {
    console.error("Failed to fetch audit log:", error);
    res.status(500).json({ error: "Failed to fetch audit log" });
  }
});

export { router as auditLogRoutes };
