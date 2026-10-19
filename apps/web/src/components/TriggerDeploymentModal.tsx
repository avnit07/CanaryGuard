"use client";

import React, { useState } from "react";
import { X, Rocket, AlertCircle } from "lucide-react";
import { api, ServiceWithStats } from "@/lib/api";
import { useRouter } from "next/navigation";

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
  const [triggeredBy, setTriggeredBy] = useState("engineer@company.internal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync serviceId default if services load after mount
  React.useEffect(() => {
    if (!serviceId && services.length > 0) {
      setServiceId(services[0].id);
    }
  }, [services, serviceId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceId) {
      setError("Please select a target service");
      return;
    }
    if (!version.trim()) {
      setError("Release version is required");
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
      router.push(`/deployments/${created.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to trigger deployment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Trigger Canary Deployment</h2>
              <p className="text-xs text-slate-400">Deploy a release with progressive canary traffic scaling</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-950/40 border border-rose-800 rounded-lg text-rose-300 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Target Service <span className="text-rose-400">*</span>
            </label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            >
              {services.map((svc) => (
                <option key={svc.id} value={svc.id}>
                  {svc.name} (Current: {svc.currentVersion})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                New Version <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="v2.1.5"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Git Commit SHA
              </label>
              <input
                type="text"
                placeholder="b4d91a2"
                value={gitCommit}
                onChange={(e) => setGitCommit(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Container Image (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. payment-service:v2.1.5"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Triggered By
            </label>
            <input
              type="text"
              placeholder="engineer@company.internal"
              value={triggeredBy}
              onChange={(e) => setTriggeredBy(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? "Triggering..." : "Launch Deployment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
