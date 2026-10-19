# CanaryGuard — Backend Audit & API Catalog

> **Stage 1 Discovery Document**: Complete audit of all frozen backend routes, data contracts, Prisma models, allowed parameters, and feature availability matrix for the frontend redesign.

---

## 1. System Endpoints & Routing Catalog

All API endpoints are hosted by default on `http://localhost:4000` (Express REST API).  
**Authentication**: No auth headers required (`public/internal`).

### 1.1 Services API (`/api/services`)

| Method | URL | Request Payload | Response Shape | Usage in UI |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/services` | *None* | `{ data: Array<Service & { deployments: Array<{ id, version, status, startedAt, canaryWeight }>, _count: { deployments: number } }> }` | `DashboardPage` (Service catalog & active pipeline) |
| `GET` | `/api/services/:id` | *None* | `{ data: Service & { deployments: Deployment[], policies: Policy[] } }` | Service details / Policy verification |
| `POST` | `/api/services` | `{ name: string, repository: string, kubernetesNamespace?: string, deploymentName?: string, currentVersion?: string }` | `{ data: Service }` (Status 201) | `CreateServiceModal` |
| `PUT` | `/api/services/:id` | `{ name?, repository?, kubernetesNamespace?, deploymentName?, currentVersion?, healthStatus? }` | `{ data: Service }` | Service configuration update |

### 1.2 Deployments API (`/api/deployments`)

| Method | URL | Request Payload | Response Shape | Usage in UI |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/deployments` | Query: `?serviceId=...&status=...&limit=...` | `{ data: Array<Deployment & { service: { id, name, repository }, _count: { steps: number, agentRuns: number } }> }` | `DashboardPage` (Recent deployments log table) |
| `GET` | `/api/deployments/:id` | *None* | `{ data: Deployment & { service: Service, steps: DeploymentStep[], agentRuns: Array<AgentRun & { evidence: AgentEvidence[] }>, approvals: Approval[], auditLogs: AuditLog[] } }` | `DeploymentDetailPage` (Full flight deck view) |
| `POST` | `/api/deployments` | `{ serviceId: string, version: string, gitCommit?: string, image?: string, triggeredBy?: string }` | `{ data: Deployment & { service: { name }, steps: DeploymentStep[] } }` (Status 201) | `TriggerDeploymentModal` |
| `PATCH` | `/api/deployments/:id` | `{ status?: string, canaryWeight?: number, notes?: string, reason?: string }` | `{ data: Deployment }` | Traffic slider update & state machine transitions |
| `POST` | `/api/deployments/:id/approve` | `{ action: "ROLLBACK" \| "PROMOTE", status: "APPROVED" \| "REJECTED", reason?: string, respondedBy?: string }` | `{ data: Approval }` | `DeploymentDetailPage` (Rollback sign-off module) |
| `POST` | `/api/deployments/:id/rollback` | `{ reason?: string }` | `{ message: string, data: { jobId: string, deploymentId: string } }` | Emergency rollback trigger |
| `POST` | `/api/deployments/:id/evaluate` | `{ targetUrl?: string }` | `{ data: { evaluation: { isDegraded: boolean, status: string, breaches: string[], metricsSnapshot: object, summary: string }, deployment: { id, version, status, targetUrl } } }` | Live SLA health check trigger |
| `POST` | `/api/deployments/:id/start-canary-workflow` | `{ targetUrl?: string, observationWindowSeconds?: number, triggeredBy?: string }` | `{ message: string, data: { jobId: string, deploymentId: string, initialWeight: 5, targetUrl: string, observationWindowSeconds: number } }` | Auto-rollout kick-off |
| `POST` | `/api/deployments/:id/investigate` | `{ failureReason?: string, breaches?: string[], metrics?: object }` | `{ message: string, data: { diagnosis: { summary, confidence, recommendation }, agentRunId: string } }` | Manual AI agent trigger |

### 1.3 Audit Logs API (`/api/audit-logs`)

| Method | URL | Request Payload | Response Shape | Usage in UI |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/audit-logs` | Query: `?deploymentId=...&action=...&actorType=...&limit=...` | `{ data: Array<AuditLog & { deployment: { id, version, service: { name } } }> }` | Cluster audit feed / timeline |
| `GET` | `/api/audit-logs/:id` | *None* | `{ data: AuditLog & { deployment: { service: Service } } }` | Detailed log inspection |

### 1.4 Policies API (`/api/policies`)

| Method | URL | Request Payload | Response Shape | Usage in UI |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/policies` | *None* | `{ data: Array<Policy & { service: { id, name } }> }` | Policy list |
| `GET` | `/api/policies/:id` | *None* | `{ data: Policy & { service: Service } }` | Policy detail |
| `POST` | `/api/policies` | `{ serviceId, name, errorRateThreshold, latencyThreshold, observationWindowSeconds, autoRollback?, requiresApproval? }` | `{ data: Policy }` | Policy creation |

