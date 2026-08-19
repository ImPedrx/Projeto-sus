"use client";

import { CART_STORAGE_KEY, parseStoredCart, type CartItem } from "@/lib/cart";

// localStorage is an external store, so React should subscribe to it rather
// than copy it into state inside an effect. useSyncExternalStore needs a stable
// reference between reads, hence the cache keyed on the raw string.
const EMPTY: CartItem[] = [];
let cache: { raw: string | null; items: CartItem[] } = { raw: null, items: EMPTY };
const listeners = new Set<() => void>();

export function getCartSnapshot(): CartItem[] {
  const raw = window.localStorage.getItem(CART_STORAGE_KEY);
  if (raw !== cache.raw) cache = { raw, items: parseStoredCart(raw) };
  return cache.items;
}

// The server has no cart; rendering an empty one keeps the markup it sends
// identical to what the client hydrates.
export function getCartServerSnapshot(): CartItem[] {
  return EMPTY;
}

export function subscribeToCart(listener: () => void): () => void {
  listeners.add(listener);
  // A second tab writing the cart should update this one too.
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function writeCart(items: CartItem[]): void {
  const raw = JSON.stringify(items);
  window.localStorage.setItem(CART_STORAGE_KEY, raw);
  cache = { raw, items };
  for (const listener of listeners) listener();
}
