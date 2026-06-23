import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const FLOW: Record<string, string> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "PACKED",
  PACKED: "SHIPPED",
  SHIPPED: "DELIVERED",
};

// PATCH /api/orders/[id] — advance order status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action } = body as { action: "advance" | "cancel" };

    const order = await db.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let status = order.status;
    let trackingNote = order.trackingNote;
    if (action === "cancel") {
      status = "CANCELLED";
      trackingNote = "Order cancelled by user.";
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
      data: { status, trackingNote },
      include: { items: true },
    });
    return NextResponse.json({ order: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
