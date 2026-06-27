"use client";

import { useStore } from "@/lib/store";
import type { ViewKey } from "@/lib/types";
import {
  LayoutDashboard,
  Store,
  ShoppingCart,
  Package,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS: { key: ViewKey; label: string; icon: typeof Store; showBadge?: boolean }[] = [
  { key: "dashboard", label: "Home", icon: LayoutDashboard },
  { key: "marketplace", label: "Shop", icon: Store },
  { key: "cart", label: "Cart", icon: ShoppingCart, showBadge: true },
  { key: "orders", label: "Orders", icon: Package },
  { key: "advisor", label: "AI", icon: Bot },
];

export function MobileNav() {
  const { view, setView, role, cart } = useStore();
  const itemCount = cart.reduce((s, c) => s + c.quantity, 0);

  // Only show cart & marketplace for buyers/wholesalers
  const items = NAV_ITEMS.filter((item) => {
    if (item.key === "cart") return role === "BUYER" || role === "WHOLESALER";
    if (item.key === "marketplace") return role === "BUYER" || role === "WHOLESALER";
    return true;
  });

  return (
    <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-border/60 bg-background/95 backdrop-blur-lg lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = view === item.key;
        return (
          <button
            key={item.key}
            onClick={() => setView(item.key)}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-0.5 py-2.5 transition-colors",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <div className="relative">
              <Icon className={cn("size-5 transition-transform", active && "scale-110")} />
              {item.showBadge && itemCount > 0 && (
                <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                  {itemCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{item.label}</span>
            {active && (
              <span className="absolute -top-px h-0.5 w-8 rounded-full bg-primary" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
