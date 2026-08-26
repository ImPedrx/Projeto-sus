import { beforeEach, describe, expect, it, vi } from "vitest";

const uploadToSignedUrl = vi.fn();
const from = vi.fn(() => ({ uploadToSignedUrl }));

vi.mock("@/lib/supabase/client", () => ({
  createBrowserClient: () => ({ storage: { from } }),
}));

import { uploadAssets } from "@/lib/beats/upload-client";
import type { UploadTarget } from "@/lib/beats/storage";

function file(name: string, bytes = 4) {
  return new File([new Uint8Array(bytes)], name, { type: "audio/mpeg" });
}

function formWith(entries: Record<string, File>) {
  const formData = new FormData();
  // The real form always carries every file input, empty or not.
  for (const field of ["preview", "masterMp3", "masterWav", "cover"]) {
    formData.set(field, entries[field] ?? new File([], ""));
  }
  formData.set("title", "Dark Night");
  return formData;
}

const targets: UploadTarget[] = [
  { kind: "preview", bucket: "beat-public", path: "previews/dark-night.mp3", token: "t1" },
  { kind: "mp3", bucket: "beat-private", path: "masters/dark-night.mp3", token: "t2" },
];

beforeEach(() => {
  uploadToSignedUrl.mockReset();
  uploadToSignedUrl.mockResolvedValue({ error: null });
  from.mockClear();
});

describe("uploadAssets", () => {
  it("strips the files from the form so the request body stays small", async () => {
    const formData = formWith({ preview: file("tag.mp3"), masterMp3: file("master.mp3") });

    await uploadAssets(formData, async () => ({ ok: true as const, targets }));

    for (const field of ["preview", "masterMp3", "masterWav", "cover"]) {
      expect(formData.get(field)).toBeNull();
    }
  });

  it("writes each stored path back into the form", async () => {
    const formData = formWith({ preview: file("tag.mp3"), masterMp3: file("master.mp3") });

    const error = await uploadAssets(formData, async () => ({
      ok: true as const,
      targets,
    }));

    expect(error).toBeNull();
    expect(formData.get("previewPath")).toBe("previews/dark-night.mp3");
    expect(formData.get("masterMp3Path")).toBe("masters/dark-night.mp3");
    expect(from).toHaveBeenCalledWith("beat-public");
    expect(from).toHaveBeenCalledWith("beat-private");
  });

  it("only asks for targets for the files that were actually picked", async () => {
    const formData = formWith({ preview: file("tag.mp3") });
    const requestTargets = vi.fn(async () => ({ ok: true as const, targets }));

    await uploadAssets(formData, requestTargets);

    expect(requestTargets).toHaveBeenCalledWith([
      { kind: "preview", filename: "tag.mp3" },
    ]);
  });

  it("does nothing when no file was picked", async () => {
    const formData = formWith({});
    const requestTargets = vi.fn(async () => ({ ok: true as const, targets }));

    expect(await uploadAssets(formData, requestTargets)).toBeNull();
    expect(requestTargets).not.toHaveBeenCalled();
    expect(uploadToSignedUrl).not.toHaveBeenCalled();
  });

  it("reports the failing asset when the upload is refused", async () => {
    uploadToSignedUrl.mockResolvedValueOnce({ error: { message: "denied" } });
    const formData = formWith({ preview: file("tag.mp3") });

    const error = await uploadAssets(formData, async () => ({
      ok: true as const,
      targets,
    }));

    expect(error).toBe("Falha ao enviar o arquivo (preview).");
    expect(formData.get("previewPath")).toBeNull();
  });

  it("passes the signing failure straight through", async () => {
    const formData = formWith({ preview: file("tag.mp3") });

    const error = await uploadAssets(formData, async () => ({ error: "Sem permissão." }));

    expect(error).toBe("Sem permissão.");
    expect(uploadToSignedUrl).not.toHaveBeenCalled();
  });
});