### 1.5 System & Diagnostic Endpoints

| Component | Method | URL | Response Shape | Usage in UI |
| :--- | :--- | :--- | :--- | :--- |
| **API Health** | `GET` | `http://localhost:4000/health` | `{ status: "ok", service: "canaryguard-api", timestamp: string }` | `Navbar` status check & latency ping |
| **Bull-Board** | `GET` | `http://localhost:4000/admin/queues` | HTML / React Dashboard | `Navbar` & Dashboard external link |
| **Proxy Routing** | `GET` | `http://localhost:8000/admin/routing` | `{ status: "ok", config: { canaryWeight, baselineTarget, canaryTarget }, stats: { totalRequests, baselineRequests, canaryRequests, lastRouted } }` | Reverse proxy inspector *(Note: Direct to port 8000)* |
| **Canary Telemetry** | `GET` | `http://localhost:8081/admin/metrics` | `{ status: "ok", metrics: { totalRequests, successCount, failureCount, errorRate, p50LatencyMs, p90LatencyMs, p99LatencyMs, avgLatencyMs } }` | `TelemetryChart` live stream |
| **Baseline Telemetry**| `GET` | `http://localhost:8080/admin/metrics` | `{ status: "ok", metrics: { totalRequests, successCount, failureCount, errorRate, p50LatencyMs, p90LatencyMs, p99LatencyMs, avgLatencyMs } }` | `TelemetryChart` baseline comparison |

---

## 2. Data Models (Prisma Schema Reference)

```prisma
model Service {
  id                  String       @id @default(cuid())
  name                String       @unique
  repository          String
  kubernetesNamespace String       @default("default")
  deploymentName      String       @default("")
  currentVersion      String
  healthStatus        String       @default("UNKNOWN") // HEALTHY | DEGRADED | UNHEALTHY
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt
}

model Deployment {
  id            String    @id @default(cuid())
  serviceId     String
  version       String
  gitCommit     String
  image         String
  status        String    @default("PENDING")
  // VALID_TRANSITIONS: PENDING -> BUILDING -> DEPLOYING -> CANARY -> CANARY_ACTIVE -> OBSERVING -> PROMOTING -> PROMOTED | CANARY_DEGRADED -> INVESTIGATING -> ROLLING_BACK -> ROLLED_BACK | FAILED
  triggeredBy   String
  canaryWeight  Int       @default(0) // 0 to 100
  startedAt     DateTime  @default(now())
  completedAt   DateTime?
  failureReason String?
}

model DeploymentStep {
  id           String    @id @default(cuid())
  deploymentId String
  stepType     String    // BUILD | DEPLOY | CANARY | OBSERVE | DECIDE
  status       String    @default("PENDING") // PENDING | RUNNING | COMPLETED | FAILED | SKIPPED
  startedAt    DateTime  @default(now())
  completedAt  DateTime?
  metadata     Json?
}

model AgentRun {
  id             String          @id @default(cuid())
  deploymentId   String
  status         String          @default("PENDING") // PENDING | RUNNING | COMPLETED | FAILED
  startedAt      DateTime        @default(now())
  completedAt    DateTime?
  model          String          // e.g. "gemini-1.5-flash"
  confidence     Float?          // 0.0 to 1.0 (e.g. 0.94)
  recommendation String?         // "ROLLBACK" | "PROMOTE" | "OBSERVE"
  summary        String?
  evidence       AgentEvidence[]
}

model AgentEvidence {
  id              String   @id @default(cuid())
  agentRunId      String
  sourceType      String   // "METRIC" | "LOG" | "GIT"
  sourceReference String   // e.g. "telemetry:/admin/metrics", "git:a9f1b4c"
  evidence        String   // raw log string, diff snippet, or JSON string
  createdAt       DateTime @default(now())
}

model Approval {
  id           String    @id @default(cuid())
  deploymentId String
  action       String    // "ROLLBACK" | "PROMOTE"
  requestedAt  DateTime  @default(now())
  respondedAt  DateTime?
  respondedBy  String?
  status       String    @default("PENDING") // PENDING | APPROVED | REJECTED
  reason       String?
}

model AuditLog {
  id           String   @id @default(cuid())
  deploymentId String?
  actorType    String   // "USER" | "SYSTEM" | "AI" | "POLICY"
  actorId      String   // username, worker name, or model ID
  action       String   // "DEPLOYMENT_STARTED", "POLICY_VIOLATED", "ROLLBACK_EXECUTED", etc.
  metadata     Json?
  createdAt    DateTime @default(now())
}
```

