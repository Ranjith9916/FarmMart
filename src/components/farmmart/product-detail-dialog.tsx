"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { api, fmtINR, fmtDate } from "@/lib/api";
import type { Product, Review } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Star,
  MapPin,
  Leaf,
  Package,
  Minus,
  Plus,
  ShoppingCart,
  Truck,
  ShieldCheck,
  CalendarDays,
  Loader2,
  Phone,
  MessageSquare,
  Link2,
  MessageCircle,
  Twitter,
} from "lucide-react";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface FullProduct extends Product {
  farmer: Product["farmer"] & { phone?: string | null };
  reviews: (Review & { user: { id: string; name: string } })[];
  priceHistory: { date: string; price: number }[];
}

export function ProductDetailDialog() {
  const { activeProductId, setActiveProduct, addToCart, setView, authUser } = useStore();
  const [product, setProduct] = useState<FullProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [qty, setQty] = useState(1);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!activeProductId) {
      setProduct(null);
      return;
    }
    setLoading(true);
    setQty(1);
    api<{ product: FullProduct }>(`/api/products/${activeProductId}`)
      .then((d) => setProduct(d.product))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [activeProductId]);

  const submitReview = async () => {
    if (!product || !reviewComment.trim() || !authUser) return;
    setSubmitting(true);
    try {
      await api("/api/reviews", {
        method: "POST",
        body: JSON.stringify({
          productId: product.id,
          rating: reviewRating,
          comment: reviewComment,
          userId: authUser.id,
        }),
      });
      toast.success("Review submitted!");
      setReviewComment("");
      const d = await api<{ product: FullProduct }>(
        `/api/products/${product.id}`
      );
      setProduct(d.product);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const chartData = product?.priceHistory.map((p) => ({
    date: new Date(p.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
    price: p.price,
  })) || [];

  return (
    <Dialog
      open={!!activeProductId}
      onOpenChange={(o) => !o && setActiveProduct(null)}
    >
      <DialogContent
        className="max-h-[92vh] overflow-y-auto sm:max-w-4xl fm-scroll"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">
            {loading ? "Product details" : product?.name || "Product details"}
          </DialogTitle>
        </DialogHeader>
        {loading && (
          <div className="grid place-items-center py-24">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        )}
        {!loading && product && (
          <>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Image */}
              <div className="space-y-3">
                <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="size-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        "data:image/svg+xml;utf8," +
                        encodeURIComponent(
                          `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect width='100%' height='100%' fill='%23e8efe6'/></svg>`
                        );
                    }}
                  />
                  <div className="absolute left-3 top-3 flex gap-1.5">
                    {product.organic && (
                      <Badge className="gap-1 bg-primary text-primary-foreground">
                        <Leaf className="size-3" /> Organic
                      </Badge>
                    )}
                    <Badge variant="secondary">{product.category}</Badge>
                  </div>
                </div>

                {/* Price history chart */}
                {chartData.length > 0 && (
                  <div className="rounded-xl border border-border/60 p-3">
                    <h4 className="mb-1 text-xs font-semibold text-muted-foreground">
                      Price trend (last 9 weeks)
                    </h4>
                    <div className="h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={2} />
                          <YAxis tick={{ fontSize: 10 }} width={40} />
                          <Tooltip
                            contentStyle={{
                              fontSize: 12,
                              borderRadius: 8,
                            }}
                            formatter={(v: number) => [fmtINR(v), "Price"]}
                          />
                          <Line
                            type="monotone"
                            dataKey="price"
                            stroke="oklch(0.55 0.13 150)"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-primary">
                      {fmtINR(product.price)}
                      <span className="text-sm font-normal text-muted-foreground">
                        /{product.unit}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-sm">
                      <Star className="size-4 fill-amber-500 text-amber-500" />
                      <span className="font-semibold">{product.rating.toFixed(1)}</span>
                      <span className="text-muted-foreground">
                        ({product.reviewCount} reviews)
                      </span>
                    </div>
                  </div>
                  {product.stock <= 0 ? (
                    <Badge className="bg-destructive text-white">Out of stock</Badge>
                  ) : product.stock < 200 ? (
                    <Badge className="bg-amber-500 text-white">
                      Low stock: {product.stock} {product.unit}
                    </Badge>
                  ) : (
                    <Badge className="bg-primary/15 text-primary">
                      In stock: {product.stock} {product.unit}
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-muted-foreground">
                  {product.description}
                </p>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 text-muted-foreground" />
                    {product.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="size-4 text-muted-foreground" />
                    Sold: {product.sold} {product.unit}
                  </div>
                  {product.harvestDate && (
                    <div className="flex items-center gap-2">
                      <CalendarDays className="size-4 text-muted-foreground" />
                      Harvested {fmtDate(product.harvestDate + "-15")}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Leaf className="size-4 text-muted-foreground" />
                    {product.organic ? "Certified organic" : "Conventional"}
                  </div>
                </div>

                {/* Farmer / Seller card */}
                <div className="rounded-xl border border-border/60 bg-secondary/40 p-3">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground font-semibold">
                      {product.farmer.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold">{product.farmer.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {product.farmer.location} · ⭐ {product.farmer.rating}
                      </div>
                    </div>
                    <Badge variant="outline" className="gap-1 shrink-0">
                      <ShieldCheck className="size-3 text-primary" /> Verified
                    </Badge>
                  </div>

                  {/* Seller contact info */}
                  {product.farmer.phone && (
                    <div className="mt-3 flex items-center gap-2 border-t border-border/60 pt-3">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground flex-1 min-w-0">
                        <Phone className="size-3.5 text-primary shrink-0" />
                        <span className="truncate font-medium text-foreground">
                          {product.farmer.phone}
                        </span>
                      </div>
                      <a
                        href={`tel:${product.farmer.phone.replace(/\s/g, "")}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                      >
                        <Phone className="size-3" />
                        Call
                      </a>
                      <a
                        href={`sms:${product.farmer.phone.replace(/\s/g, "")}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80"
                      >
                        <MessageSquare className="size-3" />
                        Message
                      </a>
                    </div>
                  )}
                </div>

                {/* Quantity + add to cart */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-lg border">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                    >
                      <Minus className="size-4" />
                    </Button>
                    <Input
                      type="number"
                      value={qty}
                      onChange={(e) =>
                        setQty(Math.max(1, parseInt(e.target.value) || 1))
                      }
                      className="h-9 w-16 border-0 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() =>
                        setQty((q) => Math.min(product.stock, q + 1))
                      }
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                  <Button
                    className="flex-1 gap-2"
                    size="lg"
                    disabled={product.stock <= 0}
                    onClick={() => {
                      addToCart({
                        productId: product.id,
                        name: product.name,
                        price: product.price,
                        unit: product.unit,
                        quantity: qty,
                        imageUrl: product.imageUrl,
                        farmerId: product.farmerId,
                        farmerName: product.farmer.name,
                        stock: product.stock,
                      });
                      toast.success(`${qty} ${product.unit} of ${product.name} added to cart`);
                    }}
                  >
                    <ShoppingCart className="size-4" />
                    Add to cart · {fmtINR(product.price * qty)}
                  </Button>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Truck className="size-4 text-primary" />
                  Free shipping on orders above ₹2,500 · 2% GST applied
                </div>

                {/* Share buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs font-medium text-muted-foreground">Share:</span>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.href);
                      toast.success("Link copied to clipboard!");
                    }}
                    className="grid size-8 place-items-center rounded-lg bg-secondary hover:bg-accent transition-colors"
                    aria-label="Copy link"
                  >
                    <Link2 className="size-3.5" />
                  </button>
                  <a
                    href={`https://wa.me/?text=Check out ${product.name} on FarmMart — ${fmtINR(product.price)}/${product.unit}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="grid size-8 place-items-center rounded-lg bg-green-500/15 text-green-600 hover:bg-green-500/25 transition-colors"
                    aria-label="Share on WhatsApp"
                  >
                    <MessageCircle className="size-3.5" />
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?text=Check out ${product.name} on FarmMart — ${fmtINR(product.price)}/${product.unit}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="grid size-8 place-items-center rounded-lg bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 transition-colors"
                    aria-label="Share on Twitter"
                  >
                    <Twitter className="size-3.5" />
                  </a>
                </div>

                <Button
                  variant="link"
                  className="h-auto p-0"
                  onClick={() => {
                    setActiveProduct(null);
                    setView("cart");
                  }}
                >
                  Go to cart →
                </Button>
              </div>
            </div>

            <Separator />

            {/* Reviews */}
            <div className="space-y-4">
              <h3 className="font-semibold">
                Reviews ({product.reviews.length})
              </h3>

              {/* Write review */}
              <div className="rounded-xl border border-border/60 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-sm font-medium">Your rating:</span>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onClick={() => setReviewRating(s)}
                      aria-label={`Rate ${s} stars`}
                    >
                      <Star
                        className={
                          s <= reviewRating
                            ? "size-5 fill-amber-500 text-amber-500"
                            : "size-5 text-muted-foreground"
                        }
                      />
                    </button>
                  ))}
                </div>
                <Textarea
                  placeholder="Share your experience with this product…"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={2}
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    size="sm"
                    onClick={submitReview}
                    disabled={submitting || !reviewComment.trim()}
                  >
                    {submitting && <Loader2 className="size-4 animate-spin" />}
                    Post review
                  </Button>
                </div>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto fm-scroll pr-1">
                {product.reviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No reviews yet. Be the first to review!
                  </p>
                ) : (
                  product.reviews.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-lg border border-border/60 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="grid size-7 place-items-center rounded-full bg-secondary text-xs font-semibold">
                            {r.user.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium">{r.user.name}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: r.rating }).map((_, i) => (
                            <Star
                              key={i}
                              className="size-3 fill-amber-500 text-amber-500"
                            />
                          ))}
                        </div>
                      </div>
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        {r.comment}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
