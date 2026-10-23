import { describe, expect, it } from "vitest";
import { CONTEST_PRESETS } from "./contestPresets";
import { getTemplate } from "./problems";

describe("contest presets", () => {
  for (const [id, { preset }] of Object.entries(CONTEST_PRESETS)) {
    it(`${id} passes the /admin form's checks`, () => {
      expect(preset.title.length).toBeGreaterThanOrEqual(4);
      expect(preset.title.length).toBeLessThanOrEqual(100);
      expect(preset.description.length).toBeLessThanOrEqual(500);
      expect(preset.start).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
      expect(preset.minutes).toBeGreaterThanOrEqual(10);
      expect(preset.problems.length).toBeGreaterThan(0);
      for (const slug of preset.problems) expect(getTemplate(slug), slug).toBeDefined();
    });
  }
});
