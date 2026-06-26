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

function seasonalBaseline(date: Date, location: string) {
  const month = date.getMonth();
  const isNorth = /punjab|haryana|delhi|up|uttar|rajasthan|kashmir/i.test(location);
  const isSouth = /kerala|tamil|karnataka|andhra|telangana|hyderabad/i.test(location);
  const swing = isNorth ? 14 : isSouth ? 7 : 9;
  const base = isNorth ? 24 : isSouth ? 29 : 28;
  const seasonal = Math.cos(((month - 4) / 12) * Math.PI * 2) * (swing / 2);
  return Math.round((base + seasonal) * 10) / 10;
}

interface CategoryAdvisory {
  category: string;
  icon: string;
  risk: "Low" | "Moderate" | "High";
  riskColor: string;
  title: string;
  advisory: string;
  metrics: { label: string; value: string; status: "good" | "watch" | "alert" }[];
}

// Generate forecast
function getForecast(location: string) {
  const rand = seededRandom(location + new Date().toDateString());
  const today = new Date();
  const baseline = seasonalBaseline(today, location);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return Array.from({ length: 7 }).map((_, i) => {
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
}

// Build category-specific advisory from weather metrics
function buildCategoryAdvisory(
  category: string,
  avgTemp: number,
  avgHumidity: number,
  totalRain: number,
  maxWind: number,
  rainyDays: number,
  hotDays: number
): CategoryAdvisory {
  const hasHeavyRain = totalRain > 50;
  const hasModerateRain = totalRain > 20;
  const isHot = avgTemp > 35;
  const isHumid = avgHumidity > 75;
  const isWindy = maxWind > 25;

  const advisories: Record<
    string,
    {
      icon: string;
      risk: CategoryAdvisory["risk"];
      title: string;
      advisory: string;
      metrics: CategoryAdvisory["metrics"];
    }
  > = {
    Grains: {
      icon: "🌾",
      risk: hasHeavyRain ? "High" : hasModerateRain ? "Moderate" : "Low",
      title: hasHeavyRain
        ? "Lodging risk — stake tall varieties"
        : isHot
          ? "Heat stress — irrigate at flowering"
          : "Favourable for grain filling",
      advisory: hasHeavyRain
        ? "Heavy rainfall forecast increases lodging risk in wheat & rice. Install wind breaks, ensure drainage channels are clear, and harvest mature crops before storms. Delay nitrogen top-dressing until fields dry."
        : isHot
          ? "High temperatures during flowering can reduce grain set. Apply light evening irrigation, use mulch to retain soil moisture, and monitor for heat stress symptoms (leaf curling, sterile spikelets)."
          : "Conditions are good for grain development. Continue regular irrigation schedule and monitor for pests. Ideal time for fertilizer application if soil moisture is adequate.",
      metrics: [
        { label: "Temp", value: `${avgTemp}°C`, status: isHot ? "alert" : avgTemp > 30 ? "watch" : "good" },
        { label: "Rain", value: `${totalRain}mm`, status: hasHeavyRain ? "alert" : hasModerateRain ? "watch" : "good" },
        { label: "Humidity", value: `${avgHumidity}%`, status: isHumid ? "watch" : "good" },
        { label: "Wind", value: `${maxWind}km/h`, status: isWindy ? "alert" : "good" },
      ],
    },
    Vegetables: {
      icon: "🥬",
      risk: hasHeavyRain || isHot ? "High" : hasModerateRain ? "Moderate" : "Low",
      title: hasHeavyRain
        ? "Fungal disease risk — spray protectant"
        : isHot
          ? "Heat scorch — use shade nets"
          : "Good growing conditions",
      advisory: hasHeavyRain
        ? "Vegetables are highly vulnerable to fungal diseases (blight, mildew) in wet conditions. Apply copper-based protectant, ensure mulching, and improve drainage. Harvest ripe tomatoes & leafy greens before rain to avoid spoilage."
        : isHot
          ? "Heat can scorch leafy vegetables and cause bitter cucumbers. Use 30-50% shade nets, mist irrigate in early morning, and harvest before 10 AM to preserve quality."
          : "Weather is favourable for vegetable cultivation. Maintain consistent soil moisture, side-dress with nitrogen, and monitor for pest pressure. Good time for sowing new vegetable beds.",
      metrics: [
        { label: "Temp", value: `${avgTemp}°C`, status: isHot ? "alert" : avgTemp > 30 ? "watch" : "good" },
        { label: "Rain", value: `${totalRain}mm`, status: hasHeavyRain ? "alert" : hasModerateRain ? "watch" : "good" },
        { label: "Humidity", value: `${avgHumidity}%`, status: isHumid ? "watch" : "good" },
        { label: "Disease", value: isHumid && hasModerateRain ? "High" : "Low", status: isHumid && hasModerateRain ? "alert" : "good" },
      ],
    },
    Fruits: {
      icon: "🍎",
      risk: hasHeavyRain ? "High" : isWindy ? "Moderate" : "Low",
      title: hasHeavyRain
        ? "Fruit cracking & rot risk"
        : isWindy
          ? "Wind damage — support branches"
          : "Good for fruit development",
      advisory: hasHeavyRain
        ? "Excess moisture causes fruit cracking in mango, pomegranate, and banana. Install rain shelters for high-value crops, prune to improve air circulation, and apply calcium sprays to strengthen skin. Harvest ripe fruits immediately."
        : isWindy
          ? "Strong winds can dislodge fruits and break branches. Stake young trees, thin heavy fruit loads, and harvest mature fruits before wind events. Net mango and guava to prevent bruising."
          : "Conditions support healthy fruit development. Maintain irrigation, apply potash for fruit quality, and monitor for fruit fly. Good time for pruning and training young orchards.",
      metrics: [
        { label: "Temp", value: `${avgTemp}°C`, status: isHot ? "watch" : "good" },
        { label: "Rain", value: `${totalRain}mm`, status: hasHeavyRain ? "alert" : hasModerateRain ? "watch" : "good" },
        { label: "Humidity", value: `${avgHumidity}%`, status: isHumid ? "watch" : "good" },
        { label: "Wind", value: `${maxWind}km/h`, status: isWindy ? "alert" : "good" },
      ],
    },
    Pulses: {
      icon: "🫘",
      risk: hasHeavyRain ? "High" : isHot ? "Moderate" : "Low",
      title: hasHeavyRain
        ? "Waterlogging — improve drainage"
        : isHot
          ? "Flower drop risk — mist cool"
          : "Favourable for pod fill",
      advisory: hasHeavyRain
        ? "Pulses (tur, moong, chickpea) are extremely sensitive to waterlogging — even 48 hours can kill plants. Open drainage channels immediately, avoid irrigation, and spray fungicide to prevent root rot. Harvest mature pods before rain."
        : isHot
          ? "High temperatures above 35°C cause flower and pod drop in pulses. Apply light sprinkler irrigation in evening, use mulch, and delay sowing if heat wave persists."
          : "Weather conditions are ideal for pulse cultivation. Maintain moderate soil moisture, inoculate with Rhizobium for nitrogen fixation, and monitor for pod borer. Good time for weed management.",
      metrics: [
        { label: "Temp", value: `${avgTemp}°C`, status: isHot ? "alert" : avgTemp > 32 ? "watch" : "good" },
        { label: "Rain", value: `${totalRain}mm`, status: hasHeavyRain ? "alert" : hasModerateRain ? "watch" : "good" },
        { label: "Moisture", value: hasHeavyRain ? "Waterlogged" : "Optimal", status: hasHeavyRain ? "alert" : "good" },
        { label: "Pod set", value: isHot ? "At risk" : "Good", status: isHot ? "alert" : "good" },
      ],
    },
    Spices: {
      icon: "🌶️",
      risk: hasHeavyRain ? "Moderate" : isHumid ? "Moderate" : "Low",
      title: hasHeavyRain
        ? "Quality risk — dry before storage"
        : isHumid
          ? "Mould risk — improve ventilation"
          : "Good curing conditions",
      advisory: hasHeavyRain
        ? "Spices (turmeric, cardamom, chilli) need proper drying after harvest. Use solar dryers or mechanical driers to prevent aflatoxin contamination. Ensure stored spices are below 10% moisture. Apply fungicide to standing turmeric crop."
        : isHumid
          ? "High humidity promotes mould and aflatoxin in stored spices. Use dehumidifiers in storage, ensure ventilation, and monitor moisture levels weekly. Sun-dry harvested spices thoroughly before bagging."
          : "Conditions are favourable for spice cultivation and curing. Maintain irrigation for turmeric and ginger, apply mulch to conserve moisture, and monitor for thrips in chilli. Ideal weather for sun-drying harvested spices.",
      metrics: [
        { label: "Temp", value: `${avgTemp}°C`, status: "good" },
        { label: "Rain", value: `${totalRain}mm`, status: hasHeavyRain ? "watch" : "good" },
        { label: "Humidity", value: `${avgHumidity}%`, status: isHumid ? "alert" : "good" },
        { label: "Drying", value: isHumid ? "Poor" : "Good", status: isHumid ? "watch" : "good" },
      ],
    },
    Dairy: {
      icon: "🥛",
      risk: isHot ? "High" : hasHeavyRain ? "Moderate" : "Low",
      title: isHot
        ? "Heat stress — cool animals"
        : hasHeavyRain
          ? "Mastitis risk — dry bedding"
          : "Comfortable for livestock",
      advisory: isHot
        ? "Heat stress reduces milk yield by 20-30%. Provide shade, fans, and cool drinking water. Feed during cooler hours, increase electrolytes, and monitor for panting. Spray cows with water 2-3 times daily. Ensure ventilation in sheds."
        : hasHeavyRain
          ? "Wet conditions increase mastitis and foot rot risk. Provide dry bedding, ensure shed drainage, and sanitize udders after milking. Store fodder under cover to prevent mould. Monitor for lameness."
          : "Weather is comfortable for dairy animals. Maintain regular feeding and milking schedule, provide clean water, and ensure ventilation. Good time for breeding and vaccination programs.",
      metrics: [
        { label: "Temp", value: `${avgTemp}°C`, status: isHot ? "alert" : avgTemp > 30 ? "watch" : "good" },
        { label: "THI", value: isHot ? "Stress" : "Comfort", status: isHot ? "alert" : "good" },
        { label: "Humidity", value: `${avgHumidity}%`, status: isHumid && isHot ? "alert" : "good" },
        { label: "Milk yield", value: isHot ? "-20%" : "Normal", status: isHot ? "alert" : "good" },
      ],
    },
    Nuts: {
      icon: "🥜",
      risk: hasHeavyRain ? "Moderate" : isWindy ? "Moderate" : "Low",
      title: hasHeavyRain
        ? "Harvest delay — dry floors"
        : isWindy
          ? "Nut drop — harvest early"
          : "Good for nut development",
      advisory: hasHeavyRain
        ? "Wet ground delays nut harvest (almond, cashew, groundnut) and risks mould. Prepare dry harvesting floors, use tarps, and dry nuts immediately after picking. Monitor stored nuts for aflatoxin. Apply gypsum to improve drainage."
        : isWindy
          ? "Strong winds cause premature nut drop and branch breakage. Harvest windfall nuts daily, stake young trees, and prune heavy canopies. Delay irrigation during high wind events."
          : "Conditions support healthy nut development. Maintain irrigation for cashew and almond, apply boron for fruit set, and monitor for nut borer. Good time for orchard floor management.",
      metrics: [
        { label: "Temp", value: `${avgTemp}°C`, status: "good" },
        { label: "Rain", value: `${totalRain}mm`, status: hasHeavyRain ? "watch" : "good" },
        { label: "Wind", value: `${maxWind}km/h`, status: isWindy ? "alert" : "good" },
        { label: "Harvest", value: hasHeavyRain ? "Delayed" : "On track", status: hasHeavyRain ? "watch" : "good" },
      ],
    },
    Herbs: {
      icon: "🌿",
      risk: hasHeavyRain ? "Moderate" : isHot ? "Moderate" : "Low",
      title: hasHeavyRain
        ? "Root rot — raise beds"
        : isHot
          ? "Bolting risk — harvest early"
          : "Ideal for herb growth",
      advisory: hasHeavyRain
        ? "Herbs (basil, mint, coriander) are prone to root rot in waterlogged soil. Raise beds, improve drainage, and harvest before heavy rain. Apply Trichoderma to prevent soil-borne diseases. Use polytunnels for high-value herbs."
        : isHot
          ? "Heat causes bolting (premature flowering) in coriander and spinach. Harvest early in the day, use shade cloth, and succession-sow every 2 weeks. Keep soil consistently moist to delay bolting."
          : "Weather is ideal for herb cultivation. Maintain consistent moisture, harvest regularly to encourage bushy growth, and apply light nitrogen doses. Perfect time for sowing coriander, mint, and basil.",
      metrics: [
        { label: "Temp", value: `${avgTemp}°C`, status: isHot ? "watch" : "good" },
        { label: "Rain", value: `${totalRain}mm`, status: hasHeavyRain ? "alert" : "good" },
        { label: "Humidity", value: `${avgHumidity}%`, status: isHumid ? "watch" : "good" },
        { label: "Bolting", value: isHot ? "Risk" : "Low", status: isHot ? "watch" : "good" },
      ],
    },
  };

  const data = advisories[category];
  const riskColor =
    data.risk === "High"
      ? "bg-destructive/15 text-destructive"
      : data.risk === "Moderate"
        ? "bg-amber-500/15 text-amber-700"
        : "bg-green-600/15 text-green-700";

  return { category, ...data, riskColor };
}

// GET /api/ai/weather/category?location=... — category-specific weather advisories
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const location = (searchParams.get("location") || "Nashik, Maharashtra").trim();

    // Check cache
    const cacheKey = `category:${location}`;
    const cached = await db.weatherCache.findUnique({ where: { location: cacheKey } });
    const now = Date.now();
    if (cached && now - cached.updatedAt.getTime() < 60 * 60 * 1000) {
      return NextResponse.json(JSON.parse(cached.payload));
    }

    const forecast = getForecast(location);

    // Calculate aggregate metrics for the 7-day period
    const avgTemp = Math.round(
      forecast.reduce((s, f) => s + (f.tempHigh + f.tempLow) / 2, 0) / forecast.length
    );
    const avgHumidity = Math.round(
      forecast.reduce((s, f) => s + f.humidity, 0) / forecast.length
    );
    const totalRain = Math.round(
      forecast.reduce((s, f) => s + f.rainfall, 0) * 10
    ) / 10;
    const maxWind = Math.max(...forecast.map((f) => f.wind));
    const rainyDays = forecast.filter((f) => f.rainfall > 0).length;
    const hotDays = forecast.filter((f) => f.tempHigh > 35).length;

    // Build advisories for all 8 categories
    const categories = ["Grains", "Vegetables", "Fruits", "Pulses", "Spices", "Dairy", "Nuts", "Herbs"];
    const categoryAdvisories = categories.map((cat) =>
      buildCategoryAdvisory(cat, avgTemp, avgHumidity, totalRain, maxWind, rainyDays, hotDays)
    );

    // Generate a summary advisory via LLM (best-effort)
    let summary = "";
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
              "You are FarmMart's weather-smart farming advisor. Given a 7-day forecast, give a 2-sentence summary of the overall weather outlook and which crop categories are most at risk. Plain text, under 60 words.",
          },
          {
            role: "user",
            content: `Location: ${location}\n7-day forecast: ${weatherSummary}\n\nGive a summary of which crop categories are most at risk this week.`,
          },
        ],
        thinking: { type: "disabled" },
      });
      summary =
        completion?.choices?.[0]?.message?.content ||
        "Monitor weather conditions and adjust farming operations accordingly.";
    } catch {
      summary = "Monitor weather conditions and adjust farming operations accordingly.";
    }

    const payload = {
      location,
      metrics: {
        avgTemp,
        avgHumidity,
        totalRain,
        maxWind,
        rainyDays,
        hotDays,
      },
      summary,
      categories: categoryAdvisories,
    };

    // Upsert cache
    try {
      await db.weatherCache.upsert({
        where: { location: cacheKey },
        update: { payload: JSON.stringify(payload), updatedAt: new Date() },
        create: { location: cacheKey, payload: JSON.stringify(payload) },
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
