// ═══════════════════════════════════════════════════════
// CanaryGuard — Database Seed Script
// Populates the database with realistic sample services & policies
// ═══════════════════════════════════════════════════════

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding CanaryGuard database...\n");

  // Clean existing data
  await prisma.agentEvidence.deleteMany();
  await prisma.agentRun.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.deploymentStep.deleteMany();
  await prisma.deployment.deleteMany();
  await prisma.policy.deleteMany();
  await prisma.service.deleteMany();

  // Create payment-api service
  const paymentApi = await prisma.service.create({
    data: {
      name: "payment-api",
      repository: "github.com/company/payment-api",
      kubernetesNamespace: "production",
      deploymentName: "payment-api",
      currentVersion: "v2.1.4",
      healthStatus: "HEALTHY",
    },
  });
  console.log("  ✓ Service: payment-api (v2.1.4)");

  // Create default safety policy for payment-api
  await prisma.policy.create({
    data: {
      serviceId: paymentApi.id,
      name: "Payment API Safety Policy",
      errorRateThreshold: 5,
      latencyThreshold: 1000,
      observationWindowSeconds: 120,
      autoRollback: false,
      requiresApproval: true,
    },
  });
  console.log("  ✓ Policy: Payment API Safety Policy (Error threshold: 5%, Latency: 1000ms)");

  console.log("\n✅ CanaryGuard Seed Complete!\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
