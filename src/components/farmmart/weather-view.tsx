"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
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
} from "lucide-react";

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

export function WeatherView() {
  const [location, setLocation] = useState("Nashik, Maharashtra");
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [custom, setCustom] = useState("");

  const load = async (loc: string) => {
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

  useEffect(() => {
    const t = setTimeout(() => load(location), 200);
    return () => clearTimeout(t);
  }, [location]);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CloudSun className="size-7 text-primary" /> Weather &amp; Farm Advisory
          </h1>
          <p className="text-sm text-muted-foreground">
            7-day forecast with AI-generated farming recommendations.
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
            onClick={() => load(location)}
            disabled={loading}
            aria-label="Refresh"
          >
            <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} />
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
