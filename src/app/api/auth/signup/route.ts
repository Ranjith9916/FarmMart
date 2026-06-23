import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/auth/signup — register a new user
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, role } = body as {
      name: string;
      email: string;
      role: string;
    };

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const validRoles = ["BUYER", "FARMER", "WHOLESALER", "TRANSPORTER"];
    const finalRole = validRoles.includes(role) ? role : "BUYER";

    // Check if the email is already taken
    const existing = await db.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in." },
        { status: 409 }
      );
    }

    const user = await db.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        role: finalRole,
        location: null,
        rating: 5,
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
