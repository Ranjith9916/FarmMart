"use client";

import { useCallback, useEffect, useState } from "react";
import { api, fmtINR, fmtDate } from "@/lib/api";
import type { DashboardStats } from "@/lib/types";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  TrendingUp,
  IndianRupee,
  AlertTriangle,
  ShoppingCart,
  Boxes,
  Plus,
  Pencil,
  Trash2,
  Leaf,
  PlusCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  Legend,
} from "recharts";
import { toast } from "sonner";
import { AddProductDialog } from "./add-product-dialog";
import { BuyerDashboard } from "./buyer-dashboard-view";
import { TransporterDashboard } from "./transporter-dashboard-view";
import { UserAvatar } from "./user-avatar";

const PIE_COLORS = [
  "oklch(0.55 0.13 150)",
  "oklch(0.7 0.15 85)",
  "oklch(0.6 0.12 200)",
  "oklch(0.65 0.18 40)",
  "oklch(0.5 0.1 280)",
  "oklch(0.6 0.13 130)",
  "oklch(0.7 0.1 30)",
  "oklch(0.55 0.15 170)",
];

interface ProductRow {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  unit: string;
  sold: number;
  imageUrl: string;
  organic: boolean;
  location: string;
  active: boolean;
}

export function DashboardView() {
  const role = useStore((s) => s.role);

  // Transporters see a transport-focused dashboard (deliveries, routes, earnings)
  if (role === "TRANSPORTER") {
    return <TransporterDashboard />;
  }

  // Buyers see a buyer-style dashboard (orders, cart, products)
  if (role === "BUYER") {
    return <BuyerDashboard />;
  }

  // Farmers and wholesalers see the farm dashboard (inventory, sales, listings)
  return <FarmDashboard />;
}

function FarmDashboard() {
  const userId = useStore((s) => s.authUser?.id);
  const authUser = useStore((s) => s.authUser);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ProductRow | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setStats(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await api<DashboardStats>(
        `/api/dashboard/stats?userId=${userId}`
      );
      setStats(data);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setEditing(null);
    setEditOpen(true);
  };
  const openEdit = (p: ProductRow) => {
    setEditing(p);
    setEditOpen(true);
  };
  const closeDialog = () => {
    setEditOpen(false);
    setEditing(null);
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product listing?")) return;
    try {
      await api(`/api/products/${id}`, { method: "DELETE" });
      toast.success("Product deleted");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const kpis = [
    {
      label: "Total Revenue",
      value: fmtINR(stats?.totalRevenue || 0),
      icon: IndianRupee,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Units Sold",
      value: (stats?.totalSales || 0).toLocaleString("en-IN"),
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-500/10",
    },
    {
      label: "Active Listings",
      value: String(stats?.totalProducts || 0),
      icon: Package,
      color: "text-amber-600",
      bg: "bg-amber-500/10",
    },
    {
      label: "Pending Orders",
      value: String(stats?.pendingOrders || 0),
      icon: ShoppingCart,
      color: "text-blue-600",
      bg: "bg-blue-500/10",
    },
    {
      label: "Total Stock",
      value: (stats?.totalStock || 0).toLocaleString("en-IN"),
      icon: Boxes,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Low Stock Alerts",
      value: String(stats?.lowStockCount || 0),
      icon: AlertTriangle,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
  ];

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <UserAvatar name={authUser?.name || "User"} avatar={authUser?.avatar} size="lg" />
          <div>
            <h1 className="text-2xl font-bold">Farm Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Manage listings, track inventory, and monitor sales performance.
            </p>
          </div>
        </div>
        <Button onClick={openNew} className="gap-1.5 shadow-sm">
          <PlusCircle className="size-4" /> Add Product
        </Button>
      </div>

      {/* KPI grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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

      {/* Charts */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <h3 className="mb-3 font-semibold">Sales Trend (last 8 weeks)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.salesTrend || []}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.55 0.13 150)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.55 0.13 150)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={60} tickFormatter={(v) => "₹" + (v / 1000) + "k"} />
                <Tooltip formatter={(v: number) => fmtINR(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="oklch(0.55 0.13 150)"
                  strokeWidth={2}
                  fill="url(#salesGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 font-semibold">Revenue by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.revenueByCategory || []}
                  dataKey="revenue"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  paddingAngle={2}
                >
                  {(stats?.revenueByCategory || []).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => fmtINR(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Inventory table */}
      <Card className="mt-4 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Inventory Management</h3>
          <Badge variant="secondary">{stats?.products.length || 0} listings</Badge>
        </div>
        <div className="fm-scroll overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-3 font-medium">Product</th>
                <th className="pb-2 pr-3 font-medium">Category</th>
                <th className="pb-2 pr-3 font-medium">Price</th>
                <th className="pb-2 pr-3 font-medium">Stock</th>
                <th className="pb-2 pr-3 font-medium">Sold</th>
                <th className="pb-2 pr-3 font-medium">Status</th>
                <th className="pb-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.products || []).map((p) => {
                const low = p.stock < 200 && p.stock > 0;
                const out = p.stock <= 0;
                return (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="size-9 rounded-lg object-cover"
                        />
                        <div className="min-w-0">
                          <div className="truncate font-medium">{p.name}</div>
                          {p.organic && (
                            <Badge className="mt-0.5 gap-0.5 bg-primary/15 px-1 py-0 text-[9px] text-primary">
                              <Leaf className="size-2.5" /> Organic
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground">{p.category}</td>
                    <td className="py-2 pr-3 font-medium">{fmtINR(p.price)}</td>
                    <td className="py-2 pr-3">
                      <span className={out ? "text-destructive" : low ? "text-amber-600" : ""}>
                        {p.stock} {p.unit}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground">{p.sold}</td>
                    <td className="py-2 pr-3">
                      {out ? (
                        <Badge className="bg-destructive/15 text-destructive">Out</Badge>
                      ) : low ? (
                        <Badge className="bg-amber-500/15 text-amber-700">Low</Badge>
                      ) : p.active ? (
                        <Badge className="bg-primary/15 text-primary">Live</Badge>
                      ) : (
                        <Badge variant="secondary">Hidden</Badge>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => openEdit(p)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteProduct(p.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <AddProductDialog
        open={editOpen}
        onOpenChange={(b) => (b ? setEditOpen(true) : closeDialog())}
        editProduct={editing}
        onSaved={() => {
          closeDialog();
          load();
        }}
      />
    </div>
  );
}
