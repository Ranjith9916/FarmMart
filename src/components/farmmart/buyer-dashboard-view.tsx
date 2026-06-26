"use client";

import { useCallback, useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { api, fmtINR, fmtDate } from "@/lib/api";
import type { Order, Product } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShoppingCart,
  IndianRupee,
  Package,
  TrendingUp,
  Store,
  Bot,
  CloudSun,
  ChevronRight,
  Sparkles,
  Leaf,
  MapPin,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-700",
  CONFIRMED: "bg-primary/15 text-primary",
  PACKED: "bg-blue-500/15 text-blue-700",
  SHIPPED: "bg-indigo-500/15 text-indigo-700",
  DELIVERED: "bg-green-600/15 text-green-700",
  CANCELLED: "bg-destructive/15 text-destructive",
};

export function BuyerDashboard() {
  const userId = useStore((s) => s.authUser?.id);
  const authUser = useStore((s) => s.authUser);
  const cart = useStore((s) => s.cart);
  const setView = useStore((s) => s.setView);
  const setActiveProduct = useStore((s) => s.setActiveProduct);
  const addToCart = useStore((s) => s.addToCart);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) {
      setOrders([]);
      setProducts([]);
      setLoading(false);
      return;
    }
    try {
      const [orderData, productData] = await Promise.all([
        api<{ orders: Order[] }>(`/api/orders?userId=${userId}&role=BUYER`),
        api<{ products: Product[] }>("/api/products?sort=newest&limit=8"),
      ]);
      setOrders(orderData.orders);
      setProducts(productData.products);
    } catch {
      setOrders([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const totalSpent = orders
    .filter((o) => o.status !== "CANCELLED")
    .reduce((s, o) => s + o.total, 0);
  const activeOrders = orders.filter(
    (o) => o.status !== "DELIVERED" && o.status !== "CANCELLED"
  ).length;
  const totalOrders = orders.length;
  const cartItems = cart.reduce((s, c) => s + c.quantity, 0);

  const kpis = [
    {
      label: "Total Orders",
      value: String(totalOrders),
      icon: Package,
      color: "text-primary",
      bg: "bg-primary/10",
      onClick: () => setView("orders"),
    },
    {
      label: "Total Spent",
      value: fmtINR(totalSpent),
      icon: IndianRupee,
      color: "text-green-600",
      bg: "bg-green-500/10",
      onClick: () => setView("orders"),
    },
    {
      label: "Active Orders",
      value: String(activeOrders),
      icon: ShoppingCart,
      color: "text-amber-600",
      bg: "bg-amber-500/10",
      onClick: () => setView("orders"),
    },
    {
      label: "Items in Cart",
      value: String(cartItems),
      icon: ShoppingCart,
      color: "text-blue-600",
      bg: "bg-blue-500/10",
      onClick: () => setView("cart"),
    },
  ];

  const quickActions = [
    {
      label: "Browse Marketplace",
      desc: "Discover fresh produce from verified farms",
      icon: Store,
      view: "marketplace" as const,
      color: "bg-primary/10 text-primary",
    },
    {
      label: "My Cart",
      desc: `${cartItems} item${cartItems !== 1 ? "s" : ""} in your cart`,
      icon: ShoppingCart,
      view: "cart" as const,
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      label: "AI Crop Advisor",
      desc: "Get personalized farming & market advice",
      icon: Bot,
      view: "advisor" as const,
      color: "bg-purple-500/10 text-purple-600",
    },
    {
      label: "Weather Forecast",
      desc: "7-day forecast with farming advisory",
      icon: CloudSun,
      view: "weather" as const,
      color: "bg-amber-500/10 text-amber-600",
    },
  ];

  const handleAddToCart = (p: Product) => {
    addToCart({
      productId: p.id,
      name: p.name,
      price: p.price,
      unit: p.unit,
      quantity: 1,
      imageUrl: p.imageUrl,
      farmerId: p.farmerId,
      farmerName: p.farmer.name,
      stock: p.stock,
    });
    toast.success(`${p.name} added to cart`);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const firstName = authUser?.name?.split(" ")[0] || "there";

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
      {/* Welcome header */}
      <div className="mb-6 fm-field-bg rounded-2xl border border-border/60 p-6">
        <h1 className="text-2xl font-bold">
          Welcome back, {firstName}! 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here's an overview of your FarmMart account and activity.
        </p>
      </div>

      {/* KPI grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card
              key={k.label}
              className="p-4 cursor-pointer transition-all hover:border-primary/40 hover:shadow-md"
              onClick={k.onClick}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {k.label}
                </span>
                <div className={`grid size-8 place-items-center rounded-lg ${k.bg}`}>
                  <Icon className={`size-4 ${k.color}`} />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold">{k.value}</div>
            </Card>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="mt-6">
        <h2 className="mb-3 font-semibold">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.label}
                onClick={() => setView(a.view)}
                className="group flex flex-col items-start gap-2 rounded-xl border border-border/60 bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className={`grid size-10 place-items-center rounded-lg ${a.color}`}>
                  <Icon className="size-5" />
                </div>
                <div className="font-semibold text-sm">{a.label}</div>
                <div className="text-xs text-muted-foreground">{a.desc}</div>
                <span className="mt-1 inline-flex items-center gap-0.5 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Open <ChevronRight className="size-3" />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fresh from Farms — products listed by farmers */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Leaf className="size-4 text-primary" /> Fresh from Farms
          </h2>
          {products.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-primary"
              onClick={() => setView("marketplace")}
            >
              View all <ChevronRight className="size-3" />
            </Button>
          )}
        </div>
        {products.length === 0 ? (
          <Card className="grid place-items-center py-12 text-center">
            <div className="grid size-12 place-items-center rounded-full bg-secondary">
              <Store className="size-6 text-muted-foreground" />
            </div>
            <h3 className="mt-3 font-semibold">No products available yet</h3>
            <p className="text-sm text-muted-foreground">
              Farmers haven't listed any products. Check back soon!
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {products.slice(0, 8).map((p) => (
              <Card
                key={p.id}
                className="group flex flex-col overflow-hidden p-0 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
                onClick={() => setActiveProduct(p.id)}
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        "data:image/svg+xml;utf8," +
                        encodeURIComponent(
                          `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='%23e8efe6'/><text x='50%' y='50%' font-size='16' fill='%23708068' text-anchor='middle' dy='.35em'>${p.name}</text></svg>`
                        );
                    }}
                  />
                  <div className="absolute left-2 top-2 flex flex-col gap-1">
                    {p.organic && (
                      <Badge className="bg-primary text-primary-foreground gap-0.5 text-[10px]">
                        <Leaf className="size-2.5" /> Organic
                      </Badge>
                    )}
                    <Badge variant="secondary" className="w-fit text-[10px]">
                      {p.category}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-1.5 p-3">
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="line-clamp-1 text-sm font-semibold leading-tight">
                      {p.name}
                    </h3>
                    <div className="flex items-center gap-0.5 text-xs text-amber-600 shrink-0">
                      <Star className="size-3 fill-amber-500 text-amber-500" />
                      {p.rating.toFixed(1)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <MapPin className="size-2.5" />
                    {p.location}
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-1">
                    <div className="font-bold text-primary">
                      {fmtINR(p.price)}
                      <span className="text-[10px] font-normal text-muted-foreground">
                        /{p.unit}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      className="h-7 gap-1 px-2 text-xs"
                      disabled={p.stock <= 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(p);
                      }}
                    >
                      <ShoppingCart className="size-3" />
                      Add
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recent orders */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Recent Orders</h2>
          {orders.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-primary"
              onClick={() => setView("orders")}
            >
              View all <ChevronRight className="size-3" />
            </Button>
          )}
        </div>
        {orders.length === 0 ? (
          <Card className="grid place-items-center py-12 text-center">
            <div className="grid size-12 place-items-center rounded-full bg-secondary">
              <Package className="size-6 text-muted-foreground" />
            </div>
            <h3 className="mt-3 font-semibold">No orders yet</h3>
            <p className="text-sm text-muted-foreground">
              Browse the marketplace to place your first order.
            </p>
            <Button
              className="mt-3 gap-1.5"
              onClick={() => setView("marketplace")}
            >
              <Store className="size-4" /> Start Shopping
            </Button>
          </Card>
        ) : (
          <div className="space-y-2">
            {orders.slice(0, 5).map((o) => (
              <Card
                key={o.id}
                className="flex items-center gap-3 p-3 cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => setView("orders")}
              >
                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Package className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{o.orderNumber}</span>
                    <Badge className={`text-[10px] ${STATUS_STYLE[o.status] || ""}`}>
                      {o.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {fmtDate(o.createdAt)} · {o.items.length} item{o.items.length !== 1 && "s"}
                  </div>
                </div>
                <div className="font-bold text-primary text-sm">
                  {fmtINR(o.total)}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* AI tip */}
      <Card className="mt-6 p-5 fm-field-bg">
        <div className="flex items-start gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Tip of the Day</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Check the Market Insights page for live pricing trends before
              placing bulk orders — prices fluctuate weekly based on harvest
              cycles. Ask the AI Crop Advisor for personalized buying tips.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 gap-1"
              onClick={() => setView("advisor")}
            >
              <Bot className="size-3.5" /> Ask AI Advisor
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
