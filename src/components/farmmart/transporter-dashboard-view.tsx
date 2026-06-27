"use client";

import { useCallback, useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { api, fmtINR, fmtDate } from "@/lib/api";
import type { Order } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Truck,
  Package,
  IndianRupee,
  MapPin,
  Clock,
  CheckCircle2,
  Navigation,
  Fuel,
  TrendingUp,
  ChevronRight,
  User,
  Phone,
  MapPinHouse,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-700",
  CONFIRMED: "bg-primary/15 text-primary",
  PACKED: "bg-blue-500/15 text-blue-700",
  SHIPPED: "bg-indigo-500/15 text-indigo-700",
  DELIVERED: "bg-green-600/15 text-green-700",
  CANCELLED: "bg-destructive/15 text-destructive",
};

const STATUS_ICON: Record<string, typeof Clock> = {
  PENDING: Clock,
  CONFIRMED: Package,
  PACKED: Package,
  SHIPPED: Truck,
  DELIVERED: CheckCircle2,
  CANCELLED: Truck,
};

export function TransporterDashboard() {
  const userId = useStore((s) => s.authUser?.id);
  const authUser = useStore((s) => s.authUser);
  const setView = useStore((s) => s.setView);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    try {
      // Fetch all orders — transporter sees all orders that need delivery
      const data = await api<{ orders: Order[] }>(
        `/api/orders?userId=${userId}&role=TRANSPORTER`
      );
      setOrders(data.orders);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  // Calculate transport KPIs
  const activeDeliveries = orders.filter(
    (o) => o.status === "SHIPPED" || o.status === "PACKED"
  ).length;
  const completedDeliveries = orders.filter(
    (o) => o.status === "DELIVERED"
  ).length;
  const pendingPickups = orders.filter(
    (o) => o.status === "CONFIRMED"
  ).length;
  // Transporter earns 15% of order value + shipping fee
  const totalEarnings = orders
    .filter((o) => o.status === "DELIVERED" || o.status === "SHIPPED")
    .reduce((s, o) => s + o.shipping + o.total * 0.15, 0);

  const kpis = [
    {
      label: "Active Deliveries",
      value: String(activeDeliveries),
      icon: Truck,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Pending Pickups",
      value: String(pendingPickups),
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-500/10",
    },
    {
      label: "Completed",
      value: String(completedDeliveries),
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-500/10",
    },
    {
      label: "Total Earnings",
      value: fmtINR(Math.round(totalEarnings)),
      icon: IndianRupee,
      color: "text-blue-600",
      bg: "bg-blue-500/10",
    },
  ];

  // Categorize orders
  const toPickup = orders.filter((o) => o.status === "CONFIRMED" || o.status === "PACKED");
  const inTransit = orders.filter((o) => o.status === "SHIPPED");
  const delivered = orders.filter((o) => o.status === "DELIVERED");

  const updateOrderStatus = async (id: string, action: "advance" | "cancel") => {
    try {
      const data = await api<{ order: Order }>(`/api/orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, ...data.order } : o))
      );
      toast.success(`Order status → ${data.order.status}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    }
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
  const initials = (authUser?.name || "U").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
      {/* Welcome header */}
      <div className="mb-6 fm-field-bg rounded-2xl border border-border/60 p-6">
        <div className="flex items-center gap-4">
          {authUser?.avatar ? (
            <img
              src={authUser.avatar}
              alt={authUser.name}
              className="size-14 rounded-full object-cover border-2 border-primary/20 shadow-sm"
            />
          ) : (
            <div className="grid size-14 place-items-center rounded-full bg-primary text-lg font-bold text-primary-foreground shadow-sm">
              {initials}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Truck className="size-7 text-primary" /> Transporter Dashboard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Welcome back, {firstName}! Manage your deliveries, track shipments, and monitor earnings.
            </p>
          </div>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="p-4">
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

      {/* Fleet info card */}
      <Card className="mt-6 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <Navigation className="size-5" />
          </div>
          <div>
            <h2 className="font-semibold">Fleet Overview</h2>
            <p className="text-xs text-muted-foreground">Your transport vehicle status</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border/60 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Truck className="size-3.5" /> Vehicle
            </div>
            <div className="mt-1 font-semibold">MH-12 AB 1234</div>
            <div className="text-xs text-muted-foreground">Tata Ace · 1 ton capacity</div>
          </div>
          <div className="rounded-lg border border-border/60 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Fuel className="size-3.5" /> Fuel Efficiency
            </div>
            <div className="mt-1 font-semibold">15 km/l</div>
            <div className="text-xs text-muted-foreground">Diesel · 40L tank</div>
          </div>
          <div className="rounded-lg border border-border/60 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="size-3.5" /> This Week
            </div>
            <div className="mt-1 font-semibold">{completedDeliveries + activeDeliveries} trips</div>
            <div className="text-xs text-muted-foreground">{fmtINR(Math.round(totalEarnings))} earned</div>
          </div>
        </div>
      </Card>

      {/* Deliveries to Pickup */}
      <div className="mt-6">
        <h2 className="mb-3 font-semibold flex items-center gap-2">
          <Package className="size-4 text-amber-600" />
          Pending Pickups ({toPickup.length})
        </h2>
        {toPickup.length === 0 ? (
          <Card className="grid place-items-center py-10 text-center">
            <Package className="size-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">No pending pickups</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {toPickup.map((o) => {
              const Icon = STATUS_ICON[o.status] || Clock;
              return (
                <DeliveryCard
                  key={o.id}
                  order={o}
                  icon={Icon}
                  showPickupButton
                  onAdvance={() => updateOrderStatus(o.id, "advance")}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* In Transit */}
      <div className="mt-6">
        <h2 className="mb-3 font-semibold flex items-center gap-2">
          <Truck className="size-4 text-indigo-600" />
          In Transit ({inTransit.length})
        </h2>
        {inTransit.length === 0 ? (
          <Card className="grid place-items-center py-10 text-center">
            <Truck className="size-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">No active deliveries</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {inTransit.map((o) => (
              <DeliveryCard
                key={o.id}
                order={o}
                icon={Truck}
                showDeliverButton
                onAdvance={() => updateOrderStatus(o.id, "advance")}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delivered */}
      <div className="mt-6">
        <h2 className="mb-3 font-semibold flex items-center gap-2">
          <CheckCircle2 className="size-4 text-green-600" />
          Completed Deliveries ({delivered.length})
        </h2>
        {delivered.length === 0 ? (
          <Card className="grid place-items-center py-10 text-center">
            <CheckCircle2 className="size-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">No completed deliveries yet</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {delivered.slice(0, 5).map((o) => (
              <DeliveryCard key={o.id} order={o} icon={CheckCircle2} />
            ))}
          </div>
        )}
      </div>

      {/* View all orders button */}
      {orders.length > 0 && (
        <div className="mt-6 text-center">
          <Button variant="outline" onClick={() => setView("orders")} className="gap-1.5">
            View all orders <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function DeliveryCard({
  order,
  icon: Icon,
  showPickupButton,
  showDeliverButton,
  onAdvance,
}: {
  order: Order;
  icon: typeof Truck;
  showPickupButton?: boolean;
  showDeliverButton?: boolean;
  onAdvance?: () => void;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          {/* Order header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{order.orderNumber}</span>
            <Badge className={cn("text-[10px]", STATUS_STYLE[order.status] || "")}>
              {order.status}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {fmtDate(order.createdAt)}
            </span>
          </div>

          {/* Route info */}
          <div className="mt-2 flex items-center gap-2 text-sm">
            <MapPinHouse className="size-3.5 text-primary shrink-0" />
            <span className="text-muted-foreground">Route:</span>
            <span className="font-medium truncate">
              {order.farmer?.name || "Farm"} → {order.shippingAddress.split(",")[0]}
            </span>
          </div>

          {/* Delivery address */}
          <div className="mt-1 flex items-start gap-2 text-xs text-muted-foreground">
            <MapPin className="size-3 shrink-0 mt-0.5" />
            <span className="line-clamp-1">{order.shippingAddress}</span>
          </div>

          {/* Items + customer */}
          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Package className="size-3" />
              {order.items.length} item{order.items.length !== 1 && "s"}
            </span>
            <span className="inline-flex items-center gap-1">
              <User className="size-3" />
              {order.buyer?.name || "Customer"}
            </span>
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <IndianRupee className="size-3" />
              {fmtINR(order.total)}
            </span>
            <span className="inline-flex items-center gap-1 text-green-600">
              <IndianRupee className="size-3" />
              Earn: {fmtINR(Math.round(order.shipping + order.total * 0.15))}
            </span>
          </div>
        </div>

        {/* Action button */}
        <div className="shrink-0">
          {showPickupButton && (
            <Button size="sm" onClick={onAdvance} className="gap-1.5">
              <Truck className="size-3.5" />
              Mark Picked Up
            </Button>
          )}
          {showDeliverButton && (
            <Button size="sm" onClick={onAdvance} className="gap-1.5">
              <CheckCircle2 className="size-3.5" />
              Mark Delivered
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
