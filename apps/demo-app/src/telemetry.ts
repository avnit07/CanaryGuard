// ═══════════════════════════════════════════════════════
// CanaryGuard Demo App — Sliding Window Telemetry Engine
// ═══════════════════════════════════════════════════════

export interface RequestRecord {
  timestamp: number;
  durationMs: number;
  statusCode: number;
}

export interface TelemetrySnapshot {
  totalRequests: number;
  errorRequests: number;
  errorRate: number; // percentage (0 - 100)
  avgLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  windowSizeSeconds: number;
  sampleCount: number;
}

class TelemetryTracker {
  private records: RequestRecord[] = [];
  private readonly maxRecords = 200;
  private readonly windowDurationMs = 60 * 1000; // 60 seconds sliding window

  /**
   * Record a completed HTTP request
   */
  public record(durationMs: number, statusCode: number): void {
    const now = Date.now();
    this.records.push({
      timestamp: now,
      durationMs,
      statusCode,
    });

    // Prune records older than windowDurationMs or exceeding maxRecords
    this.prune(now);
  }

  /**
   * Remove expired records outside the sliding window
   */
  private prune(now: number = Date.now()): void {
    const cutoff = now - this.windowDurationMs;
    this.records = this.records.filter((r) => r.timestamp >= cutoff);
    if (this.records.length > this.maxRecords) {
      this.records = this.records.slice(-this.maxRecords);
    }
  }

  /**
   * Get real-time aggregated metrics
   */
  public getSnapshot(): TelemetrySnapshot {
    this.prune();

    const count = this.records.length;
    if (count === 0) {
      return {
        totalRequests: 0,
        errorRequests: 0,
        errorRate: 0,
        avgLatencyMs: 0,
        p95LatencyMs: 0,
        p99LatencyMs: 0,
        windowSizeSeconds: this.windowDurationMs / 1000,
        sampleCount: 0,
      };
    }

    const errors = this.records.filter((r) => r.statusCode >= 500).length;
    const errorRate = parseFloat(((errors / count) * 100).toFixed(2));

    const durations = this.records.map((r) => r.durationMs).sort((a, b) => a - b);
    const sum = durations.reduce((acc, curr) => acc + curr, 0);
    const avgLatencyMs = Math.round(sum / count);

    const p95Index = Math.min(Math.floor(count * 0.95), count - 1);
    const p99Index = Math.min(Math.floor(count * 0.99), count - 1);

    return {
      totalRequests: count,
      errorRequests: errors,
      errorRate,
      avgLatencyMs,
      p95LatencyMs: Math.round(durations[p95Index] || 0),
      p99LatencyMs: Math.round(durations[p99Index] || 0),
      windowSizeSeconds: this.windowDurationMs / 1000,
      sampleCount: count,
    };
  }

  /**
   * Reset all recorded metrics
   */
  public reset(): void {
    this.records = [];
  }
}

export const telemetry = new TelemetryTracker();
