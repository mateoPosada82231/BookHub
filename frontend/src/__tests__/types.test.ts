import { describe, it, expect } from "vitest";
import { CATEGORY_LABELS, type BusinessCategory } from "@/types";

describe("CATEGORY_LABELS", () => {
  const allCategories: BusinessCategory[] = [
    "BARBERSHOP",
    "HAIR_SALON",
    "NAIL_SALON",
    "SPA",
    "CAR_WASH",
    "PET_GROOMING",
    "TATTOO_STUDIO",
    "OTHER",
  ];

  it("tiene label para cada categoría", () => {
    for (const cat of allCategories) {
      expect(CATEGORY_LABELS[cat]).toBeDefined();
      expect(typeof CATEGORY_LABELS[cat]).toBe("string");
      expect(CATEGORY_LABELS[cat].length).toBeGreaterThan(0);
    }
  });

  it("tiene exactamente 8 categorías", () => {
    expect(Object.keys(CATEGORY_LABELS)).toHaveLength(8);
  });

  it("labels están en español", () => {
    expect(CATEGORY_LABELS.BARBERSHOP).toBe("Barbería");
    expect(CATEGORY_LABELS.SPA).toBe("Spa");
    expect(CATEGORY_LABELS.OTHER).toBe("Otro");
  });
});
