"use client";

import { useState } from "react";
import { useStore, cartTotals } from "@/lib/store";
import { api, fmtINR } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  Truck,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  Package,
  CreditCard,
  Wallet,
  Landmark,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import type { Order } from "@/lib/types";

export function CartView() {
  const { cart, updateQuantity, removeFromCart, clearCart, setView, authUser } = useStore();
  const totals = cartTotals(cart);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState<Order | null>(null);
  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState("UPI");
  const [card, setCard] = useState({ number: "", name: "", exp: "", cvv: "" });

  const placeOrder = async () => {
    if (!address.trim()) {
      toast.error("Please enter a shipping address");
      return;
    }
    if (payment === "Card" && (!card.number || !card.cvv)) {
      toast.error("Please enter card details");
      return;
    }
    setPlacing(true);
    try {
      const data = await api<{ order: Order }>("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          userId: authUser?.id,
          items: cart.map((c) => ({
            productId: c.productId,
            name: c.name,
            price: c.price,
            quantity: c.quantity,
            unit: c.unit,
            imageUrl: c.imageUrl,
            farmerId: c.farmerId,
          })),
          shippingAddress: address,
          paymentMethod: payment,
        }),
      });
      setPlaced(data.order);
      clearCart();
      toast.success("Order placed successfully!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setPlacing(false);
    }
  };

  if (cart.length === 0 && !placed) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
        <div className="grid place-items-center rounded-2xl border border-dashed border-border py-20 text-center">
          <div className="grid size-16 place-items-center rounded-full bg-secondary">
            <ShoppingCart className="size-8 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-xl font-semibold">Your cart is empty</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse the marketplace and add fresh produce from verified farms.
          </p>
          <Button className="mt-4" onClick={() => setView("marketplace")}>
            Explore marketplace
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your Cart</h1>
          <p className="text-sm text-muted-foreground">
            {cart.length} item{cart.length !== 1 && "s"} from{" "}
            {new Set(cart.map((c) => c.farmerName)).size} farm
            {new Set(cart.map((c) => c.farmerName)).size !== 1 && "s"}
          </p>
        </div>
        {cart.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearCart}>
            <Trash2 className="size-4 mr-1" /> Clear
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Items */}
        <div className="space-y-3 lg:col-span-2">
          {cart.map((item) => (
            <Card key={item.productId} className="flex gap-3 p-3">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="size-20 shrink-0 rounded-lg object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                }}
              />
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold leading-tight">{item.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      by {item.farmerName}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeFromCart(item.productId)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center rounded-lg border">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity - 1)
                      }
                    >
                      <Minus className="size-3.5" />
                    </Button>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(
                          item.productId,
                          parseInt(e.target.value) || 1
                        )
                      }
                      className="h-8 w-14 border-0 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity + 1)
                      }
                    >
                      <Plus className="size-3.5" />
                    </Button>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-primary">
                      {fmtINR(item.price * item.quantity)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {fmtINR(item.price)}/{item.unit}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setView("marketplace")}
          >
            <Package className="size-4 mr-1" /> Add more items
          </Button>
        </div>

        {/* Summary */}
        <div>
          <Card className="sticky top-32 p-4">
            <h3 className="font-semibold">Order Summary</h3>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{fmtINR(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>
                  {totals.shipping === 0 ? (
                    <Badge className="bg-primary/15 text-primary">FREE</Badge>
                  ) : (
                    fmtINR(totals.shipping)
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax (2% GST)</span>
                <span>{fmtINR(totals.tax)}</span>
              </div>
              {totals.shipping === 0 && totals.subtotal > 0 && (
                <p className="rounded-lg bg-primary/10 p-2 text-xs text-primary">
                  <Truck className="mr-1 inline size-3" />
                  You unlocked free shipping!
                </p>
              )}
              {totals.shipping > 0 && (
                <p className="rounded-lg bg-amber-500/10 p-2 text-xs text-amber-700">
                  Add {fmtINR(2500 - totals.subtotal)} more for free shipping
                </p>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span className="text-primary">{fmtINR(totals.total)}</span>
              </div>
            </div>

            <Button
              className="mt-4 w-full gap-2"
              size="lg"
              onClick={() => setCheckoutOpen(true)}
            >
              <Lock className="size-4" /> Secure Checkout
            </Button>
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 text-primary" />
              256-bit encrypted payment
            </div>
          </Card>
        </div>
      </div>

      {/* Checkout dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-lg" aria-describedby={undefined}>
          {!placed ? (
            <>
              <DialogHeader>
                <DialogTitle>Secure Checkout</DialogTitle>
                <DialogDescription>
                  Review and confirm your order. Payment is processed securely.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Shipping address</label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Full delivery address with PIN"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Payment method</label>
                  <Select value={payment} onValueChange={setPayment}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UPI">
                        <span className="flex items-center gap-2">
                          <Wallet className="size-4" /> UPI / Wallet
                        </span>
                      </SelectItem>
                      <SelectItem value="Card">
                        <span className="flex items-center gap-2">
                          <CreditCard className="size-4" /> Credit / Debit Card
                        </span>
                      </SelectItem>
                      <SelectItem value="COD">
                        <span className="flex items-center gap-2">
                          <Landmark className="size-4" /> Cash on Delivery
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {payment === "Card" && (
                  <div className="space-y-2 rounded-lg border border-border/60 p-3">
                    <Input
                      placeholder="Card number (4242 4242 4242 4242)"
                      value={card.number}
                      onChange={(e) =>
                        setCard({ ...card, number: e.target.value })
                      }
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        placeholder="MM/YY"
                        value={card.exp}
                        onChange={(e) => setCard({ ...card, exp: e.target.value })}
                      />
                      <Input
                        placeholder="CVV"
                        value={card.cvv}
                        onChange={(e) => setCard({ ...card, cvv: e.target.value })}
                      />
                      <Input
                        placeholder="Name"
                        value={card.name}
                        onChange={(e) =>
                          setCard({ ...card, name: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}

                <div className="rounded-lg bg-secondary/60 p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Items</span>
                    <span>{totals.itemCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{fmtINR(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>
                      {totals.shipping === 0 ? "FREE" : fmtINR(totals.shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{fmtINR(totals.tax)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold">
                    <span>Total payable</span>
                    <span className="text-primary">{fmtINR(totals.total)}</span>
                  </div>
                </div>

                <Button
                  className="w-full gap-2"
                  size="lg"
                  onClick={placeOrder}
                  disabled={placing}
                >
                  {placing ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Lock className="size-4" />
                  )}
                  Pay {fmtINR(totals.total)} &amp; Place Order
                </Button>
              </div>
            </>
          ) : (
            <div className="py-6 text-center">
              <DialogHeader className="sr-only">
                <DialogTitle>Order confirmed</DialogTitle>
              </DialogHeader>
              <div className="mx-auto grid size-16 place-items-center rounded-full bg-primary/15">
                <CheckCircle2 className="size-9 text-primary" />
              </div>
              <h2 className="mt-3 text-xl font-bold">Order Confirmed!</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your order <span className="font-semibold">{placed.orderNumber}</span>{" "}
                has been placed successfully.
              </p>
              <div className="mx-auto mt-4 max-w-xs rounded-lg border border-border/60 p-3 text-left text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total paid</span>
                  <span className="font-semibold">{fmtINR(placed.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment</span>
                  <span>{placed.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className="bg-primary/15 text-primary">
                    {placed.status}
                  </Badge>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setPlaced(null);
                    setCheckoutOpen(false);
                    setView("marketplace");
                  }}
                >
                  Continue shopping
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    setPlaced(null);
                    setCheckoutOpen(false);
                    setView("orders");
                  }}
                >
                  Track order
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
