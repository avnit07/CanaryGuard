// ═══════════════════════════════════════════════════════
// CanaryGuard Proxy — Server Entry Point
// ═══════════════════════════════════════════════════════

import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import { trafficRouter } from "./proxy.js";

const app = express();
const port = parseInt(process.env.PORT || "8000", 10);
const host = process.env.HOST || "0.0.0.0";

app.use(cors());

// ─── Admin Control Endpoints ─────────────────────────
// (Parsed as JSON only for admin management routes)

const adminRouter = express.Router();
adminRouter.use(express.json());

adminRouter.get("/routing", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    config: trafficRouter.getConfig(),
    stats: trafficRouter.getStats(),
  });
});

adminRouter.post("/weight", (req: Request, res: Response) => {
  const { weight } = req.body || {};
  if (typeof weight !== "number" || weight < 0 || weight > 100) {
    res.status(400).json({ error: "weight must be a number between 0 and 100" });
    return;
  }

  trafficRouter.setWeight(weight);
  res.json({
    message: `Canary traffic weight updated to ${weight}%`,
    config: trafficRouter.getConfig(),
  });
});

adminRouter.post("/targets", (req: Request, res: Response) => {
  const { baseline, canary } = req.body || {};
  trafficRouter.setTargets(baseline, canary);
  res.json({
    message: "Proxy target URLs updated",
    config: trafficRouter.getConfig(),
  });
});

adminRouter.post("/reset-stats", (_req: Request, res: Response) => {
  trafficRouter.resetStats();
  res.json({
    message: "Routing statistics reset",
    stats: trafficRouter.getStats(),
  });
});

app.use("/admin", adminRouter);

// ─── Proxy All Application Traffic ────────────────────
// Streams raw request directly to selected upstream service

app.use((req: Request, res: Response) => {
  trafficRouter.forward(req, res);
});

// ─── Start Proxy Server ──────────────────────────────

app.listen(port, host, () => {
  const config = trafficRouter.getConfig();
  console.log(`
  ╔══════════════════════════════════════════════════╗
  ║                                                  ║
  ║   🔀 CanaryGuard Traffic Splitting Proxy         ║
  ║   Listening on http://${host}:${port}                ║
  ║                                                  ║
  ║   - Baseline: ${config.baselineTarget}               ║
  ║   - Canary:   ${config.canaryTarget}               ║
  ║   - Weight:   ${config.canaryWeight}% traffic to Canary             ║
  ║   - Stats:    GET  /admin/routing                ║
  ║   - Set:      POST /admin/weight                 ║
  ║                                                  ║
  ╚══════════════════════════════════════════════════╝
  `);
});

export default app;
