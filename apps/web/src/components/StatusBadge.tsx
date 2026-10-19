import React from "react";

interface StatusBadgeProps {
  status: string;
  type?: "deployment" | "health" | "step";
}

export function StatusBadge({ status, type = "deployment" }: StatusBadgeProps) {
  let bg = "bg-gray-800 text-gray-300 border-gray-700";
  let dot = "bg-gray-400";
  let pulse = false;

  const s = status.toUpperCase();

  if (type === "health") {
    switch (s) {
      case "HEALTHY":
        bg = "bg-emerald-950/60 text-emerald-300 border-emerald-800/80";
        dot = "bg-emerald-400";
        break;
      case "DEGRADED":
        bg = "bg-amber-950/60 text-amber-300 border-amber-800/80";
        dot = "bg-amber-400";
        pulse = true;
        break;
      case "UNHEALTHY":
        bg = "bg-rose-950/60 text-rose-300 border-rose-800/80";
        dot = "bg-rose-400";
        pulse = true;
        break;
      default:
        bg = "bg-slate-800 text-slate-300 border-slate-700";
        dot = "bg-slate-400";
    }
  } else {
    // Deployment status or step status
    switch (s) {
      case "PENDING":
        bg = "bg-slate-800 text-slate-300 border-slate-700";
        dot = "bg-slate-400";
        break;
      case "BUILDING":
      case "DEPLOYING":
      case "RUNNING":
        bg = "bg-blue-950/60 text-blue-300 border-blue-800/80";
        dot = "bg-blue-400";
        pulse = true;
        break;
      case "CANARY":
      case "CANARY_ACTIVE":
      case "OBSERVING":
        bg = "bg-amber-950/60 text-amber-300 border-amber-800/80";
        dot = "bg-amber-400";
        pulse = true;
        break;
      case "INVESTIGATING":
        bg = "bg-purple-950/60 text-purple-300 border-purple-800/80";
        dot = "bg-purple-400";
        pulse = true;
        break;
      case "AWAITING_APPROVAL":
        bg = "bg-orange-950/60 text-orange-300 border-orange-800/80";
        dot = "bg-orange-400";
        pulse = true;
        break;
      case "PROMOTING":
      case "PROMOTED":
      case "COMPLETED":
        bg = "bg-emerald-950/60 text-emerald-300 border-emerald-800/80";
        dot = "bg-emerald-400";
        break;
      case "ROLLING_BACK":
        bg = "bg-rose-950/60 text-rose-300 border-rose-800/80";
        dot = "bg-rose-400";
        pulse = true;
        break;
      case "ROLLED_BACK":
      case "FAILED":
        bg = "bg-rose-950/60 text-rose-300 border-rose-800/80";
        dot = "bg-rose-400";
        break;
      case "SKIPPED":
        bg = "bg-zinc-800/60 text-zinc-400 border-zinc-700";
        dot = "bg-zinc-500";
        break;
    }
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${bg}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${dot} ${pulse ? "animate-ping opacity-75" : ""}`}
      />
      {status}
    </span>
  );
}
