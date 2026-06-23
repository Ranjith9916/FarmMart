import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/products/[id] — single product with reviews
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await db.product.findUnique({
      where: { id },
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            location: true,
            rating: true,
            avatar: true,
            phone: true,
          },
        },
        reviews: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        priceHistory: { orderBy: { recordedAt: "asc" } },
      },
    });
    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ product });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PATCH /api/products/[id] — update product (inventory/price)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data: Record<string, unknown> = {};
    for (const k of [
      "name",
      "category",
      "description",
      "price",
      "unit",
      "stock",
      "imageUrl",
      "location",
      "organic",
      "harvestDate",
      "tags",
      "active",
    ]) {
      if (k in body) data[k] = body[k];
    }
    if (data.price !== undefined) data.price = parseFloat(data.price as string);
    if (data.stock !== undefined) data.stock = parseFloat(data.stock as string);

    const product = await db.product.update({ where: { id }, data });
    return NextResponse.json({ product });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/products/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
