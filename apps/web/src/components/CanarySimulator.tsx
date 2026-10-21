"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Users,
  Check,
  Zap,
  Server,
  Activity,
  Cpu,
  Layers,
  Terminal,
  GitCommit,
  Gauge,
} from "lucide-react";

type DemoStep = "ALL_SAFE" | "ROLLOUT_5" | "BUG_DETECTED" | "RECOVERED";

export function CanarySimulator() {
  const [step, setStep] = useState<DemoStep>("ROLLOUT_5");
  const [trafficRequests, setTrafficRequests] = useState(2450);

  // Computed metrics based on the current step
  const isBugActive = step === "BUG_DETECTED";
  const isRollout = step === "ROLLOUT_5";
  const isRecovered = step === "RECOVERED";

  const baselinePercent = step === "ALL_SAFE" || isRecovered ? 100 : 95;
  const canaryPercent = isRollout || isBugActive ? 5 : 0;

  const errorRate = isBugActive ? "14.2%" : "0.08%";
  const p99Latency = isBugActive ? "640ms" : "38ms";
  const slaStatus = isBugActive ? "BREACHED" : "NOMINAL";

  // Simulate live traffic fluctuations
  useEffect(() => {
    const timer = setInterval(() => {
      setTrafficRequests((prev) => 2400 + Math.floor(Math.random() * 120));
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111422] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
      {/* ─── Product Window Chrome Bar ─────────────────────── */}
      <div className="px-3.5 sm:px-5 py-3 sm:py-3.5 border-b border-white/10 bg-[#0B0D15]/90 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-[#FF5F56]/80" />
          <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-[#FFBD2E]/80" />
          <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-[#27C93F]/80" />
          <span className="text-11 sm:text-12 font-mono text-white/40 ml-1.5 hidden md:inline">
            canaryguard.live/traffic-radar • reverse-proxy:8000
          </span>
        </div>

        {/* Live Status Pill */}
        <div className="min-w-0">
          {isBugActive ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-11 sm:text-12 font-medium bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 shadow-[0_0_15px_rgba(239,68,68,0.2)] truncate">
              <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-[#EF4444] animate-ping shrink-0" />
              <span className="hidden sm:inline">SLA BREACH DETECTED • 95% PROTECTED</span>
              <span className="sm:hidden">SLA BREACH • 95% SAFE</span>
            </span>
          ) : isRecovered ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-11 sm:text-12 font-medium bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 truncate">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
              <span className="hidden sm:inline">INSTANTLY RESTORED • ZERO DOWNTIME</span>
              <span className="sm:hidden">RESTORED • 0s DOWNTIME</span>
            </span>
          ) : isRollout ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-11 sm:text-12 font-medium bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 truncate">
              <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-[#F59E0B] animate-pulse shrink-0" />
              <span className="hidden sm:inline">CANARY ACTIVE • 5% TEST COHORT</span>
              <span className="sm:hidden">CANARY 5% ACTIVE</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-11 sm:text-12 font-medium bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 truncate">
              <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-[#10B981] shrink-0" />
              <span className="hidden sm:inline">100% BASELINE NOMINAL</span>
              <span className="sm:hidden">100% BASELINE</span>
            </span>
          )}
        </div>
      </div>

      {/* ─── Scenario Buttons Bar ──────────────────────────── */}
      <div className="p-4 sm:p-5 border-b border-white/10 bg-[#0E111E]">
        <div className="text-11 font-mono text-white/50 uppercase tracking-wider mb-2.5">
          Select Release Scenario to Test:
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Step 1 */}
          <button
            onClick={() => setStep("ROLLOUT_5")}
            className={`p-3.5 rounded-xl text-left transition-all border ${
              step === "ROLLOUT_5"
                ? "bg-[#5A46FF]/15 border-[#5A46FF] text-white shadow-[0_0_20px_rgba(90,70,255,0.25)]"
                : "bg-white/[0.02] hover:bg-white/[0.05] border-white/10 text-white/70"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-11 font-mono font-semibold text-[#8B7CF6]">01 • STAGED ROLLOUT</span>
              {step === "ROLLOUT_5" && <Check className="w-3.5 h-3.5 text-[#8B7CF6]" />}
            </div>
            <div className="text-14 font-semibold text-white">1. Send Update to 5%</div>
            <div className="text-12 text-white/50 mt-1 leading-snug">
              Quietly route a 5% sample of traffic while keeping 95% safe.
            </div>
          </button>

          {/* Step 2 */}
          <button
            onClick={() => setStep("BUG_DETECTED")}
            className={`p-3.5 rounded-xl text-left transition-all border ${
              step === "BUG_DETECTED"
                ? "bg-[#EF4444]/15 border-[#EF4444] text-white shadow-[0_0_25px_rgba(239,68,68,0.25)]"
                : "bg-white/[0.02] hover:bg-white/[0.05] border-white/10 text-white/70"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-11 font-mono font-semibold text-[#EF4444]">02 • INJECT ANOMALY</span>
              {step === "BUG_DETECTED" && <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" />}
            </div>
            <div className="text-14 font-semibold text-white">2. Simulate Hidden Bug</div>
            <div className="text-12 text-white/50 mt-1 leading-snug">
              Candidate fails. AI watchdog catches it; 95% are 100% safe.
            </div>
          </button>

          {/* Step 3 */}
          <button
            onClick={() => setStep("RECOVERED")}
            className={`p-3.5 rounded-xl text-left transition-all border ${
              step === "RECOVERED"
                ? "bg-[#10B981]/15 border-[#10B981] text-white shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                : "bg-white/[0.02] hover:bg-white/[0.05] border-white/10 text-white/70"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-11 font-mono font-semibold text-[#10B981]">03 • RECOVERY</span>
              {step === "RECOVERED" && <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />}
            </div>
            <div className="text-14 font-semibold text-white">3. Instant 0s Recovery</div>
            <div className="text-12 text-white/50 mt-1 leading-snug">
              Traffic snaps back to 100% baseline with zero dropped requests.
            </div>
          </button>
        </div>
      </div>

      {/* ─── Visual Traffic Pipeline & Telemetry Deck ────────── */}
      <div className="p-5 sm:p-7 space-y-6">
        {/* Dynamic Reverse Proxy Routing Stage */}
        <div className="p-5 rounded-xl border border-white/10 bg-[#0B0D15]/70 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-[#8B7CF6]" />
              <span className="text-13 font-mono font-semibold text-white">
                DYNAMIC REVERSE PROXY (:8000)
              </span>
            </div>
            <span className="text-12 font-mono text-white/60">
              Live Ingress: <strong className="text-white">{trafficRequests.toLocaleString()} req/s</strong>
            </span>
          </div>

          {/* Dual Pipeline Nodes (Baseline vs Canary) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Node 1: Stable Baseline */}
            <div className="p-4 rounded-lg border border-[#10B981]/30 bg-[#10B981]/5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shrink-0" />
                  <span className="text-14 font-semibold text-white">Baseline Target</span>
                  <span className="text-11 font-mono text-white/50">:8080</span>
                </div>
                <span className="text-11 font-mono px-2 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] font-semibold">
                  v2.1.4 (STABLE)
                </span>
              </div>

              {/* Progress & Stats */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-12 font-mono text-white/70">
                  <span>Assigned Traffic Share</span>
                  <strong className="text-white text-14">{baselinePercent}%</strong>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#10B981] transition-all duration-500 rounded-full"
                    style={{ width: `${baselinePercent}%` }}
                  />
                </div>
              </div>

              <div className="text-11 font-mono text-white/40 flex items-center justify-between pt-1">
                <span>Health: NOMINAL</span>
                <span>~{Math.round((trafficRequests * baselinePercent) / 100)} req/s</span>
              </div>
            </div>

            {/* Node 2: Canary Candidate */}
            <div
              className={`p-4 rounded-lg border transition-all space-y-2.5 ${
                isBugActive
                  ? "border-[#EF4444]/60 bg-[#EF4444]/10 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                  : canaryPercent > 0
                  ? "border-[#F59E0B]/40 bg-[#F59E0B]/5"
                  : "border-white/10 bg-white/[0.02] opacity-60"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      isBugActive
                        ? "bg-[#EF4444] animate-ping"
                        : canaryPercent > 0
                        ? "bg-[#F59E0B]"
                        : "bg-white/30"
                    }`}
                  />
                  <span className="text-14 font-semibold text-white">Canary Candidate</span>
                  <span className="text-11 font-mono text-white/50">:8081</span>
                </div>
                <span
                  className={`text-11 font-mono px-2 py-0.5 rounded font-semibold ${
                    isBugActive
                      ? "bg-[#EF4444]/20 text-[#EF4444]"
                      : canaryPercent > 0
                      ? "bg-[#F59E0B]/20 text-[#F59E0B]"
                      : "bg-white/10 text-white/50"
                  }`}
                >
                  v2.1.5 (CANDIDATE)
                </span>
              </div>

              {/* Progress & Stats */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-12 font-mono text-white/70">
                  <span>Assigned Traffic Share</span>
                  <strong
                    className={`text-14 ${
                      isBugActive ? "text-[#EF4444]" : canaryPercent > 0 ? "text-[#F59E0B]" : "text-white/40"
                    }`}
                  >
                    {canaryPercent}%
                  </strong>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      isBugActive ? "bg-[#EF4444]" : "bg-[#F59E0B]"
                    }`}
                    style={{ width: `${canaryPercent}%` }}
                  />
                </div>
              </div>

              <div className="text-11 font-mono text-white/40 flex items-center justify-between pt-1">
                <span>{isBugActive ? "Status: DEGRADED" : canaryPercent > 0 ? "Status: OBSERVING" : "Status: IDLE (0%)"}</span>
                <span>~{Math.round((trafficRequests * canaryPercent) / 100)} req/s</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Real-Time SLA Telemetry Dials ─────────────────── */}
        <div>
          <div className="text-11 font-mono text-white/50 uppercase tracking-wider mb-2.5">
            Real-Time SLA Observability Window (Target Microservice):
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Metric 1: Error Rate */}
            <div className="p-4 rounded-xl border border-white/10 bg-[#0E111E] space-y-1">
              <div className="flex items-center justify-between text-12 text-white/50 font-mono">
                <span>Error Rate</span>
                <span>SLA Limit: &lt;5%</span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span
                  className={`text-28 font-bold font-mono tabular-nums ${
                    isBugActive ? "text-[#EF4444]" : "text-[#10B981]"
                  }`}
                >
                  {errorRate}
                </span>
                <span className="text-11 text-white/50 font-medium">
                  {isBugActive ? "CRITICAL BREACH" : "Nominal"}
                </span>
              </div>
            </div>

            {/* Metric 2: P99 Latency */}
            <div className="p-4 rounded-xl border border-white/10 bg-[#0E111E] space-y-1">
              <div className="flex items-center justify-between text-12 text-white/50 font-mono">
                <span>P99 Response Time</span>
                <span>SLA Limit: &lt;500ms</span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span
                  className={`text-28 font-bold font-mono tabular-nums ${
                    isBugActive ? "text-[#EF4444]" : "text-[#10B981]"
                  }`}
                >
                  {p99Latency}
                </span>
                <span className="text-11 text-white/50 font-medium">
                  {isBugActive ? "TIMEOUT RISK" : "Fast (<50ms)"}
                </span>
              </div>
            </div>

            {/* Metric 3: Safety Guard Status */}
            <div className="p-4 rounded-xl border border-white/10 bg-[#0E111E] space-y-1">
              <div className="flex items-center justify-between text-12 text-white/50 font-mono">
                <span>Safety Guard State</span>
                <span>Auto-Rollback</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`w-3 h-3 rounded-full shrink-0 ${
                    isBugActive ? "bg-[#EF4444] animate-ping" : "bg-[#10B981]"
                  }`}
                />
                <span className="text-15 font-semibold text-white">
                  {isBugActive ? "AUTOMATED TRIPWIRE ARMED" : "GUARDRAILS ACTIVE"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Autonomous AI Incident Report (Appears on Bug) ── */}
        {isBugActive && (
          <div className="p-5 rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 space-y-4 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#EF4444]/20 pb-3">
              <div className="flex items-center gap-2.5">
                <Cpu className="w-5 h-5 text-[#EF4444] shrink-0" />
                <h4 className="text-15 font-semibold text-white">
                  Autonomous AI Incident Diagnosis
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-11 font-mono bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30">
                  96% Confidence
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-11 font-mono bg-[#EF4444] text-white font-semibold">
                  Rollback Recommended
                </span>
              </div>
            </div>

            <p className="text-13 text-white/80 leading-relaxed">
              <strong>Incident Verdict:</strong> The AI Agent inspected live metrics and container logs. Candidate version <code className="font-mono bg-black/40 px-1.5 py-0.5 rounded border border-white/10">v2.1.5</code> introduced an unhandled database pool timeout in the payment adapter, driving error rate to 14.2%.
            </p>

            {/* Evidence Chips */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-12">
              <div className="p-2.5 rounded-lg bg-black/30 border border-white/10 space-y-0.5">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#8B7CF6]" />
                  <span>METRIC Evidence</span>
                </div>
                <div className="text-white/60 font-mono text-11">
                  P99 latency breached SLA (640ms vs 500ms max).
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-black/30 border border-white/10 space-y-0.5">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-[#8B7CF6]" />
                  <span>LOG Container Trace</span>
                </div>
                <div className="text-white/60 font-mono text-11 truncate">
                  TimeoutError: DB pool exhausted at pool.ts:42
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-black/30 border border-white/10 space-y-0.5">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <GitCommit className="w-3.5 h-3.5 text-[#8B7CF6]" />
                  <span>GIT Commit Diff</span>
                </div>
                <div className="text-white/60 font-mono text-11 truncate">
                  Commit 9f84b12: &quot;fix: stripe retry timeout&quot;
                </div>
              </div>
            </div>

            {/* 1-Click Rollback Action */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
              <span className="text-12 text-white/60">
                Notice: 95% of your customers were completely safe and never saw this issue.
              </span>
              <button
                onClick={() => setStep("RECOVERED")}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg text-13 font-semibold bg-[#EF4444] hover:bg-[#DC2626] text-white transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center justify-center gap-1.5 shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Approve &amp; Execute Instant Rollback</span>
              </button>
            </div>
          </div>
        )}

        {/* ─── Recovery Feedback Banner ───────────────────────── */}
        {isRecovered && (
          <div className="p-4 rounded-xl border border-[#10B981]/40 bg-[#10B981]/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-13">
            <div className="flex items-center gap-2.5 text-[#10B981]">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span className="font-medium text-white">
                Zero-Downtime Recovery Verified: 100% of user traffic successfully routed back to stable baseline. All SLAs nominal.
              </span>
            </div>
            <button
              onClick={() => setStep("ROLLOUT_5")}
              className="text-12 text-[#8B7CF6] hover:text-white font-medium inline-flex items-center gap-1 transition-colors shrink-0"
            >
              <span>Test again from Step 1</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ─── Footer Link to Full Cockpit ─────────────────────── */}
      <div className="px-5 py-3.5 bg-[#0B0D15]/80 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-12 text-white/60">
        <span>
          Are you a developer? Inspect the underlying servers, live metrics, and real reverse proxy routing.
        </span>
        <Link
          href="/fleet"
          className="text-[#8B7CF6] hover:text-[#A5B4FC] font-medium inline-flex items-center gap-1 shrink-0 transition-colors"
        >
          <span>Open Full Fleet Control Plane</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
