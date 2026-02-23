import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Reproduce the function from AuthContext for testing
function getTokenExpirationMs(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.exp) {
      const expiresAt = payload.exp * 1000;
      return Math.max(expiresAt - Date.now(), 0);
    }
  } catch {
    // Invalid token
  }
  return null;
}

function createMockJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.mock-signature`;
}

describe("getTokenExpirationMs", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calcula tiempo restante para token válido", () => {
    // Token que expira en 1 hora
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const token = createMockJwt({ exp, sub: "user@test.com" });

    const result = getTokenExpirationMs(token);
    expect(result).toBe(3600 * 1000); // 1 hora en ms
  });

  it("retorna 0 para token expirado", () => {
    // Token que expiró hace 1 hora
    const exp = Math.floor(Date.now() / 1000) - 3600;
    const token = createMockJwt({ exp, sub: "user@test.com" });

    const result = getTokenExpirationMs(token);
    expect(result).toBe(0);
  });

  it("retorna null para token sin exp", () => {
    const token = createMockJwt({ sub: "user@test.com" });
    const result = getTokenExpirationMs(token);
    expect(result).toBeNull();
  });

  it("retorna null para token inválido", () => {
    expect(getTokenExpirationMs("not-a-jwt")).toBeNull();
    expect(getTokenExpirationMs("")).toBeNull();
    expect(getTokenExpirationMs("a.b.c")).toBeNull(); // b is not valid base64 JSON
  });
});
