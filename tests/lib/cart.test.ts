import { describe, expect, it } from "vitest";
import { addToCart, removeFromCart, cartTotal, parseStoredCart } from "@/lib/cart";

const beat = {
  id: 1,
  title: "Noite Sem Volta",
  slug: "noite-sem-volta",
  priceCents: 19900,
  coverUrl: null,
};
const other = { ...beat, id: 2, title: "Sirene", slug: "sirene", priceCents: 14900 };

describe("addToCart", () => {
  it("adds a beat", () => {
    expect(addToCart([], beat)).toEqual([beat]);
  });

  it("never adds the same beat twice", () => {
    // A beat is a single digital licence: two copies of one would be a bug,
    // not a bigger order.
    expect(addToCart([beat], beat)).toEqual([beat]);
  });

  it("keeps existing items", () => {
    expect(addToCart([beat], other)).toEqual([beat, other]);
  });
});

describe("removeFromCart", () => {
  it("drops the matching beat", () => {
    expect(removeFromCart([beat, other], 1)).toEqual([other]);
  });

  it("ignores an id that is not in the cart", () => {
    expect(removeFromCart([beat], 99)).toEqual([beat]);
  });
});

describe("cartTotal", () => {
  it("sums the prices in cents", () => {
    expect(cartTotal([beat, other])).toBe(34800);
  });

  it("is zero for an empty cart", () => {
    expect(cartTotal([])).toBe(0);
  });
});

describe("parseStoredCart", () => {
  it("reads a stored cart back", () => {
    expect(parseStoredCart(JSON.stringify([beat]))).toEqual([beat]);
  });

  it("discards malformed entries rather than crashing the page", () => {
    expect(parseStoredCart('[{"id":"nope"}]')).toEqual([]);
    expect(parseStoredCart("not json")).toEqual([]);
    expect(parseStoredCart(null)).toEqual([]);
  });
});
