export type AssetKind = "cover" | "preview" | "mp3" | "wav";

const FOLDERS: Record<AssetKind, string> = {
  cover: "covers",
  preview: "previews",
  mp3: "masters",
  wav: "masters",
};

export function bucketFor(kind: AssetKind): "beat-public" | "beat-private" {
  return kind === "cover" || kind === "preview" ? "beat-public" : "beat-private";
}

export function storagePathFor(
  kind: AssetKind,
  slug: string,
  filename: string,
): string {
  // The MP3 and WAV masters share the masters/ folder but differ by extension,
  // so they never collide.
  const extension = filename.slice(filename.lastIndexOf(".") + 1).toLowerCase();
  return `${FOLDERS[kind]}/${slug}.${extension}`;
}

const PUBLIC_BUCKET = "beat-public";

export function publicAssetUrl(
  projectUrl: string,
  path: string | null | undefined,
): string | null {
  if (!path) return null;
  return `${projectUrl.replace(/\/+$/, "")}/storage/v1/object/public/${PUBLIC_BUCKET}/${path}`;
}
