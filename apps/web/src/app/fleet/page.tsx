"use client";

import React, { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Play,
  Activity,
  Layers,
  ArrowRight,
  GitCommit,
  Clock,
  RefreshCw,
  Plus,
  Shield,
  Copy,
  Check,
  Server,
  ExternalLink,
} from "lucide-react";
import { api, ServiceWithStats, DeploymentListItem } from "@/lib/api";
import { formatVersion } from "@/lib/formatters";
import { StatusBadge } from "@/components/StatusBadge";
import { CreateServiceModal } from "@/components/CreateServiceModal";
import { TriggerDeploymentModal } from "@/components/TriggerDeploymentModal";
import { DEMO_SERVICES, DEMO_DEPLOYMENTS } from "@/lib/demo-data";
import {
  Button,
  Panel,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableCell,
  Skeleton,
  Alert,
  Badge,
} from "@/components/ui";

// Formats raw elapsed seconds into readable time: "5h 37m", "14m 20s", or "32s"
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSec = seconds % 60;
  if (minutes < 60) {
    return `${minutes}m ${remainingSec > 0 ? `${remainingSec}s` : ""}`.trim();
  }
  const hours = Math.floor(minutes / 60);
  const remainingMin = minutes % 60;
  return `${hours}h ${remainingMin > 0 ? `${remainingMin}m` : ""}`.trim();
}

