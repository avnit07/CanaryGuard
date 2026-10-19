import React from "react";

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  level?: "surface" | "elevated";
  cornerBrackets?: boolean;
}

export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ level = "surface", cornerBrackets, children, className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`bg-surface border border-border rounded ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Panel.displayName = "Panel";
