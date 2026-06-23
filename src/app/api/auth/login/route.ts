import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Demo password for all seeded accounts — shown on the login screen.
const DEMO_PASSWORD = "farmmart";

// POST /api/auth/login — authenticate a user by email + password
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body as { email: string; password: string };

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Look up the user by email
    let user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    // If the email matches a demo role alias, resolve to that user
    if (!user) {
      const aliasMap: Record<string, string> = {
        buyer: "buyer@farmmart.io",
        farmer: "ravi@farmmart.io",
        wholesaler: "bulk@farmmart.io",
        transporter: "fleet@farmmart.io",
      };
      const aliased = aliasMap[normalizedEmail];
      if (aliased) {
        user = await db.user.findUnique({ where: { email: aliased } });
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "No account found with that email. Try signing up." },
        { status: 404 }
      );
    }

    // Validate password (demo: accept the shared demo password or the user's name)
    const valid =
      password === DEMO_PASSWORD ||
      password.toLowerCase() === user.name.toLowerCase();

    if (!valid) {
      return NextResponse.json(
        { error: "Incorrect password. Use the demo password: farmmart" },
        { status: 401 }
      );
    }

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
