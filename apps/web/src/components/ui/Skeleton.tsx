import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string;
  height?: string;
}

export function Skeleton({ className = "", width, height, style, ...props }: SkeletonProps) {
  return (
    <div
      className={`bg-page border border-border rounded animate-pulse-subtle ${className}`}
      style={{
        width,
        height,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
}