function FleetContent() {
  const searchParams = useSearchParams();
  const serviceParam = searchParams.get("service") || "";

  const [services, setServices] = useState<ServiceWithStats[]>([]);
  const [deployments, setDeployments] = useState<DeploymentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Selected service displayed in the primary stage
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");

  // Filter for the flight log table: "ALL" or "SELECTED"
  const [flightLogScope, setFlightLogScope] = useState<"ALL" | "SELECTED">("ALL");

  // Copy feedback state for git commits
  const [copiedCommitId, setCopiedCommitId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [svcData, depData] = await Promise.all([
        api.getServices(),
        api.getDeployments(),
      ]);

      if (svcData && svcData.length > 0) {
        setServices(svcData);
        setDeployments(depData);
        setIsDemoMode(false);
      } else {
        // Fallback to sample data for standalone public preview
        setServices(DEMO_SERVICES);
        setDeployments(DEMO_DEPLOYMENTS);
        setIsDemoMode(true);
      }
    } catch {
      // Backend not running (e.g. public Vercel deploy) - load rich demo fleet data
      setServices(DEMO_SERVICES);
      setDeployments(DEMO_DEPLOYMENTS);
      setIsDemoMode(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Sync selected service when services list or URL param changes
  useEffect(() => {
    if (services.length > 0) {
      setSelectedServiceId((prev) => {
        if (serviceParam && services.some((s) => s.id === serviceParam)) {
          return serviceParam;
        }
        if (prev && services.some((s) => s.id === prev)) return prev;
        const activeService = services.find((s) => {
          const dep = s.deployments?.[0];
          return (
            dep &&
            [
              "CANARY",
              "CANARY_ACTIVE",
              "OBSERVING",
              "CANARY_DEGRADED",
              "INVESTIGATING",
            ].includes(dep.status)
          );
        });
        return activeService ? activeService.id : services[0].id;
      });
    }
  }, [services, serviceParam]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const copyCommit = (e: React.MouseEvent, commit: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(commit);
    setCopiedCommitId(id);
    setTimeout(() => setCopiedCommitId(null), 2000);
  };

  // Selected service metrics & pipeline calculations
  const selectedService = useMemo(() => {
    return services.find((s) => s.id === selectedServiceId) || services[0] || null;
  }, [services, selectedServiceId]);

  const activeDeploymentForSelected = useMemo(() => {
    if (!selectedService) return null;
    return (
      deployments.find(
        (d) =>
          d.serviceId === selectedService.id &&
          !["PROMOTED", "ROLLED_BACK", "FAILED"].includes(d.status)
      ) || null
    );
  }, [deployments, selectedService]);

  const canaryWeight = activeDeploymentForSelected?.canaryWeight ?? 0;
  const baselineWeight = 100 - canaryWeight;

  // Stat Counters
  const totalServices = services.length;
  const canaryInFlight = deployments.filter((d) =>
    ["CANARY", "CANARY_ACTIVE", "OBSERVING", "CANARY_DEGRADED", "INVESTIGATING"].includes(
      d.status
    )
  ).length;
  const healthyServices = services.filter((s) => s.healthStatus === "HEALTHY").length;

  // Filtered Deployments for Table
  const tableDeployments = useMemo(() => {
    if (flightLogScope === "SELECTED" && selectedService) {
      return deployments.filter((d) => d.serviceId === selectedService.id);
    }
    return deployments;
  }, [deployments, flightLogScope, selectedService]);

  return (
    <div className="space-y-6 pb-16">
      {/* ─── Top Control Deck Header ───────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 text-12 text-muted mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            <span>Infrastructure control plane</span>
            <span>•</span>
            <span>{isDemoMode ? "Live Demo Cluster" : "Local-dev region"}</span>
            {isDemoMode && (
              <Badge variant="cyan" dot>
                PUBLIC PREVIEW MODE
              </Badge>
            )}
          </div>
          <h1 className="text-22 sm:text-28 font-semibold text-text">
            Deployment fleet control center
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/">
            <Button variant="secondary" size="sm">
              <span className="hidden sm:inline">← Back to Project Overview</span>
              <span className="sm:hidden">← Overview</span>
            </Button>
          </Link>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Poll cluster metrics"
            icon={
              <RefreshCw
                className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-primary" : ""}`}
              />
            }
          >
            Sync
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setServiceModalOpen(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Register service
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setDeployModalOpen(true)}
            disabled={services.length === 0}
            icon={<Play className="w-3.5 h-3.5" />}
          >
            Deploy canary
          </Button>
        </div>
      </div>

      {/* Demo Mode Explainer Callout for Recruiters */}
      {isDemoMode && (
        <div className="p-3.5 rounded border border-border bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-12">
          <div className="flex items-center gap-2 text-muted">
            <Server className="w-4 h-4 text-primary shrink-0" />
            <span>
              <strong>Evaluating on Vercel:</strong> The control plane is connected to realistic live fleet data so you can inspect deployments, SLA logs, and traffic routing without running local Docker containers.
            </span>
          </div>
          <Link
            href="/"
            className="text-primary hover:underline font-medium inline-flex items-center gap-1 shrink-0"
          >
            <span>Try Interactive Release Simulator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* ─── Top 3-KPI Stat Row ─── */}
      <Panel className="p-0 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
          {/* KPI 1: Canaries in flight */}
          <div className="p-4 flex items-center justify-between">
            <div>
              <span className="text-12 text-muted block">
                Canaries in flight
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-28 font-semibold font-mono tabular-nums text-text">
                  {loading ? "--" : canaryInFlight}
                </span>
                <span className="text-12 text-muted">
                  {canaryInFlight > 0 ? "active in-flight" : "all nominal"}
                </span>
              </div>
            </div>
            <div className="p-2 rounded bg-page text-canary shrink-0">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          {/* KPI 2: Cluster protection */}
          <div className="p-4 flex items-center justify-between">
            <div>
              <span className="text-12 text-muted block">
                Cluster protection
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-20 font-semibold text-healthy">
                  ARMED
                </span>
                <span className="text-12 text-muted font-mono tabular-nums">
                  {healthyServices}/{totalServices} healthy
                </span>
              </div>
            </div>
            <div className="p-2 rounded bg-page text-healthy shrink-0">
              <Shield className="w-5 h-5" />
            </div>
          </div>

          {/* KPI 3: Active target service */}
          <div className="p-4 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-12 text-muted block">
                Active target service
              </span>
              <div className="flex items-center gap-2 mt-1 truncate">
                <span className="text-16 font-semibold text-text truncate">
                  {selectedService?.name || "None"}
                </span>
                {selectedService && (
                  <StatusBadge status={selectedService.healthStatus} type="health" />
                )}
              </div>
            </div>
            <div className="p-2 rounded bg-page text-primary shrink-0">
              <Activity className="w-5 h-5" />
            </div>
          </div>
        </div>
      </Panel>

      {/* ─── Active Service Live Routing Deck ─── */}
      {selectedService ? (
        <Panel className="p-4 space-y-4">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b border-border pb-3">
            <div className="flex items-start sm:items-center gap-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-1.5 sm:mt-0" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-20 font-semibold text-text break-all">
                    {selectedService.name}
                  </h2>
                  <span className="text-12 font-mono text-muted">
                    Baseline {formatVersion(selectedService.currentVersion)}
                  </span>
                  {activeDeploymentForSelected && (
                    <StatusBadge status={activeDeploymentForSelected.status} />
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {activeDeploymentForSelected ? (
                <Link href={`/deployments/${activeDeploymentForSelected.id}`}>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Inspect full cockpit
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setDeployModalOpen(true)}
                  icon={<Play className="w-3.5 h-3.5" />}
                >
                  Trigger canary
                </Button>
              )}
            </div>
          </div>

          {/* Allocation Bar Header */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-12">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-baseline inline-block rounded-sm shrink-0" />
                <span className="text-muted">Baseline release:</span>
                <strong className="text-text font-mono tabular-nums font-semibold">{baselineWeight}%</strong>
                <span className="text-muted font-mono tabular-nums">({formatVersion(selectedService.currentVersion)})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-canary inline-block rounded-sm shrink-0" />
                <span className="text-canary font-medium">Canary candidate:</span>
                <strong className="text-canary font-mono tabular-nums font-semibold">{canaryWeight}%</strong>
                {activeDeploymentForSelected && (
                  <span className="text-muted font-mono tabular-nums">({formatVersion(activeDeploymentForSelected.version)})</span>
                )}
              </div>
            </div>

            {/* Traffic Allocation Bar */}
            <div className="h-3 w-full bg-page border border-border rounded flex overflow-hidden">
              <div
                className="bg-baseline transition-all duration-300"
                style={{ width: `${baselineWeight}%` }}
                title={`Baseline: ${baselineWeight}%`}
              />
              <div
                className="bg-canary transition-all duration-300"
                style={{ width: `${canaryWeight}%` }}
                title={`Canary: ${canaryWeight}%`}
              />
            </div>

            {/* Plain text columns under traffic bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-border">
              <div>
                <span className="text-12 text-muted block">Baseline target</span>
                <div className="text-14 font-mono text-text tabular-nums mt-0.5">
                  :8080 ({baselineWeight}%)
                </div>
              </div>
              <div>
                <span className="text-12 text-muted block">Proxy router</span>
                <div className="text-14 font-mono text-text tabular-nums mt-0.5">
                  :8000 (Active)
                </div>
              </div>
              <div>
                <span className="text-12 text-muted block">Canary target</span>
                <div className="text-14 font-mono text-canary tabular-nums mt-0.5">
                  :8081 ({canaryWeight}%)
                </div>
              </div>
            </div>
          </div>

          {/* Status Subtitle */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-12 text-muted pt-2 border-t border-border">
            <span>
              {activeDeploymentForSelected ? (
                <>
                  Rollout stage:{" "}
                  <strong className="text-text font-medium">
                    {activeDeploymentForSelected.status}
                  </strong>{" "}
                  (Candidate: <span className="font-mono tabular-nums">{formatVersion(activeDeploymentForSelected.version)}</span>)
                </>
              ) : (
                "All traffic routed 100% to baseline. Automated guardrails nominal."
              )}
            </span>

            <span className="font-mono tabular-nums">
              Namespace: {selectedService.kubernetesNamespace || "default"}
            </span>
          </div>
        </Panel>
      ) : null}

      {/* ─── Deployment Flight Logs Table ──────── */}
      <Panel className="overflow-hidden p-0">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-surface">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <h3 className="text-16 font-semibold text-text">
              Deployment flight logs
            </h3>
            <span className="text-12 font-mono text-muted tabular-nums">
              ({tableDeployments.length})
            </span>
          </div>

          <div className="flex items-center bg-page p-0.5 rounded border border-border text-12">
            <button
              onClick={() => setFlightLogScope("ALL")}
              className={`px-3 py-1 rounded transition-colors ${
                flightLogScope === "ALL"
                  ? "bg-surface text-text font-medium border border-border"
                  : "text-muted hover:text-text"
              }`}
            >
              All releases ({deployments.length})
            </button>
            {selectedService && (
              <button
                onClick={() => setFlightLogScope("SELECTED")}
                className={`px-3 py-1 rounded transition-colors ${
                  flightLogScope === "SELECTED"
                    ? "bg-surface text-text font-medium border border-border"
                    : "text-muted hover:text-text"
                }`}
              >
                {selectedService.name} only
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : tableDeployments.length === 0 ? (
          <div className="p-8 text-center text-12 text-muted">
            No deployment history found for this view.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[620px]">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Service & Version</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell className="w-48">Traffic Split</TableHeaderCell>
                  <TableHeaderCell>Git Commit</TableHeaderCell>
                  <TableHeaderCell className="text-right">Started</TableHeaderCell>
                  <TableHeaderCell className="text-right">Action</TableHeaderCell>
                </TableRow>
              </TableHead>
              <tbody>
                {tableDeployments.map((dep) => {
                  const elapsedMs = dep.completedAt
                    ? new Date(dep.completedAt).getTime() - new Date(dep.startedAt).getTime()
                    : Date.now() - new Date(dep.startedAt).getTime();
                  const elapsedSec = Math.max(1, Math.round(elapsedMs / 1000));
                  const isCopied = copiedCommitId === dep.id;

                  return (
                    <TableRow key={dep.id}>
                      {/* Service & Version */}
                      <TableCell>
                        <div className="font-medium text-text">
                          {dep.service?.name || "Service"}
                        </div>
                        <div className="text-12 font-mono text-muted tabular-nums">
                          {formatVersion(dep.version)}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <StatusBadge status={dep.status} />
                      </TableCell>

                      {/* Traffic Split with Clean Bar */}
                      <TableCell>
                        <div className="w-44 space-y-1">
                          <div className="flex items-center justify-between text-12 font-mono tabular-nums">
                            <span className="text-muted">
                              Base {100 - dep.canaryWeight}%
                            </span>
                            <span className="text-canary font-medium">
                              Canary {dep.canaryWeight}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-page rounded flex overflow-hidden border border-border">
                            <div
                              className="bg-baseline"
                              style={{ width: `${100 - dep.canaryWeight}%` }}
                            />
                            <div
                              className="bg-canary"
                              style={{ width: `${dep.canaryWeight}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>

                      {/* Git Commit Hash */}
                      <TableCell>
                        <button
                          onClick={(e) => copyCommit(e, dep.gitCommit || "unknown", dep.id)}
                          className="font-mono tabular-nums text-12 text-muted hover:text-text flex items-center gap-1.5 px-2 py-1 rounded bg-page border border-border transition-colors"
                          title="Click to copy commit hash"
                        >
                          <GitCommit className="w-3.5 h-3.5 text-muted shrink-0" />
                          <span>{(dep.gitCommit || "unknown").substring(0, 7)}</span>
                          {isCopied ? (
                            <Check className="w-3 h-3 text-healthy" />
                          ) : (
                            <Copy className="w-3 h-3 opacity-40 hover:opacity-100" />
                          )}
                        </button>
                      </TableCell>

                      {/* Started & Duration */}
                      <TableCell className="text-right">
                        <div className="inline-flex items-center justify-end gap-1.5 text-12 font-mono tabular-nums text-muted">
                          <Clock className="w-3.5 h-3.5 text-muted shrink-0" />
                          <span>
                            {new Date(dep.startedAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span>•</span>
                          <span className="text-text font-medium">
                            {formatDuration(elapsedSec)}
                          </span>
                        </div>
                      </TableCell>

                      {/* Action */}
                      <TableCell className="text-right">
                        <Link
                          href={`/deployments/${dep.id}`}
                          className="inline-flex items-center gap-1 text-12 font-medium text-primary hover:underline"
                        >
                          <span>Inspect</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}
      </Panel>

      {/* ─── Modals ────────────────────────────────────────── */}
      <CreateServiceModal
        isOpen={serviceModalOpen}
        onClose={() => setServiceModalOpen(false)}
        onSuccess={fetchData}
      />
      <TriggerDeploymentModal
        isOpen={deployModalOpen}
        services={services}
        onClose={() => setDeployModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}

export default function FleetPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-12 text-muted">Loading fleet control center...</div>}>
      <FleetContent />
    </Suspense>
  );
}
