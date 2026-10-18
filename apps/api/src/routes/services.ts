// ═══════════════════════════════════════════════════════
// CanaryGuard API — Service Routes
// CRUD operations for managed services
// ═══════════════════════════════════════════════════════

import { Router, Request, Response } from "express";
import { db } from "@canaryguard/db";

const router = Router();

// ─── GET /api/services ──────────────────────────────
// List all services with their latest deployment + count

router.get("/", async (_req: Request, res: Response) => {
  try {
    const services = await db.service.findMany({
      include: {
        deployments: {
          orderBy: { startedAt: "desc" },
          take: 1,
          select: {
            id: true,
            version: true,
            status: true,
            startedAt: true,
            canaryWeight: true,
          },
        },
        _count: {
          select: { deployments: true },
        },
      },
      orderBy: { name: "asc" },
    });

    res.json({ data: services });
  } catch (error) {
    console.error("Failed to fetch services:", error);
    res.status(500).json({ error: "Failed to fetch services" });
  }
});

// ─── GET /api/services/:id ──────────────────────────
// Get a single service with its deployments and policies

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const service = await db.service.findUnique({
      where: { id: req.params.id as string },
      include: {
        deployments: {
          orderBy: { startedAt: "desc" },
          take: 10,
        },
        policies: {
          where: { enabled: true },
        },
      },
    });

    if (!service) {
      res.status(404).json({ error: "Service not found" });
      return;
    }

    res.json({ data: service });
  } catch (error) {
    console.error("Failed to fetch service:", error);
    res.status(500).json({ error: "Failed to fetch service" });
  }
});

// ─── POST /api/services ─────────────────────────────
// Register a new service to be managed by CanaryGuard

router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, repository, kubernetesNamespace, deploymentName, currentVersion } = req.body;

    if (!name || !repository) {
      res.status(400).json({ error: "name and repository are required" });
      return;
    }

    const service = await db.service.create({
      data: {
        name: String(name).trim(),
        repository: String(repository).trim(),
        kubernetesNamespace: kubernetesNamespace ? String(kubernetesNamespace).trim() : "production",
        deploymentName: deploymentName ? String(deploymentName).trim() : String(name).trim(),
        currentVersion: currentVersion ? String(currentVersion).trim() : "v1.0.0",
        healthStatus: "HEALTHY",
      },
    });

    res.status(201).json({ data: service });
  } catch (error: any) {
    if (error?.code === "P2002") {
      res.status(409).json({ error: `A service with name '${req.body.name}' already exists` });
      return;
    }
    console.error("Failed to create service:", error);
    res.status(500).json({ error: "Failed to create service" });
  }
});

// ─── PUT /api/services/:id ──────────────────────────
// Update a service's configuration

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { name, repository, kubernetesNamespace, deploymentName, currentVersion, healthStatus } = req.body;

    const service = await db.service.update({
      where: { id: req.params.id as string },
      data: {
        ...(name ? { name: String(name).trim() } : {}),
        ...(repository ? { repository: String(repository).trim() } : {}),
        ...(kubernetesNamespace ? { kubernetesNamespace: String(kubernetesNamespace).trim() } : {}),
        ...(deploymentName ? { deploymentName: String(deploymentName).trim() } : {}),
        ...(currentVersion ? { currentVersion: String(currentVersion).trim() } : {}),
        ...(healthStatus ? { healthStatus: String(healthStatus).trim() } : {}),
      },
    });

    res.json({ data: service });
  } catch (error: any) {
    if (error?.code === "P2025") {
      res.status(404).json({ error: "Service not found" });
      return;
    }
    if (error?.code === "P2002") {
      res.status(409).json({ error: "Service name conflict" });
      return;
    }
    console.error("Failed to update service:", error);
    res.status(500).json({ error: "Failed to update service" });
  }
});

export { router as serviceRoutes };
