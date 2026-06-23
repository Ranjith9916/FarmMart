import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";

// POST /api/ai/crop-advisor — AI-powered crop & farming advice
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history = [], context } = body as {
      message: string;
      history?: { role: "user" | "assistant"; content: string }[];
      context?: { role?: string; location?: string };
    };

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const zai = await ZAI.create();

    const role = context?.role || "FARMER";
    const location = context?.location || "India";

    const systemPrompt = `You are FarmMart AI, an expert agriculture advisor embedded in an agriculture marketplace platform used across India. You help ${role.toLowerCase()}s based in ${location}.

Your expertise covers:
- Crop selection, rotation, and seasonal planning for Indian agro-climatic zones
- Soil health, irrigation (drip/sprinkler), and fertilizer schedules
- Pest & disease identification and integrated pest management (IPM)
- Organic vs conventional farming practices
- Post-harvest handling, storage, grading, and pricing strategy
- Weather-smart farming decisions
- Government schemes (PM-Kisan, MSP, crop insurance) at a high level
- Market trends and when to sell for best prices

Guidelines:
- Be practical, specific, and actionable. Give concrete quantities (per acre/hectare), timings, and crop names suitable for the user's region when possible.
- Use simple, friendly language. Avoid jargon or explain it briefly.
- Structure longer answers with short sections or bullet points.
- If asked about something outside agriculture, gently steer back to farming/marketplace topics.
- Keep responses concise (usually under 250 words) unless the user asks for detail.
- You may suggest relevant FarmMart marketplace products (e.g., seeds, produce) when natural, but do not fabricate prices.`;

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemPrompt },
      ...history.slice(-8).map((h) => ({
        role: h.role,
        content: h.content,
      })),
      { role: "user", content: message },
    ];

    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: "disabled" },
    });

    const reply =
      completion?.choices?.[0]?.message?.content ||
      "I'm sorry, I couldn't generate a response. Please try again.";

    // Persist the recommendation for analytics (best-effort)
    try {
      await db.cropRecommendation.create({
        data: {
          prompt: message,
          response: reply,
          cropType: null,
        },
      });
    } catch {
      // ignore persistence errors
    }

    return NextResponse.json({ reply });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
