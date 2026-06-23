import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  SEED_USERS,
  SEED_PRODUCTS,
  PRODUCT_IMAGES,
  SEED_REVIEWS,
} from "@/lib/seed-data";

// Seed the database with demo data for FarmMart
export async function POST() {
  try {
    // Wipe existing data (demo only)
    await db.review.deleteMany();
    await db.priceSnapshot.deleteMany();
    await db.orderItem.deleteMany();
    await db.order.deleteMany();
    await db.product.deleteMany();
    await db.cropRecommendation.deleteMany();
    await db.weatherCache.deleteMany();
    await db.user.deleteMany();

    // Users
    await db.user.createMany({ data: SEED_USERS });

    // Products
    const farmerByEmail = new Map(SEED_USERS.map((u) => [u.email, u]));
    for (const p of SEED_PRODUCTS) {
      const farmer = farmerByEmail.get(p.farmerEmail)!;
      await db.product.create({
        data: {
          name: p.name,
          category: p.category,
          description: p.description,
          price: p.price,
          unit: p.unit,
          stock: p.stock,
          imageUrl: PRODUCT_IMAGES[p.key],
          location: p.location,
          organic: p.organic,
          harvestDate: p.harvestDate,
          tags: p.tags,
          rating: p.rating,
          reviewCount: p.reviewCount,
          sold: p.sold,
          active: true,
          farmerId: farmer.id,
        },
      });
    }

    // Reviews + price snapshots
    const allProducts = await db.product.findMany();
    const buyer = await db.user.findUnique({ where: { email: "buyer@farmmart.io" } });
    const wholesaler = await db.user.findUnique({ where: { email: "bulk@farmmart.io" } });
    const reviewerPool = [buyer, wholesaler].filter(Boolean) as { id: string }[];

    let revIdx = 0;
    for (const prod of allProducts) {
      // 2-3 reviews per product
      const n = 2 + (revIdx % 2);
      for (let i = 0; i < n; i++) {
        const r = SEED_REVIEWS[revIdx % SEED_REVIEWS.length];
        const u = reviewerPool[revIdx % reviewerPool.length];
        await db.review.create({
          data: {
            productId: prod.id,
            userId: u.id,
            rating: r.rating,
            comment: r.comment,
          },
        });
        revIdx++;
      }
      // price history: last 9 weeks
      const now = Date.now();
      for (let w = 9; w >= 0; w--) {
        const d = new Date(now - w * 7 * 24 * 3600 * 1000);
        const variance = 1 + (Math.sin(w) * 0.08 + (9 - w) * 0.006);
        await db.priceSnapshot.create({
          data: {
            productId: prod.id,
            price: Math.round(prod.price * variance * 100) / 100,
            recordedAt: d,
          },
        });
      }
    }

    // Seed a couple of orders for the buyer so the Orders page has content
    const buyerUser = await db.user.findUnique({ where: { email: "buyer@farmmart.io" } });
    if (buyerUser && allProducts.length >= 2) {
      const p1 = allProducts[0];
      const p2 = allProducts[6];
      const items = [
        { prod: p1, qty: 10 },
        { prod: p2, qty: 5 },
      ];
      const subtotal = items.reduce((s, it) => s + it.prod.price * it.qty, 0);
      const shipping = subtotal > 2500 ? 0 : 120;
      const tax = Math.round(subtotal * 0.02 * 100) / 100;
      const total = subtotal + shipping + tax;
      const orderNumber = "FM-" + Date.now().toString().slice(-8);
      await db.order.create({
        data: {
          orderNumber,
          buyerId: buyerUser.id,
          farmerId: p1.farmerId,
          subtotal,
          shipping,
          tax,
          total,
          status: "DELIVERED",
          paymentStatus: "PAID",
          paymentMethod: "UPI",
          shippingAddress: "14 MG Road, Pune, Maharashtra 411001",
          trackingNote: "Delivered via FastTrack Logistics. POD signed.",
          items: {
            create: items.map((it) => ({
              productId: it.prod.id,
              name: it.prod.name,
              price: it.prod.price,
              quantity: it.qty,
              unit: it.prod.unit,
              imageUrl: it.prod.imageUrl,
              farmerId: it.prod.farmerId,
            })),
          },
        },
      });

      // second order: confirmed
      const p3 = allProducts[12];
      const sub3 = p3.price * 3;
      const tax3 = Math.round(sub3 * 0.02 * 100) / 100;
      await db.order.create({
        data: {
          orderNumber: "FM-" + (Date.now() + 1).toString().slice(-8),
          buyerId: buyerUser.id,
          farmerId: p3.farmerId,
          subtotal: sub3,
          shipping: 120,
          tax: tax3,
          total: sub3 + 120 + tax3,
          status: "CONFIRMED",
          paymentStatus: "PAID",
          paymentMethod: "Card",
          shippingAddress: "14 MG Road, Pune, Maharashtra 411001",
          trackingNote: "Being packed at farm warehouse. Dispatch in 24h.",
          items: {
            create: [
              {
                productId: p3.id,
                name: p3.name,
                price: p3.price,
                quantity: 3,
                unit: p3.unit,
                imageUrl: p3.imageUrl,
                farmerId: p3.farmerId,
              },
            ],
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      users: SEED_USERS.length,
      products: SEED_PRODUCTS.length,
      message: "FarmMart database seeded successfully.",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
