import { randomBytes } from "crypto";

/**
 * Generates a short, unique alphanumeric prefix for a tenant.
 * Format: "t" + 8 random hex chars  e.g. "t4a3f9c12b"
 */
export function generateDbPrefix(): string {
  return "t" + randomBytes(4).toString("hex");
}
