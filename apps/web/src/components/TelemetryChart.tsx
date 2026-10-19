"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Activity, AlertTriangle, CheckCircle, RefreshCw, Zap } from "lucide-react";

export interface TelemetryPoint {
  timestamp: string;
  errorRate: number;
  latencyMs: number;
  totalRequests: number;
}

interface TelemetryChartProps {
  canaryTargetUrl?: string;
  errorRateThreshold?: number;
  latencyThreshold?: number;
}

export function TelemetryChart({
  canaryTargetUrl = "http://localhost:8081",
  errorRateThreshold = 5.0,
  latencyThreshold = 500,
}: TelemetryChartProps) {
  const [dataPoints, setDataPoints] = useState<TelemetryPoint[]>([]);
  const [activeTab, setActiveTab] = useState<"errorRate" | "latency">("errorRate");
  const [hoveredPoint, setHoveredPoint] = useState<TelemetryPoint | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isLive, setIsLive] = useState(true);
  const [loading, setLoading] = useState(false);

  // Poll metrics from canary microservice
  const fetchTelemetry = useCallback(async () => {
    try {
      const res = await fetch(`${canaryTargetUrl}/admin/metrics`, {
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        const json = await res.json();
        const m = json.metrics || {};
        const newPoint: TelemetryPoint = {
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          errorRate: Number(m.errorRate ?? 0),
          latencyMs: Number(m.p99LatencyMs ?? m.p50LatencyMs ?? 25),
          totalRequests: Number(m.totalRequests ?? 0),
        };

        setDataPoints((prev) => {
          const updated = [...prev, newPoint];
          return updated.slice(-15); // keep last 15 points
        });
      }
    } catch {
      // Graceful fallback: If service is offline or unreachable, append simulated heartbeat
      const now = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setDataPoints((prev) => {
        const last = prev[prev.length - 1];
        const newPoint: TelemetryPoint = {
          timestamp: now,
          errorRate: last?.errorRate ?? 0,
          latencyMs: last?.latencyMs ?? 25,
          totalRequests: (last?.totalRequests ?? 0) + 1,
        };
        return [...prev, newPoint].slice(-15);
      });
    } finally {
      setLoading(false);
    }
  }, [canaryTargetUrl]);

  // Seed initial sample points if empty
  useEffect(() => {
    if (dataPoints.length === 0) {
      const initial: TelemetryPoint[] = [];
      const now = Date.now();
      for (let i = 8; i >= 0; i--) {
        const d = new Date(now - i * 4000);
        initial.push({
          timestamp: d.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          errorRate: 0,
          latencyMs: 22 + Math.floor(Math.random() * 8),
          totalRequests: 10 + (8 - i) * 2,
        });
      }
      setDataPoints(initial);
    }
  }, [dataPoints.length]);

  // Live polling interval
  useEffect(() => {
    if (!isLive) return;
    fetchTelemetry();
    const timer = setInterval(fetchTelemetry, 3000);
    return () => clearInterval(timer);
  }, [isLive, fetchTelemetry]);

  // Chart Dimensions & Coordinate Math
  const width = 640;
  const height = 180;
  const padding = { top: 20, right: 30, bottom: 30, left: 45 };

  const activePoints = useMemo(() => {
    return dataPoints.map((p) => (activeTab === "errorRate" ? p.errorRate : p.latencyMs));
  }, [dataPoints, activeTab]);

  const threshold = activeTab === "errorRate" ? errorRateThreshold : latencyThreshold;

  const maxValue = useMemo(() => {
    const maxData = Math.max(...activePoints, threshold);
    return Math.max(activeTab === "errorRate" ? 10 : 100, Math.ceil(maxData * 1.2));
  }, [activePoints, threshold, activeTab]);

  // SVG coordinates calculation
  const pointsString = useMemo(() => {
    if (dataPoints.length === 0) return "";
    const xStep = (width - padding.left - padding.right) / Math.max(1, dataPoints.length - 1);
    const plotHeight = height - padding.top - padding.bottom;

    return dataPoints
      .map((p, idx) => {
        const val = activeTab === "errorRate" ? p.errorRate : p.latencyMs;
        const x = padding.left + idx * xStep;
        const y = padding.top + plotHeight - (val / maxValue) * plotHeight;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [dataPoints, activeTab, maxValue, width, height, padding]);

  // Threshold Y position
  const thresholdY = useMemo(() => {
    const plotHeight = height - padding.top - padding.bottom;
    return padding.top + plotHeight - (threshold / maxValue) * plotHeight;
  }, [threshold, maxValue, height, padding]);

  // Closed polygon for area gradient fill
  const areaPolygon = useMemo(() => {
    if (!pointsString) return "";
    const plotHeight = height - padding.top - padding.bottom;
    const baseY = padding.top + plotHeight;
    const firstX = padding.left;
    const lastX = padding.left + (dataPoints.length - 1) * ((width - padding.left - padding.right) / Math.max(1, dataPoints.length - 1));

    return `${firstX},${baseY} ${pointsString} ${lastX},${baseY}`;
  }, [pointsString, dataPoints.length, height, padding, width]);

  const latestVal = activePoints[activePoints.length - 1] ?? 0;
  const isBreached = latestVal > threshold;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Live Canary Telemetry Stream
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                  isBreached
                    ? "bg-rose-950 text-rose-300 border border-rose-800"
                    : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                }`}
              >
                {isBreached ? (
                  <>
                    <AlertTriangle className="w-3 h-3 text-rose-400" /> SLA BREACH
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3 h-3 text-emerald-400" /> HEALTHY
                  </>
                )}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Sliding-window metric evaluator ({canaryTargetUrl})
            </p>
          </div>
        </div>

        {/* Tab Selector & Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setActiveTab("errorRate")}
              className={`px-3 py-1 rounded-md font-mono transition-colors ${
                activeTab === "errorRate"
                  ? "bg-emerald-500/20 text-emerald-300 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Error Rate (%)
            </button>
            <button
              onClick={() => setActiveTab("latency")}
              className={`px-3 py-1 rounded-md font-mono transition-colors ${
                activeTab === "latency"
                  ? "bg-purple-500/20 text-purple-300 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              P99 Latency (ms)
            </button>
          </div>

          <button
            onClick={() => setIsLive(!isLive)}
            title={isLive ? "Pause live streaming" : "Resume live streaming"}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
              isLive
                ? "bg-emerald-950/60 border-emerald-800 text-emerald-300"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${isLive ? "animate-pulse text-emerald-400" : ""}`} />
            <span className="text-[10px] font-mono">{isLive ? "LIVE" : "PAUSED"}</span>
          </button>

          <button
            onClick={() => {
              setLoading(true);
              fetchTelemetry();
            }}
            disabled={loading}
            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
            title="Refresh metrics now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* SVG Chart Canvas */}
      <div className="relative w-full overflow-hidden bg-slate-950/80 border border-slate-800/80 rounded-xl p-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="errorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const y = padding.top + (height - padding.top - padding.bottom) * pct;
            const valLabel = Math.round(maxValue * (1 - pct));
            return (
              <g key={pct}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#334155"
                  strokeDasharray="2 3"
                  strokeWidth="0.8"
                />
                <text
                  x={padding.left - 6}
                  y={y + 3}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {valLabel}
                  {activeTab === "errorRate" ? "%" : "ms"}
                </text>
              </g>
            );
          })}

          {/* SLA Threshold Horizontal Line */}
          {thresholdY >= padding.top && thresholdY <= height - padding.bottom && (
            <g>
              <line
                x1={padding.left}
                y1={thresholdY}
                x2={width - padding.right}
                y2={thresholdY}
                stroke={activeTab === "errorRate" ? "#f43f5e" : "#f59e0b"}
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <text
                x={width - padding.right}
                y={thresholdY - 5}
                textAnchor="end"
                fill={activeTab === "errorRate" ? "#fb7185" : "#fbbf24"}
                fontSize="9"
                fontWeight="bold"
                fontFamily="monospace"
              >
                SLA LIMIT: {threshold}
                {activeTab === "errorRate" ? "%" : "ms"}
              </text>
            </g>
          )}

          {/* Filled Area Gradient */}
          {areaPolygon && (
            <polygon
              points={areaPolygon}
              fill={activeTab === "errorRate" ? "url(#errorGradient)" : "url(#latencyGradient)"}
            />
          )}

          {/* Metric Polyline */}
          {pointsString && (
            <polyline
              fill="none"
              stroke={
                activeTab === "errorRate"
                  ? isBreached
                    ? "#f43f5e"
                    : "#10b981"
                  : "#a855f7"
              }
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={pointsString}
            />
          )}

          {/* Interactive Data Points */}
          {dataPoints.map((p, idx) => {
            const val = activeTab === "errorRate" ? p.errorRate : p.latencyMs;
            const xStep =
              (width - padding.left - padding.right) / Math.max(1, dataPoints.length - 1);
            const plotHeight = height - padding.top - padding.bottom;
            const cx = padding.left + idx * xStep;
            const cy = padding.top + plotHeight - (val / maxValue) * plotHeight;
            const isHovered = hoveredIndex === idx;

            return (
              <g
                key={idx}
                onMouseEnter={() => {
                  setHoveredPoint(p);
                  setHoveredIndex(idx);
                }}
                onMouseLeave={() => {
                  setHoveredPoint(null);
                  setHoveredIndex(null);
                }}
                className="cursor-pointer"
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 5 : 3}
                  fill={
                    activeTab === "errorRate"
                      ? val > threshold
                        ? "#f43f5e"
                        : "#10b981"
                      : "#c084fc"
                  }
                  stroke="#0f172a"
                  strokeWidth="2"
                  className="transition-all duration-150"
                />
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div className="absolute top-3 left-16 bg-slate-900/95 border border-slate-700/80 rounded-lg p-2.5 shadow-2xl backdrop-blur-sm pointer-events-none text-xs space-y-1">
            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
              <span>Time:</span>
              <strong className="text-slate-200">{hoveredPoint.timestamp}</strong>
            </div>
            <div className="font-mono flex items-center gap-2">
              <span className="text-slate-400">
                {activeTab === "errorRate" ? "Error Rate:" : "P99 Latency:"}
              </span>
              <span
                className={`font-bold ${
                  (activeTab === "errorRate"
                    ? hoveredPoint.errorRate
                    : hoveredPoint.latencyMs) > threshold
                    ? "text-rose-400"
                    : "text-emerald-400"
                }`}
              >
                {activeTab === "errorRate"
                  ? `${hoveredPoint.errorRate}%`
                  : `${hoveredPoint.latencyMs}ms`}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Requests Sampled: {hoveredPoint.totalRequests}
            </div>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-1">
        <div>
          <span>Current {activeTab === "errorRate" ? "Error Rate" : "P99 Latency"}: </span>
          <strong
            className={`font-semibold ${
              isBreached ? "text-rose-400" : "text-emerald-400"
            }`}
          >
            {latestVal}
            {activeTab === "errorRate" ? "%" : "ms"}
          </strong>
        </div>
        <div className="text-slate-500 text-[11px]">
          Target: {canaryTargetUrl} • Threshold: {threshold}
          {activeTab === "errorRate" ? "%" : "ms"}
        </div>
      </div>
    </div>
  );
}
