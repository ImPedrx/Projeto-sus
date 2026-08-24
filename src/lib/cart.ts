import { isLineLicense, type LineLicense } from "@/lib/beats/licenses";

export type CartItem = {
  beatId: number;
  license: LineLicense;
  title: string;
  slug: string;
  // Null on an exclusive licence the producer quotes by hand. It is not a
  // zero: it stays out of the total and renders as a quote request.
  priceCents: number | null;
  coverUrl: string | null;
};

export const CART_STORAGE_KEY = "susprod.cart";

// A licence is what is actually bought, so the same beat can sit in the cart
// twice under two licences — but never twice under the same one.
export function cartItemKey(item: Pick<CartItem, "beatId" | "license">): string {
  return `${item.beatId}:${item.license}`;
}

export function addToCart(items: CartItem[], item: CartItem): CartItem[] {
  const key = cartItemKey(item);
  return items.some((existing) => cartItemKey(existing) === key)
    ? items
    : [...items, item];
}

export function removeFromCart(items: CartItem[], key: string): CartItem[] {
  return items.filter((item) => cartItemKey(item) !== key);
}

// Unpriced lines are quoted after the order arrives, so they add nothing here.
export function cartTotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + (item.priceCents ?? 0), 0);
}

export function cartHasUnpricedItem(items: CartItem[]): boolean {
  return items.some((item) => item.priceCents === null);
}

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.beatId === "number" &&
    isLineLicense(item.license) &&
    typeof item.title === "string" &&
    typeof item.slug === "string" &&
    (item.priceCents === null || typeof item.priceCents === "number") &&
    (item.coverUrl === null || typeof item.coverUrl === "string")
  );
}

// The cart lives in localStorage, which anyone can edit and which survives
// deploys that change its shape. Anything that no longer fits is dropped rather
// than allowed to break the page it renders into — including carts written
// before licences existed, whose items carried a bare `id` and one price.
export function parseStoredCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isCartItem) : [];
  } catch {
    return [];
  }
}
