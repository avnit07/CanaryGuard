import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import { AppSidebar } from "@/components/AppSidebar";
import React, { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CanaryGuard — Control Plane",
  description: "Agentic Deployment Verification and Automated Rollback Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('canaryguard_theme');
                  var theme = saved || 'light';
                  document.documentElement.setAttribute('data-theme', theme);
                  document.documentElement.className = theme;
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-page text-text-primary antialiased font-sans transition-colors duration-150 flex`}
      >
        {/* Collapsible Left App Sidebar */}
        <Suspense fallback={<div className="w-64 shrink-0 bg-surface border-r border-border-subtle" />}>
          <AppSidebar />
        </Suspense>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
