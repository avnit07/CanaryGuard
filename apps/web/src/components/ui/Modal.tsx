"use client";

import React, { useEffect, useCallback } from "react";
import { X } from "lucide-react";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  maxWidth = "md",
}: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  const maxWidths = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none"
    >
      {/* Flat overlay: No backdrop-blur */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#111827]/30 transition-opacity"
      />

      {/* Modal Surface: 6px radius, border, no shadow */}
      <div
        className={`relative z-10 w-full ${maxWidths[maxWidth]} bg-surface border border-border rounded-modal p-6 text-left shadow-none space-y-4`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border pb-3">
          <div>
            <h2 id="modal-title" className="text-20 font-semibold text-text">
              {title}
            </h2>
            {description && (
              <p className="text-12 text-muted mt-1 leading-relaxed">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 text-muted hover:text-text hover:bg-page rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
}
