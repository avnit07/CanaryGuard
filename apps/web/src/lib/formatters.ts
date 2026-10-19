/**
 * Format helper utilities for CanaryGuard UI
 */

/**
 * Safely format a version string, guaranteeing exactly one "v" prefix.
 * e.g. "v2.1.4" -> "v2.1.4", "2.1.4" -> "v2.1.4", "" -> "v0.0.0"
 */
export function formatVersion(version?: string | null): string {
  if (!version) return "v0.0.0";
  const trimmed = version.trim();
  return trimmed.startsWith("v") ? trimmed : `v${trimmed}`;
}

/**
 * Extract 2-letter uppercase monogram initials from service name.
 * e.g. "payment-service" -> "PS", "ai-investigate" -> "AI", "auth" -> "AU"
 */
export function getServiceInitials(name?: string | null): string {
  if (!name) return "SV";
  const parts = name.split(/[-_\s]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

