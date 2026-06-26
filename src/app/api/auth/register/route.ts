import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const VALID_ROLES = ["BUYER", "FARMER", "WHOLESALER", "TRANSPORTER"];

// POST /api/auth/register — create a new user account
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      password,
      role,
      location,
      phone,
      vehicleType,
      vehicleNumber,
      licenseNumber,
      capacity,
      transportArea,
    } = body as {
      name: string;
      email: string;
      password: string;
      role: string;
      location?: string;
      phone?: string;
      vehicleType?: string;
      vehicleNumber?: string;
      licenseNumber?: string;
      capacity?: string;
      transportArea?: string;
    };

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { error: "A valid email is required" },
        { status: 400 }
      );
    }
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }
    const finalRole = VALID_ROLES.includes(role) ? role : "BUYER";

    // Transporter-specific validation
    if (finalRole === "TRANSPORTER") {
      if (!vehicleType?.trim()) {
        return NextResponse.json(
          { error: "Vehicle type is required for transporters" },
          { status: 400 }
        );
      }
      if (!vehicleNumber?.trim()) {
        return NextResponse.json(
          { error: "Vehicle number is required for transporters" },
          { status: 400 }
        );
      }
      if (!licenseNumber?.trim()) {
        return NextResponse.json(
          { error: "License number is required for transporters" },
          { status: 400 }
        );
      }
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check for existing user
    const existing = await db.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const user = await db.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password,
        role: finalRole,
        location: location?.trim() || null,
        phone: phone?.trim() || null,
        vehicleType: vehicleType?.trim() || null,
        vehicleNumber: vehicleNumber?.trim() || null,
        licenseNumber: licenseNumber?.trim() || null,
        capacity: capacity?.trim() || null,
        transportArea: transportArea?.trim() || null,
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        location: user.location,
        avatar: user.avatar,
        rating: user.rating,
        vehicleType: user.vehicleType,
        vehicleNumber: user.vehicleNumber,
        licenseNumber: user.licenseNumber,
        capacity: user.capacity,
        transportArea: user.transportArea,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
