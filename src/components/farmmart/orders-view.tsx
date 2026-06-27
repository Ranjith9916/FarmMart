"use client";

import { useEffect, useState, useCallback } from "react";
import { useStore } from "@/lib/store";
import { api, fmtINR, fmtDate } from "@/lib/api";
import type { Order, OrderStatus } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  Ban,
  AlertTriangle,
  RefreshCw,
  FileText,
  Printer,
  Calendar,
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
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const { addToCart, setView } = useStore();

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

  const cancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const data = await api<{ order: Order }>(`/api/orders/${cancelTarget.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          action: "cancel",
          reason: cancelReason.trim() || undefined,
        }),
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === cancelTarget.id ? { ...o, ...data.order } : o))
      );
      toast.success("Order cancelled successfully");
      setCancelTarget(null);
      setCancelReason("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to cancel");
    } finally {
      setCancelling(false);
    }
  };

  // Quick reorder — add all items from a past order back to cart
  const handleReorder = (order: Order) => {
    let added = 0;
    for (const item of order.items) {
      addToCart({
        productId: item.productId,
        name: item.name,
        price: item.price,
        unit: item.unit,
        quantity: item.quantity,
        imageUrl: item.imageUrl,
        farmerId: order.farmerId,
        farmerName: order.farmer?.name || "Farmer",
        stock: 9999, // Allow reordering — stock will be validated at checkout
      });
      added++;
    }
    toast.success(`${added} item${added !== 1 ? "s" : ""} added to cart from order ${order.orderNumber}`);
    setView("cart");
  };

  // Calculate estimated delivery date (3 days from order date)
  const getEstimatedDelivery = (order: Order) => {
    const orderDate = new Date(order.createdAt);
    const deliveryDate = new Date(orderDate.getTime() + 3 * 24 * 60 * 60 * 1000);
    return deliveryDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
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
            const canCancel =
              order.status === "PENDING" ||
              order.status === "CONFIRMED" ||
              order.status === "PACKED";
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
                      {/* Estimated delivery date */}
                      {order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                          <Calendar className="size-3" />
                          Est. delivery: {getEstimatedDelivery(order)}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {/* Reorder button (buyers only, for delivered/past orders) */}
                        {!isFarmer && (order.status === "DELIVERED" || order.status === "CANCELLED") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={() => handleReorder(order)}
                          >
                            <RefreshCw className="size-3.5" />
                            Reorder
                          </Button>
                        )}
                        {/* Receipt button */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={() => setReceiptOrder(order)}
                        >
                          <FileText className="size-3.5" />
                          Receipt
                        </Button>
                        {isFarmer && order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
                          <Button size="sm" onClick={() => advance(order.id)}>
                            Advance status
                          </Button>
                        )}
                        {canCancel && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setCancelTarget(order)}
                          >
                            <Ban className="size-3.5" />
                            {isFarmer ? "Reject order" : "Cancel order"}
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

      {/* Order Receipt / Invoice Dialog */}
      <Dialog
        open={!!receiptOrder}
        onOpenChange={(o) => !o && setReceiptOrder(null)}
      >
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          {receiptOrder && (
            <div className="space-y-4">
              <DialogHeader className="sr-only">
                <DialogTitle>Order Receipt</DialogTitle>
              </DialogHeader>

              {/* Receipt header */}
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
                    <Package className="size-4" />
                  </div>
                  <div>
                    <div className="font-bold">FarmMart</div>
                    <div className="text-[10px] text-muted-foreground">AI Agriculture Marketplace</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Receipt</div>
                  <div className="font-mono text-sm font-bold">{receiptOrder.orderNumber}</div>
                </div>
              </div>

              {/* Order info */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-muted-foreground">Order Date</div>
                  <div className="font-medium">{fmtDate(receiptOrder.createdAt)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Status</div>
                  <Badge className={cn("text-[10px]", STATUS_STYLE[receiptOrder.status] || "")}>
                    {receiptOrder.status}
                  </Badge>
                </div>
                <div>
                  <div className="text-muted-foreground">Payment</div>
                  <div className="font-medium">{receiptOrder.paymentMethod}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Payment Status</div>
                  <div className="font-medium">{receiptOrder.paymentStatus}</div>
                </div>
              </div>

              {/* Shipping address */}
              <div className="rounded-lg bg-secondary/50 p-2.5 text-xs">
                <div className="text-muted-foreground mb-0.5">Deliver to</div>
                <div>{receiptOrder.shippingAddress}</div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground">Items</div>
                {receiptOrder.items.map((it) => (
                  <div key={it.id} className="flex items-center gap-2 text-sm">
                    <img src={it.imageUrl} alt={it.name} className="size-10 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium">{it.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {it.quantity} {it.unit} × {fmtINR(it.price)}
                      </div>
                    </div>
                    <div className="font-semibold">{fmtINR(it.price * it.quantity)}</div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-1 border-t border-border/60 pt-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{fmtINR(receiptOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>{receiptOrder.shipping === 0 ? "FREE" : fmtINR(receiptOrder.shipping)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax (2% GST)</span>
                  <span>{fmtINR(receiptOrder.tax)}</span>
                </div>
                <div className="flex justify-between border-t border-border/60 pt-1 text-base font-bold">
                  <span>Total</span>
                  <span className="text-primary">{fmtINR(receiptOrder.total)}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-border/60 pt-3 text-center text-[10px] text-muted-foreground">
                Thank you for shopping with FarmMart! 🌾
                <br />
                This is a computer-generated receipt and does not require a signature.
              </div>

              {/* Print button */}
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => {
                  window.print();
                }}
              >
                <Printer className="size-4" />
                Print Receipt
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel confirmation dialog */}
      <Dialog
        open={!!cancelTarget}
        onOpenChange={(o) => {
          if (!o) {
            setCancelTarget(null);
            setCancelReason("");
          }
        }}
      >
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <div className="grid size-8 place-items-center rounded-lg bg-destructive/10">
                <AlertTriangle className="size-5" />
              </div>
              {isFarmer ? "Reject this order?" : "Cancel this order?"}
            </DialogTitle>
            <DialogDescription>
              {cancelTarget && (
                <>
                  Order{" "}
                  <span className="font-semibold text-foreground">
                    {cancelTarget.orderNumber}
                  </span>{" "}
                  — {fmtINR(cancelTarget.total)} ·{" "}
                  {cancelTarget.items.length} item
                  {cancelTarget.items.length !== 1 ? "s" : ""}
                  {isFarmer && (
                    <>
                      {" "}
                      from{" "}
                      <span className="font-semibold text-foreground">
                        {cancelTarget.buyer?.name || "Buyer"}
                      </span>
                    </>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3 text-sm text-muted-foreground">
            {isFarmer
              ? "Rejecting this order will notify the buyer, process a refund, and restore the product stock to your inventory."
              : "Cancelling this order will process a full refund and restore the product stock. This action cannot be undone."}
          </div>

          <div>
            <label className="text-sm font-medium">
              Reason (optional)
            </label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder={
                isFarmer
                  ? "e.g., Out of stock, quality issue, weather damage…"
                  : "e.g., Changed my mind, found a better price, no longer needed…"
              }
              rows={2}
              className="mt-1"
            />
          </div>

          {/* Item summary */}
          {cancelTarget && (
            <div className="max-h-32 overflow-y-auto fm-scroll space-y-1 rounded-lg border border-border/60 p-2">
              {cancelTarget.items.map((it) => (
                <div key={it.id} className="flex items-center gap-2 text-sm">
                  <img
                    src={it.imageUrl}
                    alt={it.name}
                    className="size-8 rounded object-cover"
                  />
                  <span className="flex-1 truncate">{it.name}</span>
                  <span className="text-muted-foreground">
                    {it.quantity} {it.unit}
                  </span>
                  <span className="font-medium">
                    {fmtINR(it.price * it.quantity)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setCancelTarget(null);
                setCancelReason("");
              }}
              disabled={cancelling}
            >
              Keep order
            </Button>
            <Button
              variant="destructive"
              className="flex-1 gap-1.5"
              onClick={cancel}
              disabled={cancelling}
            >
              {cancelling ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Ban className="size-4" />
              )}
              {isFarmer ? "Reject order" : "Cancel order"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
