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
  Smartphone,
  Building2,
  Clock,
  ArrowLeft,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import type { Order } from "@/lib/types";
import { cn } from "@/lib/utils";

// Payment method definitions
const PAYMENT_METHODS = [
  { id: "UPI", label: "UPI", desc: "Pay using any UPI app", icon: Smartphone },
  { id: "Card", label: "Card", desc: "Credit / Debit Card", icon: CreditCard },
  { id: "NetBanking", label: "Net Banking", desc: "All major banks", icon: Building2 },
  { id: "Wallet", label: "Wallet", desc: "Paytm, Mobikwik, Amazon Pay", icon: Wallet },
  { id: "EMI", label: "EMI", desc: "Pay in installments", icon: Clock },
  { id: "COD", label: "Cash on Delivery", desc: "Pay when you receive", icon: Landmark },
];

// UPI app options
const UPI_APPS = [
  { id: "PhonePe", name: "PhonePe", color: "bg-purple-600", initials: "Pe" },
  { id: "GooglePay", name: "Google Pay", color: "bg-blue-600", initials: "G" },
  { id: "Paytm", name: "Paytm", color: "bg-blue-500", initials: "Py" },
  { id: "AmazonPay", name: "Amazon Pay", color: "bg-orange-500", initials: "a" },
  { id: "BHIM", name: "BHIM UPI", color: "bg-green-600", initials: "B" },
  { id: "OtherUPI", name: "Other UPI App", color: "bg-gray-600", initials: "↑" },
];

// Net banking banks
const BANKS = [
  "State Bank of India",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "Punjab National Bank",
  "Bank of Baroda",
  "Canara Bank",
  "Union Bank of India",
  "IDFC First Bank",
];

// Wallet options
const WALLETS = [
  { id: "Paytm", name: "Paytm Wallet", color: "bg-blue-500", initials: "Py" },
  { id: "Mobikwik", name: "Mobikwik", color: "bg-blue-600", initials: "M" },
  { id: "AmazonPay", name: "Amazon Pay", color: "bg-orange-500", initials: "a" },
  { id: "Freecharge", name: "Freecharge", color: "bg-green-500", initials: "F" },
];

// EMI options
const EMI_PLANS = [
  { id: "3m", label: "3 Months", rate: 0, desc: "0% interest" },
  { id: "6m", label: "6 Months", rate: 0, desc: "0% interest" },
  { id: "9m", label: "9 Months", rate: 12, desc: "12% interest" },
  { id: "12m", label: "12 Months", rate: 14, desc: "14% interest" },
];

type CheckoutStep = "details" | "upi_apps" | "upi_pay" | "processing" | "done";

