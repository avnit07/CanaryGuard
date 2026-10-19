// ═══════════════════════════════════════════════════════
// CanaryGuard — Core Domain Interfaces & DTOs
// ═══════════════════════════════════════════════════════

import {
  DeploymentStatus,
  DeploymentStepType,
  StepStatus,
  AgentRecommendation,
  EvidenceSourceType,
  ApprovalStatus,
  ApprovalAction,
  ActorType,
  AuditAction,
  HealthStatus,
} from "./enums.js";

// ─── Service ─────────────────────────────────────────

export interface Service {
  id: string;
  name: string;
  repository: string;
  kubernetesNamespace: string;
  deploymentName: string;
  currentVersion: string;
  healthStatus: HealthStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Deployment ──────────────────────────────────────

export interface Deployment {
  id: string;
  serviceId: string;
  version: string;
  gitCommit: string;
  image: string;
  status: DeploymentStatus;
  triggeredBy: string;
  canaryWeight: number;
  startedAt: Date;
  completedAt: Date | null;
  failureReason: string | null;
}

// ─── Deployment Step ─────────────────────────────────

export interface DeploymentStep {
  id: string;
  deploymentId: string;
  stepType: DeploymentStepType;
  status: StepStatus;
  startedAt: Date;
  completedAt: Date | null;
  metadata: Record<string, unknown> | null;
}

// ─── Agent Run ───────────────────────────────────────

export interface AgentRun {
  id: string;
  deploymentId: string;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  model: string;
  confidence: number | null;
  recommendation: AgentRecommendation | null;
  summary: string | null;
}

// ─── Agent Evidence ──────────────────────────────────

export interface AgentEvidence {
  id: string;
  agentRunId: string;
  sourceType: EvidenceSourceType;
  sourceReference: string;
  evidence: string;
  createdAt: Date;
}

// ─── Policy ──────────────────────────────────────────

export interface Policy {
  id: string;
  serviceId: string;
  name: string;
  errorRateThreshold: number;
  latencyThreshold: number;
  observationWindowSeconds: number;
  autoRollback: boolean;
  requiresApproval: boolean;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Approval ────────────────────────────────────────

export interface Approval {
  id: string;
  deploymentId: string;
  action: ApprovalAction;
  requestedAt: Date;
  respondedAt: Date | null;
  respondedBy: string | null;
  status: ApprovalStatus;
  reason: string | null;
}

// ─── Audit Log ───────────────────────────────────────

export interface AuditLog {
  id: string;
  deploymentId: string | null;
  actorType: ActorType;
  actorId: string;
  action: AuditAction;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

// ─── Health Metrics (runtime) ────────────────────────

export interface HealthMetrics {
  errorRate: number;
  p99Latency: number;
  requestRate: number;
  timestamp: Date;
}

export interface HealthBreach {
  type: "ERROR_RATE" | "LATENCY_P99" | "SERVICE_UNREACHABLE";
  severity: "CRITICAL" | "WARNING";
  message: string;
  actualValue: number;
  thresholdValue: number;
}

export interface HealthEvaluationResult {
  status: HealthStatus;
  isDegraded: boolean;
  breaches: HealthBreach[];
  metricsSnapshot: {
    totalRequests: number;
    errorRate: number;
    latencyP99Ms: number;
    latencyAvgMs: number;
  };
  summary: string;
  evaluatedAt: Date;
}

// ─── API Request / Response DTOs ─────────────────────

export interface CreateDeploymentRequest {
  serviceId: string;
  version: string;
  gitCommit: string;
  image: string;
  triggeredBy: string;
}

export interface CreateServiceRequest {
  name: string;
  repository: string;
  kubernetesNamespace?: string;
  deploymentName?: string;
  currentVersion: string;
}

export interface CreatePolicyRequest {
  serviceId: string;
  name: string;
  errorRateThreshold: number;
  latencyThreshold: number;
  observationWindowSeconds: number;
  autoRollback: boolean;
  requiresApproval: boolean;
}

export interface ApprovalRequest {
  deploymentId: string;
  action: ApprovalAction;
  respondedBy: string;
  status: ApprovalStatus;
  reason?: string;
}
