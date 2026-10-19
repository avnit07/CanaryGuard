# 🛡️ CanaryGuard

> **Agentic Deployment Verification and Automated Rollback Platform**  
> Safely release software to production with progressive traffic splitting, real-time SLA observability, autonomous AI incident diagnostics, and zero-downtime instant rollbacks.

---

[![Next.js](https://img.shields.io/badge/Next.js-15_App_Router-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748?logo=prisma)](https://www.prisma.io/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis)](https://redis.io/)
[![BullMQ](https://img.shields.io/badge/BullMQ-5.x-E0234E)](https://docs.bullmq.io/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.x-gray?logo=express)](https://expressjs.com/)

---

## 🏗️ System Architecture

CanaryGuard manages the complete lifecycle of a software release using an intelligent control loop:

```
                  ┌─────────────────────────────────────────────────────────┐
                  │                 Next.js 15 Control Plane                │
                  │             http://localhost:3000 (or :3001)            │
                  └────────────────────────────┬────────────────────────────┘
                                               │ REST API
                                               ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                          Express API Control Plane                        │
│                                (Port 4000)                                │
│       ├── REST Endpoints (/services, /deployments, /policies, /audit)     │
│       └── Bull-Board Queue Dashboard (/admin/queues)                      │
└───────────────────────┬───────────────────────────────────┬───────────────┘
                        │                                   │
              Prisma    │                                   │ Redis
              ORM       ▼                                   ▼
        ┌───────────────────┐               ┌───────────────────────────────┐
        │  PostgreSQL (5434)│               │   BullMQ Workflow Worker      │
        │  8 Models:        │               │   ├── Canary Evaluation Queue │
        │  - Service        │               │   ├── AI Investigation Queue  │
        │  - Deployment     │               │   └── Rollback Queue          │
        │  - AgentRun & Ev. │               └───────────────┬───────────────┘
        │  - AuditLog       │                               │
        └───────────────────┘                               │
                                                            │ Dynamic Re-weighting
                        ┌───────────────────────────────────┼─────────────────────────┐
                        │                                   ▼                         │
                        │                 ┌───────────────────────────────────┐       │
         Incoming User  │                 │    Dynamic Reverse Proxy (:8000)  │       │
         Traffic ───────┼────────────────►│    Weighted Random Routing Engine │       │
                        │                 └─────────┬───────────────┬─────────┘       │
                        │                           │               │                 │
                        │             (100 - W)%    │               │  W% (Canary)    │
                        │                           ▼               ▼                 │
                        │             ┌────────────────┐ ┌────────────────┐           │
                        │             │Baseline Service│ │ Canary Service │           │
                        │             │  (Port 8080)   │ │  (Port 8081)   │           │
                        │             │  Version v2.1.4│ │  Version v2.1.5│           │
                        │             │  [Stable SLA]  │ │ [Chaos Faults] │           │
                        │             └────────────────┘ └────────────────┘           │
                        └─────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

### 1. 🔀 Dynamic Reverse Proxy & Weighted Traffic Splitting
* Reverse proxy on port `8000` intercepts production traffic.
* Routes between the stable **Baseline** (`:8080`, `v2.1.4`) and the **Canary** candidate (`:8081`, `v2.1.5`).
* Dynamically re-weights traffic in runtime via `POST /admin/weight` without dropping connections or restarting processes.

### 2. 📈 Real-Time SLA Observability Engine
* Target microservices maintain an in-memory sliding window calculating **Error Rate %** and **P99 Response Latency (ms)**.
* Health evaluation engine inspects telemetry with `AbortSignal.timeout(3000)` safety boundaries.
* Automatically identifies SLA breaches (e.g., Error Rate $> 5\%$, Latency $> 500\text{ms}$) and flags deployments as `CANARY_DEGRADED`.

### 3. ⚙️ Background Queues & Progressive Rollout (BullMQ + Redis)
* Background worker orchestrates staged canary rollouts over configured observation windows:
  $$\text{Traffic Progression: } 5\% \longrightarrow 25\% \longrightarrow 50\% \longrightarrow 100\% \longrightarrow \text{PROMOTED}$$
* Survives server crashes and restarts through persistent Redis queues.
* Integrated **Bull-Board UI** mounted at `http://localhost:4000/admin/queues` for real-time visual job tracking.

### 4. 🤖 Autonomous Multi-Modal AI Diagnostic Agent
* When an SLA degradation is detected, the workflow worker automatically summons the AI Diagnostic Agent.
* **Multi-Modal Evidence Gathering**:
  - `METRIC`: Live sliding-window error rate and P99 latency snapshots.
  - `LOG`: Real-time stderr container logs capturing stack traces.
  - `GIT`: Git commit author, message, and code diff associated with the release.
* **Historical Incident Memory Bank**: Pattern-matches symptoms against known failure profiles (e.g. downstream gateway timeouts, memory leaks).
* Generates structured diagnostic verdicts, confidence scores, and root-cause summaries with rule-based safety fallbacks.

### 5. 🛑 Human-in-the-Loop Sign-Off & Instant Automated Rollbacks
* Next.js control plane renders an **AI Root Cause Analysis Card** with evidence breakdown.
* Engineers can review findings and approve rollback with a single click.
* Instantly cuts canary traffic on the proxy back to **0%** (routing 100% back to baseline).
* Automatically checks baseline health to verify post-rollback recovery and appends `RECOVERY_VERIFIED` to the immutable audit trail.

---

## 📁 Monorepo Layout

```
canaryguard/
├── apps/
│   ├── web/               # Next.js 15 App Router Control Plane UI (:3001)
│   ├── api/               # Express REST API & Bull-Board Dashboard (:4000)
│   ├── proxy/             # Weighted Reverse Proxy & Routing Engine (:8000)
│   └── demo-app/          # Payment Microservice with Chaos Toggle (:8080 & :8081)
│
├── packages/
│   ├── db/                # Prisma ORM schema & PostgreSQL client
│   ├── config/            # Shared constants, state machine transitions & SLA defaults
│   └── types/             # Shared TypeScript models & API contracts
│
├── workers/
│   └── workflow-worker/   # BullMQ worker managing rollouts, AI dispatch & rollbacks
│
├── scripts/
│   └── start-platform.mjs # Unified multi-service launcher (npm run start:all)
│
└── docker-compose.yml     # PostgreSQL 16 & Redis 7 infrastructure
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (>= 20.x)
- [Docker](https://www.docker.com/) & Docker Compose

### 2. Infrastructure Setup
Start PostgreSQL (port 5434) and Redis (port 6379):
```bash
docker compose up -d
```

### 3. Install & Build
```bash
# Install monorepo dependencies
npm install

# Generate Prisma Client & push schema to PostgreSQL
npm run db:generate
npm run db:push

# Build all monorepo packages and apps
npm run build
```

### 4. Launch All Services (One Command)
Run the built-in platform supervisor to spin up all 6 microservices simultaneously:
```bash
npm run start:all
```

---

## 🌐 Platform Interfaces

| Interface | URL | Description |
| :--- | :--- | :--- |
| **Control Plane UI** | [http://localhost:3001](http://localhost:3001) | Next.js 15 dashboard for managing canaries & reviewing AI diagnostics. |
| **Bull-Board Queues** | [http://localhost:4000/admin/queues](http://localhost:4000/admin/queues) | Live visual monitoring of active, delayed, and completed BullMQ jobs. |
| **Reverse Proxy** | [http://localhost:8000/admin/routing](http://localhost:8000/admin/routing) | Real-time traffic weights and proxy routing statistics. |
| **Baseline Service** | [http://localhost:8080/admin/metrics](http://localhost:8080/admin/metrics) | Stable v2.1.4 payment microservice telemetry. |
| **Canary Service** | [http://localhost:8081/admin/metrics](http://localhost:8081/admin/metrics) | Candidate v2.1.5 payment microservice telemetry. |

---

## 🧪 Live Chaos Drill Walkthrough

You can test the autonomous detection, AI root-cause analysis, and rollback flow live:

### 1. Create a Canary Deployment
Open `http://localhost:3001` and click **Deploy Canary** on `payment-service`:
* **Version**: `v2.1.5`
* **Git Commit**: `a9f1b4c (feat: checkout retry logic)`

### 2. Inject Chaos into the Canary Candidate
Simulate a downstream payment gateway failure on the canary container:
```bash
curl -X POST http://localhost:8081/admin/simulate-failure \
  -H "Content-Type: application/json" \
  -d '{"failureRate": 0.85, "latencyMs": 750}'
```

### 3. Generate User Traffic Through the Reverse Proxy
Send sample payment checkout requests through the proxy:
```bash
for i in {1..15}; do
  curl -s -X POST http://localhost:8000/api/payments \
    -H "Content-Type: application/json" \
    -d '{"amount": 99.99, "currency": "USD"}' > /dev/null
done
```

### 4. Watch Autonomous Verification in Action
1. The health evaluator detects an **SLA breach** (error rate $> 80\%$).
2. The deployment status automatically transitions to **`CANARY_DEGRADED`** and enqueues an AI diagnostic job.
3. The **AI Diagnostic Agent** gathers evidence (metrics snapshot, logs, git commit diff) and diagnoses:
   - **Verdict**: Critical Defect (`Downstream Payment Gateway Timeout`)
   - **Confidence**: `94%`
   - **Recommendation**: `ROLLBACK`
4. The dashboard displays the purple **AI Root Cause Analysis Card**.
5. Click **Approve Rollback**:
   - The Reverse Proxy instantly cuts canary traffic to **0%**.
   - The deployment status updates to **`ROLLED_BACK`**.
   - The post-recovery check queries the baseline service, verifies error rates $\le 5\%$, updates service health to **`HEALTHY`**, and writes `RECOVERY_VERIFIED` to the immutable audit log.

---

## 📜 Development Scripts

```bash
# Typecheck and lint all 8 monorepo workspaces
npm run lint

# Build all workspaces for production
npm run build

# Start individual microservices in development mode
npm run dev:web            # Next.js UI (port 3000 / 3001)
npm run dev:api            # Express API (port 4000)
npm run dev:proxy          # Reverse Proxy (port 8000)
npm run dev:demo:baseline  # Baseline service (port 8080)
npm run dev:demo:canary    # Canary service (port 8081)
npm run dev:worker         # BullMQ worker
```

---

## 📄 License
This project is open-source under the MIT License.
