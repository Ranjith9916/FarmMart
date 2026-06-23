import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/orders?role=BUYER|FARMER — list orders for the demo user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role") || "BUYER";

    const buyer = await db.user.findUnique({
      where: { email: "buyer@farmmart.io" },
    });

    let orders;
    if (role === "FARMER") {
      const farmer = await db.user.findUnique({
        where: { email: "ravi@farmmart.io" },
      });
      // Show all orders as "sales" for the demo farmer perspective (any farmer)
      orders = await db.order.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
          buyer: { select: { id: true, name: true, location: true } },
        },
      });
      void farmer;
    } else {
      orders = buyer
        ? await db.order.findMany({
            where: { buyerId: buyer.id },
            orderBy: { createdAt: "desc" },
            include: { items: true, farmer: { select: { id: true, name: true } } },
          })
        : [];
    }

    return NextResponse.json({ orders });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/orders — checkout: create an order from cart items
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, shippingAddress, paymentMethod } = body as {
      items: {
        productId: string;
        name: string;
        price: number;
        quantity: number;
        unit: string;
        imageUrl: string;
        farmerId: string;
      }[];
      shippingAddress: string;
      paymentMethod: string;
    };

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const buyer = await db.user.findUnique({
      where: { email: "buyer@farmmart.io" },
    });
    if (!buyer) {
      return NextResponse.json({ error: "Buyer not found" }, { status: 400 });
    }

    const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
    const shipping = subtotal > 2500 ? 0 : 120;
    const tax = Math.round(subtotal * 0.02 * 100) / 100;
    const total = subtotal + shipping + tax;
    const orderNumber = "FM-" + Date.now().toString().slice(-8);

    // Use the first item's farmer as the order's farmer (demo simplification)
    const farmerId = items[0].farmerId;

    const order = await db.order.create({
      data: {
        orderNumber,
        buyerId: buyer.id,
        farmerId,
        subtotal,
        shipping,
        tax,
        total,
        status: "CONFIRMED",
        paymentStatus: "PAID",
        paymentMethod: paymentMethod || "UPI",
        shippingAddress: shippingAddress || "Not provided",
        trackingNote: "Order received. Farmer is preparing your shipment.",
        items: {
          create: items.map((it) => ({
            productId: it.productId,
            name: it.name,
            price: it.price,
            quantity: it.quantity,
            unit: it.unit,
            imageUrl: it.imageUrl,
            farmerId: it.farmerId,
          })),
        },
      },
      include: { items: true },
    });

    // Decrement stock & increment sold
    for (const it of items) {
      await db.product.update({
        where: { id: it.productId },
        data: {
          stock: { decrement: it.quantity },
          sold: { increment: it.quantity },
        },
      });
    }

    return NextResponse.json({ order });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
