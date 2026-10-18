# CanaryGuard — Master Architecture & Implementation Roadmap

> **Agentic Deployment Verification and Automated Rollback Platform**

This document serves as the permanent memory and source of truth for the entire CanaryGuard project journey. It defines every milestone, architecture layer, database model, and verification procedure.

---

## Architecture Overview

```
Developer pushes release (e.g. v2.1.5)
              ↓
DeployMind deploys Canary (5% traffic) via Reverse Proxy
              ↓
Observability Engine collects live telemetry (P99 latency, error rate %)
              ↓
If Healthy → BullMQ Worker steps traffic: 25% → 50% → 100% (Promoted)
If Unhealthy → AI Agent investigates (Logs + Metrics + Traces + Git diff)
              ↓
Policy Engine checks rules (Auto-rollback vs. Human approval)
              ↓
Rollback executed (0% Canary) → Recovery verified (Error rate returns to 0%)
```

---

## Monorepo Layout

```
canaryguard/
├── package.json                   # Root workspaces definition
├── tsconfig.base.json             # Base strict TypeScript configuration
├── docker-compose.yml             # PostgreSQL 16 & Redis 7 containers
├── ROADMAP.md                     # This master roadmap and memory
│
├── apps/
│   ├── web/                       # Next.js 15 App Router (Control Plane UI)
│   ├── api/                       # Express REST API (Ports 4000)
│   └── demo-app/                  # Payment microservice with chaos toggle (8080/8081)
│
├── workers/
│   ├── workflow-worker/           # BullMQ & Redis observation queues
│   ├── deployment-worker/         # Canary state machine & traffic scaling
│   └── agent-worker/              # AI diagnostic agent & incident memory
│
└── packages/
    ├── db/                        # Prisma ORM & PostgreSQL client
    ├── types/                     # Shared TypeScript enums, models & interfaces
    └── config/                    # Shared thresholds, state machine transitions & ports
```

---

## The 8 Milestones in Detail

### Milestone 1 (M1): Monorepo Architecture, PostgreSQL & Express REST API
* **Goals**: Multi-package npm monorepo, Docker Compose, Prisma schema, base Express API.
* **Shared Packages**:
  * `packages/types`: `DeploymentStatus`, `DeploymentStepType`, `StepStatus`, `ActorType`, `AuditAction`, `HealthStatus`.
  * `packages/config`: `CANARY_STEPS = [5, 25, 50, 100]`, `DEFAULT_THRESHOLDS`, `VALID_TRANSITIONS`, ports.
  * `packages/db`: Prisma schema defining `Service`, `Deployment`, `DeploymentStep`, `Policy`, `AgentRun`, `AgentEvidence`, `Approval`, and `AuditLog`.
* **Database & API**:
  * PostgreSQL running on port `5434`.
  * Express API (`apps/api`) on port `4000` with Helmet, CORS, and Morgan.
  * `POST /api/deployments` wrapping deployment + pipeline steps + initial audit log in a single `db.$transaction`.
* **Verification**: `npm run db:push`, `npm run db:studio`, curl tests against `/api/services`.

---

### Milestone 2 (M2): Deployment State Machine & Next.js Control Plane Dashboard
* **Goals**: Strict lifecycle state transitions & modern Next.js 15 frontend.
* **State Machine Rules**:
  * `PENDING` → `BUILDING` → `DEPLOYING` → `CANARY` → `OBSERVING` → `PROMOTED` / `ROLLING_BACK` / `ROLLED_BACK`.
* **Next.js Web UI (`apps/web`)**:
  * Overview dashboard (`page.tsx`) with stat cards and health pills.
  * Modals: `CreateServiceModal` and `TriggerDeploymentModal`.
  * Dynamic deployment details page (`deployments/[id]/page.tsx`) with real-time audit log timeline.
* **Verification**: Launch `localhost:3000`, register a service via modal, trigger deployment, and view live status badge transitions.

---

