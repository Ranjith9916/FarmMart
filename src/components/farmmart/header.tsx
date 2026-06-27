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
  ChevronDown,
  PlusCircle,
  LogOut,
  UserCircle2,
  Search,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { AddProductDialog } from "./add-product-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

const NAV: { key: ViewKey; label: string; icon: typeof Sprout; roles: Role[] }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["BUYER", "FARMER", "WHOLESALER", "TRANSPORTER"] },
  { key: "marketplace", label: "Marketplace", icon: Store, roles: ["BUYER", "FARMER", "WHOLESALER", "TRANSPORTER"] },
  { key: "cart", label: "Cart", icon: ShoppingCart, roles: ["BUYER", "WHOLESALER"] },
  { key: "orders", label: "Orders", icon: Package, roles: ["BUYER", "FARMER", "WHOLESALER", "TRANSPORTER"] },
  { key: "advisor", label: "AI Crop Advisor", icon: Bot, roles: ["BUYER", "FARMER", "WHOLESALER", "TRANSPORTER"] },
  { key: "weather", label: "Weather", icon: CloudSun, roles: ["BUYER", "FARMER", "WHOLESALER", "TRANSPORTER"] },
  { key: "insights", label: "Market Insights", icon: TrendingUp, roles: ["BUYER", "FARMER", "WHOLESALER", "TRANSPORTER"] },
];

export function Header() {
  const { view, setView, role, cart, authUser, logout } = useStore();
  const itemCount = cart.reduce((s, c) => s + c.quantity, 0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // Click a notification → navigate to the relevant page + close the popover
  const handleNotifClick = (target: ViewKey, message: string) => {
    setNotifOpen(false);
    setView(target);
    toast.info(message);
  };

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
          {/* Global search bar (desktop) */}
          <button
            onClick={() => setView("marketplace")}
            className="hidden md:flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground w-48 lg:w-56"
          >
            <Search className="size-4" />
            <span className="truncate">Search products, crops…</span>
          </button>

          {/* Notifications bell */}
          <Popover open={notifOpen} onOpenChange={setNotifOpen}>
            <PopoverTrigger asChild>
              <button className="relative grid size-8 place-items-center rounded-lg hover:bg-accent transition-colors" aria-label="Notifications">
                <Bell className="size-4" />
                <span className="absolute right-1 top-1 size-2 rounded-full bg-destructive" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="border-b border-border/60 p-3">
                <h3 className="text-sm font-semibold">Notifications</h3>
              </div>
              <div className="max-h-80 overflow-y-auto fm-scroll">
                {role === "FARMER" || role === "WHOLESALER" ? (
                  <>
                    <NotifItem
                      title="New order received"
                      desc="You have a new order waiting to be confirmed"
                      time="2 min ago"
                      color="bg-primary"
                      onClick={() => handleNotifClick("orders", "Opening your sales orders…")}
                    />
                    <NotifItem
                      title="Low stock alert"
                      desc="Fresh Organic Tomatoes is running low (5 kg left)"
                      time="1 hour ago"
                      color="bg-amber-500"
                      onClick={() => handleNotifClick("dashboard", "Opening inventory management…")}
                    />
                    <NotifItem
                      title="Price update"
                      desc="Market price for Grains has increased by 8%"
                      time="3 hours ago"
                      color="bg-green-500"
                      onClick={() => handleNotifClick("insights", "Opening market insights…")}
                    />
                  </>
                ) : role === "TRANSPORTER" ? (
                  <>
                    <NotifItem
                      title="New delivery assigned"
                      desc="Order FM-30579006 is ready for pickup"
                      time="5 min ago"
                      color="bg-primary"
                      onClick={() => handleNotifClick("orders", "Opening delivery orders…")}
                    />
                    <NotifItem
                      title="Route optimized"
                      desc="Your delivery route has been updated"
                      time="30 min ago"
                      color="bg-blue-500"
                      onClick={() => handleNotifClick("dashboard", "Opening transporter dashboard…")}
                    />
                  </>
                ) : (
                  <>
                    <NotifItem
                      title="Order confirmed"
                      desc="Your order has been confirmed by the farmer"
                      time="10 min ago"
                      color="bg-primary"
                      onClick={() => handleNotifClick("orders", "Opening your orders…")}
                    />
                    <NotifItem
                      title="Price drop alert"
                      desc="Fresh Green Spinach price dropped by 12%"
                      time="2 hours ago"
                      color="bg-green-500"
                      onClick={() => handleNotifClick("marketplace", "Opening marketplace to shop…")}
                    />
                    <NotifItem
                      title="Weather advisory"
                      desc="Heavy rain expected tomorrow — plan your purchases"
                      time="5 hours ago"
                      color="bg-amber-500"
                      onClick={() => handleNotifClick("weather", "Opening weather forecast…")}
                    />
                  </>
                )}
              </div>
              <div className="border-t border-border/60 p-2 text-center">
                <button
                  onClick={() => {
                    setNotifOpen(false);
                    toast.success("All notifications marked as read");
                  }}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Mark all as read
                </button>
              </div>
            </PopoverContent>
          </Popover>

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

function NotifItem({
  title,
  desc,
  time,
  color,
  onClick,
}: {
  title: string;
  desc: string;
  time: string;
  color: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full gap-3 border-b border-border/40 p-3 text-left hover:bg-accent/30 transition-colors cursor-pointer"
    >
      <div className={`mt-0.5 size-2 shrink-0 rounded-full ${color}`} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground line-clamp-2">{desc}</div>
        <div className="mt-0.5 text-[10px] text-muted-foreground/70">{time}</div>
      </div>
    </button>
  );
}
