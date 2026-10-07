import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { requireJwtSecret } from "../src/lib/jwt-secret.ts";

const authSource = await readFile(new URL("../src/lib/auth.ts", import.meta.url), "utf8");

test("JWT signing and verification have no static fallback secret", () => {
  assert.doesNotMatch(authSource, /process\.env\.JWT_SECRET\s*\|\|\s*["'][^"']+["']/);
  assert.equal((authSource.match(/requireJwtSecret\(\)/g) ?? []).length, 2);
});

test("missing JWT_SECRET is rejected in production and development", () => {
  for (const environment of [{ NODE_ENV: "production" }, { NODE_ENV: "development" }]) {
    assert.throws(() => requireJwtSecret(environment), /JWT_SECRET/);
  }
});

test("JWT secret resolver rejects short values and uses configured secrets", () => {
  assert.throws(() => requireJwtSecret({ JWT_SECRET: "too-short" }), /32 bytes/);
  const secret = "x".repeat(32);
  assert.equal(requireJwtSecret({ JWT_SECRET: secret }), secret);
});
