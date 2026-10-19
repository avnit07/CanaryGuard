import React from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "secondary",
      size = "md",
      loading = false,
      icon,
      children,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center font-medium transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40 disabled:pointer-events-none rounded";

    const sizes = {
      sm: "text-12 px-3 py-1.5 gap-1.5 h-8",
      md: "text-14 px-4 py-2 gap-2 h-9",
    };

    const variants = {
      primary:
        "bg-primary text-white font-medium hover:bg-[#1D4ED8] border border-primary",
      secondary:
        "bg-surface text-text border border-border hover:bg-page",
      danger:
        "bg-surface text-failed border border-border hover:bg-[#FEE2E2]",
      ghost:
        "bg-transparent text-muted hover:text-text hover:bg-page border border-transparent",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-current shrink-0" />
        ) : (
          icon && <span className="shrink-0">{icon}</span>
        )}
        <span>{children}</span>
      </button>
    );
  }
);

Button.displayName = "Button";
