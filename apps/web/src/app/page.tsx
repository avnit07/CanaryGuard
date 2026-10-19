"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Server,
  Rocket,
  ShieldCheck,
  Activity,
  Layers,
  ArrowRight,
  GitCommit,
  Clock,
  RefreshCw,
  Plus,
} from "lucide-react";
import { api, ServiceWithStats, DeploymentListItem } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { CreateServiceModal } from "@/components/CreateServiceModal";
import { TriggerDeploymentModal } from "@/components/TriggerDeploymentModal";

export default function DashboardPage() {
  const [services, setServices] = useState<ServiceWithStats[]>([]);
  const [deployments, setDeployments] = useState<DeploymentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [svcData, depData] = await Promise.all([
        api.getServices(),
        api.getDeployments(),
      ]);
      setServices(svcData);
      setDeployments(depData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Calculations for Stat Cards
  const totalServices = services.length;
  const activeDeployments = deployments.filter(
    (d) => !["PROMOTED", "ROLLED_BACK", "FAILED"].includes(d.status)
  ).length;
  const canaryInFlight = deployments.filter(
    (d) => ["CANARY", "CANARY_ACTIVE", "OBSERVING"].includes(d.status)
  ).length;
  const healthyServices = services.filter((s) => s.healthStatus === "HEALTHY").length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            Control Plane Overview
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time canary deployment monitoring & automated rollback policies
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded-lg transition-colors hover:bg-slate-800"
            title="Refresh dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-emerald-400" : ""}`} />
          </button>
          <button
            onClick={() => setServiceModalOpen(true)}
            className="px-3.5 py-2 text-sm font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Service
          </button>
          <button
            onClick={() => setDeployModalOpen(true)}
            disabled={services.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            <Rocket className="w-4 h-4" />
            Deploy Canary
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-800 rounded-xl text-rose-300 text-sm flex items-center justify-between">
          <span>Failed to connect to CanaryGuard API: {error}</span>
          <button onClick={fetchData} className="underline text-xs hover:text-white">
            Retry
          </button>
        </div>
      )}

      {/* ─── Metric Stat Cards ────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Services */}
        <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Managed Services</span>
            <Server className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-100">{totalServices}</span>
            <span className="text-xs text-emerald-400 font-medium">
              {healthyServices}/{totalServices} healthy
            </span>
          </div>
        </div>

        {/* Active Deployments */}
        <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Rollouts</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-100">{activeDeployments}</span>
            <span className="text-xs text-blue-400 font-medium">in progression</span>
          </div>
        </div>

        {/* Canary Traffic Active */}
        <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Canaries In Flight</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-100">{canaryInFlight}</span>
            <span className="text-xs text-amber-400 font-medium">traffic split</span>
          </div>
        </div>

        {/* Automated Protection */}
        <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Guard Status</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-bold text-emerald-400">ARMED</span>
            <span className="text-xs text-slate-400">auto-rollback enabled</span>
          </div>
        </div>
      </div>

      {/* ─── Managed Services Section ─────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400" />
            Registered Services
          </h2>
          <span className="text-xs text-slate-400">{services.length} services configured</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
            Loading services...
          </div>
        ) : services.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/30 border border-dashed border-slate-800 rounded-xl">
            <p className="text-sm text-slate-400">No services registered yet.</p>
            <button
              onClick={() => setServiceModalOpen(true)}
              className="mt-3 text-xs font-medium text-emerald-400 hover:text-emerald-300 underline"
            >
              Register your first microservice
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((svc) => (
              <div
                key={svc.id}
                className="p-5 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-slate-100 group-hover:text-emerald-300 transition-colors">
                        {svc.name}
                      </h3>
                      <p className="text-xs font-mono text-slate-400 truncate max-w-[200px] mt-0.5">
                        {svc.repository}
                      </p>
                    </div>
                    <StatusBadge status={svc.healthStatus} type="health" />
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 block">Baseline Version</span>
                      <span className="font-mono text-slate-200 font-medium">
                        {svc.currentVersion}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Namespace</span>
                      <span className="font-mono text-slate-300">
                        {svc.kubernetesNamespace}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>{svc._count?.deployments || 0} deployments</span>
                  <button
                    onClick={() => {
                      setDeployModalOpen(true);
                    }}
                    className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                  >
                    Deploy <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Recent Deployments Table ─────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Rocket className="w-4 h-4 text-blue-400" />
            Recent Canary Deployments
          </h2>
          <span className="text-xs text-slate-400">{deployments.length} total releases</span>
        </div>

        {deployments.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/30 border border-dashed border-slate-800 rounded-xl text-slate-400 text-sm">
            No deployments executed yet. Trigger your first release using the "Deploy Canary" button.
          </div>
        ) : (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950/60 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-5 py-3.5">Service & Release</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Traffic Split</th>
                    <th className="px-5 py-3.5">Git Commit</th>
                    <th className="px-5 py-3.5">Started</th>
                    <th className="px-5 py-3.5 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {deployments.map((dep) => (
                    <tr
                      key={dep.id}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-100">
                          {dep.service?.name || "Service"}
                        </div>
                        <div className="text-xs font-mono text-emerald-400">
                          {dep.version}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={dep.status} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="w-36">
                          <div className="flex justify-between text-xs font-mono mb-1">
                            <span className="text-slate-400">Canary</span>
                            <span className="font-semibold text-amber-400">
                              {dep.canaryWeight}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-amber-500 transition-all duration-500"
                              style={{ width: `${dep.canaryWeight}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-400 flex items-center gap-1.5">
                        <GitCommit className="w-3.5 h-3.5 text-slate-500" />
                        {dep.gitCommit.substring(0, 7)}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {new Date(dep.startedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/deployments/${dep.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300"
                        >
                          Inspect <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
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
