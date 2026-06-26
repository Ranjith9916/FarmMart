"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import type { WeatherData } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CloudSun,
  Droplets,
  Wind,
  Umbrella,
  Loader2,
  MapPin,
  RefreshCw,
  Sparkles,
  Thermometer,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Layers,
  UserCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LOCATIONS = [
  "Nashik, Maharashtra",
  "Pune, Maharashtra",
  "Karnal, Haryana",
  "Ludhiana, Punjab",
  "Hyderabad, Telangana",
  "Anand, Gujarat",
  "Indore, Madhya Pradesh",
  "Coimbatore, Tamil Nadu",
];

interface CategoryMetric {
  label: string;
  value: string;
  status: "good" | "watch" | "alert";
}
interface CategoryAdvisory {
  category: string;
  icon: string;
  risk: "Low" | "Moderate" | "High";
  riskColor: string;
  title: string;
  advisory: string;
  metrics: CategoryMetric[];
}
interface CategoryData {
  location: string;
  role: string;
  metrics: {
    avgTemp: number;
    avgHumidity: number;
    totalRain: number;
    maxWind: number;
    rainyDays: number;
    hotDays: number;
  };
  summary: string;
  categories: CategoryAdvisory[];
}

const STATUS_DOT: Record<string, string> = {
  good: "bg-green-500",
  watch: "bg-amber-500",
  alert: "bg-destructive",
};

