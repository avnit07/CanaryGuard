import React from "react";
import { ChevronDown } from "lucide-react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: Array<{ label: string; value: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, children, className = "", id, ...props }, ref) => {
    const selectId = id || props.name;

    return (
      <div className="flex flex-col gap-1 w-full text-left">
        {label && (
          <label htmlFor={selectId} className="text-12 text-muted">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={`h-9 w-full appearance-none px-3 pr-8 bg-page border text-14 text-text rounded transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:opacity-40 disabled:cursor-not-allowed ${
              error
                ? "border-failed focus-visible:ring-failed"
                : "border-border hover:border-border focus-visible:ring-primary"
            } ${className}`}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-surface text-text">
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <ChevronDown className="w-4 h-4 text-muted pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
        </div>
        {error && <span className="text-12 text-failed">{error}</span>}
      </div>
    );
  }
);

Select.displayName = "Select";
