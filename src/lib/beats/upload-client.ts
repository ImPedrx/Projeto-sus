"use client";

import { createBrowserClient } from "@/lib/supabase/client";
import type { AssetKind, UploadTarget } from "./storage";

export type TargetRequest = (
  assets: Array<{ kind: AssetKind; filename: string }>,
) => Promise<{ error: string } | { ok: true; targets: UploadTarget[] }>;

// Each asset arrives in the form under one field name and leaves as a storage
// path under another, which is what the Server Action reads.
const FIELDS: Array<{ kind: AssetKind; fileField: string; pathField: string }> = [
  { kind: "preview", fileField: "preview", pathField: "previewPath" },
  { kind: "mp3", fileField: "masterMp3", pathField: "masterMp3Path" },
  { kind: "wav", fileField: "masterWav", pathField: "masterWavPath" },
  { kind: "cover", fileField: "cover", pathField: "coverPath" },
];

// Audio masters run to tens of megabytes, and the host rejects any request body
// over 4.5 MB at the edge — before a Server Action ever runs, so the action
// cannot even report the failure. The files therefore never travel through the
// server: this asks for one short-lived signed upload URL per file and sends the
// bytes straight from the browser to storage, leaving the action a form that
// carries nothing but text.
//
// Returns an error message, or null when every file landed. The file fields are
// stripped from `formData` either way, so a failed upload cannot fall back to
// posting the bytes.
export async function uploadAssets(
  formData: FormData,
  requestTargets: TargetRequest,
): Promise<string | null> {
  const files: Array<{ kind: AssetKind; pathField: string; file: File }> = [];

  for (const { kind, fileField, pathField } of FIELDS) {
    const value = formData.get(fileField);
    formData.delete(fileField);
    // Every file input exists in the form; an untouched one yields an empty
    // File, which is not an upload.
    if (value instanceof File && value.size > 0) {
      files.push({ kind, pathField, file: value });
    }
  }

  if (!files.length) return null;

  const result = await requestTargets(
    files.map(({ kind, file }) => ({ kind, filename: file.name })),
  );
  if ("error" in result) return result.error;

  const byKind = new Map(result.targets.map((target) => [target.kind, target]));
  const supabase = createBrowserClient();

  for (const { kind, pathField, file } of files) {
    const target = byKind.get(kind);
    if (!target) return `Falha ao preparar o envio (${kind}).`;

    const { error } = await supabase.storage
      .from(target.bucket)
      // Overwriting is decided when the URL is signed, not here — `upsert` has
      // no effect on this call.
      .uploadToSignedUrl(target.path, target.token, file, {
        contentType: file.type,
      });

    if (error) return `Falha ao enviar o arquivo (${kind}).`;
    formData.set(pathField, target.path);
  }

  return null;
}
