// ═══════════════════════════════════════════════════════
// CanaryGuard Demo App — Server Entry Point
// ═══════════════════════════════════════════════════════

import "dotenv/config";
import app, { APP_VERSION } from "./app.js";

const port = parseInt(process.env.PORT || "8080", 10);
const host = process.env.HOST || "0.0.0.0";

app.listen(port, host, () => {
  console.log(`
  ╔══════════════════════════════════════════════════╗
  ║                                                  ║
  ║   💳 Payment Microservice (${APP_VERSION})              ║
  ║   Running on http://${host}:${port}                ║
  ║                                                  ║
  ║   - Health:    GET  /health                      ║
  ║   - Checkout:  POST /api/payments                ║
  ║   - Metrics:   GET  /admin/metrics               ║
  ║   - Chaos:     POST /admin/simulate-failure      ║
  ║                                                  ║
  ╚══════════════════════════════════════════════════╝
  `);
});
