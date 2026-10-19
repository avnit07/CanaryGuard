"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  RefreshCw,
  GitCommit,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Check,
  Shield,
  Activity,
  History,
  Info,
  Cpu,
  AlertOctagon,
  ShieldAlert,
} from "lucide-react";
import { api, DeploymentDetail } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { TelemetryChart } from "@/components/TelemetryChart";
import { VALID_TRANSITIONS, CANARY_STEPS } from "@canaryguard/config";

export default function DeploymentDetailPage() {
  const params = useParams();
  const deploymentId = params.id as string;

  const [deployment, setDeployment] = useState<DeploymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchDeployment = useCallback(async () => {
    try {
      setError(null);
      const data = await api.getDeployment(deploymentId);
      setDeployment(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load deployment");
    } finally {
      setLoading(false);
    }
  }, [deploymentId]);

  useEffect(() => {
    fetchDeployment();
    const interval = setInterval(fetchDeployment, 5000);
    return () => clearInterval(interval);
  }, [fetchDeployment]);

  // Handle State Machine Transition
  const handleTransition = async (nextStatus: string) => {
    if (!deployment) return;
    try {
      setUpdating(true);
      setError(null);
      await api.updateDeployment(deployment.id, { status: nextStatus });
      setActionSuccess(`Successfully transitioned state to ${nextStatus}`);
      await fetchDeployment();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to transition status");
    } finally {
      setUpdating(false);
    }
  };

  // Handle Traffic Weight Step Update
  const handleSetWeight = async (weight: number) => {
    if (!deployment) return;
    try {
      setUpdating(true);
      setError(null);
      await api.updateDeployment(deployment.id, { canaryWeight: weight });
      setActionSuccess(`Canary traffic split updated to ${weight}%`);
      await fetchDeployment();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update canary traffic weight");
    } finally {
      setUpdating(false);
    }
  };

  // Handle Rollback Approval
  const handleRollbackApproval = async (status: "APPROVED" | "REJECTED") => {
    if (!deployment) return;
    try {
      setUpdating(true);
      setError(null);
      await api.approveDeployment(deployment.id, {
        action: "ROLLBACK",
        status,
        reason: status === "APPROVED" ? "Approved by engineer from dashboard" : "Rejected by engineer",
      });
      setActionSuccess(`Rollback request ${status.toLowerCase()}`);
      await fetchDeployment();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to process rollback approval");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-emerald-400" />
        Loading deployment details...
      </div>
    );
  }

  if (!deployment) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-100">Deployment Not Found</h2>
        <p className="text-slate-400 text-sm">No deployment found with ID {deploymentId}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const allowedTransitions = VALID_TRANSITIONS[deployment.status] || [];
  const isTerminal = ["PROMOTED", "ROLLED_BACK", "FAILED"].includes(deployment.status);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-100">{deployment.service?.name}</h1>
              <span className="font-mono text-emerald-400 font-semibold">{deployment.version}</span>
              <StatusBadge status={deployment.status} />
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {deployment.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchDeployment()}
            className="p-2 text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded-lg transition-colors hover:bg-slate-800"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-800 rounded-xl text-rose-300 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {actionSuccess && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-800 rounded-xl text-emerald-300 text-sm flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* ─── Top Metadata Summary ─────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-500 uppercase font-semibold block">Git Commit</span>
          <div className="mt-1 flex items-center gap-1.5 font-mono text-sm text-slate-200">
            <GitCommit className="w-4 h-4 text-slate-400" />
            {deployment.gitCommit}
          </div>
        </div>
        <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-500 uppercase font-semibold block">Canary Traffic</span>
          <div className="mt-1 flex items-center gap-1.5 font-mono text-sm text-amber-400 font-bold">
            <Layers className="w-4 h-4" />
            {deployment.canaryWeight}%
          </div>
        </div>
        <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-500 uppercase font-semibold block">Triggered By</span>
          <div className="mt-1 font-mono text-xs text-slate-300 truncate">
            {deployment.triggeredBy}
          </div>
        </div>
        <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-500 uppercase font-semibold block">Started At</span>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            {new Date(deployment.startedAt).toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* ─── Live Telemetry Time-Series Chart ────────────── */}
      <TelemetryChart
        canaryTargetUrl={deployment.canaryWeight > 0 ? "http://localhost:8081" : "http://localhost:8080"}
      />

      {/* ─── AI Diagnostic Investigation & Rollback Action Panel ──────── */}
      {deployment.agentRuns && deployment.agentRuns.length > 0 && (
        <div className="p-6 bg-gradient-to-br from-purple-950/40 via-slate-900/80 to-slate-950 border border-purple-800/60 rounded-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-purple-800/40 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-slate-100">
                    AI Diagnostic Root Cause Analysis
                  </h2>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800/50">
                    Model: {deployment.agentRuns[0].model}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automated incident investigation and policy recommendation
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Confidence:</span>
              <span className="text-xs font-bold text-emerald-400 font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/80">
                {Math.round((deployment.agentRuns[0].confidence || 0) * 100)}%
              </span>
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800">
                RECOMMENDATION: {deployment.agentRuns[0].recommendation}
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-lg text-sm text-slate-200">
            <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider block mb-1">
              Diagnostic Summary
            </span>
            <p className="text-slate-300 leading-relaxed text-sm">
              {deployment.agentRuns[0].summary}
            </p>
          </div>

          {/* Evidence Breakdown */}
          {deployment.agentRuns[0].evidence && deployment.agentRuns[0].evidence.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                Investigative Evidence Captured
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {deployment.agentRuns[0].evidence.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg font-mono text-xs"
                  >
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="font-semibold text-purple-400">[{ev.sourceType}]</span>
                      <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                        {ev.sourceReference}
                      </span>
                    </div>
                    <pre className="text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap">
                      {ev.evidence}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Human Approval Sign-Off Action */}
          {["INVESTIGATING", "CANARY_DEGRADED", "AWAITING_APPROVAL", "CANARY", "OBSERVING"].includes(deployment.status) && (
            <div className="pt-4 border-t border-purple-800/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-xs text-slate-300 flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  Human-in-the-loop sign-off: Approve rollback to instantly route 100% traffic back to baseline.
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleRollbackApproval("REJECTED")}
                  disabled={updating}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800 rounded-lg transition-colors"
                >
                  Reject Rollback
                </button>
                <button
                  onClick={() => handleRollbackApproval("APPROVED")}
                  disabled={updating}
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-lg shadow-rose-950/60"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Approve Immediate Rollback
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── State Machine Control Panel ──────────────────── */}
      <div className="p-6 bg-slate-900/70 border border-slate-800 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800/80 pb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              State Machine Progression & Controls
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enforces valid state transitions according to CanaryGuard policy
            </p>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Current State: <span className="text-emerald-400 font-bold">{deployment.status}</span>
          </div>
        </div>

        {isTerminal ? (
          <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800/60 text-sm text-slate-400 flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-500" />
            This deployment has reached terminal status ({deployment.status}). No further state transitions are permitted.
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Allowed Next State Transitions
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {allowedTransitions.length === 0 ? (
                  <span className="text-xs text-slate-500">None available</span>
                ) : (
                  allowedTransitions.map((status) => {
                    const isDangerous = ["ROLLING_BACK", "ROLLED_BACK", "FAILED"].includes(status);
                    return (
                      <button
                        key={status}
                        onClick={() => handleTransition(status)}
                        disabled={updating}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors disabled:opacity-50 ${
                          isDangerous
                            ? "bg-rose-950/40 text-rose-300 border-rose-800/80 hover:bg-rose-900/50"
                            : "bg-blue-950/40 text-blue-300 border-blue-800/80 hover:bg-blue-900/50"
                        }`}
                      >
                        <Play className="w-3 h-3" />
                        Advance to {status}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Traffic Splitting Slider / Presets */}
            <div className="pt-4 border-t border-slate-800/60">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Canary Traffic Weight (% routed to {deployment.version})
              </span>
              <div className="flex items-center gap-2">
                {CANARY_STEPS.map((step) => (
                  <button
                    key={step}
                    onClick={() => handleSetWeight(step)}
                    disabled={updating || isTerminal}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors ${
                      deployment.canaryWeight === step
                        ? "bg-amber-500 text-slate-950 border-amber-400 font-bold"
                        : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {step}%
                  </button>
                ))}
                <button
                  onClick={() => handleSetWeight(0)}
                  disabled={updating || isTerminal}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono text-rose-400 bg-rose-950/30 border border-rose-800/60 hover:bg-rose-950/60 transition-colors ml-auto flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset to 0%
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Pipeline Execution Steps ─────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Pipeline Execution Steps
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {deployment.steps?.map((step, idx) => (
            <div
              key={step.id}
              className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl relative overflow-hidden"
            >
              <div className="text-xs text-slate-500 font-mono mb-1">Step 0{idx + 1}</div>
              <div className="font-semibold text-slate-200 text-sm mb-2">{step.stepType}</div>
              <StatusBadge status={step.status} type="step" />
            </div>
          ))}
        </div>
      </div>

      {/* ─── Audit Trail & Timeline ───────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <History className="w-4 h-4 text-blue-400" />
          Audit Trail & Timeline
        </h2>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
          {deployment.auditLogs?.length === 0 ? (
            <p className="text-xs text-slate-500">No audit log entries recorded yet.</p>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {deployment.auditLogs?.map((log) => (
                <div key={log.id} className="relative group">
                  <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-slate-950" />
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-slate-200">
                      {log.action}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Actor: <span className="font-mono text-slate-300">{log.actorType}</span> ({log.actorId})
                  </p>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <pre className="mt-2 p-2 bg-slate-950/80 rounded border border-slate-800 text-[11px] font-mono text-slate-400 overflow-x-auto">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
