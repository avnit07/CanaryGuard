"use client";

import React, { useRef } from "react";
import Link from "next/link";
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Users,
  Cpu,
  Layers,
  Activity,
  Check,
  Zap,
  Server,
  Terminal,
  Workflow,
  Star,
  Lock,
  Clock,
  Code,
  Gauge,
  Sliders,
} from "lucide-react";
import { CanarySimulator } from "@/components/CanarySimulator";

export default function OverviewPage() {
  const demoRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0D15] text-white selection:bg-[#5A46FF] selection:text-white">
      {/* ─── Top Global JigsawML-Style Navigation Bar ───────── */}
      <header className="sticky top-0 z-50 w-full bg-[#0B0D15]/85 backdrop-blur-md border-b border-white/10 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#5A46FF] flex items-center justify-center text-white shadow-[0_0_15px_rgba(90,70,255,0.4)] group-hover:shadow-[0_0_20px_rgba(90,70,255,0.6)] transition-all">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-semibold text-16 tracking-tight text-white">CanaryGuard</span>
          </Link>

          {/* Center: Clean Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-14 font-medium text-white/70">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="hover:text-white transition-colors"
            >
              Overview
            </button>
            <button
              onClick={() => scrollToSection("demo")}
              className="hover:text-white transition-colors"
            >
              Live Demo
            </button>
            <button
              onClick={() => scrollToSection("benefits")}
              className="hover:text-white transition-colors"
            >
              Benefits
            </button>
            <button
              onClick={() => scrollToSection("features")}
              className="hover:text-white transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("comparison")}
              className="hover:text-white transition-colors"
            >
              Comparison
            </button>
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/avnits954/canaryGuard"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-13 text-white/70 hover:text-white font-medium px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <Link
              href="/fleet"
              className="px-4 py-2 rounded-lg bg-[#5A46FF] hover:bg-[#4834EA] text-white font-medium text-13 transition-all shadow-[0_0_15px_rgba(90,70,255,0.3)] hover:shadow-[0_0_25px_rgba(90,70,255,0.5)] flex items-center gap-1.5"
            >
              <span>Launch Fleet Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Ambient Glow Background Accents ───────────────── */}
      <div className="relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-[#5A46FF]/20 via-[#8B5CF6]/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-20 space-y-24">
          {/* ═══════════════════════════════════════════════════ */}
          {/* 1. HERO SECTION (Bold, Punchy, High-End Layout)    */}
          {/* ═══════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left: Hero Headline & Actions */}
            <div className="lg:col-span-7 space-y-7">
              {/* Category Pill Tag */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-12 font-medium bg-[#5A46FF]/10 text-[#A5B4FC] border border-[#5A46FF]/30">
                <Sparkles className="w-3.5 h-3.5 text-[#8B7CF6]" />
                <span>The Autonomous Deployment Safety Platform</span>
              </div>

              {/* Commanding Hero Headline */}
              <h1 className="text-42 sm:text-60 lg:text-68 font-bold tracking-tight leading-[1.08] text-white">
                Code is deploying to production.{" "}
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-[#6366F1]">
                  Are you still in control?
                </span>
              </h1>

              {/* Clear, High-Impact Subtitle */}
              <p className="text-17 sm:text-20 text-white/70 leading-relaxed max-w-xl">
                Software updates often have hidden bugs. CanaryGuard tests new code on 5% of users first. If anything breaks, our AI safety watchdog detects the issue and restores the safe version in seconds—before your customers notice.
              </p>

              {/* Button Group */}
              <div className="space-y-4 pt-1">
                <div className="flex flex-wrap items-center gap-3.5">
                  <button
                    onClick={() => scrollToSection("demo")}
                    className="px-8 py-3.5 rounded-xl bg-[#5A46FF] hover:bg-[#4834EA] text-white font-semibold text-15 transition-all shadow-[0_0_30px_rgba(90,70,255,0.45)] hover:shadow-[0_0_40px_rgba(90,70,255,0.65)] flex items-center gap-2"
                  >
                    <span>Try Live Demo</span>
                    <Zap className="w-4 h-4" />
                  </button>

                  <Link
                    href="/fleet"
                    className="px-8 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/20 text-white font-semibold text-15 transition-colors flex items-center gap-2"
                  >
                    <span>Explore Control Plane</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Secondary Talk / GitHub Row */}
                <div className="flex items-center gap-3 pt-1">
                  <a
                    href="https://github.com/avnits954/canaryGuard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-13 text-[#A5B4FC] hover:text-white font-medium inline-flex items-center gap-1.5 transition-colors"
                  >
                    <span>View Monorepo on GitHub</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <span className="text-white/30">•</span>
                  <span className="text-12 text-white/50">Next.js 15, Redis, Express &amp; PostgreSQL</span>
                </div>
              </div>
            </div>

            {/* Right: Live Interactive Architecture Flow Map */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl border border-white/10 bg-[#111422] p-6 shadow-[0_0_50px_rgba(0,0,0,0.6)] space-y-4 overflow-hidden">
                <div className="absolute top-0 right-0 w-56 h-56 bg-[#5A46FF]/15 rounded-full blur-3xl pointer-events-none" />

                {/* Frame Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
                    <span className="text-13 font-mono font-semibold text-white">Reverse Proxy Topology</span>
                  </div>
                  <span className="text-11 font-mono px-2 py-0.5 rounded bg-white/5 text-white/60">
                    PORT :8000
                  </span>
                </div>

                {/* Ingress Stream Node */}
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#5A46FF]/20 border border-[#5A46FF]/40 flex items-center justify-center text-[#8B7CF6]">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-13 font-semibold text-white">Live Customer Traffic</div>
                      <div className="text-11 text-white/50">2,450 incoming requests/sec</div>
                    </div>
                  </div>
                  <span className="text-11 font-mono text-[#10B981] font-semibold bg-[#10B981]/10 px-2 py-0.5 rounded">
                    100% ROUTED
                  </span>
                </div>

                {/* Split Routing Channels */}
                <div className="pl-6 space-y-2.5 border-l-2 border-[#5A46FF]/40 ml-4 py-1">
                  {/* Stable Baseline Pod */}
                  <div className="p-3 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-between text-12">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                      <div>
                        <span className="text-white font-medium block">Baseline Pod (:8080)</span>
                        <span className="text-11 text-white/40 font-mono">v2.1.4 • 0.08% Error</span>
                      </div>
                    </div>
                    <span className="font-mono text-[#10B981] font-semibold text-13">95% Traffic</span>
                  </div>

                  {/* Canary Candidate Pod */}
                  <div className="p-3 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-between text-12">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
                      <div>
                        <span className="text-white font-medium block">Canary Pod (:8081)</span>
                        <span className="text-11 text-white/40 font-mono">v2.1.5 • Staged Testing</span>
                      </div>
                    </div>
                    <span className="font-mono text-[#F59E0B] font-semibold text-13">5% Test Cohort</span>
                  </div>
                </div>

                {/* AI Safety Watchdog Footer Strip */}
                <div className="p-3.5 rounded-xl bg-[#16192B] border border-white/10 flex items-center justify-between text-12">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#8B7CF6]" />
                    <span className="text-white/80">AI Safety Watchdog:</span>
                    <span className="text-[#10B981] font-semibold">Active &amp; Guarding</span>
                  </div>
                  <span className="text-11 font-mono text-white/40">0s Instant Rollback</span>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════ */}
          {/* 2. INTERACTIVE DEMO (The Star Experience)          */}
          {/* ═══════════════════════════════════════════════════ */}
          <div id="demo" className="space-y-6 pt-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-1.5 text-12 font-mono text-[#A5B4FC] uppercase tracking-wider">
                <Star className="w-3.5 h-3.5 text-[#8B7CF6]" />
                <span>Interactive Demonstration</span>
                <Star className="w-3.5 h-3.5 text-[#8B7CF6]" />
              </div>
              <h2 className="text-30 sm:text-40 font-bold tracking-tight text-white">
                See How CanaryGuard Isolates Bugs
              </h2>
              <p className="text-15 text-white/60">
                Click the scenarios below to see real traffic safely split, monitored, and protected in real time.
              </p>
            </div>

            <CanarySimulator />
          </div>

          {/* ═══════════════════════════════════════════════════ */}
          {/* 3. PRIME BENEFITS SECTION (JigsawML Signature Grid) */}
          {/* ═══════════════════════════════════════════════════ */}
          <div id="benefits" className="space-y-10 pt-10">
            {/* Section Header with Horizontal Lines and Stars */}
            <div className="flex items-center justify-center gap-4 text-center">
              <div className="h-px bg-gradient-to-r from-transparent to-white/20 flex-1 max-w-xs" />
              <div className="flex items-center gap-2 text-13 font-mono font-semibold uppercase tracking-widest text-[#A5B4FC]">
                <Star className="w-3.5 h-3.5 text-[#8B7CF6]" />
                <span>Prime benefits</span>
                <Star className="w-3.5 h-3.5 text-[#8B7CF6]" />
              </div>
              <div className="h-px bg-gradient-to-l from-transparent to-white/20 flex-1 max-w-xs" />
            </div>

            {/* 6 Benefit Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Benefit 1 */}
              <div className="p-6 rounded-xl border border-white/10 bg-[#111422] hover:border-[#5A46FF]/50 transition-all space-y-3 group">
                <div className="w-10 h-10 rounded-lg bg-[#5A46FF]/10 border border-[#5A46FF]/30 flex items-center justify-center text-[#8B7CF6] group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-16 font-semibold text-white">Safe 5% Traffic Splitting</h3>
                <p className="text-13 text-white/60 leading-relaxed">
                  Route only a small fraction of users to the candidate release without dropping connections or restarting servers.
                </p>
              </div>

              {/* Benefit 2 */}
              <div className="p-6 rounded-xl border border-white/10 bg-[#111422] hover:border-[#5A46FF]/50 transition-all space-y-3 group">
                <div className="w-10 h-10 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center text-[#10B981] group-hover:scale-105 transition-transform">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-16 font-semibold text-white">Continuous AI Watchdog</h3>
                <p className="text-13 text-white/60 leading-relaxed">
                  Real-time health monitoring continuously inspects error rates and latency, catching bugs before they spread.
                </p>
              </div>

              {/* Benefit 3 */}
              <div className="p-6 rounded-xl border border-white/10 bg-[#111422] hover:border-[#5A46FF]/50 transition-all space-y-3 group">
                <div className="w-10 h-10 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-center justify-center text-[#EF4444] group-hover:scale-105 transition-transform">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <h3 className="text-16 font-semibold text-white">Instant 0-Second Recovery</h3>
                <p className="text-13 text-white/60 leading-relaxed">
                  Immediately pulls bad code back in milliseconds, restoring 100% of customer traffic to the working release.
                </p>
              </div>

              {/* Benefit 4 */}
              <div className="p-6 rounded-xl border border-white/10 bg-[#111422] hover:border-[#5A46FF]/50 transition-all space-y-3 group">
                <div className="w-10 h-10 rounded-lg bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 flex items-center justify-center text-[#8B5CF6] group-hover:scale-105 transition-transform">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="text-16 font-semibold text-white">Root Cause Intelligence</h3>
                <p className="text-13 text-white/60 leading-relaxed">
                  AI diagnostic agent matches error stack traces and git commits to show engineers the exact code that caused the issue.
                </p>
              </div>

              {/* Benefit 5 */}
              <div className="p-6 rounded-xl border border-white/10 bg-[#111422] hover:border-[#5A46FF]/50 transition-all space-y-3 group">
                <div className="w-10 h-10 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30 flex items-center justify-center text-[#3B82F6] group-hover:scale-105 transition-transform">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-16 font-semibold text-white">Permanent Audit Trail</h3>
                <p className="text-13 text-white/60 leading-relaxed">
                  Every deployment, traffic adjustment, and rollback decision is permanently recorded in PostgreSQL for compliance.
                </p>
              </div>

              {/* Benefit 6 */}
              <div className="p-6 rounded-xl border border-white/10 bg-[#111422] hover:border-[#5A46FF]/50 transition-all space-y-3 group">
                <div className="w-10 h-10 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B] group-hover:scale-105 transition-transform">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-16 font-semibold text-white">Frictionless Team Velocity</h3>
                <p className="text-13 text-white/60 leading-relaxed">
                  Ship software multiple times a day with complete confidence that an unexpected bug will never take down production.
                </p>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════ */}
          {/* 4. NOTABLE FEATURES (JigsawML Bento Grid Style)    */}
          {/* ═══════════════════════════════════════════════════ */}
          <div id="features" className="space-y-6 pt-10">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-[#8B7CF6]" />
              <h2 className="text-20 font-semibold text-white">Notable features</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl border border-white/10 bg-[#16192B] flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-[#5A46FF]/20 flex items-center justify-center text-[#8B7CF6] shrink-0">
                  <Cpu className="w-4 h-4" />
                </div>
                <span className="text-13 font-medium text-white/90">
                  AI assistant for incident diagnostics
                </span>
              </div>

              <div className="p-5 rounded-xl border border-white/10 bg-[#16192B] flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-[#10B981]/20 flex items-center justify-center text-[#10B981] shrink-0">
                  <Server className="w-4 h-4" />
                </div>
                <span className="text-13 font-medium text-white/90">
                  Dynamic reverse proxy traffic routing
                </span>
              </div>

              <div className="p-5 rounded-xl border border-white/10 bg-[#16192B] flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-[#EF4444]/20 flex items-center justify-center text-[#EF4444] shrink-0">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <span className="text-13 font-medium text-white/90">
                  Automated rollback on SLA breach
                </span>
              </div>

              <div className="p-5 rounded-xl border border-white/10 bg-[#16192B] flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-[#F59E0B]/20 flex items-center justify-center text-[#F59E0B] shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <span className="text-13 font-medium text-white/90">
                  Sliding-window statistical health checks
                </span>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════ */}
          {/* 5. BEFORE VS AFTER COMPARISON CARDS                */}
          {/* ═══════════════════════════════════════════════════ */}
          <div id="comparison" className="space-y-6 pt-6">
            <h2 className="text-20 font-semibold text-white">
              Why Teams Switch to CanaryGuard
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Without CanaryGuard */}
              <div className="p-6 rounded-xl border border-[#EF4444]/30 bg-[#111422] space-y-3">
                <div className="flex items-center gap-2 text-[#EF4444] font-semibold text-15">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>Traditional Deployments (Risky)</span>
                </div>
                <p className="text-13 text-white/60 leading-relaxed">
                  Updates are deployed to 100% of production traffic at once. An unexpected bug breaks the app for every single customer simultaneously.
                </p>
                <div className="space-y-1.5 pt-2 text-12 text-white/60">
                  <div className="flex items-center gap-2">
                    <span className="text-[#EF4444] font-bold">✕</span>
                    <span>All users experience broken screens and crashes.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#EF4444] font-bold">✕</span>
                    <span>Engineers scramble in emergency panic to rollback.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#EF4444] font-bold">✕</span>
                    <span>Costly downtime and customer trust lost.</span>
                  </div>
                </div>
              </div>

              {/* With CanaryGuard */}
              <div className="p-6 rounded-xl border border-[#10B981]/30 bg-[#111422] space-y-3">
                <div className="flex items-center gap-2 text-[#10B981] font-semibold text-15">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>With CanaryGuard (Zero-Downtime)</span>
                </div>
                <p className="text-13 text-white/60 leading-relaxed">
                  Updates are sent quietly to only 5% of users. The AI safety watchdog verifies user experience in real-time before releasing further.
                </p>
                <div className="space-y-1.5 pt-2 text-12 text-white/60">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                    <span>95% of users never see the bug or notice any downtime.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                    <span>Instant automatic recovery restores working code in seconds.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                    <span>Engineers receive an AI root-cause report to fix the code calmly.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════ */}
          {/* 6. ENGINEERING GATEWAY (JigsawML CTA Style)        */}
          {/* ═══════════════════════════════════════════════════ */}
          <div className="p-8 sm:p-10 rounded-2xl border border-white/10 bg-gradient-to-r from-[#111422] via-[#16192B] to-[#111422] flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-2xl">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 text-12 font-mono text-[#A5B4FC]">
                <Shield className="w-4 h-4 text-[#8B7CF6]" />
                <span>For Software Engineers, SREs &amp; Technical Evaluators</span>
              </div>
              <h3 className="text-22 font-semibold text-white">
                Inspect the Live Distributed Control Plane
              </h3>
              <p className="text-13 text-white/60 leading-relaxed">
                Explore the underlying microservices, dynamic reverse proxy routing (:8000), BullMQ Redis workflows, and PostgreSQL relational data in the Fleet Control Center.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href="/fleet"
                className="px-6 py-3 rounded-lg bg-[#5A46FF] hover:bg-[#4834EA] text-white font-semibold text-14 transition-all shadow-[0_0_20px_rgba(90,70,255,0.4)]"
              >
                Launch Fleet Control Center
              </Link>

              <Link
                href="/design-preview"
                className="px-6 py-3 rounded-lg bg-transparent hover:bg-white/5 border border-white/20 text-white font-semibold text-14 transition-colors"
              >
                Design System
              </Link>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════ */}
          {/* 7. FOOTER (JigsawML Clean Style)                   */}
          {/* ═══════════════════════════════════════════════════ */}
          <footer className="pt-8 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-12 text-white/50">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#8B7CF6]" />
              <span className="font-semibold text-white">CanaryGuard</span>
              <span>•</span>
              <span>Autonomous Release Safety Platform</span>
            </div>

            <div className="flex items-center gap-6">
              <Link href="/fleet" className="hover:text-white transition-colors">
                Fleet Console
              </Link>
              <Link href="/design-preview" className="hover:text-white transition-colors">
                Design System
              </Link>
              <a
                href="https://github.com/avnits954/canaryGuard"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                GitHub
              </a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