export function CartView() {
  const { cart, updateQuantity, removeFromCart, clearCart, setView, authUser } = useStore();
  const totals = cartTotals(cart);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [step, setStep] = useState<CheckoutStep>("details");
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState<Order | null>(null);
  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState("UPI");
  const [card, setCard] = useState({ number: "", name: "", exp: "", cvv: "" });
  const [selectedBank, setSelectedBank] = useState("");
  const [selectedWallet, setSelectedWallet] = useState("");
  const [selectedEmi, setSelectedEmi] = useState("");
  const [selectedUpiApp, setSelectedUpiApp] = useState("");
  const [upiId, setUpiId] = useState("");
  const [upiPin, setUpiPin] = useState("");

  const resetCheckout = () => {
    setStep("details");
    setPlaced(null);
    setPlacing(false);
    setSelectedUpiApp("");
    setUpiId("");
    setUpiPin("");
  };

  const placeOrder = async (paymentMethodLabel?: string) => {
    if (!address.trim()) {
      toast.error("Please enter a shipping address");
      return;
    }

    setPlacing(true);
    setStep("processing");
    try {
      const finalPaymentMethod = paymentMethodLabel || payment;
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
          paymentMethod: finalPaymentMethod,
        }),
      });
      // Simulate payment processing delay
      await new Promise((r) => setTimeout(r, 1500));
      setPlaced(data.order);
      setStep("done");
      clearCart();
      toast.success("Payment successful! Order placed.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Checkout failed");
      setStep("details");
    } finally {
      setPlacing(false);
    }
  };

  const handleUPIAppSelect = (appId: string) => {
    setSelectedUpiApp(appId);
    setUpiPin("");
    // Show the UPI app's payment screen — order is placed only after PIN confirmation
    setStep("upi_pay");
  };

  const handleUPIAppPay = () => {
    if (upiPin.length < 4) {
      toast.error("Enter a 4-digit UPI PIN");
      return;
    }
    const appName = UPI_APPS.find((a) => a.id === selectedUpiApp)?.name || selectedUpiApp;
    placeOrder(`UPI - ${appName}`);
  };

  const handleUPIIdPay = () => {
    if (!upiId.trim() || !upiId.includes("@")) {
      toast.error("Enter a valid UPI ID (e.g., name@bank)");
      return;
    }
    if (upiPin.length < 4) {
      toast.error("Enter a 4-digit UPI PIN");
      return;
    }
    placeOrder(`UPI - ${upiId.trim()}`);
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

  // EMI calculation
  const emiPlan = EMI_PLANS.find((e) => e.id === selectedEmi);
  const emiMonthly = emiPlan
    ? Math.round(
        ((totals.total * (1 + emiPlan.rate / 100)) / parseInt(emiPlan.id)) * 100
      ) / 100
    : 0;

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
              onClick={() => {
                resetCheckout();
                setCheckoutOpen(true);
              }}
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
      <Dialog
        open={checkoutOpen}
        onOpenChange={(o) => {
          setCheckoutOpen(o);
          if (!o) resetCheckout();
        }}
      >
        <DialogContent className="max-w-lg" aria-describedby={undefined}>
          {/* Step: Processing */}
          {step === "processing" ? (
            <div className="py-12 text-center">
              <DialogHeader className="sr-only">
                <DialogTitle>Processing payment</DialogTitle>
              </DialogHeader>
              <div className="mx-auto grid size-16 place-items-center rounded-full bg-primary/10">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
              <h2 className="mt-4 text-lg font-bold">Processing Payment…</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Please wait while we process your payment securely.
              </p>
              <div className="mx-auto mt-4 max-w-xs space-y-1 text-left text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Amount</span>
                  <span className="font-medium text-foreground">
                    {fmtINR(totals.total)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Method</span>
                  <span className="font-medium text-foreground">
                    {payment === "UPI"
                      ? `UPI - ${UPI_APPS.find((a) => a.id === selectedUpiApp)?.name || "UPI"}`
                      : payment}
                  </span>
                </div>
              </div>
            </div>
          ) : step === "done" && placed ? (
            /* Step: Done */
            <div className="py-6 text-center">
              <DialogHeader className="sr-only">
                <DialogTitle>Order confirmed</DialogTitle>
              </DialogHeader>
              <div className="mx-auto grid size-16 place-items-center rounded-full bg-primary/15">
                <CheckCircle2 className="size-9 text-primary" />
              </div>
              <h2 className="mt-3 text-xl font-bold">Payment Successful!</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your order{" "}
                <span className="font-semibold">{placed.orderNumber}</span> has
                been placed successfully.
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
                    setCheckoutOpen(false);
                    resetCheckout();
                    setView("marketplace");
                  }}
                >
                  Continue shopping
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    setCheckoutOpen(false);
                    resetCheckout();
                    setView("orders");
                  }}
                >
                  Track order
                </Button>
              </div>
            </div>
          ) : step === "upi_apps" ? (
            /* Step: UPI App Selection */
            <>
              <DialogHeader>
                <button
                  onClick={() => setStep("details")}
                  className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="size-4" /> Back
                </button>
                <DialogTitle className="flex items-center gap-2">
                  <Smartphone className="size-5 text-primary" /> Pay with UPI
                </DialogTitle>
                <DialogDescription>
                  Choose your preferred UPI app to pay{" "}
                  <span className="font-semibold text-foreground">
                    {fmtINR(totals.total)}
                  </span>
                </DialogDescription>
              </DialogHeader>

              {/* UPI app grid */}
              <div className="grid grid-cols-3 gap-3">
                {UPI_APPS.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => handleUPIAppSelect(app.id)}
                    disabled={placing}
                    className="flex flex-col items-center gap-2 rounded-xl border border-border/60 p-3 transition-all hover:border-primary/40 hover:bg-accent/40 disabled:opacity-50"
                  >
                    <div
                      className={cn(
                        "grid size-11 place-items-center rounded-full text-sm font-bold text-white",
                        app.color
                      )}
                    >
                      {app.initials}
                    </div>
                    <span className="text-xs font-medium text-center">
                      {app.name}
                    </span>
                  </button>
                ))}
              </div>

              <Separator className="my-2" />

              {/* UPI ID entry */}
              <div>
                <label className="text-sm font-medium">
                  Or pay with UPI ID
                </label>
                <div className="mt-1 flex gap-2">
                  <Input
                    placeholder="yourname@bank"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                  />
                  <Button
                    onClick={() => {
                      if (!upiId.trim() || !upiId.includes("@")) {
                        toast.error("Enter a valid UPI ID (e.g., name@bank)");
                        return;
                      }
                      setSelectedUpiApp("UPI_ID");
                      setUpiPin("");
                      setStep("upi_pay");
                    }}
                    disabled={!upiId.trim() || !upiId.includes("@")}
                  >
                    Continue
                  </Button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Enter your UPI ID to receive a payment request
                </p>
              </div>
            </>
          ) : step === "upi_pay" ? (
            /* Step: UPI App Payment Screen (simulated) */
            <>
              <DialogHeader>
                <button
                  onClick={() => {
                    setStep("upi_apps");
                    setUpiPin("");
                  }}
                  className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="size-4" /> Back
                </button>
              </DialogHeader>

              {/* Simulated UPI App Payment Screen */}
              {(() => {
                const app =
                  UPI_APPS.find((a) => a.id === selectedUpiApp) ||
                  UPI_APPS.find((a) => a.id === "OtherUPI")!;
                const isUpiId = selectedUpiApp === "UPI_ID";
                const displayName = isUpiId
                  ? upiId.trim()
                  : app.name;

                return (
                  <div className="space-y-4">
                    {/* App header banner */}
                    <div
                      className={cn(
                        "flex items-center gap-3 rounded-xl p-4 text-white",
                        isUpiId ? "bg-gray-700" : app.color
                      )}
                    >
                      <div className="grid size-12 place-items-center rounded-full bg-white/20 text-lg font-bold backdrop-blur">
                        {isUpiId ? "↑" : app.initials}
                      </div>
                      <div>
                        <div className="text-lg font-bold">
                          {isUpiId ? "UPI Payment" : app.name}
                        </div>
                        <div className="text-xs text-white/80">
                          Secure payment via UPI
                        </div>
                      </div>
                    </div>

                    {/* Payment details */}
                    <div className="rounded-xl border border-border/60 p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Merchant</span>
                        <span className="font-medium">FarmMart</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Paying to</span>
                        <span className="font-medium">farmmart@hdfcbank</span>
                      </div>
                      {isUpiId && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">From</span>
                          <span className="font-medium">{upiId.trim()}</span>
                        </div>
                      )}
                      <Separator className="my-1" />
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Amount
                        </span>
                        <span className="text-2xl font-bold text-primary">
                          {fmtINR(totals.total)}
                        </span>
                      </div>
                    </div>

                    {/* PIN entry */}
                    <div className="rounded-xl border border-border/60 p-4">
                      <label className="text-sm font-medium flex items-center gap-1.5">
                        <Lock className="size-3.5" />
                        Enter UPI PIN
                      </label>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Enter your 4-digit UPI PIN to confirm payment
                      </p>
                      <div className="mt-3 flex justify-center gap-3">
                        {[0, 1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className={cn(
                              "grid size-12 place-items-center rounded-lg border-2 text-xl font-bold transition-all",
                              upiPin.length > i
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-secondary"
                            )}
                          >
                            {upiPin.length > i ? "•" : ""}
                          </div>
                        ))}
                      </div>
                      <Input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        value={upiPin}
                        onChange={(e) =>
                          setUpiPin(
                            e.target.value.replace(/[^0-9]/g, "").slice(0, 4)
                          )
                        }
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          upiPin.length === 4 &&
                          (isUpiId ? handleUPIIdPay() : handleUPIAppPay())
                        }
                        className="mt-3 text-center text-lg tracking-[0.5em]"
                        placeholder="••••"
                        autoFocus
                      />
                    </div>

                    {/* Security note */}
                    <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                      <ShieldCheck className="size-3.5 text-primary" />
                      Your PIN is encrypted and never stored
                    </div>

                    {/* Pay button */}
                    <Button
                      className="w-full gap-2"
                      size="lg"
                      onClick={() =>
                        isUpiId ? handleUPIIdPay() : handleUPIAppPay()
                      }
                      disabled={placing || upiPin.length < 4}
                    >
                      {placing ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Lock className="size-4" />
                      )}
                      Pay {fmtINR(totals.total)}
                    </Button>

                    <p className="text-center text-[11px] text-muted-foreground">
                      By proceeding, you authorize FarmMart to debit{" "}
                      {fmtINR(totals.total)} from your account via {displayName}.
                    </p>
                  </div>
                );
              })()}
            </>
          ) : (
            /* Step: Checkout details */
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

                {/* Payment method selection */}
                <div>
                  <label className="text-sm font-medium">Payment method</label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {PAYMENT_METHODS.map((m) => {
                      const Icon = m.icon;
                      const active = payment === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => setPayment(m.id)}
                          className={cn(
                            "flex items-start gap-2 rounded-lg border p-3 text-left transition-all",
                            active
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border/60 hover:border-primary/40"
                          )}
                        >
                          <Icon
                            className={cn(
                              "size-5 shrink-0 mt-0.5",
                              active ? "text-primary" : "text-muted-foreground"
                            )}
                          />
                          <div className="min-w-0">
                            <div className="text-sm font-semibold">{m.label}</div>
                            <div className="text-[11px] text-muted-foreground truncate">
                              {m.desc}
                            </div>
                          </div>
                          {active && (
                            <Check className="size-4 text-primary shrink-0 ml-auto" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Conditional payment details */}
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

                {payment === "NetBanking" && (
                  <div className="space-y-2 rounded-lg border border-border/60 p-3">
                    <label className="text-sm font-medium">Select your bank</label>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Choose a bank…</option>
                      {BANKS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">
                      You'll be redirected to your bank's secure login page.
                    </p>
                  </div>
                )}

                {payment === "Wallet" && (
                  <div className="space-y-2 rounded-lg border border-border/60 p-3">
                    <label className="text-sm font-medium">Select wallet</label>
                    <div className="grid grid-cols-2 gap-2">
                      {WALLETS.map((w) => (
                        <button
                          key={w.id}
                          onClick={() => setSelectedWallet(w.id)}
                          className={cn(
                            "flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all",
                            selectedWallet === w.id
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border/60 hover:border-primary/40"
                          )}
                        >
                          <div
                            className={cn(
                              "grid size-7 place-items-center rounded-full text-[10px] font-bold text-white",
                              w.color
                            )}
                          >
                            {w.initials}
                          </div>
                          <span className="text-xs font-medium">{w.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {payment === "EMI" && (
                  <div className="space-y-2 rounded-lg border border-border/60 p-3">
                    <label className="text-sm font-medium">
                      Choose EMI plan
                    </label>
                    <div className="space-y-1.5">
                      {EMI_PLANS.map((e) => {
                        const monthly =
                          Math.round(
                            ((totals.total * (1 + e.rate / 100)) /
                              parseInt(e.id)) *
                              100
                          ) / 100;
                        return (
                          <button
                            key={e.id}
                            onClick={() => setSelectedEmi(e.id)}
                            className={cn(
                              "flex w-full items-center justify-between rounded-lg border p-2.5 text-left transition-all",
                              selectedEmi === e.id
                                ? "border-primary bg-primary/5 ring-1 ring-primary"
                                : "border-border/60 hover:border-primary/40"
                            )}
                          >
                            <div>
                              <span className="text-sm font-medium">
                                {e.label}
                              </span>
                              <span className="ml-2 text-xs text-muted-foreground">
                                {e.desc}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold">
                                {fmtINR(monthly)}/mo
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {emiPlan && (
                      <p className="text-xs text-muted-foreground">
                        Total: {fmtINR(totals.total * (1 + emiPlan.rate / 100))} ·{" "}
                        {parseInt(emiPlan.id)} × {fmtINR(emiMonthly)}/mo
                      </p>
                    )}
                  </div>
                )}

                {payment === "COD" && (
                  <div className="rounded-lg border border-border/60 p-3 text-sm text-muted-foreground">
                    <Landmark className="mr-1 inline size-4 text-primary" />
                    Pay <span className="font-semibold text-foreground">{fmtINR(totals.total)}</span> in
                    cash when your order is delivered. A handling fee of ₹20
                    applies for COD orders.
                  </div>
                )}

                {/* Order summary */}
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

                {/* Pay button */}
                {payment === "UPI" ? (
                  <Button
                    className="w-full gap-2"
                    size="lg"
                    onClick={() => setStep("upi_apps")}
                  >
                    <Smartphone className="size-4" />
                    Pay {fmtINR(totals.total)} with UPI
                  </Button>
                ) : payment === "Card" ? (
                  <Button
                    className="w-full gap-2"
                    size="lg"
                    onClick={() => placeOrder()}
                    disabled={placing || !card.number || !card.cvv}
                  >
                    {placing ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Lock className="size-4" />
                    )}
                    Pay {fmtINR(totals.total)}
                  </Button>
                ) : payment === "NetBanking" ? (
                  <Button
                    className="w-full gap-2"
                    size="lg"
                    onClick={() => placeOrder(`Net Banking - ${selectedBank}`)}
                    disabled={placing || !selectedBank}
                  >
                    {placing ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Building2 className="size-4" />
                    )}
                    Pay {fmtINR(totals.total)}
                  </Button>
                ) : payment === "Wallet" ? (
                  <Button
                    className="w-full gap-2"
                    size="lg"
                    onClick={() =>
                      placeOrder(
                        `Wallet - ${WALLETS.find((w) => w.id === selectedWallet)?.name || ""}`
                      )
                    }
                    disabled={placing || !selectedWallet}
                  >
                    {placing ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Wallet className="size-4" />
                    )}
                    Pay {fmtINR(totals.total)}
                  </Button>
                ) : payment === "EMI" ? (
                  <Button
                    className="w-full gap-2"
                    size="lg"
                    onClick={() =>
                      placeOrder(
                        `EMI - ${emiPlan?.label} (${fmtINR(emiMonthly)}/mo)`
                      )
                    }
                    disabled={placing || !selectedEmi}
                  >
                    {placing ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Clock className="size-4" />
                    )}
                    Pay {fmtINR(totals.total)} via EMI
                  </Button>
                ) : (
                  <Button
                    className="w-full gap-2"
                    size="lg"
                    onClick={() => placeOrder("Cash on Delivery")}
                    disabled={placing}
                  >
                    {placing ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Landmark className="size-4" />
                    )}
                    Confirm Order (COD)
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
