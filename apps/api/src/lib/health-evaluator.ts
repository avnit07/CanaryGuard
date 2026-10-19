// ═══════════════════════════════════════════════════════
// CanaryGuard API — Observability & Health Evaluator Engine
// ═══════════════════════════════════════════════════════

import { DEFAULT_THRESHOLDS } from "@canaryguard/config";
import { HealthStatus, HealthEvaluationResult, HealthBreach } from "@canaryguard/types";

export interface EvaluateHealthOptions {
  targetUrl: string; // e.g. "http://localhost:8081" (canary) or "http://localhost:8080"
  errorRateThreshold?: number; // e.g. 5%
  latencyThreshold?: number; // e.g. 1000ms
  timeoutMs?: number; // default 3000ms
}

/**
 * Pulls telemetry from target service and evaluates SLA compliance
 */
export async function evaluateServiceHealth(
  options: EvaluateHealthOptions
): Promise<HealthEvaluationResult> {
  const {
    targetUrl,
    errorRateThreshold = DEFAULT_THRESHOLDS.errorRate,
    latencyThreshold = DEFAULT_THRESHOLDS.p99Latency,
    timeoutMs = 3000,
  } = options;

  const metricsEndpoint = `${targetUrl.replace(/\/+$/, "")}/admin/metrics`;

  try {
    // 1. Fetch live telemetry with defensive timeout
    const response = await fetch(metricsEndpoint, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      return {
        status: HealthStatus.UNHEALTHY,
        isDegraded: true,
        breaches: [
          {
            type: "SERVICE_UNREACHABLE",
            severity: "CRITICAL",
            message: `Telemetry endpoint returned HTTP ${response.status}: ${errorText}`,
            actualValue: response.status,
            thresholdValue: 200,
          },
        ],
        metricsSnapshot: { totalRequests: 0, errorRate: 0, latencyP99Ms: 0, latencyAvgMs: 0 },
        summary: `Telemetry health check failed with HTTP ${response.status}`,
        evaluatedAt: new Date(),
      };
    }

    const payload = (await response.json()) as any;
    const rawMetrics = payload?.metrics || {};
    const totalRequests = Number(rawMetrics.totalRequests || 0);
    const errorRate = Number(rawMetrics.errorRate || 0);
    const latencyP99Ms = Number(rawMetrics.latencyP99Ms || 0);
    const latencyAvgMs = Number(rawMetrics.latencyAvgMs || 0);

    const snapshot = {
      totalRequests,
      errorRate,
      latencyP99Ms,
      latencyAvgMs,
    };

    const breaches: HealthBreach[] = [];

    // 2. Evaluate Error Rate SLA Breach
    if (errorRate > errorRateThreshold) {
      breaches.push({
        type: "ERROR_RATE",
        severity: "CRITICAL",
        message: `Error rate of ${errorRate}% exceeds policy threshold of ${errorRateThreshold}%`,
        actualValue: errorRate,
        thresholdValue: errorRateThreshold,
      });
    } else if (errorRate > errorRateThreshold * 0.6) {
      breaches.push({
        type: "ERROR_RATE",
        severity: "WARNING",
        message: `Error rate is elevated at ${errorRate}% (approaching threshold ${errorRateThreshold}%)`,
        actualValue: errorRate,
        thresholdValue: errorRateThreshold,
      });
    }

    // 3. Evaluate P99 Latency SLA Breach
    if (latencyP99Ms > latencyThreshold) {
      breaches.push({
        type: "LATENCY_P99",
        severity: "CRITICAL",
        message: `P99 latency of ${latencyP99Ms}ms exceeds policy threshold of ${latencyThreshold}ms`,
        actualValue: latencyP99Ms,
        thresholdValue: latencyThreshold,
      });
    } else if (latencyP99Ms > latencyThreshold * 0.8) {
      breaches.push({
        type: "LATENCY_P99",
        severity: "WARNING",
        message: `P99 latency is elevated at ${latencyP99Ms}ms (approaching threshold ${latencyThreshold}ms)`,
        actualValue: latencyP99Ms,
        thresholdValue: latencyThreshold,
      });
    }

    // 4. Determine Overall Health Status
    const hasCritical = breaches.some((b) => b.severity === "CRITICAL");
    const hasWarning = breaches.some((b) => b.severity === "WARNING");

    let status = HealthStatus.HEALTHY;
    let isDegraded = false;
    let summary = "Service telemetry is healthy and compliant with all policy thresholds";

    if (hasCritical) {
      status = HealthStatus.UNHEALTHY;
      isDegraded = true;
      summary = `Critical SLA breach detected: ${breaches.map((b) => b.message).join("; ")}`;
    } else if (hasWarning) {
      status = HealthStatus.DEGRADED;
      isDegraded = true;
      summary = `Service is degraded: ${breaches.map((b) => b.message).join("; ")}`;
    }

    return {
      status,
      isDegraded,
      breaches,
      metricsSnapshot: snapshot,
      summary,
      evaluatedAt: new Date(),
    };
  } catch (error: any) {
    const isTimeout = error?.name === "TimeoutError" || error?.name === "AbortError";
    const message = isTimeout
      ? `Telemetry request timed out after ${timeoutMs}ms`
      : `Failed to reach telemetry endpoint at ${metricsEndpoint}: ${error?.message || "Unknown error"}`;

    return {
      status: HealthStatus.UNHEALTHY,
      isDegraded: true,
      breaches: [
        {
          type: "SERVICE_UNREACHABLE",
          severity: "CRITICAL",
          message,
          actualValue: 0,
          thresholdValue: 0,
        },
      ],
      metricsSnapshot: { totalRequests: 0, errorRate: 0, latencyP99Ms: 0, latencyAvgMs: 0 },
      summary: `Health evaluation failure: ${message}`,
      evaluatedAt: new Date(),
    };
  }
}
