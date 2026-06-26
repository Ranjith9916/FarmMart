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

type Role = "FARMER" | "BUYER" | "WHOLESALER" | "TRANSPORTER";

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

// Role-specific advisory content for each category
// Structure: category -> role -> { title, advisory } (conditions applied inside)
function getRoleAdvisory(
  category: string,
  role: Role,
  w: {
    hasHeavyRain: boolean;
    hasModerateRain: boolean;
    isHot: boolean;
    isHumid: boolean;
    isWindy: boolean;
    avgTemp: number;
    totalRain: number;
    avgHumidity: number;
    maxWind: number;
  }
): { title: string; advisory: string } {
  const { hasHeavyRain, hasModerateRain, isHot, isHumid, isWindy, avgTemp, totalRain } = w;

  const content: Record<string, Record<Role, { title: string; advisory: string }>> = {
    Grains: {
      FARMER: hasHeavyRain
        ? { title: "Lodging risk — stake tall varieties", advisory: "Heavy rainfall forecast increases lodging risk in wheat & rice. Install wind breaks, ensure drainage channels are clear, and harvest mature crops before storms. Delay nitrogen top-dressing until fields dry." }
        : isHot
          ? { title: "Heat stress — irrigate at flowering", advisory: "High temperatures during flowering can reduce grain set. Apply light evening irrigation, use mulch to retain soil moisture, and monitor for heat stress symptoms (leaf curling, sterile spikelets)." }
          : { title: "Favourable for grain filling", advisory: "Conditions are good for grain development. Continue regular irrigation schedule and monitor for pests. Ideal time for fertilizer application if soil moisture is adequate." },
      BUYER: hasHeavyRain
        ? { title: "Prices may rise — stock up now", advisory: "Heavy rain can damage standing grain crops, potentially tightening supply and raising prices in 2-3 weeks. Consider buying ahead for your needs. Quality of freshly harvested grain may be lower — check moisture content before purchase." }
        : isHot
          ? { title: "Stable supply — good buying window", advisory: "Current weather supports normal grain harvest. Prices should remain stable. Good time to purchase wheat and rice at fair rates. Store in airtight containers to prevent pest infestation." }
          : { title: "Good availability — competitive prices", advisory: "Favourable growing conditions mean steady grain supply. Compare prices across farms and buy in bulk for better rates. Look for freshly harvested stock with good grain fill." },
      WHOLESALER: hasHeavyRain
        ? { title: "Procure now — supply squeeze ahead", advisory: "Heavy rainfall will disrupt grain harvest and transport, likely causing a supply squeeze in 2-3 weeks. Procure inventory now at current prices. Ensure warehouse is dry and pest-controlled — grain moisture must stay below 12% for long-term storage." }
        : isHot
          ? { title: "Normal procurement — monitor quality", advisory: "Weather conditions support regular grain procurement. Maintain steady supply contracts. Monitor incoming grain for heat-damaged kernels. Storage temperatures above 30°C increase pest activity — fumigate as needed." }
          : { title: "Stable supply chain — build inventory", advisory: "Favourable conditions ensure a stable grain supply chain. Good time to build inventory at competitive prices. Diversify procurement across regions to hedge against localized weather events." },
      TRANSPORTER: hasHeavyRain
        ? { title: "Road closures likely — plan routes", advisory: "Heavy rain may cause waterlogging on rural roads to grain mandis. Expect delays of 6-12 hours. Use covered trucks with tarpaulin to protect grain from moisture. Check road conditions before dispatch and plan alternate routes." }
        : isHot
          ? { title: "Hot roads — schedule night transport", advisory: "High temperatures can affect grain quality in transit. Schedule long-haul transport during cooler night hours. Ensure trucks are ventilated. Check tyre pressure — hot roads increase blowout risk." }
          : { title: "Good driving conditions", advisory: "Weather is clear for grain transport operations. Roads are dry and visibility is good. Maintain regular schedules. Ensure grain is covered to prevent dust contamination." },
    },
    Vegetables: {
      FARMER: hasHeavyRain
        ? { title: "Fungal disease risk — spray protectant", advisory: "Vegetables are highly vulnerable to fungal diseases (blight, mildew) in wet conditions. Apply copper-based protectant, ensure mulching, and improve drainage. Harvest ripe tomatoes & leafy greens before rain to avoid spoilage." }
        : isHot
          ? { title: "Heat scorch — use shade nets", advisory: "Heat can scorch leafy vegetables and cause bitter cucumbers. Use 30-50% shade nets, mist irrigate in early morning, and harvest before 10 AM to preserve quality." }
          : { title: "Good growing conditions", advisory: "Weather is favourable for vegetable cultivation. Maintain consistent soil moisture, side-dress with nitrogen, and monitor for pest pressure. Good time for sowing new vegetable beds." },
      BUYER: hasHeavyRain
        ? { title: "Quality may drop — inspect carefully", advisory: "Rain increases the risk of fungal spots and waterlogging damage in vegetables. Inspect produce carefully for soft spots and mould. Prices may rise for premium-quality stock. Buy locally-grown to reduce transit damage." }
        : isHot
          ? { title: "Expect bitter cucumbers & bolted greens", advisory: "Heat stress makes leafy greens bolt (turn bitter) and cucumbers taste bitter. Ask farmers about harvest timing — early morning picks are sweeter. Prices for heat-sensitive varieties may be higher." }
          : { title: "Fresh & abundant — best quality", advisory: "Ideal weather means vegetables are fresh, crisp, and abundant. Prices should be competitive. Great time to buy tomatoes, leafy greens, and cucumbers. Look for firm, brightly coloured produce." },
      WHOLESALER: hasHeavyRain
        ? { title: "Spoilage risk — reduce order volumes", advisory: "Wet conditions increase post-harvest losses in vegetables by 15-25%. Reduce order volumes and increase frequency to minimize spoilage. Invest in cold storage and dehumidifiers. Demand higher quality grades from suppliers — reject water-damaged stock." }
        : isHot
          ? { title: "Cold chain critical — check refrigeration", advisory: "High temperatures accelerate vegetable deterioration. Ensure cold chain integrity from farm to warehouse — maintain 4-8°C. Pre-cool produce before loading. Expect higher rejection rates and plan buffer stock." }
          : { title: "Good storage conditions — bulk up", advisory: "Favourable weather reduces post-harvest losses. Good time to increase inventory levels. Maintain 85-90% humidity in cold storage. Diversify vegetable range to meet varied demand." },
      TRANSPORTER: hasHeavyRain
        ? { title: "Rush delivery — spoilage risk high", advisory: "Vegetables spoil rapidly in wet, humid transport conditions. Prioritize fastest routes and reduce transit time. Use refrigerated trucks where possible. Load under cover and use ventilated crates. Avoid open trucks." }
        : isHot
          ? { title: "Reefer mandatory — maintain cold chain", advisory: "High heat makes refrigerated transport essential for vegetables. Pre-cool the truck before loading. Maintain 4-8°C throughout transit. Minimize door-opening stops. Schedule deliveries for early morning." }
          : { title: "Standard transit — minimal risk", advisory: "Weather conditions are good for vegetable transport. Use covered trucks with adequate ventilation. Maintain regular delivery schedules. Roads are clear — no weather delays expected." },
    },
    Fruits: {
      FARMER: hasHeavyRain
        ? { title: "Fruit cracking & rot risk", advisory: "Excess moisture causes fruit cracking in mango, pomegranate, and banana. Install rain shelters for high-value crops, prune to improve air circulation, and apply calcium sprays to strengthen skin. Harvest ripe fruits immediately." }
        : isWindy
          ? { title: "Wind damage — support branches", advisory: "Strong winds can dislodge fruits and break branches. Stake young trees, thin heavy fruit loads, and harvest mature fruits before wind events. Net mango and guava to prevent bruising." }
          : { title: "Good for fruit development", advisory: "Conditions support healthy fruit development. Maintain irrigation, apply potash for fruit quality, and monitor for fruit fly. Good time for pruning and training young orchards." },
      BUYER: hasHeavyRain
        ? { title: "Check for cracks & bruising", advisory: "Rain can cause fruit cracking (especially pomegranate, mango) and promote rot. Inspect fruits carefully before buying. Prices for premium unblemished fruit may rise. Buy ripe fruits immediately — they won't store well in humid weather." }
        : isHot
          ? { title: "Sweet & ripe — best flavour", advisory: "Heat speeds up ripening, making fruits sweeter and more flavourful. Great time for mangoes, melons, and bananas. However, shelf life is shorter — consume quickly. Ask for same-day harvest for best quality." }
          : { title: "Peak quality & fair prices", advisory: "Favourable weather means fruits are developing well with good colour and flavour. Prices should be reasonable. Excellent time to buy seasonal fruits. Look for firm, aromatic produce." },
      WHOLESALER: hasHeavyRain
        ? { title: "Rejections high — tighten QC", advisory: "Rain-damaged fruits (cracks, rot, bruising) will increase rejection rates by 20-30%. Tighten quality control at procurement. Process or divert Grade B fruit to juice/pulp immediately. Invest in sorting lines and cold storage — humidity accelerates decay." }
        : isHot
          ? { title: "Ripening fast — rotate inventory", advisory: "Heat accelerates fruit ripening, reducing shelf life. Implement FIFO (first-in-first-out) inventory rotation. Pre-cool fruits within 4 hours of arrival. Monitor ethylene levels in storage — use scrubbers for sensitive varieties." }
          : { title: "Good storage window — stock up", advisory: "Favourable conditions extend fruit shelf life. Good time to build inventory of apples, pomegranates, and citrus. Maintain 0-4°C cold storage. Diversify fruit range to capture seasonal demand peaks." },
      TRANSPORTER: hasHeavyRain
        ? { title: "Delicate cargo — drive carefully", advisory: "Wet roads increase braking distance and accident risk for fruit transport. Use padded crates and reduce load height to prevent pressure bruising. Cover trucks with waterproof tarpaulin. Expect 20-30% longer transit times." }
        : isHot
          ? { title: "Pre-cool before loading — critical", advisory: "Fruits must be pre-cooled before loading in hot weather. Use reefer trucks at 2-5°C. Never leave loaded trucks in the sun. Minimize stops. Heat exposure for even 2 hours can ruin a full load." }
          : { title: "Smooth transit — good conditions", advisory: "Weather is ideal for fruit transport. Roads are dry and temperatures moderate. Use standard refrigerated trucks. Maintain regular delivery schedules. Minimal spoilage risk during transit." },
    },
    Pulses: {
      FARMER: hasHeavyRain
        ? { title: "Waterlogging — improve drainage", advisory: "Pulses (tur, moong, chickpea) are extremely sensitive to waterlogging — even 48 hours can kill plants. Open drainage channels immediately, avoid irrigation, and spray fungicide to prevent root rot. Harvest mature pods before rain." }
        : isHot
          ? { title: "Flower drop risk — mist cool", advisory: "High temperatures above 35°C cause flower and pod drop in pulses. Apply light sprinkler irrigation in evening, use mulch, and delay sowing if heat wave persists." }
          : { title: "Favourable for pod fill", advisory: "Weather conditions are ideal for pulse cultivation. Maintain moderate soil moisture, inoculate with Rhizobium for nitrogen fixation, and monitor for pod borer. Good time for weed management." },
      BUYER: hasHeavyRain
        ? { title: "Supply may tighten — buy ahead", advisory: "Waterlogging can destroy pulse crops, potentially reducing supply and raising prices in 4-6 weeks. Consider stocking up on tur dal and chana now. Check stored pulses for mould — high humidity promotes aflatoxin." }
        : isHot
          ? { title: "Prices stable — normal supply", advisory: "Heat may reduce yields slightly but supply should remain adequate. Prices for toor dal and moong are likely stable. Buy in bulk for better rates. Ensure pulses are fully dry before storage." }
          : { title: "Good supply — fair prices", advisory: "Favourable growing conditions mean steady pulse supply. Compare prices across suppliers. Look for unpolished dal which retains more protein. Store in airtight containers to prevent weevils." },
      WHOLESALER: hasHeavyRain
        ? { title: "Supply squeeze risk — procure now", advisory: "Waterlogging can cause 20-40% pulse crop loss, triggering a price spike in 4-6 weeks. Build inventory now at current prices. Ensure warehouse moisture is below 10% — pulses absorb humidity rapidly and develop mould." }
        : isHot
          ? { title: "Normal procurement — watch moisture", advisory: "Weather supports regular pulse procurement. Monitor incoming stock for heat-damaged or shriveled grains. Storage temperature above 30°C encourages bruchid beetle — fumigate with phosphine every 6 weeks." }
          : { title: "Stable supply — build buffer stock", advisory: "Good conditions ensure steady pulse supply. Build buffer stock of tur, moong, and chana at competitive prices. Maintain 10-12% moisture in storage. Diversify suppliers across regions." },
      TRANSPORTER: hasHeavyRain
        ? { title: "Moisture damage — use tarps", advisory: "Pulses easily absorb moisture during rainy transport, leading to mould and weight gain disputes. Double-tarp all loads. Use closed containers for high-value pulses. Check for leaks before loading. Weigh before and after transit." }
        : isHot
          ? { title: "Standard transport — keep dry", advisory: "Dry heat is good for pulse transport — low moisture risk. Use covered trucks. Ensure bags are intact and pallets are used to keep stock off the floor. Schedule long-haul trips for night to avoid driver fatigue." }
          : { title: "Good transit conditions", advisory: "Weather is clear for pulse transport. Use standard covered trucks. Maintain regular schedules. Ensure bags are properly stacked and secured for transit." },
    },
    Spices: {
      FARMER: hasHeavyRain
        ? { title: "Quality risk — dry before storage", advisory: "Spices (turmeric, cardamom, chilli) need proper drying after harvest. Use solar dryers or mechanical driers to prevent aflatoxin contamination. Ensure stored spices are below 10% moisture. Apply fungicide to standing turmeric crop." }
        : isHumid
          ? { title: "Mould risk — improve ventilation", advisory: "High humidity promotes mould and aflatoxin in stored spices. Use dehumidifiers in storage, ensure ventilation, and monitor moisture levels weekly. Sun-dry harvested spices thoroughly before bagging." }
          : { title: "Good curing conditions", advisory: "Conditions are favourable for spice cultivation and curing. Maintain irrigation for turmeric and ginger, apply mulch to conserve moisture, and monitor for thrips in chilli. Ideal weather for sun-drying harvested spices." },
      BUYER: hasHeavyRain
        ? { title: "Quality may vary — test for aflatoxin", advisory: "Rain during harvest increases aflatoxin risk in turmeric and chilli. Ask for quality test certificates. Colour and aroma may be dull in rain-affected stock. Premium-grade spices may be scarce — prices could rise." }
        : isHot
          ? { title: "Strong aroma — good quality", advisory: "Heat concentrates essential oils in spices, giving stronger colour and aroma. Great time to buy turmeric, chilli, and cardamom. Prices should be competitive. Store in airtight, dark containers to preserve potency." }
          : { title: "Fresh & fragrant — best quality", advisory: "Favourable weather produces high-quality spices with good colour and aroma. Compare grades and prices. Look for whole spices rather than powder for longer shelf life. Check for ISO or Agmark certification." },
      WHOLESALER: hasHeavyRain
        ? { title: "Quality control critical — test every batch", advisory: "Rain-affected spices carry high aflatoxin risk. Test every batch before accepting. Reject stock above 10ppb aflatoxin. Invest in mechanical dryers to process wet stock. Price spreads between grades will widen — stock premium grade." }
        : isHumid
          ? { title: "Dehumidify storage — mould risk", advisory: "High humidity causes caking, colour loss, and mould in stored spices. Maintain storage humidity below 40% with dehumidifiers. Use moisture-barrier packaging. Rotate stock weekly. Cardamom is especially vulnerable." }
          : { title: "Good storage conditions — stock up", advisory: "Favourable dry weather is ideal for spice storage and procurement. Build inventory of turmeric, chilli, and cardamom. Maintain 8-10% moisture. Vacuum-seal premium grades for extended shelf life." },
      TRANSPORTER: hasHeavyRain
        ? { title: "Moisture-sensitive — use sealed containers", advisory: "Spices are extremely moisture-sensitive — even slight dampness causes mould and colour loss. Use sealed, waterproof containers only. Never use open trucks. Place moisture absorbers (silica gel) in each load. Inspect for leaks." }
        : isHot
          ? { title: "Heat affects potency — keep cool", advisory: "Extreme heat can degrade essential oils in spices during long transit. Use insulated trucks. Avoid direct sun on cargo. Schedule deliveries for cooler hours. Cardamom and saffron are most heat-sensitive." }
          : { title: "Standard transit — low risk", advisory: "Weather conditions are good for spice transport. Use standard covered trucks. Keep spices in sealed bags. Minimal quality risk during transit. Maintain regular delivery schedules." },
    },
    Dairy: {
      FARMER: isHot
        ? { title: "Heat stress — cool animals", advisory: "Heat stress reduces milk yield by 20-30%. Provide shade, fans, and cool drinking water. Feed during cooler hours, increase electrolytes, and monitor for panting. Spray cows with water 2-3 times daily. Ensure ventilation in sheds." }
        : hasHeavyRain
          ? { title: "Mastitis risk — dry bedding", advisory: "Wet conditions increase mastitis and foot rot risk. Provide dry bedding, ensure shed drainage, and sanitize udders after milking. Store fodder under cover to prevent mould. Monitor for lameness." }
          : { title: "Comfortable for livestock", advisory: "Weather is comfortable for dairy animals. Maintain regular feeding and milking schedule, provide clean water, and ensure ventilation. Good time for breeding and vaccination programs." },
      BUYER: isHot
        ? { title: "Supply may dip — expect higher prices", advisory: "Heat stress reduces milk production, potentially tightening supply and raising prices. Fresh milk may have shorter shelf life in heat — buy smaller quantities more frequently. Check delivery temperature — milk should arrive below 4°C." }
        : hasHeavyRain
          ? { title: "Quality risk — check freshness", advisory: "Wet conditions can contaminate milk during milking. Check for off-flavours and ensure packaging is intact. Buy pasteurized milk from reputable brands. Paneer and curd should smell fresh with no sour notes." }
          : { title: "Fresh & plentiful — good supply", advisory: "Comfortable weather means steady milk production. Prices should be stable. Great time to buy fresh milk, paneer, and ghee. Check the manufacturing date — dairy is best consumed within 2-3 days of production." },
      WHOLESALER: isHot
        ? { title: "Supply drop expected — stock powder", advisory: "Heat reduces milk output by 20-30%, tightening procurement. Diversify with milk powder and UHT stock. Reinforce cold chain — milk must stay below 4°C. Expect higher procurement prices from farmers. Plan for reduced paneer yield." }
        : hasHeavyRain
          ? { title: "Contamination risk — test every batch", advisory: "Wet conditions increase bacterial contamination in raw milk. Test somatic cell count and MBRT before accepting. Tighten supplier QC. Ensure cold chain integrity — humidity accelerates bacterial growth even at 4°C." }
          : { title: "Steady supply — good procurement", advisory: "Favourable weather ensures steady milk procurement. Build contracts with multiple dairy farmers. Maintain cold chain at 2-4°C. Good time to stock up on butter and ghee for upcoming demand." },
      TRANSPORTER: isHot
        ? { title: "Cold chain critical — reefer mandatory", advisory: "Milk and dairy products spoil rapidly in heat. Refrigerated trucks at 2-4°C are mandatory. Pre-cool truck before loading. Minimize door openings. Insulate delivery crates. Schedule deliveries before 9 AM. Monitor temperature logs." }
        : hasHeavyRain
          ? { title: "Sealed containers — prevent contamination", advisory: "Rain can contaminate milk through splash-back and leaks. Use fully sealed, insulated containers only. Check vehicle for leaks before loading. Keep loading bays covered. Maintain 4°C cold chain despite ambient humidity." }
          : { title: "Standard reefer — good conditions", advisory: "Weather is good for dairy transport. Use standard refrigerated trucks at 2-4°C. Roads are clear. Maintain regular delivery schedules. Minimal spoilage risk during transit." },
    },
    Nuts: {
      FARMER: hasHeavyRain
        ? { title: "Harvest delay — dry floors", advisory: "Wet ground delays nut harvest (almond, cashew, groundnut) and risks mould. Prepare dry harvesting floors, use tarps, and dry nuts immediately after picking. Monitor stored nuts for aflatoxin. Apply gypsum to improve drainage." }
        : isWindy
          ? { title: "Nut drop — harvest early", advisory: "Strong winds cause premature nut drop and branch breakage. Harvest windfall nuts daily, stake young trees, and prune heavy canopies. Delay irrigation during high wind events." }
          : { title: "Good for nut development", advisory: "Conditions support healthy nut development. Maintain irrigation for cashew and almond, apply boron for fruit set, and monitor for nut borer. Good time for orchard floor management." },
      BUYER: hasHeavyRain
        ? { title: "Aflatoxin risk — check certificates", advisory: "Rain-damaged nuts may contain aflatoxin. Ask for quality test certificates before buying. Avoid nuts with discolouration or musty smell. Prices for clean, tested nuts may be higher. Buy vacuum-packed for safety." }
        : isHot
          ? { title: "Good quality — dry & crunchy", advisory: "Dry heat is good for nuts — they're well-dried and crunchy. Great time to buy almonds, cashews, and groundnuts. Prices should be competitive. Store in airtight containers to prevent rancidity." }
          : { title: "Fresh harvest — best quality", advisory: "Favourable weather means good-quality nuts with low moisture. Compare prices and grades. Look for plump, uniform nuts with intact shells. Vacuum-packed nuts stay fresh longer." },
      WHOLESALER: hasHeavyRain
        ? { title: "Aflatoxin testing mandatory", advisory: "Rain-affected nuts carry high aflatoxin risk. Test every batch — reject above 10ppb. Dry wet stock immediately in mechanical driers. Price gap between food-grade and oil-grade will widen. Stock certified, tested inventory." }
        : isHot
          ? { title: "Good storage — low moisture risk", advisory: "Dry heat is ideal for nut storage — moisture content stays low. Build inventory of cashews, almonds, and groundnuts. Maintain 4-5% moisture in storage. Monitor for rancidity in shelled nuts — vacuum-pack for extended shelf life." }
          : { title: "Stable supply — build inventory", advisory: "Favourable conditions ensure steady nut supply. Build inventory at competitive prices. Maintain cold storage at 10-15°C for premium nuts. Diversify across cashew, almond, and walnut categories." },
      TRANSPORTER: hasHeavyRain
        ? { title: "Mould risk — use sealed trucks", advisory: "Nuts absorb moisture in rainy transit, developing mould and aflatoxin. Use sealed, waterproof trucks only. Place desiccant bags in cargo. Never use open trucks. Check for roof leaks before loading. Keep nuts off the floor." }
        : isHot
          ? { title: "Standard transport — keep cool", advisory: "Dry heat is low-risk for nut transport. Use covered trucks. For shelled nuts, maintain below 25°C to prevent rancidity. Insulated trucks recommended for long-haul. Minimize transit time for high-oil nuts like walnuts." }
          : { title: "Good transit conditions", advisory: "Weather is clear for nut transport. Use standard covered trucks. Maintain regular schedules. Minimal quality risk. Ensure bags are properly stacked and secured." },
    },
    Herbs: {
      FARMER: hasHeavyRain
        ? { title: "Root rot — raise beds", advisory: "Herbs (basil, mint, coriander) are prone to root rot in waterlogged soil. Raise beds, improve drainage, and harvest before heavy rain. Apply Trichoderma to prevent soil-borne diseases. Use polytunnels for high-value herbs." }
        : isHot
          ? { title: "Bolting risk — harvest early", advisory: "Heat causes bolting (premature flowering) in coriander and spinach. Harvest early in the day, use shade cloth, and succession-sow every 2 weeks. Keep soil consistently moist to delay bolting." }
          : { title: "Ideal for herb growth", advisory: "Weather is ideal for herb cultivation. Maintain consistent moisture, harvest regularly to encourage bushy growth, and apply light nitrogen doses. Perfect time for sowing coriander, mint, and basil." },
      BUYER: hasHeavyRain
        ? { title: "Supply may be limited — buy fresh", advisory: "Rain can damage delicate herbs, reducing supply. Buy smaller quantities more frequently as herbs won't store well in humid conditions. Look for greenhouse-grown herbs which are more consistent. Prices may rise for premium bunches." }
        : isHot
          ? { title: "May bolt — check for bitterness", advisory: "Heat makes herbs like coriander and spinach bolt (turn bitter). Taste before buying in bulk. Basil and mint thrive in heat — great quality now. Buy cut herbs in sealed packs with moisture pads." }
          : { title: "Fresh & abundant — peak quality", advisory: "Perfect herb-growing weather means fresh, aromatic bunches at good prices. Great time for basil, mint, coriander, and rosemary. Look for vibrant green colour and firm stems. Buy potted herbs for longer-lasting supply." },
      WHOLESALER: hasHeavyRain
        ? { title: "Spoilage high — reduce order size", advisory: "Delicate herbs spoil rapidly in wet, humid conditions — losses can reach 30-40%. Reduce order volumes and increase frequency. Invest in hydro-cooling and modified atmosphere packaging. Prioritize greenhouse-grown supply for consistency." }
        : isHot
          ? { title: "Bolting reduces quality — diversify", advisory: "Heat causes bolting in leafy herbs, reducing marketable yield. Diversify into heat-tolerant herbs (basil, rosemary, oregano). Invest in pre-cooling within 1 hour of harvest. Maintain 95% humidity at 1-4°C in storage." }
          : { title: "Good storage window — bulk up", advisory: "Favourable conditions extend herb shelf life. Build inventory of robust herbs (rosemary, thyme). Maintain cold storage at 1-4°C with 95% humidity. Use modified atmosphere packaging for delicate herbs (coriander, mint)." },
      TRANSPORTER: hasHeavyRain
        ? { title: "Rush delivery — spoilage risk", advisory: "Herbs are extremely perishable in wet conditions. Use refrigerated trucks at 1-4°C. Prioritize fastest routes. Load under cover. Use vented crates to prevent condensation. Deliver within 24 hours of harvest." }
        : isHot
          ? { title: "Pre-cool & reefer — critical", advisory: "Heat wilts herbs within hours. Pre-cool to 2°C before loading. Use refrigerated trucks at 1-4°C throughout. Minimize stops. Deliver early morning. Basil is most heat-sensitive — handle with extra care." }
          : { title: "Standard reefer — good conditions", advisory: "Weather is good for herb transport. Use refrigerated trucks at 1-4°C. Roads are clear. Maintain regular delivery schedules. Minimal wilting risk during transit." },
    },
  };

  return content[category]?.[role] || content[category]?.FARMER || { title: "Monitor conditions", advisory: "Stay alert to weather changes." };
}

