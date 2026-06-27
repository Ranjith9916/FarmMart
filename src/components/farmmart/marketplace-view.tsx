"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { api, CATEGORIES, fmtINR } from "@/lib/api";
import type { Product } from "@/lib/types";
import { ProductCard } from "./product-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  SlidersHorizontal,
  Sprout,
  Truck,
  ShieldCheck,
  Bot,
  X,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Filters = {
  q: string;
  category: string;
  location: string;
  organic: boolean;
  minPrice: number;
  maxPrice: number;
  sort: string;
};

const DEFAULT_FILTERS: Filters = {
  q: "",
  category: "All",
  location: "All",
  organic: false,
  minPrice: 0,
  maxPrice: 2000,
  sort: "popular",
};

export function MarketplaceView() {
  const { role, wishlist, recentlyViewed, setActiveProduct, addRecentlyViewed } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.q) params.set("q", filters.q);
      if (filters.category !== "All") params.set("category", filters.category);
      if (filters.location !== "All") params.set("location", filters.location);
      if (filters.organic) params.set("organic", "true");
      params.set("minPrice", String(filters.minPrice));
      params.set("maxPrice", String(filters.maxPrice));
      params.set("sort", filters.sort);
      const data = await api<{ products: Product[] }>(
        `/api/products?${params.toString()}`
      );
      setProducts(data.products);
      // Store all products for wishlist/recently-viewed lookups
      if (filters.sort === "popular" && !filters.q && filters.category === "All") {
        setAllProducts(data.products);
      }
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [filters, load]);

  const locations = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.location));
    return ["All", ...Array.from(set)];
  }, [products]);

  const update = (patch: Partial<Filters>) =>
    setFilters((f) => ({ ...f, ...patch }));

  const activeFilterCount =
    (filters.category !== "All" ? 1 : 0) +
    (filters.location !== "All" ? 1 : 0) +
    (filters.organic ? 1 : 0) +
    (filters.minPrice > 0 || filters.maxPrice < 2000 ? 1 : 0);

  const FiltersPanel = (
    <div className="space-y-6">
      {/* Category */}
      <div>
        <h4 className="mb-2 text-sm font-semibold">Category</h4>
        <div className="flex flex-wrap gap-1.5">
          {["All", ...CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => update({ category: c })}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                filters.category === c
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Location */}
      <div>
        <h4 className="mb-2 text-sm font-semibold">Region</h4>
        <Select
          value={filters.location}
          onValueChange={(v) => update({ location: v })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {locations.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price range */}
      <div>
        <h4 className="mb-2 text-sm font-semibold">
          Price range: {fmtINR(filters.minPrice)} – {fmtINR(filters.maxPrice)}
        </h4>
        <Slider
          min={0}
          max={2000}
          step={50}
          value={[filters.minPrice, filters.maxPrice]}
          onValueChange={([min, max]) => update({ minPrice: min, maxPrice: max })}
        />
      </div>

      {/* Organic */}
      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox
          checked={filters.organic}
          onCheckedChange={(c) => update({ organic: c === true })}
        />
        <span className="text-sm font-medium">Organic only</span>
        <Sprout className="size-4 text-primary ml-auto" />
      </label>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => setFilters(DEFAULT_FILTERS)}
      >
        <X className="size-4 mr-1" /> Reset filters
      </Button>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
      {/* Hero */}
      <section className="fm-field-bg relative mb-6 overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-accent/40 to-background p-6 sm:p-8">
        <div className="relative z-10 max-w-2xl">
          <Badge className="mb-3 gap-1 bg-primary/15 text-primary hover:bg-primary/20">
            <Sprout className="size-3" /> Farm to market, powered by AI
          </Badge>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">
            Fresh produce from <span className="text-primary">verified farms</span>,{" "}
            delivered to your door.
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Browse {products.length || "20"}+ farm-fresh listings, get AI crop
            recommendations, weather advisories, and live market intelligence — all
            in one platform.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1">
              <Truck className="size-3" /> Pan-India logistics
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <ShieldCheck className="size-3" /> Secure payments
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Bot className="size-3" /> AI advisory
            </Badge>
          </div>
        </div>
      </section>

      {/* Search + sort bar */}
      <div className="sticky top-16 z-30 mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-background/90 p-2 backdrop-blur">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search crops, produce, tags…"
            value={filters.q}
            onChange={(e) => update({ q: e.target.value })}
            className="pl-9"
          />
        </div>
        <Select value={filters.sort} onValueChange={(v) => update({ sort: v })}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">Most popular</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
            <SelectItem value="rating">Top rated</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
          </SelectContent>
        </Select>

        <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="lg:hidden gap-1.5">
              <SlidersHorizontal className="size-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge className="ml-1">{activeFilterCount}</Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-4">{FiltersPanel}</div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex gap-6">
        {/* Desktop filters sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-32 rounded-xl border border-border/60 bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Filters</h3>
              {activeFilterCount > 0 && <Badge>{activeFilterCount}</Badge>}
            </div>
            {FiltersPanel}
          </div>
        </aside>

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {loading ? "Loading…" : `${products.length} products available`}
              {role === "WHOLESALER" && (
                <span className="ml-2 text-primary font-medium">
                  · Wholesale pricing active
                </span>
              )}
            </p>
          </div>

          {/* Wishlist section */}
          {!loading && wishlist.length > 0 && allProducts.length > 0 && (
            (() => {
              const wishProducts = allProducts.filter((p) => wishlist.includes(p.id));
              if (wishProducts.length === 0) return null;
              return (
                <div className="mb-6">
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <span className="text-red-500">♥</span> Your Wishlist ({wishProducts.length})
                  </h2>
                  <div className="fm-scroll flex gap-3 overflow-x-auto pb-2">
                    {wishProducts.map((p) => (
                      <div
                        key={p.id}
                        className="w-44 shrink-0 cursor-pointer"
                        onClick={() => {
                          addRecentlyViewed(p.id);
                          setActiveProduct(p.id);
                        }}
                      >
                        <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                          <img src={p.imageUrl} alt={p.name} className="size-full object-cover" />
                        </div>
                        <div className="mt-1.5 text-xs font-semibold truncate">{p.name}</div>
                        <div className="text-xs text-primary font-bold">{fmtINR(p.price)}/{p.unit}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()
          )}

          {/* Recently viewed section */}
          {!loading && recentlyViewed.length > 0 && allProducts.length > 0 && (
            (() => {
              const recentProducts = recentlyViewed
                .map((id) => allProducts.find((p) => p.id === id))
                .filter(Boolean)
                .slice(0, 6) as Product[];
              if (recentProducts.length === 0) return null;
              return (
                <div className="mb-6">
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    Recently Viewed
                  </h2>
                  <div className="fm-scroll flex gap-3 overflow-x-auto pb-2">
                    {recentProducts.map((p) => (
                      <div
                        key={p.id}
                        className="w-44 shrink-0 cursor-pointer"
                        onClick={() => {
                          addRecentlyViewed(p.id);
                          setActiveProduct(p.id);
                        }}
                      >
                        <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                          <img src={p.imageUrl} alt={p.name} className="size-full object-cover" />
                        </div>
                        <div className="mt-1.5 text-xs font-semibold truncate">{p.name}</div>
                        <div className="text-xs text-primary font-bold">{fmtINR(p.price)}/{p.unit}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()
          )}

          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="grid place-items-center rounded-xl border border-dashed border-border py-20 text-center">
              <Store className="size-10 text-muted-foreground" />
              <h3 className="mt-3 font-semibold">No products found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filters.
              </p>
              <Button
                variant="outline"
                className="mt-3"
                onClick={() => setFilters(DEFAULT_FILTERS)}
              >
                Reset filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
