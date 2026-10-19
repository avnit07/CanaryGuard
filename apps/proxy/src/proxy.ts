// ═══════════════════════════════════════════════════════
// CanaryGuard Proxy — Traffic Splitting Engine
// ═══════════════════════════════════════════════════════

import http from "node:http";
import { Request, Response } from "express";

export interface ProxyConfig {
  baselineTarget: string; // e.g. "http://localhost:8080"
  canaryTarget: string; // e.g. "http://localhost:8081"
  canaryWeight: number; // 0 to 100
}

export interface RoutingStats {
  totalRequests: number;
  baselineRequests: number;
  canaryRequests: number;
  actualCanaryPercentage: number;
}

class TrafficRouter {
  private config: ProxyConfig = {
    baselineTarget: process.env.BASELINE_TARGET || "http://localhost:8080",
    canaryTarget: process.env.CANARY_TARGET || "http://localhost:8081",
    canaryWeight: parseInt(process.env.CANARY_WEIGHT || "5", 10),
  };

  private stats: RoutingStats = {
    totalRequests: 0,
    baselineRequests: 0,
    canaryRequests: 0,
    actualCanaryPercentage: 0,
  };

  public getConfig(): ProxyConfig {
    return { ...this.config };
  }

  public setWeight(weight: number): void {
    this.config.canaryWeight = Math.max(0, Math.min(100, Math.round(weight)));
  }

  public setTargets(baseline: string, canary: string): void {
    if (baseline) this.config.baselineTarget = baseline;
    if (canary) this.config.canaryTarget = canary;
  }

  public getStats(): RoutingStats {
    const total = this.stats.totalRequests;
    const actualCanary = total > 0 ? parseFloat(((this.stats.canaryRequests / total) * 100).toFixed(2)) : 0;
    return {
      ...this.stats,
      actualCanaryPercentage: actualCanary,
    };
  }

  public resetStats(): void {
    this.stats = {
      totalRequests: 0,
      baselineRequests: 0,
      canaryRequests: 0,
      actualCanaryPercentage: 0,
    };
  }

  /**
   * Decide whether to route to Canary or Baseline
   */
  public selectRoute(): { targetUrl: string; isCanary: boolean } {
    this.stats.totalRequests++;

    const { canaryWeight, canaryTarget, baselineTarget } = this.config;

    let isCanary = false;
    if (canaryWeight >= 100) {
      isCanary = true;
    } else if (canaryWeight > 0) {
      const roll = Math.random() * 100;
      isCanary = roll < canaryWeight;
    }

    if (isCanary) {
      this.stats.canaryRequests++;
      return { targetUrl: canaryTarget, isCanary: true };
    } else {
      this.stats.baselineRequests++;
      return { targetUrl: baselineTarget, isCanary: false };
    }
  }

  /**
   * Forward an incoming HTTP request to the selected upstream target
   */
  public forward(req: Request, res: Response): void {
    const { targetUrl, isCanary } = this.selectRoute();
    const parsedTarget = new URL(targetUrl);

    // Merge upstream path with request url
    const upstreamPath = req.originalUrl || req.url;

    // Filter out host header so upstream sees its own host
    const forwardHeaders: http.OutgoingHttpHeaders = {
      ...req.headers,
      host: parsedTarget.host,
      "x-forwarded-for": req.headers["x-forwarded-for"] || req.socket.remoteAddress,
      "x-forwarded-proto": req.protocol,
    };

    const options: http.RequestOptions = {
      protocol: parsedTarget.protocol,
      hostname: parsedTarget.hostname,
      port: parsedTarget.port,
      method: req.method,
      path: upstreamPath,
      headers: forwardHeaders,
      timeout: 10000,
    };

    const upstreamReq = http.request(options, (upstreamRes) => {
      // Set debug and response headers
      res.status(upstreamRes.statusCode || 502);

      // Copy headers from upstream response
      for (const [key, val] of Object.entries(upstreamRes.headers)) {
        if (val !== undefined) {
          res.setHeader(key, val);
        }
      }

      // Add CanaryGuard observability headers
      res.setHeader("x-canary-routed", isCanary ? "true" : "false");
      res.setHeader("x-canary-weight", `${this.config.canaryWeight}%`);
      res.setHeader("x-routed-to", isCanary ? "canary" : "baseline");

      // Pipe upstream body to client
      upstreamRes.pipe(res);
    });

    upstreamReq.on("error", (err) => {
      console.error(`Proxy forwarding error to ${targetUrl}:`, err.message);
      if (!res.headersSent) {
        res.status(502).json({
          error: "Bad Gateway",
          message: `Unable to connect to upstream service at ${targetUrl}`,
          isCanary,
        });
      }
    });

    upstreamReq.on("timeout", () => {
      upstreamReq.destroy();
      if (!res.headersSent) {
        res.status(504).json({
          error: "Gateway Timeout",
          message: `Upstream service at ${targetUrl} timed out`,
          isCanary,
        });
      }
    });

    // Pipe client request body to upstream
    req.pipe(upstreamReq);
  }
}

export const trafficRouter = new TrafficRouter();
