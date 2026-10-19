// ═══════════════════════════════════════════════════════
// CanaryGuard Demo App — Payment Microservice with Chaos
// ═══════════════════════════════════════════════════════

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { telemetry } from "./telemetry.js";

export const APP_VERSION = process.env.APP_VERSION || "v2.1.4";

// ─── Chaos State ──────────────────────────────────────

interface ChaosConfig {
  enabled: boolean;
  failureRate: number; // probability between 0 and 1
  latencyMs: number; // artificial delay in ms
  errorReason: string;
}

const chaosState: ChaosConfig = {
  enabled: false,
  failureRate: 0.65, // 65% failure rate by default when enabled
  latencyMs: 1250, // 1250ms delay
  errorReason: "Downstream payment gateway timeout (Stripe/Bank unresponsive)",
};

// ─── Express App ──────────────────────────────────────

const app = express();

app.use(cors());
app.use(express.json());

// ─── Telemetry Middleware ─────────────────────────────
// Automatically tracks every request's duration and status code

app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    // Don't pollute telemetry with internal health check / metrics queries
    if (!req.path.startsWith("/admin") && req.path !== "/health") {
      telemetry.record(duration, res.statusCode);
    }
  });

  next();
});

// ─── Health Check ─────────────────────────────────────

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "payment-service",
    version: APP_VERSION,
    chaosActive: chaosState.enabled,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// ─── Payment Processing Endpoint ──────────────────────

app.post("/api/payments", async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { amount, currency = "USD", customerId } = req.body || {};

  // If Chaos Mode is ON: Inject latency and artificial failures
  if (chaosState.enabled) {
    // Add latency delay with +/- 100ms jitter
    const jitter = Math.floor(Math.random() * 200) - 100;
    const delay = Math.max(0, chaosState.latencyMs + jitter);
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Simulate 500 error if random roll matches failure rate
    if (Math.random() < chaosState.failureRate) {
      res.status(500).json({
        error: "PaymentGatewayError",
        code: "GATEWAY_TIMEOUT",
        message: chaosState.errorReason,
        processedByVersion: APP_VERSION,
        latencyMs: Date.now() - startTime,
        chaosInjected: true,
      });
      return;
    }
  } else {
    // Normal simulated database & gateway latency: 30 - 75ms
    const normalDelay = Math.floor(Math.random() * 45) + 30;
    await new Promise((resolve) => setTimeout(resolve, normalDelay));
  }

  // Successful payment
  const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  res.status(200).json({
    status: "APPROVED",
    transactionId,
    amount: amount || 49.99,
    currency,
    customerId: customerId || "cust_demo_101",
    processedByVersion: APP_VERSION,
    latencyMs: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  });
});

// ─── Telemetry Endpoint ───────────────────────────────
// Polled by CanaryGuard's Observability Engine (Milestone 5)

app.get("/admin/metrics", (_req: Request, res: Response) => {
  const snapshot = telemetry.getSnapshot();
  res.json({
    service: "payment-service",
    version: APP_VERSION,
    chaos: {
      active: chaosState.enabled,
      failureRate: chaosState.failureRate,
      latencyMs: chaosState.latencyMs,
    },
    metrics: {
      totalRequests: snapshot.totalRequests,
      errorRequests: snapshot.errorRequests,
      errorRate: snapshot.errorRate, // %
      latencyAvgMs: snapshot.avgLatencyMs,
      latencyP95Ms: snapshot.p95LatencyMs,
      latencyP99Ms: snapshot.p99LatencyMs,
      windowSizeSeconds: snapshot.windowSizeSeconds,
    },
  });
});

// ─── Chaos Control Endpoints ──────────────────────────

/**
 * POST /admin/simulate-failure
 * Activates chaos failure simulation
 */
app.post("/admin/simulate-failure", (req: Request, res: Response) => {
  const { failureRate, latencyMs, reason } = req.body || {};

  chaosState.enabled = true;
  if (typeof failureRate === "number") chaosState.failureRate = failureRate;
  if (typeof latencyMs === "number") chaosState.latencyMs = latencyMs;
  if (typeof reason === "string") chaosState.errorReason = reason;

  res.json({
    message: "Chaos fault injection ACTIVATED",
    version: APP_VERSION,
    chaosState,
  });
});

/**
 * POST /admin/reset-failure
 * Disables chaos simulation and resets metrics
 */
app.post("/admin/reset-failure", (_req: Request, res: Response) => {
  chaosState.enabled = false;
  telemetry.reset();

  res.json({
    message: "Chaos fault injection DEACTIVATED and metrics reset",
    version: APP_VERSION,
    chaosState,
  });
});

export default app;
