import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="flex flex-col gap-1 w-full text-left">
        {label && (
          <label htmlFor={inputId} className="text-12 text-muted">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`h-9 px-3 bg-page border text-14 text-text rounded placeholder:text-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:opacity-40 disabled:cursor-not-allowed ${
            error
              ? "border-failed focus-visible:ring-failed"
              : "border-border hover:border-border focus-visible:ring-primary"
          } ${className}`}
          {...props}
        />
        {error ? (
          <span className="text-12 text-failed">{error}</span>
        ) : hint ? (
          <span className="text-12 text-muted">{hint}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
