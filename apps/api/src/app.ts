// ═══════════════════════════════════════════════════════
// CanaryGuard API — Express Application Setup
// ═══════════════════════════════════════════════════════

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { API_CONFIG } from "@canaryguard/config";

// ─── Route Imports ───────────────────────────────────
import { serviceRoutes } from "./routes/services.js";
import { deploymentRoutes } from "./routes/deployments.js";
import { policyRoutes } from "./routes/policies.js";
import { auditLogRoutes } from "./routes/audit-logs.js";

import { serverAdapter } from "./lib/bull-board.js";

// ─── Create Express App ─────────────────────────────

const app = express();

// ─── Middleware ──────────────────────────────────────

const rawCors = process.env.CORS_ORIGINS;
const corsOrigin = (!rawCors || rawCors === "*") ? "*" : rawCors.split(",").map((s) => s.trim());

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: corsOrigin }));
app.use(express.json());
app.use(morgan("dev"));

// ─── Bull-Board Queue Dashboard ──────────────────────
app.use("/admin/queues", serverAdapter.getRouter());

// ─── Health Check ───────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "canaryguard-api", timestamp: new Date().toISOString() });
});

// ─── API Routes ─────────────────────────────────────

app.use("/api/services", serviceRoutes);
app.use("/api/deployments", deploymentRoutes);
app.use("/api/policies", policyRoutes);
app.use("/api/audit-logs", auditLogRoutes);

// ─── 404 Handler ────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

export default app;
