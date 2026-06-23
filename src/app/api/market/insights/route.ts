import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/market/insights — marketplace-wide intelligence
export async function GET() {
  try {
    const products = await db.product.findMany({
      include: { priceHistory: { orderBy: { recordedAt: "asc" } } },
    });

    // Category distribution
    const catMap = new Map<
      string,
      { count: number; priceSum: number }
    >();
    for (const p of products) {
      const cur = catMap.get(p.category) || { count: 0, priceSum: 0 };
      cur.count += 1;
      cur.priceSum += p.price;
      catMap.set(p.category, cur);
    }
    const categoryDistribution = Array.from(catMap.entries())
      .map(([category, v]) => ({
        category,
        count: v.count,
        avgPrice: Math.round((v.priceSum / v.count) * 100) / 100,
      }))
      .sort((a, b) => b.count - a.count);

    // Price trends for top 4 products by sold
    const topBySold = [...products].sort((a, b) => b.sold - a.sold).slice(0, 4);
    const priceTrends = topBySold.map((p) => ({
      name: p.name.split(" ")[0],
      data: p.priceHistory.map((ph) => ({
        date: new Date(ph.recordedAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        }),
        price: ph.price,
      })),
    }));

    // Top regions by product count & estimated revenue
    const regionMap = new Map<
      string,
      { products: number; revenue: number }
    >();
    for (const p of products) {
      const cur = regionMap.get(p.location) || { products: 0, revenue: 0 };
      cur.products += 1;
      cur.revenue += p.sold * p.price;
      regionMap.set(p.location, cur);
    }
    const topRegions = Array.from(regionMap.entries())
      .map(([location, v]) => ({
        location,
        products: v.products,
        revenue: Math.round(v.revenue),
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Top selling products
    const topSelling = [...products]
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 8)
      .map((p) => ({
        name: p.name,
        category: p.category,
        sold: p.sold,
        revenue: Math.round(p.sold * p.price),
      }));

    // Demand index (synthetic from sold + reviewCount)
    const demandIndex = Array.from(catMap.entries())
      .map(([category]) => {
        const prods = products.filter((p) => p.category === category);
        const demand = prods.reduce((s, p) => s + p.sold + p.reviewCount * 5, 0);
        return { category, demand: Math.round(demand) };
      })
      .sort((a, b) => b.demand - a.demand);

    return NextResponse.json({
      categoryDistribution,
      priceTrends,
      topRegions,
      topSelling,
      demandIndex,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
