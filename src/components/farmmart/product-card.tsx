"use client";

import type { Product } from "@/lib/types";
import { useStore } from "@/lib/store";
import { fmtINR } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Leaf, Package, ShoppingCart, Truck, Heart, Flame, TrendingUp, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function ProductCard({ product }: { product: Product }) {
  const { setActiveProduct, addToCart, wishlist, toggleWishlist, addRecentlyViewed } = useStore();
  const lowStock = product.stock < 200 && product.stock > 0;
  const outOfStock = product.stock <= 0;
  const isFav = wishlist.includes(product.id);
  const isBestseller = product.sold > 500;
  const stockPercent = Math.min(100, Math.round((product.stock / 1000) * 100));

  const handleCardClick = () => {
    addRecentlyViewed(product.id);
    setActiveProduct(product.id);
  };

  return (
    <Card
      className="group relative flex flex-col overflow-hidden p-0 transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          className={cn(
            "size-full object-cover transition-transform duration-500 group-hover:scale-105",
            outOfStock && "opacity-50 grayscale"
          )}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "data:image/svg+xml;utf8," +
              encodeURIComponent(
                `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='%23e8efe6'/><text x='50%' y='50%' font-size='20' fill='%23708068' text-anchor='middle' dy='.35em'>${product.name}</text></svg>`
              );
          }}
        />
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {isBestseller && (
            <Badge className="bg-amber-500 text-white gap-1 shadow-sm">
              <Flame className="size-3" /> Bestseller
            </Badge>
          )}
          {product.organic && (
            <Badge className="bg-primary text-primary-foreground gap-1 shadow-sm">
              <Leaf className="size-3" /> Organic
            </Badge>
          )}
          <Badge variant="secondary" className="w-fit shadow-sm">
            {product.category}
          </Badge>
        </div>

        {/* Wishlist heart button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
            toast.success(isFav ? "Removed from wishlist" : "Added to wishlist");
          }}
          className={cn(
            "absolute right-2 top-2 grid size-8 place-items-center rounded-full backdrop-blur-md transition-all",
            isFav
              ? "bg-white/90 text-red-500"
              : "bg-black/30 text-white opacity-0 group-hover:opacity-100"
          )}
          aria-label="Toggle wishlist"
        >
          <Heart className={cn("size-4", isFav && "fill-red-500")} />
        </button>

        {lowStock && !isFav && (
          <Badge className="absolute right-2 top-2 bg-amber-500 text-white shadow-sm group-hover:opacity-0 transition-opacity">
            Low stock
          </Badge>
        )}
        {outOfStock && !isFav && (
          <Badge className="absolute right-2 top-2 bg-destructive text-white shadow-sm group-hover:opacity-0 transition-opacity">
            Out of stock
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-semibold leading-tight">
            {product.name}
          </h3>
          <div className="flex items-center gap-0.5 text-xs font-medium text-amber-600">
            <Star className="size-3.5 fill-amber-500 text-amber-500" />
            {product.rating.toFixed(1)}
          </div>
        </div>

        <p className="line-clamp-2 text-xs text-muted-foreground min-h-[2rem]">
          {product.description}
        </p>

        {/* Stock progress bar */}
        {!outOfStock && (
          <div className="space-y-0.5">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-0.5">
                <TrendingUp className="size-2.5" />
                {product.sold.toLocaleString("en-IN")} sold
              </span>
              <span>{product.stock.toLocaleString("en-IN")} {product.unit} left</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  stockPercent < 20
                    ? "bg-destructive"
                    : stockPercent < 50
                      ? "bg-amber-500"
                      : "bg-primary"
                )}
                style={{ width: `${stockPercent}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-1">
          <div>
            <div className="text-lg font-bold text-primary">
              {fmtINR(product.price)}
              <span className="text-xs font-normal text-muted-foreground">
                /{product.unit}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="size-3" />
              {product.location}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
              <Truck className="size-2.5" />
              Delivers in 2-3 days
            </div>
          </div>
          <Button
            size="sm"
            disabled={outOfStock}
            onClick={(e) => {
              e.stopPropagation();
              addToCart({
                productId: product.id,
                name: product.name,
                price: product.price,
                unit: product.unit,
                quantity: 1,
                imageUrl: product.imageUrl,
                farmerId: product.farmerId,
                farmerName: product.farmer.name,
                stock: product.stock,
              });
            }}
            className="gap-1"
          >
            <ShoppingCart className="size-3.5" />
            Add
          </Button>
        </div>

        <div className="flex items-center justify-between border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1 truncate">
            <ShieldCheck className="size-3 shrink-0 text-primary" />
            {product.farmer.name}
          </span>
          <span className="inline-flex items-center gap-0.5">
            <Star className="size-2.5 fill-amber-500 text-amber-500" />
            {product.reviewCount} reviews
          </span>
        </div>
      </div>
    </Card>
  );
}
