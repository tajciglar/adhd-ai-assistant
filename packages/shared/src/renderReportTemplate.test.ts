import { describe, it, expect } from "vitest";
import { buildPlaceholderMap, renderReportTemplate } from "./templateRenderer";
import type { ArchetypeReportTemplate } from "./reportTemplates";

// ─── buildPlaceholderMap Tests ─────────────────────────────────────────────

describe("buildPlaceholderMap", () => {
  it("should return correct pronouns for male", () => {
    const map = buildPlaceholderMap("Tom", "Male");

    expect(map).toEqual({
      "[NAME]": "Tom",
      "[HE/SHE/THEY]": "he",
      "[HIS/HER/THEIR]": "his",
      "[HIM/HER/THEM]": "him",
      "[HIMSELF/HERSELF/THEMSELVES]": "himself",
    });
  });

  it("should return correct pronouns for female", () => {
    const map = buildPlaceholderMap("Anna", "Female");

    expect(map["[HE/SHE/THEY]"]).toBe("she");
    expect(map["[HIS/HER/THEIR]"]).toBe("her");
  });

  it("should default to they/them pronouns", () => {
    const map = buildPlaceholderMap("Alex", "Non-binary");

    expect(map["[HE/SHE/THEY]"]).toBe("they");
    expect(map["[HIS/HER/THEIR]"]).toBe("their");
  });
});



