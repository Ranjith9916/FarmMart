import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";

// Deterministic pseudo-random based on a string seed
function seededRandom(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CONDITIONS = [
  { c: "Sunny", icon: "☀️" },
  { c: "Partly Cloudy", icon: "⛅" },
  { c: "Cloudy", icon: "☁️" },
  { c: "Light Rain", icon: "🌦️" },
  { c: "Thunderstorm", icon: "⛈️" },
  { c: "Clear", icon: "🌙" },
];

// Seasonal baseline temperatures for Indian regions (°C)
function seasonalBaseline(date: Date, location: string) {
  const month = date.getMonth(); // 0-11
  const isNorth = /punjab|haryana|delhi|up|uttar|rajasthan|kashmir/i.test(location);
  const isSouth = /kerala|tamil|karnataka|andhra|telangana|hyderabad/i.test(location);
  const isCoastal = /mumbai|gujarat|goa|konkan|orissa|bengal|kolkata/i.test(location);

  // North has wider seasonal swing, south/coastal more stable
  const swing = isNorth ? 14 : isSouth ? 7 : 9;
  const base = isNorth ? 24 : isSouth ? 29 : 28;
  // peak summer ~ May (month 4), peak winter ~ Jan (month 0)
  const seasonal = Math.cos(((month - 4) / 12) * Math.PI * 2) * (swing / 2);
  return Math.round((base + seasonal) * 10) / 10;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const location =
      (searchParams.get("location") || "Nashik, Maharashtra").trim();

    // Check cache (1 hour)
    const cached = await db.weatherCache.findUnique({
      where: { location },
    });
    const now = Date.now();
    if (cached && now - cached.updatedAt.getTime() < 60 * 60 * 1000) {
      return NextResponse.json(JSON.parse(cached.payload));
    }

    const rand = seededRandom(location + new Date().toDateString());
    const today = new Date();
    const baseline = seasonalBaseline(today, location);

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const forecast = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today.getTime() + i * 86400000);
      const condIdx = Math.floor(rand() * CONDITIONS.length);
      const cond = CONDITIONS[condIdx];
      const tempHigh = Math.round(baseline + 4 + (rand() * 4 - 2));
      const tempLow = Math.round(baseline - 5 + (rand() * 3 - 1.5));
      const rainy = cond.c.includes("Rain") || cond.c.includes("Thunder");
      return {
        date: d.toISOString().slice(0, 10),
        day: i === 0 ? "Today" : days[d.getDay()],
        tempHigh,
        tempLow,
        condition: cond.c,
        icon: cond.icon,
        humidity: Math.round(40 + rand() * 50),
        rainfall: rainy ? Math.round(rand() * 35 * 10) / 10 : 0,
        wind: Math.round(6 + rand() * 22),
      };
    });

    const current = {
      temp: forecast[0].tempHigh,
      condition: forecast[0].condition,
      icon: forecast[0].icon,
      humidity: forecast[0].humidity,
      wind: forecast[0].wind,
      rainfall: forecast[0].rainfall,
    };

    // Generate farming advisory via LLM
    let advisory = "";
    try {
      const zai = await ZAI.create();
      const weatherSummary = forecast
        .map(
          (f) =>
            `${f.day}: ${f.condition}, ${f.tempLow}–${f.tempHigh}°C, humidity ${f.humidity}%, rain ${f.rainfall}mm, wind ${f.wind}km/h`
        )
        .join("; ");
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are FarmMart's weather-smart farming advisor for Indian farmers. Given a 7-day weather forecast and location, give 3-4 short, actionable bullet-point recommendations covering irrigation, pesticide spraying, harvesting, and any risk alerts. Be specific and concise. Use plain text with '• ' bullets. Under 120 words.",
          },
          {
            role: "user",
            content: `Location: ${location}\n7-day forecast: ${weatherSummary}\n\nGive farming advisory.`,
          },
        ],
        thinking: { type: "disabled" },
      });
      advisory =
        completion?.choices?.[0]?.message?.content ||
        "• Monitor fields daily and adjust irrigation based on rainfall forecast.";
    } catch {
      advisory =
        "• Monitor fields daily and adjust irrigation based on rainfall forecast.\n• Avoid pesticide spraying on rainy days.\n• Harvest mature crops before forecasted thunderstorms.";
    }

    const payload = { location, current, forecast, advisory };

    // Upsert cache
    try {
      await db.weatherCache.upsert({
        where: { location },
        update: { payload: JSON.stringify(payload), updatedAt: new Date() },
        create: { location, payload: JSON.stringify(payload) },
      });
    } catch {
      // ignore
    }

    return NextResponse.json(payload);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
