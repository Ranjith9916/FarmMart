import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Role, ViewKey } from "./types";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  location?: string | null;
}

interface FarmMartState {
  // Auth
  authed: boolean;
  authUser: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;

  // UI
  view: ViewKey;
  setView: (v: ViewKey) => void;

  // Role
  role: Role;
  setRole: (r: Role) => void;

  // Cart sheet open state
  cartOpen: boolean;
  setCartOpen: (b: boolean) => void;

  // Cart items
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;

  // active product for detail modal
  activeProductId: string | null;
  setActiveProduct: (id: string | null) => void;

  // search/filter state
  query: string;
  setQuery: (q: string) => void;
}

export const useStore = create<FarmMartState>()(
  persist(
    (set) => ({
      authed: false,
      authUser: null,
      login: (user) =>
        set({ authed: true, authUser: user, role: user.role, view: "marketplace" }),
      logout: () =>
        set({
          authed: false,
          authUser: null,
          view: "marketplace",
          cart: [],
          activeProductId: null,
        }),

      view: "marketplace",
      setView: (v) => set({ view: v }),

      role: "BUYER",
      setRole: (r) =>
        set((state) => ({
          role: r,
          // keep authUser role in sync when an authed user switches perspective
          authUser: state.authUser ? { ...state.authUser, role: r } : null,
        })),

      cartOpen: false,
      setCartOpen: (b) => set({ cartOpen: b }),

      cart: [],
      addToCart: (item) =>
        set((state) => {
          const existing = state.cart.find((c) => c.productId === item.productId);
          if (existing) {
            const nextQty = Math.min(existing.quantity + item.quantity, item.stock);
            return {
              cart: state.cart.map((c) =>
                c.productId === item.productId ? { ...c, quantity: nextQty } : c
              ),
            };
          }
          return { cart: [...state.cart, item] };
        }),
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          cart: state.cart.map((c) =>
            c.productId === productId
              ? { ...c, quantity: Math.max(1, Math.min(quantity, c.stock)) }
              : c
          ),
        })),
      removeFromCart: (productId) =>
        set((state) => ({
          cart: state.cart.filter((c) => c.productId !== productId),
        })),
      clearCart: () => set({ cart: [] }),

      activeProductId: null,
      setActiveProduct: (id) => set({ activeProductId: id }),

      query: "",
      setQuery: (q) => set({ query: q }),
    }),
    {
      name: "farmmart-store",
      partialize: (state) => ({
        authed: state.authed,
        authUser: state.authUser,
        role: state.role,
        cart: state.cart,
      }),
    }
  )
);

// Cart totals helper
export function cartTotals(cart: CartItem[]) {
  const itemCount = cart.reduce((s, c) => s + c.quantity, 0);
  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const shipping = subtotal > 0 ? (subtotal > 2500 ? 0 : 120) : 0;
  const tax = Math.round(subtotal * 0.02 * 100) / 100;
  const total = subtotal + shipping + tax;
  return { itemCount, subtotal, shipping, tax, total };
}