export function WeatherView() {
  const role = useStore((s) => s.role);
  const [location, setLocation] = useState("Nashik, Maharashtra");
  const [data, setData] = useState<WeatherData | null>(null);
  const [catData, setCatData] = useState<CategoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [catLoading, setCatLoading] = useState(true);
  const [custom, setCustom] = useState("");

  const loadWeather = async (loc: string) => {
    setLoading(true);
    try {
      const d = await api<WeatherData>(
        `/api/ai/weather?location=${encodeURIComponent(loc)}`
      );
      setData(d);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const loadCategory = useCallback(
    async (loc: string) => {
      setCatLoading(true);
      try {
        const d = await api<CategoryData>(
          `/api/ai/weather/category?location=${encodeURIComponent(loc)}&role=${role}`
        );
        setCatData(d);
      } catch {
        setCatData(null);
      } finally {
        setCatLoading(false);
      }
    },
    [role]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      loadWeather(location);
      loadCategory(location);
    }, 200);
    return () => clearTimeout(t);
  }, [location, role, loadCategory]);

  const refresh = () => {
    loadWeather(location);
    loadCategory(location);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CloudSun className="size-7 text-primary" /> Weather &amp; Farm Advisory
          </h1>
          <p className="text-sm text-muted-foreground">
            7-day forecast with category-specific crop advisories and AI recommendations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className="w-[220px]">
              <MapPin className="size-4 mr-1 text-primary" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOCATIONS.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={refresh}
            disabled={loading || catLoading}
            aria-label="Refresh"
          >
            <RefreshCw
              className={loading || catLoading ? "size-4 animate-spin" : "size-4"}
            />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-24">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : !data ? (
        <div className="grid place-items-center rounded-2xl border border-dashed py-20">
          <p className="text-sm text-muted-foreground">Unable to load weather.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Current weather hero */}
          <Card className="relative overflow-hidden fm-field-bg p-6">
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="size-4" />
                  {data.location}
                </div>
                <div className="mt-1 flex items-end gap-3">
                  <span className="text-6xl">{data.current.icon}</span>
                  <div>
                    <div className="text-5xl font-bold leading-none">
                      {data.current.temp}°C
                    </div>
                    <div className="mt-1 text-lg text-muted-foreground">
                      {data.current.condition}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Droplets className="size-3.5 text-primary" />
                    {data.current.humidity}% humidity
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <Wind className="size-3.5 text-primary" />
                    {data.current.wind} km/h wind
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <Umbrella className="size-3.5 text-primary" />
                    {data.current.rainfall} mm rain
                  </Badge>
                </div>
              </div>
              <div className="hidden sm:block text-right">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Updated
                </div>
                <div className="text-sm font-medium">
                  {new Date().toLocaleString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "short",
                  })}
                </div>
              </div>
            </div>
          </Card>

          {/* 7-day forecast */}
          <div>
            <h2 className="mb-3 font-semibold">7-Day Forecast</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {data.forecast.map((f) => (
                <Card
                  key={f.date}
                  className="flex flex-col items-center gap-1 p-3 text-center"
                >
                  <span className="text-xs font-semibold text-muted-foreground">
                    {f.day}
                  </span>
                  <span className="text-3xl">{f.icon}</span>
                  <span className="text-xs">{f.condition}</span>
                  <div className="mt-1 flex items-center gap-1 text-sm">
                    <Thermometer className="size-3.5 text-primary" />
                    <span className="font-semibold">{f.tempHigh}°</span>
                    <span className="text-muted-foreground">/ {f.tempLow}°</span>
                  </div>
                  <div className="flex gap-2 text-[10px] text-muted-foreground">
                    <span className="inline-flex items-center gap-0.5">
                      <Droplets className="size-2.5" />
                      {f.humidity}%
                    </span>
                    <span className="inline-flex items-center gap-0.5">
                      <Umbrella className="size-2.5" />
                      {f.rainfall}mm
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* AI Advisory */}
          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary">
                <Sparkles className="size-4" />
              </div>
              <h2 className="font-semibold">AI Farming Advisory</h2>
              <Badge className="ml-auto gap-1 bg-primary/15 text-primary">
                <Sparkles className="size-3" /> Z.ai
              </Badge>
            </div>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {data.advisory}
            </div>
          </Card>

          {/* Category Weather Dashboard */}
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Layers className="size-5 text-primary" />
              <h2 className="text-xl font-bold">Category Weather Dashboard</h2>
              {catData?.role && (
                <Badge className="gap-1 bg-primary/15 text-primary capitalize">
                  <UserCircle2 className="size-3" />
                  {catData.role.toLowerCase()} advisory
                </Badge>
              )}
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Weather impact and advisories tailored to each crop category for{" "}
              <span className="font-medium text-foreground">{location}</span>, from a{" "}
              <span className="font-medium text-primary capitalize">{role.toLowerCase()}</span> perspective.
            </p>

            {catLoading ? (
              <div className="grid place-items-center py-16">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : !catData ? (
              <Card className="grid place-items-center py-12">
                <p className="text-sm text-muted-foreground">
                  Unable to load category advisories.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Summary + weekly metrics strip */}
                <Card className="p-5 fm-field-bg">
                  <div className="flex items-start gap-3">
                    <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
                      <TrendingUp className="size-4" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">Weekly Summary</h3>
                      <p className="mt-1 text-sm text-foreground/90">
                        {catData.summary}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                    <MetricPill
                      icon={Thermometer}
                      label="Avg Temp"
                      value={`${catData.metrics.avgTemp}°C`}
                    />
                    <MetricPill
                      icon={Droplets}
                      label="Avg Humidity"
                      value={`${catData.metrics.avgHumidity}%`}
                    />
                    <MetricPill
                      icon={Umbrella}
                      label="Total Rain"
                      value={`${catData.metrics.totalRain}mm`}
                    />
                    <MetricPill
                      icon={Wind}
                      label="Max Wind"
                      value={`${catData.metrics.maxWind}km/h`}
                    />
                    <MetricPill
                      icon={CloudSun}
                      label="Rainy Days"
                      value={`${catData.metrics.rainyDays}/7`}
                    />
                    <MetricPill
                      icon={AlertTriangle}
                      label="Hot Days"
                      value={`${catData.metrics.hotDays}/7`}
                    />
                  </div>
                </Card>

                {/* Category cards grid */}
                <div className="grid gap-4 md:grid-cols-2">
                  {catData.categories.map((cat) => (
                    <CategoryCard key={cat.category} cat={cat} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Custom location lookup */}
          <Card className="p-4">
            <h3 className="mb-2 text-sm font-semibold">Check another location</h3>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Bhopal, Madhya Pradesh"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
              />
              <Button
                onClick={() => custom.trim() && setLocation(custom.trim())}
                disabled={!custom.trim()}
              >
                Check
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function MetricPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CloudSun;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-background/60 p-2.5 backdrop-blur">
      <div className="grid size-7 place-items-center rounded-md bg-primary/10 text-primary">
        <Icon className="size-3.5" />
      </div>
      <div>
        <div className="text-[10px] font-medium text-muted-foreground">{label}</div>
        <div className="text-sm font-bold">{value}</div>
      </div>
    </div>
  );
}

function CategoryCard({ cat }: { cat: CategoryAdvisory }) {
  return (
    <Card className="overflow-hidden p-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 bg-secondary/40 p-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{cat.icon}</span>
          <div>
            <h3 className="font-bold">{cat.category}</h3>
            <p className="text-xs text-muted-foreground">{cat.title}</p>
          </div>
        </div>
        <Badge className={cn("gap-1 text-xs", cat.riskColor)}>
          {cat.risk === "High" && <AlertTriangle className="size-3" />}
          {cat.risk === "Low" && <CheckCircle2 className="size-3" />}
          {cat.risk} Risk
        </Badge>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-2 border-b border-border/60 p-3">
        {cat.metrics.map((m) => (
          <div key={m.label} className="text-center">
            <div className="flex items-center justify-center gap-1">
              <span className={cn("size-1.5 rounded-full", STATUS_DOT[m.status])} />
              <span className="text-[10px] font-medium text-muted-foreground">
                {m.label}
              </span>
            </div>
            <div className="mt-0.5 text-sm font-bold">{m.value}</div>
          </div>
        ))}
      </div>

      {/* Advisory */}
      <div className="p-4">
        <p className="text-sm leading-relaxed text-foreground/90">{cat.advisory}</p>
      </div>
    </Card>
  );
}
