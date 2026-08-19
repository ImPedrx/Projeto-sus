export type CartItem = {
  id: number;
  title: string;
  slug: string;
  priceCents: number;
  coverUrl: string | null;
};

export const CART_STORAGE_KEY = "susprod.cart";

export function addToCart(items: CartItem[], item: CartItem): CartItem[] {
  // A beat is a single digital licence, so the cart is a set, not a tally.
  return items.some((existing) => existing.id === item.id)
    ? items
    : [...items, item];
}

export function removeFromCart(items: CartItem[], id: number): CartItem[] {
  return items.filter((item) => item.id !== id);
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.priceCents, 0);
}

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "number" &&
    typeof item.title === "string" &&
    typeof item.slug === "string" &&
    typeof item.priceCents === "number" &&
    (item.coverUrl === null || typeof item.coverUrl === "string")
  );
}

// The cart lives in localStorage, which anyone can edit and which survives
// deploys that change its shape. Anything that no longer fits is dropped rather
// than allowed to break the page it renders into.
export function parseStoredCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isCartItem) : [];
  } catch {
    return [];
  }
}
