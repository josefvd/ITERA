export function requireJwtSecret(environment: { [key: string]: string | undefined; JWT_SECRET?: string } = process.env): string {
  const secret = environment.JWT_SECRET;
  if (!secret || !secret.trim()) {
    throw new Error("JWT_SECRET must be configured before signing or verifying tokens");
  }
  if (new TextEncoder().encode(secret).length < 32) {
    throw new Error("JWT_SECRET must be at least 32 bytes");
  }
  return secret;
}
