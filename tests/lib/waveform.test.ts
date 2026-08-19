import { describe, expect, it } from "vitest";
import { waveformFor } from "@/lib/beats/waveform";

describe("waveformFor", () => {
  it("is deterministic for the same seed", () => {
    expect(waveformFor("dark-night", 32)).toEqual(waveformFor("dark-night", 32));
  });

  it("differs between seeds", () => {
    expect(waveformFor("dark-night", 32)).not.toEqual(waveformFor("drill-2am", 32));
  });

  it("returns the requested number of bars", () => {
    expect(waveformFor("dark-night", 48)).toHaveLength(48);
  });

  it("keeps every bar within a visible range", () => {
    for (const bar of waveformFor("qualquer-slug", 64)) {
      expect(bar).toBeGreaterThanOrEqual(0.15);
      expect(bar).toBeLessThanOrEqual(1);
    }
  });
});
