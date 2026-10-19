import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "emerald" | "amber" | "coral" | "steel" | "cyan";
  dot?: boolean;
  pulseDot?: boolean;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "steel", dot = false, pulseDot = false, children, className = "", ...props }, ref) => {
    const variants = {
      emerald: {
        badge: "bg-[#DCFCE7] text-[#166534]",
        dotBg: "bg-healthy",
      },
      amber: {
        badge: "bg-[#FEF3C7] text-[#92400E]",
        dotBg: "bg-canary",
      },
      coral: {
        badge: "bg-[#FEE2E2] text-[#991B1B]",
        dotBg: "bg-failed",
      },
      steel: {
        badge: "bg-[#F1F5F9] text-[#334155]",
        dotBg: "bg-baseline",
      },
      cyan: {
        badge: "bg-[#DBEAFE] text-[#1E40AF]",
        dotBg: "bg-primary",
      },
    };

    const current = variants[variant] || variants.steel;

    return (
      <span
        ref={ref}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-12 font-medium rounded select-none ${current.badge} ${className}`}
        {...props}
      >
        {dot && (
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${current.dotBg} ${
              pulseDot ? "animate-pulse" : ""
            }`}
          />
        )}
        <span>{children}</span>
      </span>
    );
  }
);

Badge.displayName = "Badge";
