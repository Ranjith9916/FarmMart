import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// PATCH /api/auth/profile — update user profile (name, phone, location, avatar, etc.)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, ...updates } = body as {
      userId: string;
      name?: string;
      phone?: string;
      location?: string;
      avatar?: string;
      vehicleType?: string;
      vehicleNumber?: string;
      licenseNumber?: string;
      capacity?: string;
      transportArea?: string;
    };

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build update data — only include provided fields
    const data: Record<string, string | null> = {};
    if (updates.name !== undefined) data.name = updates.name.trim();
    if (updates.phone !== undefined) data.phone = updates.phone.trim() || null;
    if (updates.location !== undefined) data.location = updates.location.trim() || null;
    if (updates.avatar !== undefined) data.avatar = updates.avatar || null;
    if (updates.vehicleType !== undefined) data.vehicleType = updates.vehicleType || null;
    if (updates.vehicleNumber !== undefined) data.vehicleNumber = updates.vehicleNumber || null;
    if (updates.licenseNumber !== undefined) data.licenseNumber = updates.licenseNumber || null;
    if (updates.capacity !== undefined) data.capacity = updates.capacity || null;
    if (updates.transportArea !== undefined) data.transportArea = updates.transportArea || null;

    const updated = await db.user.update({
      where: { id: userId },
      data,
    });

    return NextResponse.json({
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        phone: updated.phone,
        location: updated.location,
        avatar: updated.avatar,
        rating: updated.rating,
        vehicleType: updated.vehicleType,
        vehicleNumber: updated.vehicleNumber,
        licenseNumber: updated.licenseNumber,
        capacity: updated.capacity,
        transportArea: updated.transportArea,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
