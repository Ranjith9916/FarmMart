import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/reviews — create a review, update product rating
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, rating, comment, userId } = body;
    if (!productId || !rating || !comment || !userId) {
      return NextResponse.json(
        { error: "productId, rating, comment, and userId are required" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const review = await db.review.create({
      data: {
        productId,
        userId: user.id,
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