// GET /api/ai/weather/category?location=...&role=FARMER — role + category-specific weather advisories
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const location = (searchParams.get("location") || "Nashik, Maharashtra").trim();
    const role = (searchParams.get("role") || "FARMER").toUpperCase() as Role;
    const validRole: Role = ["FARMER", "BUYER", "WHOLESALER", "TRANSPORTER"].includes(role as Role)
      ? (role as Role)
      : "FARMER";

    // Check cache
    const cacheKey = `category:${validRole}:${location}`;
    const cached = await db.weatherCache.findUnique({ where: { location: cacheKey } });
    const now = Date.now();
    if (cached && now - cached.updatedAt.getTime() < 60 * 60 * 1000) {
      return NextResponse.json(JSON.parse(cached.payload));
    }

    const forecast = getForecast(location);

    // Calculate aggregate metrics
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

    const w = {
      hasHeavyRain: totalRain > 50,
      hasModerateRain: totalRain > 20,
      isHot: avgTemp > 35,
      isHumid: avgHumidity > 75,
      isWindy: maxWind > 25,
      avgTemp,
      totalRain,
      avgHumidity,
      maxWind,
      rainyDays,
      hotDays,
    };

    // Build advisories for all 8 categories with role-specific content
    const categories = ["Grains", "Vegetables", "Fruits", "Pulses", "Spices", "Dairy", "Nuts", "Herbs"];
    const categoryAdvisories: CategoryAdvisory[] = categories.map((cat) => {
      const roleContent = getRoleAdvisory(cat, validRole, w);

      // Risk is weather-based, not role-based
      const risk: CategoryAdvisory["risk"] =
        w.hasHeavyRain || (w.isHot && (cat === "Vegetables" || cat === "Dairy"))
          ? "High"
          : w.hasModerateRain || w.isHot || w.isWindy
            ? "Moderate"
            : "Low";

      const riskColor =
        risk === "High"
          ? "bg-destructive/15 text-destructive"
          : risk === "Moderate"
            ? "bg-amber-500/15 text-amber-700"
            : "bg-green-600/15 text-green-700";

      // Role-specific metrics
      const metrics = buildMetrics(cat, validRole, w);

      return {
        category: cat,
        icon: getCategoryIcon(cat),
        risk,
        riskColor,
        title: roleContent.title,
        advisory: roleContent.advisory,
        metrics,
      };
    });

    // Generate role-specific summary via LLM
    const roleLabels: Record<Role, string> = {
      FARMER: "a farmer growing crops",
      BUYER: "a buyer purchasing fresh produce",
      WHOLESALER: "a wholesaler procuring in bulk",
      TRANSPORTER: "a transporter moving agricultural goods",
    };
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
            content: `You are FarmMart's weather-smart advisor. The user is ${roleLabels[validRole]}. Given a 7-day forecast, give a 2-sentence summary tailored to their role — which crops/categories are most affected and what action they should prioritize this week. Plain text, under 60 words.`,
          },
          {
            role: "user",
            content: `Location: ${location}\n7-day forecast: ${weatherSummary}\n\nGive a role-specific (${validRole}) summary.`,
          },
        ],
        thinking: { type: "disabled" },
      });
      summary =
        completion?.choices?.[0]?.message?.content ||
        `As ${roleLabels[validRole]}, monitor weather conditions and adjust your operations accordingly this week.`;
    } catch {
      summary = `As ${roleLabels[validRole]}, monitor weather conditions and adjust your operations accordingly this week.`;
    }

    const payload = {
      location,
      role: validRole,
      metrics: { avgTemp, avgHumidity, totalRain, maxWind, rainyDays, hotDays },
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

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    Grains: "🌾",
    Vegetables: "🥬",
    Fruits: "🍎",
    Pulses: "🫘",
    Spices: "🌶️",
    Dairy: "🥛",
    Nuts: "🥜",
    Herbs: "🌿",
  };
  return icons[category] || "🌱";
}

