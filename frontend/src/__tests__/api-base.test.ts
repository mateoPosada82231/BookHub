import { describe, it, expect, vi, beforeEach } from "vitest";
import { BaseApiClient, API_BASE_URL } from "@/lib/api/base";

// Concrete subclass for testing
class TestApiClient extends BaseApiClient {
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  async post<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }
}

describe("BaseApiClient", () => {
  let client: TestApiClient;

  beforeEach(() => {
    client = new TestApiClient(API_BASE_URL);
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("realiza petición GET exitosa", async () => {
    const mockData = { id: 1, name: "Test" };
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockData), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await client.get("/api/test");
    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/test`,
      expect.objectContaining({
        credentials: "include",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("incluye token de autorización cuando existe", async () => {
    localStorage.setItem("accessToken", "test-jwt-token");
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("{}", { status: 200 }),
    );

    await client.get("/api/protected");

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-jwt-token",
        }),
      }),
    );
  });

  it("no incluye Authorization sin token", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("{}", { status: 200 }),
    );

    await client.get("/api/public");

    const callArgs = vi.mocked(fetch).mock.calls[0];
    const headers = (callArgs[1] as RequestInit).headers as Record<
      string,
      string
    >;
    expect(headers.Authorization).toBeUndefined();
  });

  it("lanza ApiError en respuesta no-ok", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Not found" }), { status: 404 }),
    );

    await expect(client.get("/api/missing")).rejects.toMatchObject({
      message: "Not found",
      status: 404,
    });
  });

  it("maneja respuestas vacías (204)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("", { status: 200 }),
    );

    const result = await client.get("/api/empty");
    expect(result).toEqual({});
  });

  it("envía body en POST", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    );

    await client.post("/api/data", { name: "test" });

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "test" }),
      }),
    );
  });
});
