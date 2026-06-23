import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/products — list with filters/search/sort/pagination
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const category = searchParams.get("category") || "";
    const location = searchParams.get("location") || "";
    const organic = searchParams.get("organic");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sort = searchParams.get("sort") || "popular";
    const limit = parseInt(searchParams.get("limit") || "100");

    const where: Record<string, unknown> = { active: true };
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { description: { contains: q } },
        { tags: { contains: q } },
      ];
    }
    if (category && category !== "All") where.category = category;
    if (location && location !== "All") where.location = location;
    if (organic === "true") where.organic = true;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) (where.price as { gte?: number }).gte = parseFloat(minPrice);
      if (maxPrice) (where.price as { lte?: number }).lte = parseFloat(maxPrice);
    }

    let orderBy: Record<string, "asc" | "desc"> = { sold: "desc" };
    if (sort === "price-asc") orderBy = { price: "asc" };
    else if (sort === "price-desc") orderBy = { price: "desc" };
    else if (sort === "rating") orderBy = { rating: "desc" };
    else if (sort === "newest") orderBy = { createdAt: "desc" };

    const products = await db.product.findMany({
      where,
      orderBy,
      take: limit,
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            location: true,
            rating: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({ products });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/products — create a product (farmer dashboard)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      category,
      description,
      price,
      unit,
      stock,
      imageUrl,
      location,
      organic,
      harvestDate,
      tags,
      farmerId,
    } = body;

    if (!name || !category || !price || !farmerId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const product = await db.product.create({
      data: {
        name,
        category,
        description: description || "",
        price: parseFloat(price),
        unit: unit || "kg",
        stock: parseFloat(stock || "0"),
        imageUrl:
          imageUrl || "https://sfile.chatglm.cn/images-ppt/2f199b3ef558.jpg",
        location: location || "Unknown",
        organic: !!organic,
        harvestDate: harvestDate || null,
        tags: tags || "",
        farmerId,
        rating: 4.5,
        reviewCount: 0,
        sold: 0,
        active: true,
      },
    });

    return NextResponse.json({ product });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
