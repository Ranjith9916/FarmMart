import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/dashboard/stats?userId=... — aggregate farmer dashboard stats
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Products belonging to this farmer
    const products = await db.product.findMany({
      where: { farmerId: userId },
      orderBy: { createdAt: "desc" },
    });

    // Orders where this user is the farmer
    const orders = await db.order.findMany({
      where: { farmerId: userId, status: { not: "CANCELLED" } },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    const totalProducts = products.length;
    const totalStock = products.reduce((s, p) => s + p.stock, 0);
    const totalSold = products.reduce((s, p) => s + p.sold, 0);
    const orderRevenue = orders.reduce((s, o) => s + o.total, 0);
    const productRevenue = products.reduce((s, p) => s + p.sold * p.price, 0);
    const totalRevenue = orderRevenue + productRevenue;
    const pendingOrders = orders.filter(
      (o) => o.status === "PENDING" || o.status === "CONFIRMED" || o.status === "PACKED"
    ).length;
    const lowStockCount = products.filter((p) => p.stock < 200 && p.stock > 0).length;

    // Revenue by category
    const catMap = new Map<string, number>();
    for (const o of orders) {
      for (const it of o.items) {
        const prod = products.find((p) => p.id === it.productId);
        const cat = prod?.category || "Other";
        catMap.set(cat, (catMap.get(cat) || 0) + it.price * it.quantity);
      }
    }
    // Also include revenue from sold products
    for (const p of products) {
      const cat = p.category;
      catMap.set(cat, (catMap.get(cat) || 0) + p.sold * p.price);
    }
    const revenueByCategory = Array.from(catMap.entries())
      .map(([category, revenue]) => ({ category, revenue: Math.round(revenue) }))
      .sort((a, b) => b.revenue - a.revenue);

    // Sales trend (last 8 weeks, grouped)
    const now = Date.now();
    const weeks: { date: string; sales: number }[] = [];
    for (let w = 7; w >= 0; w--) {
      const start = new Date(now - (w + 1) * 7 * 86400000);
      const end = new Date(now - w * 7 * 86400000);
      const weekOrders = orders.filter(
        (o) => o.createdAt >= start && o.createdAt < end
      );
      const weekRev = weekOrders.reduce((s, o) => s + o.total, 0);
      weeks.push({
        date: end.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        sales: Math.round(weekRev),
      });
    }
    const salesTrend = weeks;

    // Top products by revenue
    const prodRevMap = new Map<string, { name: string; sold: number; revenue: number }>();
    for (const o of orders) {
      for (const it of o.items) {
        const cur = prodRevMap.get(it.productId) || {
          name: it.name,
          sold: 0,
          revenue: 0,
        };
        cur.sold += it.quantity;
        cur.revenue += it.price * it.quantity;
        prodRevMap.set(it.productId, cur);
      }
    }
    for (const p of products) {
      const cur = prodRevMap.get(p.id) || { name: p.name, sold: 0, revenue: 0 };
      cur.sold += p.sold;
      cur.revenue += p.sold * p.price;
      prodRevMap.set(p.id, cur);
    }
    const topProducts = Array.from(prodRevMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((p) => ({ ...p, revenue: Math.round(p.revenue) }));

    // Recent orders (last 5)
    const recentOrders = orders.slice(0, 5).map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      buyerId: o.buyerId,
      farmerId: o.farmerId,
      farmer: { id: o.farmerId, name: "" },
      items: o.items.map((it) => ({
        id: it.id,
        productId: it.productId,
        name: it.name,
        price: it.price,
        quantity: it.quantity,
        unit: it.unit,
        imageUrl: it.imageUrl,
      })),
      subtotal: o.subtotal,
      shipping: o.shipping,
      tax: o.tax,
      total: o.total,
      status: o.status,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      shippingAddress: o.shippingAddress,
      transporterId: o.transporterId,
      trackingNote: o.trackingNote,
      createdAt: o.createdAt.toISOString(),
    }));

    return NextResponse.json({
      totalProducts,
      totalStock,
      totalSales: totalSold,
      totalRevenue: Math.round(totalRevenue),
      pendingOrders,
      lowStockCount,
      revenueByCategory,
      salesTrend,
      topProducts,
      recentOrders,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.price,
        stock: p.stock,
        unit: p.unit,
        sold: p.sold,
        imageUrl: p.imageUrl,
        organic: p.organic,
        location: p.location,
        active: p.active,
      })),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
