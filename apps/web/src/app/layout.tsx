import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import React from "react";

const geistSans = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CanaryGuard — Autonomous Deployment Safety Platform",
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
                  var theme = saved || 'dark';
                  document.documentElement.setAttribute('data-theme', theme);
                  document.documentElement.className = theme;
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-[#0B0D15] text-text-primary antialiased font-sans transition-colors duration-150`}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
