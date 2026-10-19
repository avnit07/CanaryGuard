import React from "react";
import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "emerald" | "amber" | "coral" | "cyan" | "steel";
  title?: string;
}

export function Alert({ variant = "steel", title, children, className = "", ...props }: AlertProps) {
  const styles = {
    emerald: {
      border: "border-l-2 border-l-healthy",
      icon: <CheckCircle className="w-4 h-4 text-healthy shrink-0 mt-0.5" />,
    },
    amber: {
      border: "border-l-2 border-l-canary",
      icon: <AlertTriangle className="w-4 h-4 text-canary shrink-0 mt-0.5" />,
    },
    coral: {
      border: "border-l-2 border-l-failed",
      icon: <XCircle className="w-4 h-4 text-failed shrink-0 mt-0.5" />,
    },
    cyan: {
      border: "border-l-2 border-l-primary",
      icon: <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />,
    },
    steel: {
      border: "border-l-2 border-l-baseline",
      icon: <Info className="w-4 h-4 text-baseline shrink-0 mt-0.5" />,
    },
  };

  const current = styles[variant];

  return (
    <div
      role="alert"
      className={`bg-surface border border-border rounded p-4 text-14 flex items-start gap-3 ${current.border} ${className}`}
      {...props}
    >
      {current.icon}
      <div className="space-y-0.5 flex-1">
        {title && <h4 className="font-semibold text-text text-14">{title}</h4>}
        <div className="text-muted text-12 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
