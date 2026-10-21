"use client";

import React, { Suspense, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/AppSidebar";
import { Navbar } from "@/components/Navbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomepage = pathname === "/";
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Auto-close mobile navigation drawer on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  // The landing homepage is a full-width, immersive experience without internal app sidebar
  if (isHomepage) {
    return <div className="w-full min-h-screen bg-[#0B0D15]">{children}</div>;
  }

  // Internal dashboard routes (/fleet, /deployments, /design-preview) render the operator shell
  return (
    <div className="flex min-h-screen w-full bg-page">
      <Suspense fallback={<div className="w-64 shrink-0 bg-surface border-r border-border-subtle" />}>
        <AppSidebar
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
        />
      </Suspense>

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="flex-1 w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
