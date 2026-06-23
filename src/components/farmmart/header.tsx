"use client";

import { useStore } from "@/lib/store";
import type { ViewKey, Role } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sprout,
  ShoppingCart,
  Store,
  Package,
  LayoutDashboard,
  Bot,
  CloudSun,
  TrendingUp,
  Menu,
  Leaf,
  ChevronDown,
  PlusCircle,
  LogOut,
  UserCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { AddProductDialog } from "./add-product-dialog";

const NAV: { key: ViewKey; label: string; icon: typeof Sprout; roles: Role[] }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["BUYER", "FARMER", "WHOLESALER", "TRANSPORTER"] },
  { key: "marketplace", label: "Marketplace", icon: Store, roles: ["FARMER", "WHOLESALER", "TRANSPORTER"] },
  { key: "cart", label: "Cart", icon: ShoppingCart, roles: ["WHOLESALER"] },
  { key: "orders", label: "Orders", icon: Package, roles: ["FARMER", "WHOLESALER", "TRANSPORTER"] },
  { key: "advisor", label: "AI Crop Advisor", icon: Bot, roles: ["FARMER", "WHOLESALER", "TRANSPORTER"] },
  { key: "weather", label: "Weather", icon: CloudSun, roles: ["FARMER", "WHOLESALER", "TRANSPORTER"] },
  { key: "insights", label: "Market Insights", icon: TrendingUp, roles: ["FARMER", "WHOLESALER", "TRANSPORTER"] },
];

export function Header() {
  const { view, setView, role, setRole, cart, authUser, logout } = useStore();
  const itemCount = cart.reduce((s, c) => s + c.quantity, 0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);

  const visibleNav = NAV.filter((n) => n.roles.includes(role));
  const canSell = role === "FARMER" || role === "WHOLESALER";
  const initials = (authUser?.name || "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-6">
        {/* Logo */}
        <button
          onClick={() => setView("marketplace")}
          className="flex items-center gap-2 shrink-0 mr-2"
        >
          <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Sprout className="size-5" />
          </div>
          <div className="hidden sm:flex flex-col leading-none text-left">
            <span className="text-lg font-bold tracking-tight">FarmMart</span>
            <span className="text-[10px] text-muted-foreground font-medium">
              AI Agriculture Marketplace
            </span>
          </div>
        </button>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1 ml-2">
          {visibleNav.map((n) => {
            const Icon = n.icon;
            const active = view === n.key;
            return (
              <button
                key={n.key}
                onClick={() => setView(n.key)}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="size-4" />
                {n.label}
                {n.key === "cart" && itemCount > 0 && (
                  <span className="ml-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {itemCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* Sell / List product — prominent CTA for farmers & wholesalers */}
          {canSell && (
            <Button
              size="sm"
              className="gap-1.5 shadow-sm"
              onClick={() => setSellOpen(true)}
            >
              <PlusCircle className="size-4" />
              <span className="hidden sm:inline">Sell Product</span>
              <span className="sm:hidden">Sell</span>
            </Button>
          )}

          {/* Account / role menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 pr-1.5">
                <div className="grid size-6 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                  {initials}
                </div>
                <span className="hidden sm:inline max-w-[120px] truncate">
                  {authUser?.name?.split(" ")[0] || ROLE_LABELS[role]}
                </span>
                <ChevronDown className="size-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              {/* Account header */}
              <DropdownMenuLabel className="flex items-center gap-2 py-2">
                <div className="grid size-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">
                    {authUser?.name || "Guest"}
                  </div>
                  <div className="truncate text-[11px] font-normal text-muted-foreground">
                    {authUser?.email}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {/* Role switcher — hidden for buyers (they stay in buyer view) */}
              {role !== "BUYER" && (
                <>
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Switch perspective
                  </DropdownMenuLabel>
                  {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                    <DropdownMenuItem
                      key={r}
                      onClick={() => setRole(r)}
                      className={cn(
                        "flex items-center justify-between",
                        role === r && "bg-accent"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Leaf className="size-3.5 text-primary" />
                        {ROLE_LABELS[r]}
                      </span>
                      {role === r && (
                        <Badge variant="secondary" className="text-[10px]">
                          Active
                        </Badge>
                      )}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                onClick={logout}
                className="flex items-center gap-2 text-destructive focus:text-destructive"
              >
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile menu */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <Menu className="size-5" />
          </Button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-border/60 bg-background">
          <nav className="mx-auto grid max-w-7xl grid-cols-2 gap-1 p-3">
            {visibleNav.map((n) => {
              const Icon = n.icon;
              const active = view === n.key;
              return (
                <button
                  key={n.key}
                  onClick={() => {
                    setView(n.key);
                    setMobileOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent"
                  )}
                >
                  <Icon className="size-4" />
                  {n.label}
                  {n.key === "cart" && itemCount > 0 && (
                    <Badge className="ml-auto">{itemCount}</Badge>
                  )}
                </button>
              );
            })}
            {canSell && (
              <button
                onClick={() => {
                  setSellOpen(true);
                  setMobileOpen(false);
                }}
                className="col-span-2 flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                <PlusCircle className="size-4" />
                Sell / List a Product
              </button>
            )}
            <button
              onClick={() => {
                setMobileOpen(false);
                logout();
              }}
              className="col-span-2 flex items-center justify-center gap-2 rounded-lg border border-border/60 px-3 py-2.5 text-sm font-medium text-destructive"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </nav>
        </div>
      )}

      {/* Global add-product dialog for farmers/wholesalers */}
      {canSell && (
        <AddProductDialog
          open={sellOpen}
          onOpenChange={setSellOpen}
          onSaved={() => {
            setView("dashboard");
          }}
        />
      )}
    </header>
  );
}
