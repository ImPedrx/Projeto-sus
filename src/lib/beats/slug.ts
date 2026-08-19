export function slugify(input: string): string {
  return input
    .normalize("NFD")
    // Strip the combining diacritical marks that NFD split off.
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
