// ═══════════════════════════════════════════════════════
// CanaryGuard — Database Client Export
// Singleton PrismaClient for use across the platform
// ═══════════════════════════════════════════════════════
import { PrismaClient, Prisma } from "@prisma/client";
const globalForPrisma = globalThis;
export const db = globalForPrisma.prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === "development"
            ? ["query", "error", "warn"]
            : ["error"],
    });
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = db;
}
export { PrismaClient, Prisma };
export default db;
//# sourceMappingURL=index.js.map