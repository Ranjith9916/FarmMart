import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const VALID_ROLES = ["BUYER", "FARMER", "WHOLESALER", "TRANSPORTER"];

// POST /api/auth/register — create a new user account
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role, location, phone } = body as {
      name: string;
      email: string;
      password: string;
      role: string;
      location?: string;
      phone?: string;
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
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