function buildMetrics(
  category: string,
  role: Role,
  w: {
    avgTemp: number;
    totalRain: number;
    avgHumidity: number;
    maxWind: number;
    hasHeavyRain: boolean;
    isHot: boolean;
    isHumid: boolean;
    isWindy: boolean;
  }
): { label: string; value: string; status: "good" | "watch" | "alert" }[] {
  const { avgTemp, totalRain, avgHumidity, maxWind, hasHeavyRain, isHot, isHumid, isWindy } = w;

  // Base weather metrics
  const tempMetric = {
    label: "Temp",
    value: `${avgTemp}°C`,
    status: (isHot ? "alert" : avgTemp > 30 ? "watch" : "good") as "good" | "watch" | "alert",
  };
  const rainMetric = {
    label: "Rain",
    value: `${totalRain}mm`,
    status: (hasHeavyRain ? "alert" : totalRain > 20 ? "watch" : "good") as "good" | "watch" | "alert",
  };
  const humidityMetric = {
    label: "Humidity",
    value: `${avgHumidity}%`,
    status: (isHumid ? "watch" : "good") as "good" | "watch" | "alert",
  };
  const windMetric = {
    label: "Wind",
    value: `${maxWind}km/h`,
    status: (isWindy ? "alert" : "good") as "good" | "watch" | "alert",
  };

  // Role-specific 4th metric
  let roleMetric: { label: string; value: string; status: "good" | "watch" | "alert" };

  if (role === "FARMER") {
    const diseaseRisk = isHumid && (totalRain > 20);
    roleMetric = {
      label: "Disease",
      value: diseaseRisk ? "High" : "Low",
      status: diseaseRisk ? "alert" : "good",
    };
  } else if (role === "BUYER") {
    roleMetric = {
      label: "Price",
      value: hasHeavyRain || isHot ? "↑ Rising" : "Stable",
      status: hasHeavyRain ? "alert" : isHot ? "watch" : "good",
    };
  } else if (role === "WHOLESALER") {
    roleMetric = {
      label: "Supply",
      value: hasHeavyRain ? "Tight" : "Stable",
      status: hasHeavyRain ? "alert" : "good",
    };
  } else {
    // TRANSPORTER
    roleMetric = {
      label: "Roads",
      value: hasHeavyRain ? "Flooded" : isWindy ? "Risky" : "Clear",
      status: hasHeavyRain ? "alert" : isWindy ? "watch" : "good",
    };
  }

  return [tempMetric, rainMetric, humidityMetric, roleMetric];
}
