import { describe, expect, it } from "vitest";
import { publicAssetUrl } from "@/lib/beats/storage";

const base = "https://proj.supabase.co";

describe("publicAssetUrl", () => {
  it("builds a URL into the public bucket", () => {
    expect(publicAssetUrl(base, "covers/dark-night.png")).toBe(
      "https://proj.supabase.co/storage/v1/object/public/beat-public/covers/dark-night.png",
    );
  });

  it("tolerates a trailing slash on the project URL", () => {
    expect(publicAssetUrl(base + "/", "previews/x.mp3")).toBe(
      "https://proj.supabase.co/storage/v1/object/public/beat-public/previews/x.mp3",
    );
  });

  it("returns null when there is no path", () => {
    expect(publicAssetUrl(base, null)).toBeNull();
  });
});
