import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/reviews — create a review, update product rating
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, rating, comment } = body;
    if (!productId || !rating || !comment) {
      return NextResponse.json(
        { error: "productId, rating, comment are required" },
        { status: 400 }
      );
    }
    // Use the demo buyer as the reviewer
    const buyer = await db.user.findUnique({
      where: { email: "buyer@farmmart.io" },
    });
    if (!buyer) {
      return NextResponse.json({ error: "No buyer user found" }, { status: 400 });
    }

    const review = await db.review.create({
      data: {
        productId,
        userId: buyer.id,
        rating: parseInt(rating),
        comment,
      },
      include: { user: { select: { id: true, name: true } } },
    });

    // Recompute product aggregate rating
    const agg = await db.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await db.product.update({
      where: { id: productId },
      data: {
        rating: Math.round((agg._avg.rating || 5) * 10) / 10,
        reviewCount: agg._count.rating,
      },
    });

    return NextResponse.json({ review });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