---

## 3. Real-Time Architecture & Traffic Stepping

### 3.1 How "Real-Time" Works Today
* **Mechanism**: **Client-side polling via `setInterval` over HTTP**.
  - Dashboard overview (`apps/web/src/app/page.tsx`): Polled every **8000ms**.
  - Deployment details (`apps/web/src/app/deployments/[id]/page.tsx`): Polled every **5000ms**.
  - Navbar health badge (`apps/web/src/components/Navbar.tsx`): Polled every **10000ms**.
  - Telemetry chart (`apps/web/src/components/TelemetryChart.tsx`): Polled every **3000ms**.
* **Events / WebSockets / SSE**: **None** in the frozen backend. Everything is pull-based HTTP.

### 3.2 Allowed Traffic Steps
* Defined in `@canaryguard/config`:
  ```typescript
  export const CANARY_STEPS = [5, 25, 50, 100] as const;
  ```
* Total allowed discrete steps in the system:
  - **`0%`**: Baseline 100% (idle / post-rollback)
  - **`5%`**: Probe step
  - **`25%`**: Cautious step
  - **`50%`**: Half-split
  - **`100%`**: Full candidate promotion
* Backend `PATCH /api/deployments/:id` accepts `{ canaryWeight: number }` (0–100). The proxy accepts any integer 0–100, but standard workflows advance along `0 -> 5 -> 25 -> 50 -> 100`.

---

## 4. Feature Availability Matrix (Hard Rule 4 Audit)

| Feature Required by UI | Backend Status | Source / Reason | Implementation Rule |
| :--- | :---: | :--- | :--- |
| **API Latency Ping** | **AVAILABLE** | Measured client-side against real `http://localhost:4000/health`. | Measure round-trip delta `performance.now()` on health check. |
| **Audit Feed** | **AVAILABLE** | `GET /api/audit-logs?limit=5` & `deployment.auditLogs`. | Render real immutable audit log rows. |
| **Git Commit Hash** | **AVAILABLE** | `Deployment.gitCommit` (stored on deployment row). | Render commit hash chip with copy button. |
| **Git Diff Snippet** | **AVAILABLE** | `AgentEvidence` where `sourceType === "GIT"`. | Render inside AI Diagnostic panel only when an agent run exists. |
| **Standalone Git Diff Browser** | ❌ **MISSING** | No Git repository integration endpoint on port 4000. | **Do NOT build or mock** outside the AI evidence card. |
| **Repository Link** | **AVAILABLE** | `Service.repository` (stored on service row). | Render outbound link to repository URL. |
| **Duration Timers** | **AVAILABLE** | Calculated from `startedAt` and `completedAt` timestamps. | Compute elapsed seconds/minutes dynamically. |
| **SLA Thresholds & Breaches** | **AVAILABLE** | `Policy` table (`errorRateThreshold`, `latencyThreshold`) & `evaluation.breaches`. | Display real threshold values and breach badges. |
| **Proxy Stats via API Port 4000** | ❌ **MISSING** | Express API (`:4000`) does not expose a `/api/proxy/stats` route. Proxy stats exist only directly on `:8000/admin/routing`. | **Do NOT mock**. Show proxy status if direct `:8000` is queryable or link to proxy admin. |
| **Bull-Board UI Link** | **AVAILABLE** | Express mounts Bull-Board at `http://localhost:4000/admin/queues`. | Render navigation link to Bull-Board. |
| **Multi-Service Canary Pipeline** | **AVAILABLE** | `GET /api/services` returns each service's active deployment + weight. | Render selectable service tabs in hero with real weights. |

---

## 5. UI Inventory & Identified Deficiencies

* **Installed Tailwind Version**: `3.4.17` (`apps/web/package.json`).
* **Installed Next.js Version**: `15.1.7` (React 19).
* **Current UI Deficiencies**:
  1. **Generic Slate/Purple Aesthetic**: Uses default Tailwind `slate-950` / `slate-900` with purple gradients and emerald glows, looking identical to low-effort AI templates.
  2. **Gradient & Blur Violations**: Uses `backdrop-blur`, decorative linear gradients, and glowing borders contrary to the new strict "Solid Colors Only" rule.
  3. **Lack of Hierarchy**: All cards look identical with uniform `p-4` or `p-5` padding and repetitive borders.
  4. **Typography**: Uses default system sans-serif without tabular monospace numbers for time, error rates, and hashes.
  5. **Controls**: Missing real `<input type="range">` with discrete tick marks (0, 5, 25, 50, 100), missing hold-to-confirm / two-step rollback confirmation, missing peak/trough chart readouts.
