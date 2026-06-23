"use client";

import { useCallback, useEffect, useState } from "react";
import { api, fmtINR } from "@/lib/api";
import type { MarketInsights } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  MapPin,
  Trophy,
  Gauge,
  Sparkles,
  Loader2,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = [
  "oklch(0.55 0.13 150)",
  "oklch(0.7 0.15 85)",
  "oklch(0.6 0.12 200)",
  "oklch(0.65 0.18 40)",
  "oklch(0.5 0.1 280)",
  "oklch(0.6 0.13 130)",
  "oklch(0.7 0.1 30)",
  "oklch(0.55 0.15 170)",
];

export function InsightsView() {
  const [data, setData] = useState<MarketInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [briefing, setBriefing] = useState("");
  const [briefingLoading, setBriefingLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api<MarketInsights>("/api/market/insights");
      setData(d);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBriefing = useCallback(async (d: MarketInsights) => {
    setBriefingLoading(true);
    try {
      const topCats = d.categoryDistribution.slice(0, 4).map(c => c.category).join(", ");
      const topRegion = d.topRegions[0]?.location || "India";
      const topProduct = d.topSelling[0]?.name || "produce";
      const res = await api<{ reply: string }>("/api/ai/crop-advisor", {
        method: "POST",
        body: JSON.stringify({
          message: `Give me a concise market intelligence briefing for an agriculture marketplace. Top categories by listings: ${topCats}. Leading region: ${topRegion}. Best-selling product: ${topProduct}. Provide 4 short bullet insights on pricing trends, demand, and selling opportunities. Under 120 words, plain text with • bullets.`,
          history: [],
          context: { role: "WHOLESALER" },
        }),
      });
      setBriefing(res.reply);
    } catch {
      setBriefing("Unable to generate briefing right now.");
    } finally {
      setBriefingLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (data) loadBriefing(data);
  }, [data, loadBriefing]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="grid place-items-center py-24 text-sm text-muted-foreground">
        Unable to load market insights.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="size-7 text-primary" /> Market Intelligence
          </h1>
          <p className="text-sm text-muted-foreground">
            Live pricing trends, demand signals, and regional supply across the marketplace.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-1.5">
          <RefreshCw className="size-4" /> Refresh
        </Button>
      </div>

      {/* AI Briefing */}
      <Card className="mb-4 p-5 fm-field-bg">
        <div className="mb-2 flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </div>
          <h2 className="font-semibold">AI Market Briefing</h2>
          <Badge className="ml-auto gap-1 bg-primary/15 text-primary">
            <Sparkles className="size-3" /> Z.ai
          </Badge>
        </div>
        {briefingLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Analyzing market signals…
          </div>
        ) : (
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {briefing}
          </div>
        )}
      </Card>

      {/* KPI strip */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Trophy className="size-3.5 text-primary" /> Top category
          </div>
          <div className="mt-1 text-lg font-bold">
            {data.categoryDistribution[0]?.category || "—"}
          </div>
          <div className="text-xs text-muted-foreground">
            {data.categoryDistribution[0]?.count || 0} listings
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="size-3.5 text-primary" /> Leading region
          </div>
          <div className="mt-1 text-lg font-bold">
            {data.topRegions[0]?.location?.split(",")[0] || "—"}
          </div>
          <div className="text-xs text-muted-foreground">
            ₹{(data.topRegions[0]?.revenue || 0).toLocaleString("en-IN")} revenue
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="size-3.5 text-primary" /> Best seller
          </div>
          <div className="mt-1 truncate text-lg font-bold">
            {data.topSelling[0]?.name || "—"}
          </div>
          <div className="text-xs text-muted-foreground">
            {data.topSelling[0]?.sold.toLocaleString("en-IN") || 0} units sold
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Gauge className="size-3.5 text-primary" /> Highest demand
          </div>
          <div className="mt-1 text-lg font-bold">
            {data.demandIndex[0]?.category || "—"}
          </div>
          <div className="text-xs text-muted-foreground">
            index {data.demandIndex[0]?.demand.toLocaleString("en-IN") || 0}
          </div>
        </Card>
      </div>

      {/* Charts grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Price trends */}
        <Card className="p-4">
          <h3 className="mb-3 font-semibold">Price Trends — Top Products</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.priceTrends[0]?.data.map((_, i) => {
                  const obj: Record<string, string | number> = {
                    date: data.priceTrends[0]?.data[i]?.date || "",
                  };
                  data.priceTrends.forEach((p) => {
                    obj[p.name] = p.data[i]?.price ?? 0;
                  });
                  return obj;
                }) || []}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={1} />
                <YAxis tick={{ fontSize: 10 }} width={50} />
                <Tooltip formatter={(v: number) => fmtINR(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                {data.priceTrends.map((p, i) => (
                  <Line
                    key={p.name}
                    type="monotone"
                    dataKey={p.name}
                    stroke={COLORS[i % COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Category distribution */}
        <Card className="p-4">
          <h3 className="mb-3 font-semibold">Category Distribution</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.categoryDistribution}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={45}
                  paddingAngle={2}
                  label={(e) => (e as { category?: string }).category || ""}
                  labelLine={false}
                >
                  {data.categoryDistribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top regions */}
        <Card className="p-4">
          <h3 className="mb-3 font-semibold">Revenue by Region</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.topRegions.slice(0, 6).map((r) => ({
                  ...r,
                  shortName: r.location.split(",")[0],
                }))}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => "₹" + (v / 100000).toFixed(1) + "L"}
                />
                <YAxis
                  type="category"
                  dataKey="shortName"
                  tick={{ fontSize: 11 }}
                  width={80}
                />
                <Tooltip formatter={(v: number) => fmtINR(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="revenue" radius={[0, 6, 6, 0]} fill="oklch(0.55 0.13 150)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Demand index */}
        <Card className="p-4">
          <h3 className="mb-3 font-semibold">Demand Index by Category</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.demandIndex}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="category" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="demand" radius={[6, 6, 0, 0]} fill="oklch(0.7 0.15 85)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Top selling table */}
      <Card className="mt-4 p-4">
        <h3 className="mb-3 font-semibold flex items-center gap-2">
          <Trophy className="size-4 text-amber-500" /> Top Selling Products
        </h3>
        <div className="space-y-2">
          {data.topSelling.map((p, i) => (
            <div
              key={p.name}
              className="flex items-center gap-3 rounded-lg border border-border/60 p-2.5"
            >
              <div className="grid size-7 place-items-center rounded-full bg-secondary text-xs font-bold">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.category}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">
                  {p.sold.toLocaleString("en-IN")} units
                </div>
                <div className="text-xs text-muted-foreground">
                  {fmtINR(p.revenue)} revenue
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
