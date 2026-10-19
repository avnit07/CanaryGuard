"use client";

import React, { useState } from "react";
import { X, Server, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !repository.trim()) {
      setError("Service name and repository are required");
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
        currentVersion: currentVersion.trim() || "v1.0.0",
      });
      setName("");
      setRepository("");
      setDeploymentName("");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create service");
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
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Register Microservice</h2>
              <p className="text-xs text-slate-400">Configure a service for automated canary protection</p>
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
              Service Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. payment-service"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!deploymentName) setDeploymentName(e.target.value);
              }}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Repository URL <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. github.com/organization/payment-service"
              value={repository}
              onChange={(e) => setRepository(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                K8s Namespace
              </label>
              <input
                type="text"
                placeholder="production"
                value={kubernetesNamespace}
                onChange={(e) => setKubernetesNamespace(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Baseline Version
              </label>
              <input
                type="text"
                placeholder="v1.0.0"
                value={currentVersion}
                onChange={(e) => setCurrentVersion(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
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
              className="px-5 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? "Registering..." : "Register Service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
