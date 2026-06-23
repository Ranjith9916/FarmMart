"use client";

import { useEffect, useState, useCallback } from "react";
import { useStore } from "@/lib/store";
import { api, fmtINR, fmtDate } from "@/lib/api";
import type { Order, OrderStatus } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  MapPin,
  ChevronRight,
  PackageCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_FLOW: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
];

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
  CONFIRMED: PackageCheck,
  PACKED: Package,
  SHIPPED: Truck,
  DELIVERED: CheckCircle2,
  CANCELLED: XCircle,
};

export function OrdersView() {
  const role = useStore((s) => s.role);
  const userId = useStore((s) => s.authUser?.id);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await api<{ orders: Order[] }>(
        `/api/orders?userId=${userId}&role=${role}`
      );
      setOrders(data.orders);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [role, userId]);

  useEffect(() => {
    load();
  }, [load]);

  const advance = async (id: string) => {
    try {
      const data = await api<{ order: Order }>(`/api/orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "advance" }),
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, ...data.order } : o))
      );
      toast.success(`Order status → ${data.order.status}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    }
  };

  const cancel = async (id: string) => {
    try {
      const data = await api<{ order: Order }>(`/api/orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "cancel" }),
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, ...data.order } : o))
      );
      toast.success("Order cancelled");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to cancel");
    }
  };

  const isFarmer = role === "FARMER" || role === "WHOLESALER";

  if (loading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold">
          {isFarmer ? "Sales & Fulfillment" : "Your Orders"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isFarmer
            ? "Manage incoming orders, update fulfillment status, and track deliveries."
            : "Track your orders from confirmation to delivery."}
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border py-20 text-center">
          <Package className="size-10 text-muted-foreground" />
          <h3 className="mt-3 font-semibold">No orders yet</h3>
          <p className="text-sm text-muted-foreground">
            {isFarmer
              ? "Orders from buyers will appear here."
              : "Place your first order from the marketplace."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const Icon = STATUS_ICON[order.status] || Clock;
            const currentStep = STATUS_FLOW.indexOf(order.status);
            const isOpen = expanded === order.id;
            const canCancel = order.status === "PENDING" || order.status === "CONFIRMED";
            return (
              <Card key={order.id} className="overflow-hidden">
                {/* Header row */}
                <button
                  className="flex w-full items-center gap-3 p-4 text-left"
                  onClick={() => setExpanded(isOpen ? null : order.id)}
                >
                  <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{order.orderNumber}</span>
                      <Badge className={cn("text-[10px]", STATUS_STYLE[order.status])}>
                        {order.status}
                      </Badge>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span>{fmtDate(order.createdAt)}</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3" />
                        {isFarmer
                          ? order.buyer?.name
                          : order.farmer?.name}
                      </span>
                      <span>{order.items.length} item{order.items.length !== 1 && "s"}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary">
                      {fmtINR(order.total)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {order.paymentMethod} · {order.paymentStatus}
                    </div>
                  </div>
                  <ChevronRight
                    className={cn(
                      "size-5 text-muted-foreground transition-transform",
                      isOpen && "rotate-90"
                    )}
                  />
                </button>

                {/* Status tracker */}
                {order.status !== "CANCELLED" && (
                  <div className="border-t border-border/60 px-4 py-3">
                    <div className="flex items-center">
                      {STATUS_FLOW.map((s, i) => {
                        const done = i <= currentStep;
                        const StepIcon = STATUS_ICON[s];
                        return (
                          <div
                            key={s}
                            className="flex flex-1 items-center last:flex-none"
                          >
                            <div className="flex flex-col items-center">
                              <div
                                className={cn(
                                  "grid size-7 place-items-center rounded-full text-[10px] font-bold transition-colors",
                                  done
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary text-muted-foreground"
                                )}
                              >
                                <StepIcon className="size-3.5" />
                              </div>
                              <span
                                className={cn(
                                  "mt-1 text-[9px] font-medium",
                                  done ? "text-primary" : "text-muted-foreground"
                                )}
                              >
                                {s}
                              </span>
                            </div>
                            {i < STATUS_FLOW.length - 1 && (
                              <div
                                className={cn(
                                  "mx-1 h-0.5 flex-1 rounded-full",
                                  i < currentStep ? "bg-primary" : "bg-secondary"
                                )}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Expanded details */}
                {isOpen && (
                  <div className="border-t border-border/60 p-4 space-y-3">
                    {order.trackingNote && (
                      <div className="rounded-lg bg-secondary/50 p-3 text-sm">
                        <span className="font-medium">Tracking: </span>
                        {order.trackingNote}
                      </div>
                    )}
                    <div className="space-y-2">
                      {order.items.map((it) => (
                        <div key={it.id} className="flex items-center gap-3">
                          <img
                            src={it.imageUrl}
                            alt={it.name}
                            className="size-12 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{it.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {it.quantity} {it.unit} × {fmtINR(it.price)}
                            </div>
                          </div>
                          <div className="font-semibold">
                            {fmtINR(it.price * it.quantity)}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap justify-between gap-2 border-t border-border/60 pt-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Ship to: </span>
                        {order.shippingAddress}
                      </div>
                      <div className="space-x-2">
                        {isFarmer && order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
                          <Button size="sm" onClick={() => advance(order.id)}>
                            Advance status
                          </Button>
                        )}
                        {!isFarmer && canCancel && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancel(order.id)}
                          >
                            Cancel order
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
