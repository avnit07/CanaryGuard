// ═══════════════════════════════════════════════════════
// CanaryGuard API — Server Entry Point
// ═══════════════════════════════════════════════════════

import "dotenv/config";
import app from "./app.js";
import { API_CONFIG } from "@canaryguard/config";

const { port, host } = API_CONFIG;

app.listen(port, host, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║                                          ║
  ║   🛡️ CanaryGuard API                     ║
  ║   Running on http://${host}:${port}        ║
  ║                                          ║
  ╚══════════════════════════════════════════╝
  `);
});
