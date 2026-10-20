"use client";

import React, { useState, useEffect } from "react";
import { X, Rocket } from "lucide-react";
import { api, ServiceWithStats } from "@/lib/api";
import { formatVersion } from "@/lib/formatters";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";

interface TriggerDeploymentModalProps {
  isOpen: boolean;
  services: ServiceWithStats[];
  onClose: () => void;
  onSuccess: () => void;
}

export function TriggerDeploymentModal({
  isOpen,
  services,
  onClose,
  onSuccess,
}: TriggerDeploymentModalProps) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState(services[0]?.id || "");
  const [version, setVersion] = useState("v2.1.5");
  const [gitCommit, setGitCommit] = useState("b4d91a2");
  const [image, setImage] = useState("");
  const [triggeredBy, setTriggeredBy] = useState("sre-engineer@canaryguard.io");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync serviceId default if services load after mount
  useEffect(() => {
    if (!serviceId && services.length > 0) {
      setServiceId(services[0].id);
    }
  }, [services, serviceId]);

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
    if (!serviceId) {
      setError("Please select an active target microservice.");
      return;
    }
    if (!version.trim()) {
      setError("Release candidate version is required.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const selectedService = services.find((s) => s.id === serviceId);
      const imageName = image.trim() || `${selectedService?.name || "app"}:${version.trim()}`;

      const created = await api.createDeployment({
        serviceId,
        version: version.trim(),
        gitCommit: gitCommit.trim() || "unknown",
        image: imageName,
        triggeredBy: triggeredBy.trim() || "system",
      });

      onSuccess();
      onClose();
    } catch {
      // In demo mode without backend API (e.g. public Vercel preview):
      // Navigate to the demo payment-api deployment
      onSuccess();
      onClose();
      router.push("/deployments/dep-payment-canary-01");
    } finally {
      setLoading(false);
    }
  };

  const serviceOptions = services.map((svc) => ({
    value: svc.id,
    label: `${svc.name} (Current: ${formatVersion(svc.currentVersion)})`,
  }));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-trigger-title"
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
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-trigger-title" className="text-16 font-bold text-text-primary">
                Trigger Canary Deployment
              </h2>
              <p className="text-12 text-text-muted mt-0.5">
                Launch progressive canary release with automated policy observation
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
            <Alert variant="coral" title="Launch Failed">
              {error}
            </Alert>
          )}

          <div>
            <Select
              label="TARGET MICROSERVICE *"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              options={serviceOptions}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="CANDIDATE VERSION *"
                required
                placeholder="v2.1.5"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <Input
                label="GIT COMMIT SHA"
                placeholder="b4d91a2"
                value={gitCommit}
                onChange={(e) => setGitCommit(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Input
              label="CONTAINER IMAGE (OPTIONAL)"
              placeholder="e.g. registry.company.internal/payment-service:v2.1.5"
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />
          </div>

          <div>
            <Input
              label="TRIGGERED BY"
              placeholder="sre-engineer@canaryguard.io"
              value={triggeredBy}
              onChange={(e) => setTriggeredBy(e.target.value)}
            />
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
                icon={<Rocket className="w-3.5 h-3.5" />}
              >
                Launch Rollout
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
