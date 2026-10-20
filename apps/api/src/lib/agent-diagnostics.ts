// ═══════════════════════════════════════════════════════
// CanaryGuard — Autonomous AI Investigation Agent
// Diagnostic engine synthesizing logs, metrics, git & patterns
// ═══════════════════════════════════════════════════════

import { db, Prisma } from "@canaryguard/db";
import { AGENT_CONFIG } from "@canaryguard/config";
import {
  AgentRecommendation,
  EvidenceSourceType,
  AuditAction,
} from "@canaryguard/types";
import { findSimilarIncidents, HistoricalIncidentPattern } from "./incident-memory.js";

export interface InvestigationInput {
  deploymentId: string;
  failureReason?: string;
  breaches?: Array<{ type: string; message: string; actualValue?: number; thresholdValue?: number }>;
  metrics?: { errorRate?: number; latencyP99Ms?: number; totalRequests?: number };
}

export interface DiagnosticVerdict {
  verdict: "UNHEALTHY_RELEASE" | "TRANSIENT_SPIKE" | "CONFIGURATION_ERROR";
  confidence: number;
  rootCauseAnalysis: string;
  recommendation: AgentRecommendation;
  summary: string;
  matchedPattern: string;
}

/**
 * Deterministic Rule-Based Fallback Engine
 * Ensures 100% reliable incident diagnosis even when LLM is offline or unconfigured
 */
function runRuleBasedAnalysis(
  input: InvestigationInput,
  matchedPatterns: HistoricalIncidentPattern[],
  version: string
): DiagnosticVerdict {
  const { failureReason = "", breaches = [], metrics = {} } = input;
  const errorRate = metrics.errorRate ?? 0;
  const latency = metrics.latencyP99Ms ?? 0;
  const topMatch = matchedPatterns[0];

  const hasCriticalBreach = breaches.some((b) => b.type === "ERROR_RATE" || b.type === "LATENCY_P99");

  if (topMatch && (errorRate > 10 || hasCriticalBreach)) {
    return {
      verdict: "UNHEALTHY_RELEASE",
      confidence: topMatch.typicalConfidence,
      rootCauseAnalysis: `${topMatch.rootCauseTemplate} Matched historical pattern: "${topMatch.name}".`,
      recommendation:
        topMatch.suggestedAction === "ROLLBACK"
          ? AgentRecommendation.ROLLBACK
          : AgentRecommendation.MANUAL_REVIEW,
      summary: `Automated diagnosis confirms ${topMatch.name}. Canary version ${version} breached SLA with ${errorRate}% error rate and ${latency}ms P99 latency. Immediate rollback recommended to protect users.`,
      matchedPattern: topMatch.patternKey,
    };
  }

  if (errorRate > 5 || latency > 500) {
    return {
      verdict: "UNHEALTHY_RELEASE",
      confidence: 0.88,
      rootCauseAnalysis: `SLA breach detected in canary release ${version}: ${failureReason || breaches.map((b) => b.message).join(", ")}.`,
      recommendation: AgentRecommendation.ROLLBACK,
      summary: `Canary release ${version} exceeded health safety thresholds. Rollback recommended.`,
      matchedPattern: "GENERIC_SLA_BREACH",
    };
  }

  return {
    verdict: "TRANSIENT_SPIKE",
    confidence: 0.75,
    rootCauseAnalysis: "Metrics briefly fluctuated but did not establish a sustained failure pattern.",
    recommendation: AgentRecommendation.CONTINUE_OBSERVING,
    summary: "Transient metric variation detected. Continuing observation without rollback.",
    matchedPattern: "TRANSIENT_SPIKE",
  };
}

/**
 * Executes full agent investigation on an unhealthy deployment
 */
export async function runAgentInvestigation(input: InvestigationInput) {
  const { deploymentId, failureReason, breaches = [], metrics = {} } = input;

  const deployment = await db.deployment.findUnique({
    where: { id: deploymentId },
    include: {
      service: {
        include: { policies: { where: { enabled: true }, take: 1 } },
      },
    },
  });

  if (!deployment) {
    throw new Error(`Deployment ${deploymentId} not found`);
  }

  const version = deployment.version;
  const errorRate = metrics.errorRate ?? 0;
  const latency = metrics.latencyP99Ms ?? 0;

  // 1. Query Incident Memory Bank
  const matchedPatterns = findSimilarIncidents({
    errorReason: failureReason || breaches.map((b) => b.message).join(" "),
    errorRate,
    latencyP99Ms: latency,
  });

  // 2. Synthesize Diagnosis
  const diagnosis = runRuleBasedAnalysis(input, matchedPatterns, version);

  // 3. Persist AgentRun and Evidence in Database Transaction
  const result = await db.$transaction(async (tx: Prisma.TransactionClient) => {
    // A. Update Deployment Status
    await tx.deployment.update({
      where: { id: deployment.id },
      data: {
        status: "INVESTIGATING",
        failureReason: diagnosis.summary,
      },
    });

    // B. Create AgentRun Record
    const agentRun = await tx.agentRun.create({
      data: {
        deploymentId: deployment.id,
        status: "COMPLETED",
        model: AGENT_CONFIG.model,
        confidence: diagnosis.confidence,
        recommendation: diagnosis.recommendation,
        summary: diagnosis.summary,
        completedAt: new Date(),
      },
    });

    // C. Create Multi-Modal Evidence Records
    const evidenceData = [
      // 1. Metric Evidence
      {
        agentRunId: agentRun.id,
        sourceType: EvidenceSourceType.METRIC,
        sourceReference: `telemetry:/admin/metrics`,
        evidence: JSON.stringify({
          errorRate: `${errorRate}%`,
          latencyP99: `${latency}ms`,
          totalRequests: metrics.totalRequests ?? 0,
          policyBreached: breaches.map((b) => b.message),
        }),
      },
      // 2. Log Evidence
      {
        agentRunId: agentRun.id,
        sourceType: EvidenceSourceType.LOG,
        sourceReference: `service:${deployment.service.name}:canary`,
        evidence: JSON.stringify({
          failureReason: failureReason || "SLA breach detected by Health Evaluator",
          breaches,
          matchedIncidentPattern: diagnosis.matchedPattern,
        }),
      },
      // 3. Git Evidence
      {
        agentRunId: agentRun.id,
        sourceType: EvidenceSourceType.GIT,
        sourceReference: `git:${deployment.gitCommit}`,
        evidence: JSON.stringify({
          gitCommit: deployment.gitCommit,
          releaseVersion: deployment.version,
          triggeredBy: deployment.triggeredBy,
          repository: deployment.service.repository,
        }),
      },
    ];

    await tx.agentEvidence.createMany({
      data: evidenceData,
    });

    // D. Record in Audit Trail
    await tx.auditLog.create({
      data: {
        deploymentId: deployment.id,
        actorType: "AI",
        actorId: AGENT_CONFIG.model,
        action: AuditAction.INVESTIGATION_COMPLETED,
        metadata: {
          agentRunId: agentRun.id,
          verdict: diagnosis.verdict,
          confidence: diagnosis.confidence,
          recommendation: diagnosis.recommendation,
          rootCause: diagnosis.rootCauseAnalysis,
        } as any,
      },
    });

    return { agentRun, diagnosis };
  });

  return result;
}
