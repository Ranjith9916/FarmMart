import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const FLOW: Record<string, string> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "PACKED",
  PACKED: "SHIPPED",
  SHIPPED: "DELIVERED",
};

// PATCH /api/orders/[id] — advance or cancel an order
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, reason } = body as {
      action: "advance" | "cancel";
      reason?: string;
    };

    const order = await db.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Can't modify already-delivered or already-cancelled orders
    if (order.status === "DELIVERED" || order.status === "CANCELLED") {
      return NextResponse.json(
        { error: `Order is already ${order.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    let status = order.status;
    let trackingNote = order.trackingNote;
    let paymentStatus = order.paymentStatus;

    if (action === "cancel") {
      status = "CANCELLED";
      paymentStatus = "REFUNDED";
      const reasonText = reason ? ` Reason: ${reason}.` : "";
      trackingNote = `Order cancelled.${reasonText}`;
    } else if (action === "advance") {
      status = FLOW[order.status] || order.status;
      const notes: Record<string, string> = {
        CONFIRMED: "Order confirmed. Farmer is preparing your shipment.",
        PACKED: "Packed and ready for pickup by transporter.",
        SHIPPED: "Shipped via FastTrack Logistics. In transit to your city.",
        DELIVERED: "Delivered. Thank you for shopping with FarmMart!",
      };
      trackingNote = notes[status] || trackingNote;
    }

    const updated = await db.order.update({
      where: { id },
      data: { status, trackingNote, paymentStatus },
      include: { items: true },
    });

    // If cancelled, restore product stock & reduce sold count
    if (action === "cancel") {
      for (const item of order.items) {
        await db.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity },
            sold: { decrement: item.quantity },
          },
        });
      }
    }

    return NextResponse.json({ order: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
