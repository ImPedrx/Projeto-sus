import { describe, expect, it } from "vitest";
import {
  addToCart,
  removeFromCart,
  cartTotal,
  cartItemKey,
  cartHasUnpricedItem,
  parseStoredCart,
  type CartItem,
} from "@/lib/cart";

const mp3: CartItem = {
  beatId: 1,
  license: "mp3",
  title: "Noite Sem Volta",
  slug: "noite-sem-volta",
  priceCents: 6000,
  coverUrl: null,
};
const wav: CartItem = { ...mp3, license: "wav", priceCents: 12000 };
const other: CartItem = {
  ...mp3,
  beatId: 2,
  title: "Sirene",
  slug: "sirene",
  priceCents: 6000,
};
const exclusive: CartItem = { ...mp3, license: "exclusive", priceCents: null };

describe("addToCart", () => {
  it("adds a licence", () => {
    expect(addToCart([], mp3)).toEqual([mp3]);
  });

  it("never adds the same licence of the same beat twice", () => {
    expect(addToCart([mp3], mp3)).toEqual([mp3]);
  });

  it("allows the same beat under a second licence", () => {
    // MP3 and WAV of one beat are two different things being bought.
    expect(addToCart([mp3], wav)).toEqual([mp3, wav]);
  });

  it("keeps existing items", () => {
    expect(addToCart([mp3], other)).toEqual([mp3, other]);
  });
});

describe("removeFromCart", () => {
  it("drops only the matching licence", () => {
    expect(removeFromCart([mp3, wav], cartItemKey(mp3))).toEqual([wav]);
  });

  it("ignores a key that is not in the cart", () => {
    expect(removeFromCart([mp3], "99:mp3")).toEqual([mp3]);
  });
});

describe("cartTotal", () => {
  it("sums the prices in cents", () => {
    expect(cartTotal([mp3, wav])).toBe(18000);
  });

  it("leaves an unpriced line out rather than counting it as free", () => {
    expect(cartTotal([mp3, exclusive])).toBe(6000);
  });

  it("is zero for an empty cart", () => {
    expect(cartTotal([])).toBe(0);
  });
});

describe("cartHasUnpricedItem", () => {
  it("spots a line the producer still has to quote", () => {
    expect(cartHasUnpricedItem([mp3, exclusive])).toBe(true);
    expect(cartHasUnpricedItem([mp3, wav])).toBe(false);
  });
});

describe("parseStoredCart", () => {
  it("reads a stored cart back", () => {
    expect(parseStoredCart(JSON.stringify([mp3]))).toEqual([mp3]);
  });

  it("keeps an unpriced line, which is not the same as a malformed one", () => {
    expect(parseStoredCart(JSON.stringify([exclusive]))).toEqual([exclusive]);
  });

  it("discards malformed entries rather than crashing the page", () => {
    expect(parseStoredCart('[{"beatId":"nope"}]')).toEqual([]);
    // A cart written before licences existed carried a bare id and one price.
    expect(
      parseStoredCart('[{"id":1,"title":"a","slug":"a","priceCents":100,"coverUrl":null}]'),
    ).toEqual([]);
    expect(parseStoredCart('[{"beatId":1,"license":"gold"}]')).toEqual([]);
    expect(parseStoredCart("not json")).toEqual([]);
    expect(parseStoredCart(null)).toEqual([]);
  });
});
