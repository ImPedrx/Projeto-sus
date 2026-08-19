"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { addToCart, removeFromCart, type CartItem } from "@/lib/cart";
import {
  getCartSnapshot,
  getCartServerSnapshot,
  subscribeToCart,
  writeCart,
} from "@/lib/cart-store";

type CartState = {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (id: number) => void;
  has: (id: number) => boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
};

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(
    subscribeToCart,
    getCartSnapshot,
    getCartServerSnapshot,
  );
  const [open, setOpen] = useState(false);

  const add = useCallback(
    (item: CartItem) => {
      writeCart(addToCart(getCartSnapshot(), item));
      setOpen(true);
    },
    [],
  );

  const remove = useCallback((id: number) => {
    writeCart(removeFromCart(getCartSnapshot(), id));
  }, []);

  const has = useCallback(
    (id: number) => items.some((item) => item.id === id),
    [items],
  );

  const value = useMemo(
    () => ({ items, add, remove, has, open, setOpen }),
    [items, add, remove, has, open],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart precisa estar dentro de CartProvider");
  return context;
}
