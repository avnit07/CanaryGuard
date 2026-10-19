// ═══════════════════════════════════════════════════════
// CanaryGuard — Historical Incident Memory Bank
// Pattern-matching signatures for production failure diagnosis
// ═══════════════════════════════════════════════════════

export interface HistoricalIncidentPattern {
  id: string;
  name: string;
  patternKey: string;
  matchKeywords: string[];
  minErrorRate?: number;
  minLatencyMs?: number;
  rootCauseTemplate: string;
  suggestedAction: "ROLLBACK" | "PROMOTE" | "MANUAL_REVIEW";
  typicalConfidence: number;
}

export const INCIDENT_PATTERNS: HistoricalIncidentPattern[] = [
  {
    id: "inc-pattern-001",
    name: "Downstream Payment Gateway Timeout",
    patternKey: "GATEWAY_TIMEOUT",
    matchKeywords: ["timeout", "gateway", "unresponsive", "bank", "stripe", "downstream", "econnreset"],
    minErrorRate: 15,
    minLatencyMs: 400,
    rootCauseTemplate:
      "Canary release introduced blocking calls to downstream payment gateway. Timeouts (>1000ms) caused checkout thread starvation and high failure rates.",
    suggestedAction: "ROLLBACK",
    typicalConfidence: 0.94,
  },
  {
    id: "inc-pattern-002",
    name: "Database Connection Pool Exhaustion",
    patternKey: "DB_POOL_EXHAUSTION",
    matchKeywords: ["pool", "connection", "postgres", "timeout waiting for connection", "deadlock", "prisma"],
    minErrorRate: 25,
    minLatencyMs: 800,
    rootCauseTemplate:
      "Database connection pool saturated by unclosed connections or long-running queries in canary release, causing cascading timeouts.",
    suggestedAction: "ROLLBACK",
    typicalConfidence: 0.91,
  },
  {
    id: "inc-pattern-003",
    name: "Unhandled Runtime TypeError / Crash",
    patternKey: "RUNTIME_EXCEPTION",
    matchKeywords: ["typeerror", "cannot read properties", "undefined", "null pointer", "referenceerror", "json.parse"],
    minErrorRate: 40,
    rootCauseTemplate:
      "Uncaught runtime exception in critical request handler path in canary code. Immediate 500 responses without latency delay.",
    suggestedAction: "ROLLBACK",
    typicalConfidence: 0.98,
  },
  {
    id: "inc-pattern-004",
    name: "Transient Upstream Network Jitter",
    patternKey: "TRANSIENT_SPIKE",
    matchKeywords: ["brief", "temporary", "jitter"],
    minErrorRate: 2,
    rootCauseTemplate:
      "Minor transient network hiccup. Error rates stayed low (<10%) and latency did not sustain high levels.",
    suggestedAction: "MANUAL_REVIEW",
    typicalConfidence: 0.72,
  },
];

/**
 * Compares live incident evidence against historical incident signatures
 */
export function findSimilarIncidents(symptoms: {
  errorReason?: string;
  errorRate?: number;
  latencyP99Ms?: number;
}): HistoricalIncidentPattern[] {
  const { errorReason = "", errorRate = 0, latencyP99Ms = 0 } = symptoms;
  const reasonLower = errorReason.toLowerCase();

  const scored = INCIDENT_PATTERNS.map((pattern) => {
    let score = 0;

    // Keyword match
    for (const kw of pattern.matchKeywords) {
      if (reasonLower.includes(kw)) {
        score += 2;
      }
    }

    // Error rate match
    if (pattern.minErrorRate !== undefined && errorRate >= pattern.minErrorRate) {
      score += 2;
    }

    // Latency match
    if (pattern.minLatencyMs !== undefined && latencyP99Ms >= pattern.minLatencyMs) {
      score += 2;
    }

    return { pattern, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.pattern);
}
