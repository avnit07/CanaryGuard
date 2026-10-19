// ═══════════════════════════════════════════════════════
// CanaryGuard Web — API Client
// ═══════════════════════════════════════════════════════

import type {
  Service,
  Deployment,
  DeploymentStep,
  AgentRun,
  AgentEvidence,
  Approval,
  AuditLog,
  CreateServiceRequest,
  CreateDeploymentRequest,
} from "@canaryguard/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface ServiceWithStats extends Service {
  deployments?: Array<{
    id: string;
    version: string;
    status: string;
    startedAt: string;
    canaryWeight: number;
  }>;
  _count?: {
    deployments: number;
  };
}

export interface DeploymentDetail extends Deployment {
  service: Service;
  steps: DeploymentStep[];
  agentRuns: Array<AgentRun & { evidence: AgentEvidence[] }>;
  approvals: Approval[];
  auditLogs: AuditLog[];
}

export interface DeploymentListItem extends Deployment {
  service: {
    id: string;
    name: string;
    repository: string;
  };
  _count: {
    steps: number;
    agentRuns: number;
  };
}

// ─── Generic Fetch Wrapper ───────────────────────────

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorBody.error || `HTTP error ${res.status}`);
  }

  return res.json();
}

// ─── API Client Methods ──────────────────────────────

export const api = {
  // Services
  getServices: async (): Promise<ServiceWithStats[]> => {
    const json = await apiFetch<{ data: ServiceWithStats[] }>("/api/services");
    return json.data;
  },

  getService: async (id: string): Promise<ServiceWithStats> => {
    const json = await apiFetch<{ data: ServiceWithStats }>(`/api/services/${id}`);
    return json.data;
  },

  createService: async (payload: CreateServiceRequest): Promise<Service> => {
    const json = await apiFetch<{ data: Service }>("/api/services", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return json.data;
  },

  // Deployments
  getDeployments: async (params?: { serviceId?: string; status?: string }): Promise<DeploymentListItem[]> => {
    const query = new URLSearchParams();
    if (params?.serviceId) query.set("serviceId", params.serviceId);
    if (params?.status) query.set("status", params.status);
    const qs = query.toString() ? `?${query.toString()}` : "";
    const json = await apiFetch<{ data: DeploymentListItem[] }>(`/api/deployments${qs}`);
    return json.data;
  },

  getDeployment: async (id: string): Promise<DeploymentDetail> => {
    const json = await apiFetch<{ data: DeploymentDetail }>(`/api/deployments/${id}`);
    return json.data;
  },

  createDeployment: async (payload: CreateDeploymentRequest): Promise<DeploymentDetail> => {
    const json = await apiFetch<{ data: DeploymentDetail }>("/api/deployments", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return json.data;
  },

  updateDeployment: async (
    id: string,
    payload: { status?: string; canaryWeight?: number; notes?: string; reason?: string }
  ): Promise<Deployment> => {
    const json = await apiFetch<{ data: Deployment }>(`/api/deployments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return json.data;
  },

  approveDeployment: async (
    id: string,
    payload: { action: "ROLLBACK" | "PROMOTE"; status: "APPROVED" | "REJECTED"; reason?: string; respondedBy?: string }
  ): Promise<Approval> => {
    const json = await apiFetch<{ data: Approval }>(`/api/deployments/${id}/approve`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return json.data;
  },

  rollbackDeployment: async (
    id: string,
    payload?: { reason?: string }
  ): Promise<{ jobId: string; deploymentId: string }> => {
    const json = await apiFetch<{ message: string; data: { jobId: string; deploymentId: string } }>(
      `/api/deployments/${id}/rollback`,
      {
        method: "POST",
        body: JSON.stringify(payload || {}),
      }
    );
    return json.data;
  },

  evaluateDeployment: async (
    id: string,
    payload?: { targetUrl?: string }
  ): Promise<any> => {
    const json = await apiFetch<{ data: any }>(`/api/deployments/${id}/evaluate`, {
      method: "POST",
      body: JSON.stringify(payload || {}),
    });
    return json.data;
  },

  // Audit Logs
  getAuditLogs: async (params?: { deploymentId?: string; action?: string }): Promise<AuditLog[]> => {
    const query = new URLSearchParams();
    if (params?.deploymentId) query.set("deploymentId", params.deploymentId);
    if (params?.action) query.set("action", params.action);
    const qs = query.toString() ? `?${query.toString()}` : "";
    const json = await apiFetch<{ data: AuditLog[] }>(`/api/audit-logs${qs}`);
    return json.data;
  },
};
