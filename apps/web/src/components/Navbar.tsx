"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, RefreshCw, Sun, Moon, ChevronRight, Menu } from "lucide-react";

export interface NavbarProps {
  onOpenMobileNav?: () => void;
}

export function Navbar({ onOpenMobileNav }: NavbarProps = {}) {
  const pathname = usePathname();
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("light");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("canaryguard_theme") as "dark" | "light" | null;
      const initial = saved || (document.documentElement.classList.contains("dark") ? "dark" : "light");
      setTheme(initial);
    } catch {
      // fallback
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    try {
      localStorage.setItem("canaryguard_theme", nextTheme);
    } catch {
      // ignore
    }
    document.documentElement.setAttribute("data-theme", nextTheme);
    document.documentElement.className = nextTheme;
  };

  const checkApi = useCallback(async () => {
    try {
      const startTime = performance.now();
      const res = await fetch("http://localhost:4000/health", { cache: "no-store" });
      const duration = Math.round(performance.now() - startTime);

      if (res.ok) {
        setApiOnline(true);
        setLatencyMs(duration);
      } else {
        setApiOnline(false);
        setLatencyMs(null);
      }
    } catch {
      setApiOnline(false);
      setLatencyMs(null);
    }
  }, []);

  useEffect(() => {
    checkApi();
    const interval = setInterval(checkApi, 10000);
    return () => clearInterval(interval);
  }, [checkApi]);

  // Dynamic breadcrumb label
  const isDeploymentPage = pathname.startsWith("/deployments");
  const deploymentId = isDeploymentPage ? pathname.split("/deployments/")[1] : null;
  const breadcrumbSection = pathname.startsWith("/fleet")
    ? "Fleet Control Plane"
    : pathname.startsWith("/design-preview")
    ? "Design System"
    : "Overview & Simulator";

  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-surface select-none">
      <div className="w-full px-3 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-2">
        {/* Left: Breadcrumbs in Geist + Mobile Drawer Trigger */}
        <div className="flex items-center gap-1.5 text-14 min-w-0">
          {onOpenMobileNav && (
            <button
              onClick={onOpenMobileNav}
              className="sm:hidden p-1.5 -ml-1 text-muted hover:text-text hover:bg-raised rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0"
              aria-label="Open navigation menu"
              title="Open navigation menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          <Link
            href="/"
            className="text-muted hover:text-text transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Shield className="w-4 h-4 text-primary" />
            <span className="font-semibold text-text hidden sm:inline">CanaryGuard</span>
          </Link>

          <ChevronRight className="w-3.5 h-3.5 text-muted hidden sm:inline shrink-0" />

          {isDeploymentPage ? (
            <>
              <Link
                href="/fleet"
                className="text-muted hover:text-text transition-colors truncate hidden sm:inline"
              >
                Fleet
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-muted hidden sm:inline shrink-0" />
              <span className="text-text font-medium truncate font-mono text-13">
                {deploymentId || "Deployment Deck"}
              </span>
            </>
          ) : (
            <span className="text-text font-medium truncate">{breadcrumbSection}</span>
          )}
        </div>

        {/* Right: API Health Ping & Theme Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded bg-raised border border-border text-12">
            {apiOnline === null ? (
              <>
                <RefreshCw className="w-3 h-3 text-muted animate-spin" />
                <span className="text-muted">Connecting...</span>
              </>
            ) : apiOnline ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-healthy shrink-0" />
                <span className="text-healthy font-medium hidden sm:inline">API online</span>
                <span className="text-muted hidden sm:inline">•</span>
                <span className="text-muted font-mono tabular-nums">
                  {latencyMs !== null ? `${latencyMs}ms` : ":4000"}
                </span>
              </>
            ) : !isLocalhost ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <span className="text-primary font-medium">Demo Cluster</span>
                <span className="text-muted hidden sm:inline">•</span>
                <span className="text-muted hidden sm:inline">Vercel Preview</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-failed shrink-0" />
                <span className="text-failed font-medium">Offline</span>
              </>
            )}
          </div>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="px-2.5 py-1 rounded bg-raised border border-border hover:bg-surface text-muted hover:text-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary flex items-center gap-1.5 text-12 select-none"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            aria-label="Toggle visual theme"
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-3.5 h-3.5 text-canary" />
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
