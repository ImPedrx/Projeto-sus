import { describe, expect, it } from "vitest";
import { bucketFor, storagePathFor } from "@/lib/beats/storage";

describe("bucketFor", () => {
  it("puts covers and previews in the public bucket", () => {
    expect(bucketFor("cover")).toBe("beat-public");
    expect(bucketFor("preview")).toBe("beat-public");
  });

  it("puts masters in the private bucket", () => {
    expect(bucketFor("mp3")).toBe("beat-private");
    expect(bucketFor("wav")).toBe("beat-private");
  });
});

describe("storagePathFor", () => {
  it("namespaces by kind and slug and keeps the extension", () => {
    expect(storagePathFor("preview", "dark-night", "Dark Night (tag).mp3")).toBe(
      "previews/dark-night.mp3",
    );
  });

  it("lowercases the extension", () => {
    expect(storagePathFor("wav", "dark-night", "master.WAV")).toBe(
      "masters/dark-night.wav",
    );
  });

  it("names cover files by slug", () => {
    expect(storagePathFor("cover", "dark-night", "capa.PNG")).toBe(
      "covers/dark-night.png",
    );
  });
});