### Milestone 3 (M3): Target Microservice & Chaos Simulation Engine
* **Goals**: Standalone runnable microservice with live telemetry and deliberate fault injection.
* **Implementation (`apps/demo-app`)**:
  * Payment checkout endpoint: `POST /api/payments` returning `processedByVersion: "v2.1.4"`.
  * Health endpoint: `GET /health`.
  * Telemetry endpoint: `GET /admin/metrics` returning sliding-window error rates and P99 latency.
  * Chaos switch: `POST /admin/simulate-failure` dynamically injecting latency jitter (1250ms) and simulated 500 errors.
* **Verification**: Curl `/api/payments` for success responses, trigger `/admin/simulate-failure`, verify `/admin/metrics` reflects error rate spike.

---

### Milestone 4 (M4): Canary Deployments & Traffic Splitting Logic
* **Goals**: Dynamic reverse proxy splitting traffic between baseline and canary instances.
* **Routing Logic**:
  * Baseline instance (`v2.1.4`) on `localhost:8080`.
  * Canary instance (`v2.1.5`) on `localhost:8081`.
  * Router proxy on port `8000`: rolls `Math.random() * 100 < canaryWeight`.
  * If `< 5%` → routes to port `8081`.
  * Otherwise → routes to port `8080`.
* **Verification**: Batch script sending 100 requests; verify ~95 hits on `v2.1.4` and ~5 hits on `v2.1.5`.

---

### Milestone 5 (M5): Telemetry Collection, Observability & Health Evaluator
* **Goals**: Production-grade health evaluation engine measuring SLA breaches.
* **Health Evaluator (`evaluateServiceHealth`)**:
  * Pulls `/admin/metrics` with defensive timeouts (`AbortSignal.timeout(3000)`).
  * Evaluates if `errorRate > policy.errorRateThreshold` (5%) or `latencyP99Ms > policy.latencyThreshold` (500ms).
  * Classifies status as `HEALTHY`, `DEGRADED`, or `UNHEALTHY`.
* **Verification**: Run evaluation against healthy service (`isDegraded: false`), inject chaos fault, run evaluation again (`isDegraded: true` with breach explanation).

---

### Milestone 6 (M6): Background Workflow Queues & Orchestration (Redis + BullMQ)
* **Goals**: Durable background execution surviving server restarts.
* **Queue Architecture**:
  * Redis container on port `6379`.
  * BullMQ Queues: `canary-evaluation-queue`, `ai-investigation-queue`, `rollback-queue`.
  * Delayed observation window jobs (e.g. 120s timer before auto-advancing canary weight).
  * Bull-Board UI mounted at `/admin/queues` for live job monitoring.
* **Verification**: Watch BullMQ jobs move from `waiting` → `delayed` → `completed`, advancing canary weight 5% → 25% → 50% → 100% when healthy.

---

### Milestone 7 (M7): Autonomous AI Investigation Agent & Policy Guardrails
* **Goals**: LLM-powered incident diagnostics with fallback safety engine.
* **Agent Diagnostics (`analyzeWithLLM`)**:
  * Extracts evidence bundle: error logs + P99 latency + git commit diff.
  * Queries Historical Incident Memory Bank (`findSimilarIncidents`) for matching patterns (connection timeout, memory leak).
  * Generates structured JSON: `verdict`, `confidenceScore`, `rootCauseAnalysis`, `recommendedAction`.
  * Rule-based fallback engine if LLM provider times out or is offline.
* **Verification**: Trigger canary defect, verify worker transitions deployment to `INVESTIGATING`, verify `AgentRun` and `AgentEvidence` rows created in PostgreSQL.

---

### Milestone 8 (M8): Automated Rollback Execution, Human Approval & Verification
* **Goals**: Human-in-the-loop sign-off, instant rollback execution, and post-recovery verification.
* **Lifecycle**:
  * Next.js UI modal: Review AI diagnostics and click **Approve Rollback**.
  * Rollback execution: Instantly resets `canaryWeight` to `0%` and routes 100% traffic to stable baseline.
  * Post-rollback verification: Worker checks telemetry after 30s to verify error rates returned to 0%.
  * Appends `RECOVERY_VERIFIED` to `AuditLog`.
* **Verification**: Full end-to-end chaos drill simulating a broken release, automated diagnosis, human approval, rollback, and recovery.
