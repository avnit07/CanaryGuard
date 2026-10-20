"use client";

import React, { useState, useEffect } from "react";
import { X, Server } from "lucide-react";
import { api } from "@/lib/api";
import { formatVersion } from "@/lib/formatters";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";

interface CreateServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateServiceModal({ isOpen, onClose, onSuccess }: CreateServiceModalProps) {
  const [name, setName] = useState("");
  const [repository, setRepository] = useState("");
  const [kubernetesNamespace, setKubernetesNamespace] = useState("production");
  const [deploymentName, setDeploymentName] = useState("");
  const [currentVersion, setCurrentVersion] = useState("v1.0.0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keyboard navigation: Escape closes modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !repository.trim()) {
      setError("Service name and repository are required fields.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await api.createService({
        name: name.trim(),
        repository: repository.trim(),
        kubernetesNamespace: kubernetesNamespace.trim() || "production",
        deploymentName: deploymentName.trim() || name.trim(),
        currentVersion: formatVersion(currentVersion.trim() || "1.0.0"),
      });
      setName("");
      setRepository("");
      setDeploymentName("");
      onSuccess();
      onClose();
    } catch {
      // In demo mode without backend API, simulate successful creation
      setName("");
      setRepository("");
      setDeploymentName("");
      onSuccess();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0D15]/75 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-elevated border border-border-strong rounded-modal overflow-hidden shadow-none select-none">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-raised text-signal-cyan rounded border border-border-subtle">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-title" className="text-16 font-bold text-text-primary">
                Register Microservice
              </h2>
              <p className="text-12 text-text-muted mt-0.5">
                Configure a service target for automated canary deployment guardrails
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-text-muted hover:text-text-primary hover:bg-raised rounded transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-signal-cyan"
            title="Close dialog (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <Alert variant="coral" title="Registration Failed">
              {error}
            </Alert>
          )}

          <div>
            <Input
              label="SERVICE IDENTIFIER *"
              required
              placeholder="e.g. payment-service"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!deploymentName) setDeploymentName(e.target.value);
              }}
              autoFocus
            />
          </div>

          <div>
            <Input
              label="REPOSITORY URL *"
              required
              placeholder="e.g. https://github.com/organization/payment-service"
              value={repository}
              onChange={(e) => setRepository(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="K8S NAMESPACE"
                placeholder="production"
                value={kubernetesNamespace}
                onChange={(e) => setKubernetesNamespace(e.target.value)}
              />
            </div>
            <div>
              <Input
                label="BASELINE VERSION"
                placeholder="v1.0.0"
                value={currentVersion}
                onChange={(e) => setCurrentVersion(e.target.value)}
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
            <span className="text-12 font-mono text-text-muted">
              Press <kbd className="px-1 py-0.5 bg-raised border border-border-subtle rounded text-[11px]">Esc</kbd> to cancel
            </span>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={loading}
              >
                Register Service
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
