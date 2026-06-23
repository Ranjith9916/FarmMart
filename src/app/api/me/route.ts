import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/me?role=FARMER — resolve the demo user for the active role
// In a production app this would use the authenticated session.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const role = (searchParams.get("role") || "BUYER").toUpperCase();

    // Map each role to its demo user
    const emailByRole: Record<string, string> = {
      BUYER: "buyer@farmmart.io",
      FARMER: "ravi@farmmart.io",
      WHOLESALER: "bulk@farmmart.io",
      TRANSPORTER: "fleet@farmmart.io",
    };

    const email = emailByRole[role] || emailByRole.BUYER;
    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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
