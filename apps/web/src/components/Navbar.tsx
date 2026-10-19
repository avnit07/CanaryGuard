"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Activity, AlertCircle, RefreshCw } from "lucide-react";

export function Navbar() {
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const checkApi = async () => {
      try {
        const res = await fetch("http://localhost:4000/health", { cache: "no-store" });
        setApiOnline(res.ok);
      } catch {
        setApiOnline(false);
      }
    };
    checkApi();
    const interval = setInterval(checkApi, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-100 tracking-tight">CanaryGuard</span>
              <span className="ml-1.5 text-xs font-mono uppercase bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-800/50">
                Control Plane
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link
              href="/"
              className="text-slate-200 hover:text-white transition-colors"
            >
              Dashboard
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono">
            {apiOnline === null ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin" />
                <span className="text-slate-400">Connecting...</span>
              </>
            ) : apiOnline ? (
              <>
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">API Online</span>
                <span className="text-slate-500">:4000</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-rose-400 font-semibold">API Offline</span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
