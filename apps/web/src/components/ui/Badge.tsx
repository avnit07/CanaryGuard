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
        badge: "bg-[#DCFCE7] text-[#166534] border border-transparent dark:bg-[#16A34A]/15 dark:text-[#4ADE80] dark:border-[#16A34A]/30",
        dotBg: "bg-healthy",
      },
      amber: {
        badge: "bg-[#FEF3C7] text-[#92400E] border border-transparent dark:bg-[#F59E0B]/15 dark:text-[#FBBF24] dark:border-[#F59E0B]/30",
        dotBg: "bg-canary",
      },
      coral: {
        badge: "bg-[#FEE2E2] text-[#991B1B] border border-transparent dark:bg-[#DC2626]/15 dark:text-[#F87171] dark:border-[#DC2626]/30",
        dotBg: "bg-failed",
      },
      steel: {
        badge: "bg-[#F1F5F9] text-[#334155] border border-transparent dark:bg-[#334155]/40 dark:text-[#94A3B8] dark:border-[#334155]/60",
        dotBg: "bg-baseline",
      },
      cyan: {
        badge: "bg-[#DBEAFE] text-[#1E40AF] border border-transparent dark:bg-[#3B82F6]/15 dark:text-[#60A5FA] dark:border-[#3B82F6]/30",
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
