import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/auth/google — Google OAuth login (simulated)
// Accepts a Google profile (email, name, avatar) and either logs in
// an existing user or creates a new one automatically.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, avatar } = body as {
      email: string;
      name: string;
      avatar?: string;
    };

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { error: "A valid email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    let user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Auto-create account for Google users (no password needed)
      const finalName = name || normalizedEmail.split("@")[0];
      user = await db.user.create({
        data: {
          name: finalName,
          email: normalizedEmail,
          password: "google-oauth-" + Date.now(), // random — Google users don't use password login
          role: "BUYER",
          avatar: avatar || null,
          location: null,
          phone: null,
        },
      });
    }

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
