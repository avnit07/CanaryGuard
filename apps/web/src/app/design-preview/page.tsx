"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Terminal,
  Activity,
  ShieldCheck,
  RotateCcw,
  Plus,
  Play,
  Layers,
  CheckCircle2,
} from "lucide-react";
import {
  Button,
  Input,
  Select,
  Panel,
  Badge,
  Modal,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableCell,
  Skeleton,
  Alert,
} from "@/components/ui";

export default function DesignPreviewPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  return (
    <div className="space-y-12 pb-24">
      {/* Header */}
      <div className="border-b border-border-subtle pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-text-muted mb-2">
            <Link href="/" className="hover:text-text-primary flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Control Plane</span>
            </Link>
            <span>/</span>
            <span className="text-signal-cyan">Design System Foundation</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Obsidian Telemetry — Foundation Preview
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Precision flight deck design tokens, strict solid color rules, and accessible component primitives.
          </p>
        </div>
        <Badge variant="cyan" dot>
          STAGE 2 FOUNDATION VERIFIED
        </Badge>
      </div>

      {/* ─── 1. Solid Color Palette ──────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-text-primary flex items-center gap-2">
          <span className="text-xs font-mono text-signal-cyan">[01]</span>
          <span>Solid Color Tokens (Zero Gradients)</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* Surfaces */}
          <div className="p-3 bg-surface border border-border-subtle rounded space-y-2">
            <div className="h-10 bg-page border border-border-strong rounded" />
            <div className="text-xs font-mono">
              <span className="text-text-primary block font-semibold">Page</span>
              <span className="text-text-muted text-[11px]">#07090E</span>
            </div>
          </div>

          <div className="p-3 bg-surface border border-border-subtle rounded space-y-2">
            <div className="h-10 bg-surface border border-border-strong rounded" />
            <div className="text-xs font-mono">
              <span className="text-text-primary block font-semibold">Surface (L1)</span>
              <span className="text-text-muted text-[11px]">#0C0F17</span>
            </div>
          </div>

          <div className="p-3 bg-surface border border-border-subtle rounded space-y-2">
            <div className="h-10 bg-elevated border border-border-strong rounded" />
            <div className="text-xs font-mono">
              <span className="text-text-primary block font-semibold">Elevated (L2)</span>
              <span className="text-text-muted text-[11px]">#111622</span>
            </div>
          </div>

          <div className="p-3 bg-surface border border-border-subtle rounded space-y-2">
            <div className="h-10 bg-raised border border-border-strong rounded" />
            <div className="text-xs font-mono">
              <span className="text-text-primary block font-semibold">Raised (Row/Inp)</span>
              <span className="text-text-muted text-[11px]">#171E2E</span>
            </div>
          </div>

          <div className="p-3 bg-surface border border-border-subtle rounded space-y-2">
            <div className="h-10 bg-border-subtle rounded" />
            <div className="text-xs font-mono">
              <span className="text-text-primary block font-semibold">Border Subtle</span>
              <span className="text-text-muted text-[11px]">#1E2638</span>
            </div>
          </div>

          <div className="p-3 bg-surface border border-border-subtle rounded space-y-2">
            <div className="h-10 bg-border-strong rounded" />
            <div className="text-xs font-mono">
              <span className="text-text-primary block font-semibold">Border Strong</span>
              <span className="text-text-muted text-[11px]">#2A364F</span>
            </div>
          </div>

          {/* Signals */}
          <div className="p-3 bg-surface border border-border-subtle rounded space-y-2">
            <div className="h-10 bg-signal-cyan rounded" />
            <div className="text-xs font-mono">
              <span className="text-text-primary block font-semibold">Cyan (Primary/Focus)</span>
              <span className="text-text-muted text-[11px]">#00D8F6</span>
            </div>
          </div>

          <div className="p-3 bg-surface border border-border-subtle rounded space-y-2">
            <div className="h-10 bg-signal-emerald rounded" />
            <div className="text-xs font-mono">
              <span className="text-text-primary block font-semibold">Emerald (Healthy)</span>
              <span className="text-text-muted text-[11px]">#00F59B</span>
            </div>
          </div>

          <div className="p-3 bg-surface border border-border-subtle rounded space-y-2">
            <div className="h-10 bg-signal-amber rounded" />
            <div className="text-xs font-mono">
              <span className="text-text-primary block font-semibold">Amber (Canary/Warn)</span>
              <span className="text-text-muted text-[11px]">#FFB224</span>
            </div>
          </div>

          <div className="p-3 bg-surface border border-border-subtle rounded space-y-2">
            <div className="h-10 bg-signal-coral rounded" />
            <div className="text-xs font-mono">
              <span className="text-text-primary block font-semibold">Coral (Breach/Rollback)</span>
              <span className="text-text-muted text-[11px]">#FF4B6E</span>
            </div>
          </div>

          <div className="p-3 bg-surface border border-border-subtle rounded space-y-2">
            <div className="h-10 bg-signal-steel rounded" />
            <div className="text-xs font-mono">
              <span className="text-text-primary block font-semibold">Steel (Baseline/Neutral)</span>
              <span className="text-text-muted text-[11px]">#6B7A99</span>
            </div>
          </div>

          <div className="p-3 bg-surface border border-border-subtle rounded space-y-2">
            <div className="h-10 bg-text-primary rounded" />
            <div className="text-xs font-mono">
              <span className="text-text-primary block font-semibold">Text Primary</span>
              <span className="text-text-muted text-[11px]">#E6EAF2</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. Typography Scale ─────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-text-primary flex items-center gap-2">
          <span className="text-xs font-mono text-signal-cyan">[02]</span>
          <span>Typography Hierarchy (Geist + Geist Mono Tabular)</span>
        </h2>

        <Panel level="surface" className="p-6 space-y-5">
          <div className="border-b border-border-subtle pb-4">
            <span className="text-xs font-mono text-text-muted block mb-1">40px — Page Title / Display</span>
            <div className="text-2xl font-bold tracking-tight text-text-primary">
              Control Plane Flight Deck
            </div>
          </div>

          <div className="border-b border-border-subtle pb-4">
            <span className="text-xs font-mono text-text-muted block mb-1">28px — Section Heading / Hero KPI</span>
            <div className="text-xl font-bold tracking-tight text-text-primary">
              99.98% Telemetry Availability
            </div>
          </div>

          <div className="border-b border-border-subtle pb-4">
            <span className="text-xs font-mono text-text-muted block mb-1">20px — Card Header / Subheading</span>
            <div className="text-lg font-semibold tracking-tight text-text-primary">
              Payment Gateway Microservice (v2.1.5)
            </div>
          </div>

          <div className="border-b border-border-subtle pb-4">
            <span className="text-xs font-mono text-text-muted block mb-1">16px — Body Base Text</span>
            <p className="text-base text-text-primary leading-relaxed">
              Automated SLA breach detected by BullMQ evaluator. Progressive traffic stepping halted.
            </p>
          </div>

          <div className="border-b border-border-subtle pb-4">
            <span className="text-xs font-mono text-text-muted block mb-1">14px — Table Data / Form Labels</span>
            <p className="text-sm text-text-muted">
              Traffic weights: 75% Baseline (v2.1.4) • 25% Canary Candidate (v2.1.5)
            </p>
          </div>

          <div>
            <span className="text-xs font-mono text-text-muted block mb-1">
              12px Mono Tabular — Timestamps, Hashes, Hashes, Latency (Non-shifting numbers)
            </span>
            <div className="font-mono text-xs text-text-primary space-x-4">
              <span>HASH: a9f1b4c</span>
              <span>P99: 142ms</span>
              <span>ERR: 0.00%</span>
              <span>TIME: 2026-10-19 16:30:15 UTC</span>
            </div>
          </div>
        </Panel>
      </section>

      {/* ─── 3. Buttons ──────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-text-primary flex items-center gap-2">
          <span className="text-xs font-mono text-signal-cyan">[03]</span>
          <span>Button Primitives & States</span>
        </h2>

        <Panel level="surface" className="p-6 space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-mono text-text-muted block">Variants (Medium 14px)</span>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" icon={<Play className="w-3.5 h-3.5" />}>
                Deploy Canary
              </Button>
              <Button variant="secondary" icon={<Activity className="w-3.5 h-3.5" />}>
                Evaluate SLA
              </Button>
              <Button variant="danger" icon={<RotateCcw className="w-3.5 h-3.5" />}>
                Approve Rollback
              </Button>
              <Button variant="ghost">Secondary Action</Button>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono text-text-muted block">Sizes (Small 12px vs Medium 14px)</span>
            <div className="flex items-center gap-3">
              <Button size="sm" variant="primary">
                Small (32px)
              </Button>
              <Button size="md" variant="primary">
                Medium (36px)
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono text-text-muted block">States (Loading & Disabled)</span>
            <div className="flex items-center gap-3">
              <Button variant="secondary" loading>
                Processing...
              </Button>
              <Button variant="primary" disabled>
                Disabled Action
              </Button>
              <Button variant="danger" disabled>
                Disabled Rollback
              </Button>
            </div>
          </div>
        </Panel>
      </section>

      {/* ─── 4. Panels & Elevation ───────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-text-primary flex items-center gap-2">
          <span className="text-xs font-mono text-signal-cyan">[04]</span>
          <span>Two Panel Levels (Surface vs Elevated) & Corner Brackets</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Panel level="surface" className="p-5 space-y-2">
            <Badge variant="steel">LEVEL 1: SURFACE (#0C0F17)</Badge>
            <h3 className="text-sm font-semibold text-text-primary">Standard Container Panel</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Used for regular dashboard cards, service items, and data tables. 1px border (#1E2638).
            </p>
          </Panel>

          <Panel level="elevated" className="p-5 space-y-2">
            <Badge variant="cyan">LEVEL 2: ELEVATED (#111622)</Badge>
            <h3 className="text-sm font-semibold text-text-primary">Elevated Dialog & Card Panel</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Used for modals, flyouts, and highlighted cockpit modules. 1px strong border (#2A364F).
            </p>
          </Panel>

          <Panel level="surface" cornerBrackets className="p-5 space-y-2 bg-dot-grid">
            <Badge variant="emerald" dot>
              HERO COMMAND CARD
            </Badge>
            <h3 className="text-sm font-semibold text-text-primary">Corner Bracketed Hero</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Reserved strictly for the top primary dashboard flight deck and empty states with dot grid.
            </p>
          </Panel>
        </div>
      </section>

      {/* ─── 5. Status Badges & LED Diode Beacons ────────── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-text-primary flex items-center gap-2">
          <span className="text-xs font-mono text-signal-cyan">[05]</span>
          <span>Status LED Indicator Beacons (Subtle 6px Glow Halo Only)</span>
        </h2>

        <Panel level="surface" className="p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="emerald" dot pulseDot>
              PROMOTED (100%)
            </Badge>
            <Badge variant="emerald" dot>
              HEALTHY
            </Badge>
            <Badge variant="amber" dot pulseDot>
              CANARY OBSERVING (25%)
            </Badge>
            <Badge variant="amber" dot>
              DEGRADED
            </Badge>
            <Badge variant="coral" dot pulseDot>
              SLA BREACH (ROLLBACK)
            </Badge>
            <Badge variant="coral" dot>
              ROLLED BACK
            </Badge>
            <Badge variant="steel" dot>
              BASELINE (STABLE)
            </Badge>
            <Badge variant="cyan" dot>
              SYSTEM INVESTIGATION
            </Badge>
          </div>
          <p className="text-xs text-text-muted font-mono">
            * Note: Status is never conveyed by color alone — every LED beacon is paired with explicit text.
          </p>
        </Panel>
      </section>

      {/* ─── 6. Inputs & Selects ─────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-text-primary flex items-center gap-2">
          <span className="text-xs font-mono text-signal-cyan">[06]</span>
          <span>Inputs, Selects & Focus Rings</span>
        </h2>

        <Panel level="surface" className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Input
              label="CANDIDATE VERSION"
              placeholder="e.g. v2.1.5"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              hint="Semantic version tag"
            />
            <Select
              label="OBSERVATION WINDOW"
              options={[
                { label: "15 Seconds (Rapid Evaluation)", value: "15" },
                { label: "60 Seconds (Standard)", value: "60" },
                { label: "120 Seconds (Extended SLA)", value: "120" },
              ]}
            />
            <Input
              label="ERROR STATE DEMONSTRATION"
              defaultValue="invalid-format-@@"
              error="Version must follow semantic format vX.Y.Z"
            />
          </div>
        </Panel>
      </section>

      {/* ─── 7. Dense Flight Log Table ───────────────────── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-text-primary flex items-center gap-2">
          <span className="text-xs font-mono text-signal-cyan">[07]</span>
          <span>Dense Engineer's Flight Log Table</span>
        </h2>

        <Panel level="surface" className="overflow-hidden">
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>Deployment</TableHeaderCell>
                <TableHeaderCell>Version</TableHeaderCell>
                <TableHeaderCell>Commit Hash</TableHeaderCell>
                <TableHeaderCell>Traffic Split</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell className="text-right">Elapsed</TableHeaderCell>
              </tr>
            </TableHead>
            <tbody>
              <TableRow>
                <TableCell className="font-mono text-xs text-text-primary">dep_cmvezuzj70001</TableCell>
                <TableCell className="font-mono text-xs font-semibold text-text-primary">v2.1.5</TableCell>
                <TableCell className="font-mono text-xs text-text-muted">a9f1b4c</TableCell>
                <TableCell className="font-mono text-xs">
                  <span className="text-signal-steel">100% Base</span> / <span className="text-signal-amber font-semibold">0% Canary</span>
                </TableCell>
                <TableCell>
                  <Badge variant="coral" dot>
                    ROLLED_BACK
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-right text-text-muted">42s</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-xs text-text-primary">dep_cmveyx1080002</TableCell>
                <TableCell className="font-mono text-xs font-semibold text-text-primary">v2.1.4</TableCell>
                <TableCell className="font-mono text-xs text-text-muted">3c8d19e</TableCell>
                <TableCell className="font-mono text-xs">
                  <span className="text-signal-emerald">100% Promoted</span>
                </TableCell>
                <TableCell>
                  <Badge variant="emerald" dot>
                    PROMOTED
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-right text-text-muted">120s</TableCell>
              </TableRow>
            </tbody>
          </Table>
        </Panel>
      </section>

      {/* ─── 8. Skeletons & Alerts ───────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-text-primary flex items-center gap-2">
          <span className="text-xs font-mono text-signal-cyan">[08]</span>
          <span>Skeletons (No Shimmer) & Alerts (2px Solid Border)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Panel level="surface" className="p-5 space-y-3">
            <span className="text-xs font-mono text-text-muted block">Solid Opacity Pulse Skeleton</span>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-9 w-full" />
          </Panel>

          <div className="space-y-3">
            <Alert variant="emerald" title="DEPLOYMENT PROMOTED">
              Canary release v2.1.4 successfully reached 100% traffic with zero SLA violations.
            </Alert>
            <Alert variant="coral" title="CRITICAL SLA BREACH">
              Error rate exceeded 5.0% threshold (recorded: 93.33%). Immediate rollback recommended.
            </Alert>
          </div>
        </div>
      </section>

      {/* ─── 9. Modal Demonstration ──────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-text-primary flex items-center gap-2">
          <span className="text-xs font-mono text-signal-cyan">[09]</span>
          <span>Modal Dialog (Flat 80% Overlay, 6px Radius, Esc Key)</span>
        </h2>

        <Panel level="surface" className="p-5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Interactive Modal Primitive</h3>
            <p className="text-xs text-text-muted">
              Click to preview Level 2 elevation, keyboard escape listener, and flat overlay.
            </p>
          </div>
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            Open Test Modal
          </Button>
        </Panel>

        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Dispatch Canary Deployment"
          description="Initiate a staged canary verification workflow across the proxy cluster."
        >
          <div className="space-y-4">
            <Input label="RELEASE VERSION" placeholder="v2.1.6" defaultValue="v2.1.6" />
            <Input label="GIT COMMIT SHA" placeholder="e.g. b8c2e11" defaultValue="b8c2e11 (fix: timeout)" />
            <div className="pt-3 border-t border-border-subtle flex items-center justify-between">
              <span className="text-[11px] font-mono text-text-muted">Press Esc to cancel</span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={() => setModalOpen(false)}>
                  Confirm Dispatch
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      </section>
    </div>
  );
}
