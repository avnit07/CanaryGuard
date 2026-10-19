import React from "react";

export interface StatusBadgeProps {
  status: string;
  type?: "deployment" | "health" | "step";
  className?: string;
}

export function StatusBadge({ status, type = "deployment", className = "" }: StatusBadgeProps) {
  const s = (status || "UNKNOWN").toUpperCase();

  let variant: "emerald" | "amber" | "coral" | "steel" | "cyan" = "steel";
  let pulse = false;

  if (type === "health") {
    switch (s) {
      case "HEALTHY":
        variant = "emerald";
        break;
      case "DEGRADED":
        variant = "amber";
        pulse = true;
        break;
      case "UNHEALTHY":
        variant = "coral";
        pulse = true;
        break;
      default:
        variant = "steel";
    }
  } else {
    // Deployment / Pipeline step statuses
    switch (s) {
      case "PROMOTED":
      case "COMPLETED":
        variant = "emerald";
        break;

      case "PROMOTING":
        variant = "emerald";
        pulse = true;
        break;

      case "CANARY":
      case "CANARY_ACTIVE":
      case "OBSERVING":
      case "AWAITING_APPROVAL":
        variant = "amber";
        pulse = true;
        break;

      case "CANARY_DEGRADED":
      case "ROLLING_BACK":
        variant = "coral";
        pulse = true;
        break;

      case "ROLLED_BACK":
      case "FAILED":
        variant = "coral";
        break;

      case "INVESTIGATING":
        variant = "cyan";
        pulse = true;
        break;

      case "BUILDING":
      case "DEPLOYING":
      case "RUNNING":
        variant = "cyan";
        pulse = true;
        break;

      case "PENDING":
      case "SKIPPED":
      default:
        variant = "steel";
    }
  }

  // One style only: soft solid background + dark text + small dot (no borders, no glows)
  const styles = {
    emerald: {
      badge: "bg-[#DCFCE7] text-[#166534]",
      dot: "bg-healthy",
    },
    amber: {
      badge: "bg-[#FEF3C7] text-[#92400E]",
      dot: "bg-canary",
    },
    coral: {
      badge: "bg-[#FEE2E2] text-[#991B1B]",
      dot: "bg-failed",
    },
    cyan: {
      badge: "bg-[#DBEAFE] text-[#1E40AF]",
      dot: "bg-primary",
    },
    steel: {
      badge: "bg-[#F1F5F9] text-[#334155]",
      dot: "bg-baseline",
    },
  };

  const current = styles[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-12 font-medium rounded select-none ${current.badge} ${className}`}
    >
      <span
        aria-hidden="true"
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${current.dot} ${
          pulse ? "animate-pulse" : ""
        }`}
      />
      <span>{status}</span>
    </span>
  );
}
