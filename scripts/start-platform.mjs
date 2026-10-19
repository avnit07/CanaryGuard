#!/usr/bin/env node

// ═══════════════════════════════════════════════════════
// CanaryGuard — Unified Platform Orchestrator
// Starts all 6 services with clean log routing & shutdown
// ═══════════════════════════════════════════════════════

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const children = [];

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

const services = [
  {
    name: "BASELINE",
    color: colors.cyan,
    command: "node",
    args: ["apps/demo-app/dist/server.js"],
    cwd: rootDir,
    env: {
      PORT: "8080",
      APP_VERSION: "v2.1.4",
      FAILURE_RATE: "0",
      LATENCY_MS: "25",
    },
    url: "http://localhost:8080",
    desc: "Baseline payment microservice (v2.1.4)",
  },
  {
    name: "CANARY  ",
    color: colors.yellow,
    command: "node",
    args: ["apps/demo-app/dist/server.js"],
    cwd: rootDir,
    env: {
      PORT: "8081",
      APP_VERSION: "v2.1.5",
      FAILURE_RATE: "0",
      LATENCY_MS: "25",
    },
    url: "http://localhost:8081",
    desc: "Canary candidate microservice (v2.1.5)",
  },
  {
    name: "PROXY   ",
    color: colors.blue,
    command: "node",
    args: ["apps/proxy/dist/server.js"],
    cwd: rootDir,
    env: {
      PORT: "8000",
      BASELINE_TARGET: "http://localhost:8080",
      CANARY_TARGET: "http://localhost:8081",
      CANARY_WEIGHT: "0",
    },
    url: "http://localhost:8000",
    desc: "Dynamic reverse proxy & traffic splitter",
  },
  {
    name: "API     ",
    color: colors.green,
    command: "node",
    args: ["apps/api/dist/server.js"],
    cwd: rootDir,
    env: {
      API_PORT: "4000",
    },
    url: "http://localhost:4000",
    desc: "REST API control plane & Bull-Board UI",
  },
  {
    name: "WORKER  ",
    color: colors.magenta,
    command: "node",
    args: ["workers/workflow-worker/dist/index.js"],
    cwd: rootDir,
    env: {
      API_URL: "http://localhost:4000/api",
      PROXY_URL: "http://localhost:8000",
      BASELINE_URL: "http://localhost:8080",
    },
    url: "Redis:6379",
    desc: "BullMQ asynchronous workflow worker",
  },
  {
    name: "WEB     ",
    color: colors.bright + colors.green,
    command: "npx",
    args: ["next", "start", "-p", "3001"],
    cwd: path.join(rootDir, "apps/web"),
    env: {
      PORT: "3001",
      NEXT_PUBLIC_API_URL: "http://localhost:4000",
    },
    url: "http://localhost:3001",
    desc: "Next.js 15 App Router Control Plane UI",
  },
];

console.log(`
${colors.bright}╔═════════════════════════════════════════════════════════════════════════════╗
║                      🛡️  CANARYGUARD PLATFORM SUPERVISOR                    ║
╚═════════════════════════════════════════════════════════════════════════════╝${colors.reset}
`);

for (const svc of services) {
  const child = spawn(svc.command, svc.args, {
    cwd: svc.cwd,
    env: { ...process.env, ...svc.env },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout?.on("data", (data) => {
    const lines = data.toString().trim().split("\n");
    for (const line of lines) {
      if (line.trim()) {
        console.log(`${svc.color}[${svc.name}]${colors.reset} ${line}`);
      }
    }
  });

  child.stderr?.on("data", (data) => {
    const lines = data.toString().trim().split("\n");
    for (const line of lines) {
      if (line.trim() && !line.includes("ExperimentalWarning")) {
        console.error(`${svc.color}[${svc.name}:ERR]${colors.reset} ${line}`);
      }
    }
  });

  child.on("exit", (code, signal) => {
    if (signal !== "SIGTERM" && signal !== "SIGKILL" && code !== 0) {
      console.log(`${colors.red}[${svc.name}] Process exited with code ${code}${colors.reset}`);
    }
  });

  children.push(child);
  console.log(`  ${svc.color}▶${colors.reset} ${svc.name}  → ${colors.bright}${svc.url}${colors.reset} (${svc.desc})`);
}

console.log(`
${colors.green}${colors.bright}✔ All 6 platform services are running!${colors.reset}
${colors.cyan}🌐 Open Web Dashboard:  ${colors.bright}http://localhost:3001${colors.reset}
${colors.cyan}📊 Open Bull-Board UI:  ${colors.bright}http://localhost:4000/admin/queues${colors.reset}
${colors.cyan}🔀 Reverse Proxy:       ${colors.bright}http://localhost:8000${colors.reset}

${colors.dim}Press Ctrl+C to safely shut down all services.${colors.reset}
`);

function shutdown() {
  console.log(`\n${colors.yellow}Shutting down all platform services...${colors.reset}`);
  for (const child of children) {
    try {
      child.kill("SIGTERM");
    } catch {
      // ignore
    }
  }
  setTimeout(() => {
    for (const child of children) {
      try {
        child.kill("SIGKILL");
      } catch {
        // ignore
      }
    }
    console.log(`${colors.green}All services stopped cleanly.${colors.reset}`);
    process.exit(0);
  }, 1000);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
