"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Shield,
  Activity,
  Server,
  Plus,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Layers,
  Search,
  Palette,
  Terminal,
  Sparkles,
  X,
} from "lucide-react";
import { api, ServiceWithStats } from "@/lib/api";
import { formatVersion } from "@/lib/formatters";
import { CreateServiceModal } from "@/components/CreateServiceModal";
import { DEMO_SERVICES } from "@/lib/demo-data";

export interface AppSidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function AppSidebar({ mobileOpen = false, onCloseMobile }: AppSidebarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();

  // Read service from URL search without useSearchParams de-optimization
  const [currentServiceParam, setCurrentServiceParam] = useState("");

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      setCurrentServiceParam(params.get("service") || "");
    } catch {
      // ignore
    }
  }, [pathname]);

  const [collapsed, setCollapsed] = useState(false);
  const [services, setServices] = useState<ServiceWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Restore collapsed state from localStorage (default collapsed on tablet <1024px)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("canaryguard_sidebar_collapsed");
      if (saved !== null) {
        setCollapsed(saved === "true");
      } else if (typeof window !== "undefined" && window.innerWidth < 1024) {
        setCollapsed(true);
      }
    } catch {
      // ignore in restricted environments
    }
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem("canaryguard_sidebar_collapsed", String(next));
    } catch {
      // ignore
    }
  };

  const fetchServices = useCallback(async () => {
    try {
      const data = await api.getServices();
      if (data && data.length > 0) {
        setServices(data);
      } else {
        setServices(DEMO_SERVICES);
      }
    } catch {
      setServices(DEMO_SERVICES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
    const interval = setInterval(fetchServices, 10000);
    return () => clearInterval(interval);
  }, [fetchServices]);

  // Filter services by search
  const filteredServices = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return services;
    return services.filter((s) => s.name.toLowerCase().includes(query));
  }, [services, searchQuery]);

  // Active selected service matches cockpit page selection
  const activeSelectedId = useMemo(() => {
    if (currentServiceParam) return currentServiceParam;
    if (services.length === 0) return "";
    const activeSvc = services.find((s) => {
      const dep = s.deployments?.[0];
      return (
        dep &&
        [
          "CANARY",
          "CANARY_ACTIVE",
          "OBSERVING",
          "CANARY_DEGRADED",
          "INVESTIGATING",
        ].includes(dep.status)
      );
    });
    return activeSvc ? activeSvc.id : services[0].id;
  }, [currentServiceParam, services]);

  const navLinks = [
    { label: "Overview & Demo", href: "/", icon: <Sparkles className="w-4 h-4 text-primary" /> },
    { label: "Fleet Control Plane", href: "/fleet", icon: <Activity className="w-4 h-4" /> },
    { label: "Design system", href: "/design-preview", icon: <Palette className="w-4 h-4" /> },
  ];

  const externalTools = [
    { label: "Queue monitor", href: "http://localhost:4000/admin/queues", icon: <Terminal className="w-4 h-4" /> },
    { label: "Proxy routing", href: "http://localhost:8000/admin/routing", icon: <Layers className="w-4 h-4" /> },
  ];

  const hasCanariesInFlight = useMemo(() => {
    return services.some((s) =>
      s.deployments?.some((d) =>
        ["CANARY", "CANARY_ACTIVE", "OBSERVING", "CANARY_DEGRADED", "INVESTIGATING"].includes(
          d.status
        )
      )
    );
  }, [services]);

  return (
    <>
      <aside
        className={`shrink-0 border-r border-border bg-surface flex flex-col justify-between transition-all duration-150 select-none ${
          collapsed ? "w-16" : "w-64"
        } hidden sm:flex`}
        style={{ minHeight: "100vh" }}
      >
        {/* ─── Top Brand & Workspace Header ─────────────────── */}
        <div>
          {!collapsed ? (
            <div className="h-14 px-4 border-b border-border flex items-center justify-between gap-2">
              <Link href="/" className="flex items-center gap-2.5 truncate">
                <div className="w-7 h-7 rounded bg-raised border border-border flex items-center justify-center text-primary shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="text-14 font-semibold text-text truncate">
                    CanaryGuard
                  </div>
                  <div className="text-12 text-muted truncate">
                    Local cluster
                  </div>
                </div>
              </Link>

              {/* Collapse Button */}
              <button
                onClick={toggleCollapsed}
                className="p-1.5 text-muted hover:text-text hover:bg-page rounded transition-colors"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="h-14 border-b border-border flex items-center justify-center">
              <button
                onClick={toggleCollapsed}
                className="w-9 h-9 rounded bg-raised border border-border flex items-center justify-center text-primary hover:border-primary/60 hover:bg-surface transition-colors group"
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <Shield className="w-4 h-4 group-hover:hidden" />
                <ChevronRight className="w-4 h-4 hidden group-hover:block text-primary" />
              </button>
            </div>
          )}

          {/* Quick Search Bar (when expanded) */}
          {!collapsed && (
            <div className="p-3 border-b border-border">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-2 bg-raised border border-border rounded text-14 text-text placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
                <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}

          {/* ─── Main Navigation ────────────────────────────── */}
          {!collapsed ? (
            <div className="py-2 space-y-0.5">
              {navLinks.map((item) => {
                const isActive = pathname === item.href && !currentServiceParam;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-1.5 text-14 transition-colors ${
                      isActive
                        ? "border-l-2 border-primary bg-raised text-text font-medium"
                        : "border-l-2 border-transparent text-muted hover:text-text hover:bg-raised"
                    }`}
                    title={item.label}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="py-2.5 space-y-1 flex flex-col items-center">
              {/* Overview & Demo Icon */}
              <Link
                href="/"
                className={`w-9 h-9 rounded flex items-center justify-center text-14 transition-colors ${
                  pathname === "/" && !currentServiceParam
                    ? "bg-primary text-white font-medium"
                    : "text-muted hover:text-text hover:bg-raised"
                }`}
                title="Overview & Demo"
              >
                <Sparkles className="w-4 h-4" />
              </Link>

              {/* Fleet Control Plane Icon */}
              <Link
                href="/fleet"
                className={`w-9 h-9 rounded flex items-center justify-center text-14 transition-colors ${
                  pathname === "/fleet"
                    ? "bg-primary text-white font-medium"
                    : "text-muted hover:text-text hover:bg-raised"
                }`}
                title="Fleet Control Plane"
              >
                <Activity className="w-4 h-4" />
              </Link>

              {/* Microservices Drawer Opener Icon */}
              <button
                onClick={toggleCollapsed}
                className="relative w-9 h-9 rounded flex items-center justify-center text-muted hover:text-text hover:bg-raised transition-colors"
                title={`Microservices (${services.length}) — Click to view fleet list`}
              >
                <Server className="w-4 h-4" />
                {hasCanariesInFlight && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-canary" />
                )}
              </button>

              {/* Design System Preview */}
              <Link
                href="/design-preview"
                className={`w-9 h-9 rounded flex items-center justify-center text-14 transition-colors ${
                  pathname === "/design-preview"
                    ? "bg-primary text-white font-medium"
                    : "text-muted hover:text-text hover:bg-raised"
                }`}
                title="Design system"
              >
                <Palette className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Divider between Nav & Infrastructure */}
          {collapsed && <div className="w-8 h-px bg-border mx-auto my-1" />}

          {/* ─── External Infrastructure Tools ───────────────── */}
          {!collapsed ? (
            <div className="py-2 pt-0 space-y-0.5">
              <div className="px-3 pt-2 pb-1 text-12 text-muted">
                Infrastructure
              </div>
              {externalTools.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between px-3 py-1.5 text-14 text-muted hover:text-text hover:bg-raised transition-colors border-l-2 border-transparent"
                  title={`Open ${item.label}`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="shrink-0">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </div>
                  <ExternalLink className="w-3 h-3 opacity-40 shrink-0" />
                </a>
              ))}
            </div>
          ) : (
            <div className="py-1 space-y-1 flex flex-col items-center">
              {externalTools.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded flex items-center justify-center text-muted hover:text-text hover:bg-raised transition-colors"
                  title={`Open ${item.label}`}
                >
                  {item.icon}
                </a>
              ))}
            </div>
          )}

          {/* Divider in collapsed mode */}
          {collapsed && <div className="w-8 h-px bg-border mx-auto my-1" />}

          {/* ─── Services Section ─────────────────────────────── */}
          {!collapsed ? (
            <div className="border-t border-border py-2 space-y-0.5">
              <div className="flex items-center justify-between px-3 pt-1 pb-1">
                <span className="text-12 text-muted">
                  Microservices ({services.length})
                </span>
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="p-0.5 text-muted hover:text-text rounded hover:bg-raised transition-colors"
                  title="Register new microservice"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tree Items List */}
              <div className="space-y-0.5 max-h-[calc(100vh-380px)] overflow-y-auto">
                {loading ? (
                  <div className="px-3 py-2 space-y-2">
                    <div className="h-4 bg-raised rounded animate-pulse-subtle" />
                    <div className="h-4 bg-raised rounded animate-pulse-subtle" />
                  </div>
                ) : filteredServices.length === 0 ? (
                  <div className="px-3 py-2 text-12 text-muted">
                    No services found.
                  </div>
                ) : (
                  filteredServices.map((svc) => {
                    const isSelected = activeSelectedId === svc.id;
                    const activeCanary = svc.deployments?.[0]?.canaryWeight ?? 0;
                    const hasActiveCanary = activeCanary > 0;

                    return (
                      <button
                        key={svc.id}
                        onClick={() => {
                          setCurrentServiceParam(svc.id);
                          router.push(`/fleet?service=${svc.id}`);
                        }}
                        className={`w-full text-left flex items-center justify-between px-3 py-1.5 text-14 transition-colors ${
                          isSelected
                            ? "border-l-2 border-primary bg-raised text-text font-medium"
                            : "border-l-2 border-transparent text-muted hover:text-text hover:bg-raised"
                        }`}
                        title={`${svc.name} (${formatVersion(svc.currentVersion)})`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              svc.healthStatus === "HEALTHY"
                                ? "bg-healthy"
                                : "bg-baseline"
                            }`}
                          />
                          <span className="truncate">{svc.name}</span>
                        </div>

                        {hasActiveCanary && (
                          <span className="text-12 font-mono text-muted tabular-nums shrink-0">
                            {activeCanary}%
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* + Register Service item */}
              <button
                onClick={() => setCreateModalOpen(true)}
                className="w-[calc(100%-16px)] mx-2 text-left flex items-center gap-2 px-2.5 py-1.5 mt-2 rounded text-12 text-muted hover:text-text hover:bg-raised transition-colors border border-dashed border-border"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>Add microservice...</span>
              </button>
            </div>
          ) : (
            <div className="py-2 flex justify-center">
              {/* Clean Add Service Button */}
              <button
                onClick={() => setCreateModalOpen(true)}
                className="w-9 h-9 rounded border border-dashed border-border flex items-center justify-center text-muted hover:text-primary hover:border-primary transition-colors"
                title="Register new microservice"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* ─── Bottom Footer ─────────────────────────────────── */}
        <div className="p-2.5 border-t border-border bg-surface">
          {!collapsed ? (
            <div className="flex items-center justify-between text-12 text-muted px-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-healthy shrink-0" />
                <span>Guardrails armed</span>
              </div>
              <span className="text-12 font-mono tabular-nums">{formatVersion("2.1")}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-2 h-2 rounded-full bg-healthy shrink-0"
                title="Cluster guardrails armed"
              />
              <button
                onClick={toggleCollapsed}
                className="w-9 h-9 rounded text-muted hover:text-text hover:bg-page flex items-center justify-center transition-colors"
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ─── Mobile Navigation Drawer Overlay ─────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 sm:hidden select-none">
          {/* Backdrop */}
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-[#0B0D15]/80 backdrop-blur-sm transition-opacity"
            aria-hidden="true"
          />

          {/* Drawer container */}
          <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-surface border-r border-border shadow-2xl flex flex-col justify-between animate-in slide-in-from-left duration-200">
            <div>
              {/* Header */}
              <div className="h-14 px-4 border-b border-border flex items-center justify-between gap-2">
                <Link
                  href="/"
                  onClick={onCloseMobile}
                  className="flex items-center gap-2.5 truncate"
                >
                  <div className="w-7 h-7 rounded bg-raised border border-border flex items-center justify-center text-primary shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-14 font-semibold text-text truncate">
                      CanaryGuard
                    </div>
                    <div className="text-11 text-muted truncate">
                      Control Plane
                    </div>
                  </div>
                </Link>

                <button
                  onClick={onCloseMobile}
                  className="p-1.5 text-muted hover:text-text hover:bg-raised rounded transition-colors"
                  aria-label="Close navigation menu"
                  title="Close menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Search */}
              <div className="p-3 border-b border-border">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-8 pl-8 pr-2 bg-raised border border-border rounded text-14 text-text placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                  <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Navigation Links */}
              <div className="py-2 space-y-0.5">
                {navLinks.map((item) => {
                  const isActive = pathname === item.href && !currentServiceParam;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onCloseMobile}
                      className={`flex items-center gap-2.5 px-3 py-2 text-14 transition-colors ${
                        isActive
                          ? "border-l-2 border-primary bg-raised text-text font-medium"
                          : "border-l-2 border-transparent text-muted hover:text-text hover:bg-raised"
                      }`}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Microservices Section */}
              <div className="border-t border-border py-2 space-y-0.5">
                <div className="flex items-center justify-between px-3 pt-1 pb-1">
                  <span className="text-12 text-muted">
                    Microservices ({services.length})
                  </span>
                  <button
                    onClick={() => {
                      if (onCloseMobile) onCloseMobile();
                      setCreateModalOpen(true);
                    }}
                    className="p-1 text-muted hover:text-text rounded hover:bg-raised transition-colors"
                    title="Register new microservice"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-0.5 max-h-[calc(100vh-360px)] overflow-y-auto">
                  {loading ? (
                    <div className="px-3 py-2 space-y-2">
                      <div className="h-4 bg-raised rounded animate-pulse-subtle" />
                      <div className="h-4 bg-raised rounded animate-pulse-subtle" />
                    </div>
                  ) : filteredServices.length === 0 ? (
                    <div className="px-3 py-2 text-12 text-muted">
                      No services found.
                    </div>
                  ) : (
                    filteredServices.map((svc) => {
                      const isSelected = activeSelectedId === svc.id;
                      const activeCanary = svc.deployments?.[0]?.canaryWeight ?? 0;
                      const hasActiveCanary = activeCanary > 0;

                      return (
                        <button
                          key={svc.id}
                          onClick={() => {
                            if (onCloseMobile) onCloseMobile();
                            setCurrentServiceParam(svc.id);
                            router.push(`/fleet?service=${svc.id}`);
                          }}
                          className={`w-full text-left flex items-center justify-between px-3 py-2 text-14 transition-colors ${
                            isSelected
                              ? "border-l-2 border-primary bg-raised text-text font-medium"
                              : "border-l-2 border-transparent text-muted hover:text-text hover:bg-raised"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                svc.healthStatus === "HEALTHY"
                                  ? "bg-healthy"
                                  : "bg-baseline"
                              }`}
                            />
                            <span className="truncate">{svc.name}</span>
                          </div>

                          {hasActiveCanary && (
                            <span className="text-12 font-mono text-muted tabular-nums shrink-0">
                              {activeCanary}%
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>

                <button
                  onClick={() => {
                    if (onCloseMobile) onCloseMobile();
                    setCreateModalOpen(true);
                  }}
                  className="w-[calc(100%-16px)] mx-2 text-left flex items-center gap-2 px-2.5 py-1.5 mt-2 rounded text-12 text-muted hover:text-text hover:bg-raised transition-colors border border-dashed border-border"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span>Add microservice...</span>
                </button>
              </div>
            </div>

            {/* Bottom Footer */}
            <div className="p-3 border-t border-border bg-surface flex items-center justify-between text-12 text-muted">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-healthy shrink-0" />
                <span>Guardrails armed</span>
              </div>
              <span className="font-mono tabular-nums">{formatVersion("2.1")}</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal for adding service */}
      <CreateServiceModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={fetchServices}
      />
    </>
  );
}
