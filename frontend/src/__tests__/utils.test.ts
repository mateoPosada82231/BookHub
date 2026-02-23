import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn (className utility)", () => {
  it("combina clases simples", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("maneja valores condicionales", () => {
    expect(cn("base", false && "hidden", true && "visible")).toBe(
      "base visible",
    );
  });

  it("resuelve conflictos de Tailwind", () => {
    // twMerge debería resolver conflictos: el último gana
    expect(cn("p-4", "p-2")).toBe("p-2");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("maneja undefined/null", () => {
    expect(cn("base", undefined, null, "extra")).toBe("base extra");
  });

  it("maneja arrays", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  it("retorna string vacío sin argumentos", () => {
    expect(cn()).toBe("");
  });
});
