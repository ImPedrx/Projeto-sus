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
