"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
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
  ShieldAlert,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Sliders,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { api, DeploymentDetail } from "@/lib/api";
import { formatVersion } from "@/lib/formatters";
import { DEMO_DEPLOYMENT_DETAIL } from "@/lib/demo-data";
import { DeploymentStatus } from "@canaryguard/types";
import { StatusBadge } from "@/components/StatusBadge";
import { TelemetryChart } from "@/components/TelemetryChart";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import {
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui/Table";
import { VALID_TRANSITIONS, CANARY_STEPS } from "@canaryguard/config";

// Allowed discrete traffic snap points
const TRAFFIC_STEPS = [0, 5, 25, 50, 100] as const;

export default function DeploymentDetailPage() {
  const params = useParams();
  const deploymentId = params.id as string;

  const [deployment, setDeployment] = useState<DeploymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [copiedCommit, setCopiedCommit] = useState(false);

  // Fader state (selected locally, applies only on explicit button click)
  const [selectedWeight, setSelectedWeight] = useState<number>(0);

  // Rollback two-step confirmation state
  const [rollbackState, setRollbackState] = useState<"idle" | "confirming">("idle");
  const [rollbackCountdown, setRollbackCountdown] = useState<number>(5);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Evidence filter tab in AI panel
  const [activeEvidenceTab, setActiveEvidenceTab] = useState<"ALL" | "LOG" | "GIT" | "METRIC">("ALL");

  // Expandable audit metadata rows
  const [expandedAuditRows, setExpandedAuditRows] = useState<Record<string, boolean>>({});

  // Elapsed time tracker for active canaries
  const [now, setNow] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchDeployment = useCallback(
    async (isBackground = false) => {
      try {
        if (!isBackground) setRefreshing(true);
        setError(null);
        const data = await api.getDeployment(deploymentId);
        setDeployment(data);
        // Only initialize selected weight if not currently modified by user
        setSelectedWeight((prev) => (isBackground ? prev : data.canaryWeight));
      } catch (err: unknown) {
        // Fallback to sample deployment detail for public portfolio reviews
        if (deploymentId.startsWith("dep-") || !deployment) {
          setDeployment({ ...DEMO_DEPLOYMENT_DETAIL, id: deploymentId });
          setSelectedWeight((prev) => (isBackground ? prev : DEMO_DEPLOYMENT_DETAIL.canaryWeight));
        } else {
          setError(err instanceof Error ? err.message : "Failed to load deployment details");
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [deploymentId, deployment]
  );

  // Polling every 5000ms
  useEffect(() => {
    fetchDeployment();
    const interval = setInterval(() => fetchDeployment(true), 5000);
    return () => clearInterval(interval);
  }, [fetchDeployment]);

  // Sync selectedWeight once initial deployment data arrives
  useEffect(() => {
    if (deployment) {
      setSelectedWeight(deployment.canaryWeight);
    }
  }, [deployment?.canaryWeight]);

  // Two-step rollback countdown timer
  useEffect(() => {
    if (rollbackState === "confirming") {
      setRollbackCountdown(5);
      countdownTimerRef.current = setInterval(() => {
        setRollbackCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimerRef.current!);
            setRollbackState("idle");
            return 5;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    }
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [rollbackState]);

  // Handle State Machine Transition
  const handleTransition = async (nextStatus: string) => {
    if (!deployment) return;
    try {
      setUpdating(true);
      setError(null);
      await api.updateDeployment(deployment.id, { status: nextStatus });
      setActionSuccess(`Advanced state to ${nextStatus}`);
      await fetchDeployment(true);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch {
      // In demo mode without backend, simulate success locally
      setDeployment((prev) => (prev ? { ...prev, status: nextStatus as any } : null));
      setActionSuccess(`Advanced state to ${nextStatus} (Demo mode)`);
      setTimeout(() => setActionSuccess(null), 4000);
    } finally {
      setUpdating(false);
    }
  };

  // Handle Explicit Traffic Weight Apply
  const handleApplyWeight = async () => {
    if (!deployment) return;
    try {
      setUpdating(true);
      setError(null);
      await api.updateDeployment(deployment.id, { canaryWeight: selectedWeight });
      setActionSuccess(`Canary traffic split successfully set to ${selectedWeight}%`);
      await fetchDeployment(true);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch {
      // In demo mode without backend, simulate success locally
      setDeployment((prev) => (prev ? { ...prev, canaryWeight: selectedWeight } : null));
      setActionSuccess(`Canary traffic split set to ${selectedWeight}% (Demo mode)`);
      setTimeout(() => setActionSuccess(null), 4000);
    } finally {
      setUpdating(false);
    }
  };

  // Handle Rollback Approval / Execution
  const handleRollbackApproval = async (status: "APPROVED" | "REJECTED") => {
    if (!deployment) return;
    try {
      setUpdating(true);
      setError(null);
      setRollbackState("idle");
      await api.approveDeployment(deployment.id, {
        action: "ROLLBACK",
        status,
        reason: status === "APPROVED" ? "Approved by engineer from Flight Deck" : "Rejected by engineer",
      });
      setActionSuccess(
        status === "APPROVED"
          ? "Rollback initiated. Routing 100% traffic back to baseline."
          : "Rollback recommendation rejected by engineer."
      );
      await fetchDeployment(true);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch {
      // In demo mode without backend, simulate success locally
      setDeployment((prev) => (prev ? { ...prev, status: DeploymentStatus.ROLLED_BACK, canaryWeight: 0 } : null));
      setActionSuccess("Simulated rollback approved. 100% traffic restored to baseline.");
      setRollbackState("idle");
      setTimeout(() => setActionSuccess(null), 4000);
    } finally {
      setUpdating(false);
    }
  };

  // Handle Live SLA Health Evaluation
  const handleEvaluateHealth = async () => {
    if (!deployment) return;
    try {
      setEvaluating(true);
      setError(null);
      const res = await api.evaluateDeployment(deployment.id);
      if (res?.evaluation?.isDegraded) {
        setError(`SLA Violation Detected: ${res.evaluation.breaches?.join(", ") || "Degraded metrics"}`);
      } else {
        setActionSuccess("SLA Health Evaluation Passed: All canary metrics within baseline thresholds.");
        setTimeout(() => setActionSuccess(null), 4000);
      }
      await fetchDeployment(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to evaluate service health");
    } finally {
      setEvaluating(false);
    }
  };

  const copyCommitHash = () => {
    if (!deployment) return;
    navigator.clipboard.writeText(deployment.gitCommit);
    setCopiedCommit(true);
    setTimeout(() => setCopiedCommit(false), 2000);
  };

  const toggleAuditRow = (id: string) => {
    setExpandedAuditRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Elapsed flight time computation
  const durationReadout = useMemo(() => {
    if (!deployment) return "--";
    const start = new Date(deployment.startedAt).getTime();
    const end = deployment.completedAt ? new Date(deployment.completedAt).getTime() : now;
    const diffSec = Math.max(0, Math.floor((end - start) / 1000));
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    const formatted = `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
    return deployment.completedAt ? `Finished (${formatted})` : `In flight (${formatted})`;
  }, [deployment, now]);

  // Loading Skeleton State (Solid opacity pulse, no shimmer gradient)
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  // Error / Not Found State
  if (!deployment) {
    return (
      <Panel level="surface" className="p-8 text-center space-y-4 max-w-lg mx-auto my-12">
        <XCircle className="w-8 h-8 text-signal-coral mx-auto" />
        <h2 className="text-20 font-bold text-text-primary">Deployment Record Not Found</h2>
        <p className="text-sm text-text-muted">
          No deployment matching identifier <span className="font-mono text-text-primary">{deploymentId}</span> exists in the cluster database.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link href="/fleet">
            <Button variant="secondary" icon={<ArrowLeft className="w-4 h-4" />}>
              Back to Fleet Overview
            </Button>
          </Link>
          <Button variant="primary" onClick={() => fetchDeployment()}>
            Retry Fetch
          </Button>
        </div>
      </Panel>
    );
  }

  const allowedTransitions = VALID_TRANSITIONS[deployment.status] || [];
  const isTerminal = ["PROMOTED", "ROLLED_BACK", "FAILED"].includes(deployment.status);
  const latestAgentRun = deployment.agentRuns && deployment.agentRuns.length > 0 ? deployment.agentRuns[0] : null;
  const isRollbackRecommended = latestAgentRun?.recommendation === "ROLLBACK";
  const isAwaitingRollbackSignoff = [
    "INVESTIGATING",
    "CANARY_DEGRADED",
    "AWAITING_APPROVAL",
    "CANARY",
    "OBSERVING",
  ].includes(deployment.status);

  // Evidence filtering
  const allEvidence = latestAgentRun?.evidence || [];
  const filteredEvidence = allEvidence.filter((ev) => {
    if (activeEvidenceTab === "ALL") return true;
    return ev.sourceType === activeEvidenceTab;
  });

  // Slider step index helper
  const currentStepIndex = TRAFFIC_STEPS.indexOf(selectedWeight as any) >= 0 ? TRAFFIC_STEPS.indexOf(selectedWeight as any) : 0;

  return (
    <div className="space-y-6">
      {/* ─── Breadcrumb & Actions Bar ─────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-4">
        <div className="flex items-start sm:items-center gap-3">
          <Link href="/fleet">
            <Button
              variant="secondary"
              size="sm"
              icon={<ArrowLeft className="w-4 h-4" />}
              title="Return to fleet overview"
            >
              Fleet
            </Button>
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-20 font-bold text-text-primary tracking-tight">
                {deployment.service?.name || "Service"}
              </h1>
              <span className="font-mono text-14 font-semibold text-signal-emerald px-1.5 py-0.5 bg-raised border border-border-subtle rounded">
                {formatVersion(deployment.version)}
              </span>
              <StatusBadge status={deployment.status} />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-12 font-mono text-text-muted">ID: {deployment.id}</span>
              {deployment.service?.repository && (
                <a
                  href={deployment.service.repository}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-12 font-mono text-text-muted hover:text-signal-cyan transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Repo
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleEvaluateHealth}
            loading={evaluating}
            icon={<Activity className="w-3.5 h-3.5 text-signal-emerald" />}
            title="Perform live SLA evaluation against telemetry metrics"
          >
            Evaluate SLA Health
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchDeployment()}
            loading={refreshing}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />}
            title="Refresh deployment state"
          >
            Sync
          </Button>
        </div>
      </div>

      {/* ─── Alerts & Notifications ───────────────────────── */}
      {error && (
        <Alert variant="coral" title="Operation Failure">
          {error}
        </Alert>
      )}
      {actionSuccess && (
        <Alert variant="emerald" title="Action Confirmed">
          {actionSuccess}
        </Alert>
      )}

      {/* ─── Metadata HUD (4 Solid Metric Tiles) ──────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Tile 1: Git Commit */}
        <Panel level="surface" className="p-4 space-y-1">
          <span className="text-12 font-mono text-text-muted uppercase tracking-wider block">
            Git Commit
          </span>
          <div className="flex items-center justify-between gap-1">
            <span className="font-mono text-14 font-semibold text-text-primary truncate">
              {deployment.gitCommit ? deployment.gitCommit.slice(0, 10) : "HEAD"}
            </span>
            <button
              onClick={copyCommitHash}
              className="p-1 text-text-muted hover:text-text-primary hover:bg-raised rounded transition-colors"
              title="Copy full commit hash"
            >
              {copiedCommit ? (
                <Check className="w-3.5 h-3.5 text-signal-emerald" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </Panel>

        {/* Tile 2: Canary Split */}
        <Panel level="surface" className="p-4 space-y-1">
          <span className="text-12 font-mono text-text-muted uppercase tracking-wider block">
            Traffic Allocation
          </span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-16 font-bold tabular-nums text-signal-amber">
              {deployment.canaryWeight}%
            </span>
            <span className="text-12 font-mono text-text-muted">
              (Baseline: {100 - deployment.canaryWeight}%)
            </span>
          </div>
          {/* Solid 4px Traffic Bar */}
          <div className="w-full h-1.5 bg-signal-steel/30 rounded flex overflow-hidden">
            <div
              className="bg-signal-amber transition-all duration-200"
              style={{ width: `${deployment.canaryWeight}%` }}
            />
            <div
              className="bg-signal-steel transition-all duration-200"
              style={{ width: `${100 - deployment.canaryWeight}%` }}
            />
          </div>
        </Panel>

        {/* Tile 3: Triggered By */}
        <Panel level="surface" className="p-4 space-y-1">
          <span className="text-12 font-mono text-text-muted uppercase tracking-wider block">
            Trigger Actor
          </span>
          <div className="font-mono text-14 font-medium text-text-primary truncate">
            {deployment.triggeredBy || "Automated Workflow"}
          </div>
          <span className="text-12 font-mono text-text-muted block truncate">
            Namespace: {deployment.service?.kubernetesNamespace || "default"}
          </span>
        </Panel>

        {/* Tile 4: Duration */}
        <Panel level="surface" className="p-4 space-y-1">
          <span className="text-12 font-mono text-text-muted uppercase tracking-wider block">
            Flight Clock
          </span>
          <div className="flex items-center gap-1.5 font-mono text-14 font-medium tabular-nums text-text-primary">
            <Clock className="w-3.5 h-3.5 text-signal-steel shrink-0" />
            <span>{durationReadout}</span>
          </div>
          <span className="text-12 font-mono text-text-muted block">
            {new Date(deployment.startedAt).toLocaleTimeString()}
          </span>
        </Panel>
      </div>

      {/* ─── Rollback Action Module (Thin 2px Amber Top Border) ─── */}
      {(isRollbackRecommended || isAwaitingRollbackSignoff) && !isTerminal && (
        <Panel
          level="elevated"
          className="border-t-2 border-t-signal-amber border-border-strong p-5 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-raised border border-border-subtle rounded text-signal-coral">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-16 font-bold text-text-primary">
                    Human-in-the-Loop Rollback Authority
                  </h3>
                  {isRollbackRecommended && (
                    <Badge variant="coral">AI Recommended</Badge>
                  )}
                </div>
                <p className="text-14 text-text-muted mt-0.5">
                  Authorize immediate traffic cut. Instantly routes 100% traffic back to baseline{" "}
                  <span className="font-mono text-text-primary">
                    v{deployment.service?.currentVersion || "baseline"}
                  </span>{" "}
                  and queues rollback recovery.
                </p>
              </div>
            </div>

            {/* Confirmation Controls */}
            {rollbackState === "idle" ? (
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleRollbackApproval("REJECTED")}
                  disabled={updating}
                  title="Dismiss rollback recommendation"
                >
                  Dismiss
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setRollbackState("confirming")}
                  disabled={updating}
                  icon={<RotateCcw className="w-3.5 h-3.5" />}
                >
                  Initiate Emergency Rollback
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setRollbackState("idle")}
                  disabled={updating}
                >
                  Cancel
                </Button>
                <button
                  onClick={() => handleRollbackApproval("APPROVED")}
                  disabled={updating}
                  className="px-3.5 py-1.5 text-xs font-mono font-bold bg-signal-coral text-page hover:bg-signal-coral/90 rounded border border-signal-coral transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-signal-cyan disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  CONFIRM IMMEDIATE ROLLBACK ({rollbackCountdown}s)
                </button>
              </div>
            )}
          </div>
        </Panel>
      )}

      {/* ─── Live Telemetry Time-Series Chart ────────────── */}
      <TelemetryChart
        canaryTargetUrl={deployment.canaryWeight > 0 ? "http://localhost:8081" : "http://localhost:8080"}
      />

      {/* ─── Tactile Traffic Fader & State Machine Deck ───── */}
      <Panel level="surface" className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border-subtle pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-raised border border-border-subtle rounded text-signal-amber">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-16 font-bold text-text-primary">
                Tactile Traffic Control & State Engine
              </h2>
              <p className="text-12 text-text-muted mt-0.5">
                Precision throttle snaps strictly to backend-validated canary steps
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-12 font-mono text-text-muted">Active State:</span>
            <span className="font-mono text-12 font-bold px-2 py-0.5 rounded bg-raised border border-border-strong text-signal-emerald">
              {deployment.status}
            </span>
          </div>
        </div>

        {/* State Machine Transition Actions */}
        {!isTerminal ? (
          <div className="space-y-3">
            <span className="text-12 font-mono uppercase tracking-wider text-text-muted block">
              Allowed Next State Transitions
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {allowedTransitions.length === 0 ? (
                <span className="text-12 font-mono text-text-muted">
                  No automated transitions currently available from {deployment.status}.
                </span>
              ) : (
                allowedTransitions.map((nextState) => {
                  const isDestructive = ["ROLLING_BACK", "ROLLED_BACK", "FAILED"].includes(nextState);
                  return (
                    <Button
                      key={nextState}
                      variant={isDestructive ? "danger" : "secondary"}
                      size="sm"
                      onClick={() => handleTransition(nextState)}
                      loading={updating}
                      icon={isDestructive ? <RotateCcw className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    >
                      Advance to {nextState}
                    </Button>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div className="p-3 bg-raised border border-border-subtle rounded text-14 text-text-muted flex items-center gap-2">
            <Info className="w-4 h-4 text-signal-steel shrink-0" />
            <span>
              Deployment has reached terminal state ({deployment.status}). The state machine is locked.
            </span>
          </div>
        )}

        {/* Traffic Split Fader */}
        <div className="space-y-4 pt-4 border-t border-border-subtle">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <span className="text-12 font-mono uppercase tracking-wider text-text-muted block">
                Canary Weight Fader
              </span>
              <span className="text-12 text-text-muted">
                Adjust throttle slider or select discrete preset, then click Apply.
              </span>
            </div>

            {/* Split Readout */}
            <div className="flex items-center gap-3 font-mono text-12">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-signal-steel rounded-none" />
                <span className="text-text-muted">
                  Baseline: <strong className="text-text-primary tabular-nums">{100 - selectedWeight}%</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-signal-amber rounded-none" />
                <span className="text-signal-amber">
                  Canary: <strong className="tabular-nums">{selectedWeight}%</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Dual-Color Solid Allocation Bar */}
          <div className="w-full h-4 bg-raised border border-border-subtle rounded overflow-hidden flex">
            <div
              className="bg-signal-amber transition-all duration-150 flex items-center justify-center font-mono text-[10px] text-page font-bold select-none overflow-hidden"
              style={{ width: `${selectedWeight}%` }}
              title={`Canary: ${selectedWeight}%`}
            >
              {selectedWeight >= 15 ? `${selectedWeight}%` : ""}
            </div>
            <div
              className="bg-signal-steel transition-all duration-150 flex items-center justify-center font-mono text-[10px] text-page font-bold select-none overflow-hidden"
              style={{ width: `${100 - selectedWeight}%` }}
              title={`Baseline: ${100 - selectedWeight}%`}
            >
              {100 - selectedWeight >= 15 ? `${100 - selectedWeight}%` : ""}
            </div>
          </div>

          {/* HTML5 Range Slider snapping to 0, 5, 25, 50, 100 */}
          <div className="relative pt-1 pb-1">
            <input
              type="range"
              min={0}
              max={4}
              step={1}
              value={currentStepIndex}
              disabled={isTerminal || updating}
              onChange={(e) => {
                const stepIdx = Number(e.target.value);
                setSelectedWeight(TRAFFIC_STEPS[stepIdx]);
              }}
              className="w-full h-2 bg-raised rounded appearance-none cursor-pointer accent-signal-cyan disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-signal-cyan"
              aria-label="Canary traffic split percentage"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={selectedWeight}
            />
          </div>

          {/* Preset Buttons & Explicit Apply Button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              {TRAFFIC_STEPS.map((step) => {
                const isSelected = selectedWeight === step;
                const isCurrentlyActive = deployment.canaryWeight === step;
                return (
                  <button
                    key={step}
                    type="button"
                    onClick={() => setSelectedWeight(step)}
                    disabled={isTerminal || updating}
                    className={`px-3 py-1 text-12 font-mono border rounded transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-signal-cyan disabled:opacity-40 ${
                      isSelected
                        ? "bg-signal-cyan text-page font-bold border-signal-cyan"
                        : "bg-surface text-text-primary border-border-subtle hover:bg-raised"
                    }`}
                  >
                    <span>{step}%</span>
                    {isCurrentlyActive && (
                      <span className="ml-1.5 text-[10px] opacity-75">(active)</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explicit Apply Traffic Shift Button */}
            <div>
              {selectedWeight !== deployment.canaryWeight ? (
                <Button
                  variant="primary"
                  onClick={handleApplyWeight}
                  loading={updating}
                  className="w-full sm:w-auto"
                >
                  Apply Traffic Shift: {deployment.canaryWeight}% → {selectedWeight}%
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  disabled
                  className="w-full sm:w-auto"
                >
                  Traffic Split Synchronized ({selectedWeight}%)
                </Button>
              )}
            </div>
          </div>
        </div>
      </Panel>

      {/* ─── AI Diagnostic Root Cause HUD (Zero Purple) ───── */}
      {latestAgentRun ? (
        <Panel level="surface" className="p-6 space-y-5 border-border-strong">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border-subtle pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-raised border border-border-subtle rounded text-signal-emerald">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-16 font-bold text-text-primary">
                    AI Diagnostic Root Cause Analysis
                  </h2>
                  <span className="text-12 font-mono text-text-muted bg-raised px-2 py-0.5 rounded border border-border-subtle">
                    Model: {latestAgentRun.model}
                  </span>
                </div>
                <p className="text-12 text-text-muted mt-0.5">
                  Automated incident investigation, policy correlation, and remediation directive
                </p>
              </div>
            </div>

            {/* Segmented Confidence Meter & Recommendation Readout */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 bg-raised px-2.5 py-1 rounded border border-border-subtle">
                <span className="text-12 font-mono text-text-muted">Confidence:</span>
                {/* 10-Segment Precision Meter */}
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 10 }).map((_, idx) => {
                    const isFilled = idx < Math.round((latestAgentRun.confidence || 0) * 10);
                    return (
                      <span
                        key={idx}
                        className={`w-1.5 h-3 rounded-none ${
                          isFilled ? "bg-signal-emerald" : "bg-page border border-border-subtle"
                        }`}
                      />
                    );
                  })}
                </div>
                <span className="font-mono text-12 font-bold tabular-nums text-signal-emerald ml-1">
                  {Math.round((latestAgentRun.confidence || 0) * 100)}%
                </span>
              </div>

              {/* Recommendation Badge */}
              <div
                className={`font-mono text-12 font-bold px-2.5 py-1 rounded border uppercase ${
                  latestAgentRun.recommendation === "ROLLBACK"
                    ? "bg-surface text-signal-coral border-signal-coral"
                    : latestAgentRun.recommendation === "PROMOTE"
                    ? "bg-surface text-signal-emerald border-signal-emerald"
                    : "bg-surface text-signal-amber border-signal-amber"
                }`}
              >
                RECOMMENDATION: {latestAgentRun.recommendation || "OBSERVE"}
              </div>
            </div>
          </div>

          {/* Diagnostic Summary Quote Block */}
          <div className="bg-page border-l-2 border-l-signal-emerald border border-border-subtle p-4 rounded text-14 text-text-primary leading-relaxed font-mono">
            <span className="text-12 font-mono uppercase text-signal-steel block mb-1">
              Automated Forensic Summary
            </span>
            <p>{latestAgentRun.summary || "Investigation concluded without anomalies."}</p>
          </div>

          {/* Evidence Inspector Tabs */}
          {allEvidence.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                <span className="text-12 font-mono uppercase tracking-wider text-text-muted">
                  Correlated Diagnostic Evidence ({allEvidence.length})
                </span>

                {/* Evidence Filter Tabs */}
                <div className="flex items-center gap-1 font-mono text-12">
                  {(["ALL", "LOG", "GIT", "METRIC"] as const).map((tab) => {
                    const count = tab === "ALL" ? allEvidence.length : allEvidence.filter((e) => e.sourceType === tab).length;
                    if (count === 0 && tab !== "ALL") return null;
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveEvidenceTab(tab)}
                        className={`px-2 py-0.5 rounded text-xs transition-colors ${
                          activeEvidenceTab === tab
                            ? "bg-raised text-signal-cyan font-bold border border-signal-cyan/40"
                            : "text-text-muted hover:text-text-primary"
                        }`}
                      >
                        {tab} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Evidence Content Blocks */}
              <div className="space-y-3">
                {filteredEvidence.map((ev) => {
                  const isGitDiff = ev.sourceType === "GIT";
                  const lines = ev.evidence.split("\n");

                  return (
                    <div
                      key={ev.id}
                      className="bg-page border border-border-subtle rounded p-3 font-mono text-12 space-y-2"
                    >
                      <div className="flex items-center justify-between text-text-muted text-xs border-b border-border-subtle pb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold px-1.5 py-0.2 rounded ${
                              ev.sourceType === "GIT"
                                ? "text-signal-cyan bg-raised"
                                : ev.sourceType === "LOG"
                                ? "text-signal-amber bg-raised"
                                : "text-signal-emerald bg-raised"
                            }`}
                          >
                            [{ev.sourceType}]
                          </span>
                          <span className="text-text-primary">{ev.sourceReference}</span>
                        </div>
                        <span className="tabular-nums">
                          {new Date(ev.createdAt).toLocaleTimeString()}
                        </span>
                      </div>

                      {/* Evidence Body */}
                      {isGitDiff ? (
                        <div className="overflow-x-auto max-h-64 font-mono text-12 leading-relaxed bg-surface border border-border-subtle rounded p-2">
                          {lines.map((line, idx) => {
                            const isAdded = line.startsWith("+") && !line.startsWith("+++");
                            const isRemoved = line.startsWith("-") && !line.startsWith("---");
                            const isHeader = line.startsWith("@@");

                            let lineStyle = "text-text-muted";
                            if (isAdded) lineStyle = "text-signal-emerald bg-signal-emerald/10";
                            if (isRemoved) lineStyle = "text-signal-coral bg-signal-coral/10";
                            if (isHeader) lineStyle = "text-signal-steel bg-raised";

                            return (
                              <div key={idx} className={`flex ${lineStyle} px-1.5 py-0.5`}>
                                <span className="w-8 text-right pr-2 text-text-muted/50 select-none tabular-nums text-[11px]">
                                  {idx + 1}
                                </span>
                                <span className="whitespace-pre">{line}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <pre className="text-12 text-text-primary overflow-x-auto max-h-48 whitespace-pre-wrap leading-relaxed bg-surface border border-border-subtle p-2 rounded">
                          {ev.evidence}
                        </pre>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Panel>
      ) : (
        <Panel level="surface" className="p-6 text-center space-y-2">
          <Cpu className="w-6 h-6 text-signal-steel mx-auto" />
          <h3 className="text-14 font-semibold text-text-primary">
            AI Diagnostic Engine Idle
          </h3>
          <p className="text-12 text-text-muted max-w-md mx-auto">
            No incident investigation runs recorded for this release. Automated root cause analysis triggers on policy breaches or manual SLA evaluation.
          </p>
        </Panel>
      )}

      {/* ─── Pipeline Execution Steps ─────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-signal-emerald" />
          <h2 className="text-16 font-bold text-text-primary">
            Pipeline Execution Steps
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {(deployment.steps || []).map((step, idx) => (
            <Panel
              key={step.id}
              level="surface"
              className="p-4 space-y-2 relative"
            >
              <div className="flex items-center justify-between">
                <span className="text-12 font-mono text-text-muted">
                  Step 0{idx + 1}
                </span>
                <StatusBadge status={step.status} type="step" />
              </div>
              <div className="font-mono text-14 font-bold text-text-primary">
                {step.stepType}
              </div>
              <div className="text-12 font-mono text-text-muted tabular-nums">
                {new Date(step.startedAt).toLocaleTimeString()}
              </div>
            </Panel>
          ))}
        </div>
      </div>

      {/* ─── Audit Trail & Timeline (Flight Log) ──────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-signal-steel" />
          <h2 className="text-16 font-bold text-text-primary">
            Audit Trail & Event Log
          </h2>
        </div>

        <Panel level="surface" className="overflow-hidden">
          {(!deployment.auditLogs || deployment.auditLogs.length === 0) ? (
            <div className="p-6 text-center text-12 font-mono text-text-muted">
              No audit log entries recorded for this deployment.
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell className="w-28">Timestamp</TableHeaderCell>
                  <TableHeaderCell className="w-32">Actor</TableHeaderCell>
                  <TableHeaderCell>Action Event</TableHeaderCell>
                  <TableHeaderCell className="w-24 text-right">Details</TableHeaderCell>
                </TableRow>
              </TableHead>
              <tbody>
                {deployment.auditLogs.map((log) => {
                  const isExpanded = !!expandedAuditRows[log.id];
                  const hasMetadata = log.metadata && Object.keys(log.metadata).length > 0;

                  return (
                    <React.Fragment key={log.id}>
                      <TableRow>
                        <TableCell className="font-mono text-12 text-text-muted tabular-nums">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-12 px-1.5 py-0.5 rounded bg-raised border border-border-subtle text-text-primary">
                            {log.actorType}: {log.actorId}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-12 font-medium text-text-primary">
                          {log.action}
                        </TableCell>
                        <TableCell className="text-right">
                          {hasMetadata ? (
                            <button
                              onClick={() => toggleAuditRow(log.id)}
                              className="text-12 font-mono text-signal-cyan hover:underline inline-flex items-center gap-1"
                            >
                              <span>{isExpanded ? "Hide" : "Inspect"}</span>
                              {isExpanded ? (
                                <ChevronDown className="w-3 h-3" />
                              ) : (
                                <ChevronRight className="w-3 h-3" />
                              )}
                            </button>
                          ) : (
                            <span className="text-12 font-mono text-text-muted">--</span>
                          )}
                        </TableCell>
                      </TableRow>
                      {isExpanded && hasMetadata && (
                        <TableRow className="bg-page">
                          <TableCell colSpan={4} className="p-3">
                            <pre className="font-mono text-12 text-text-muted bg-raised border border-border-subtle p-3 rounded overflow-x-auto max-h-48">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Panel>
      </div>
    </div>
  );
}
