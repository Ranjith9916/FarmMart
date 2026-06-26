"use client";

import { useState } from "react";
import { useStore, type AuthUser } from "@/lib/store";
import { api, ROLE_LABELS } from "@/lib/api";
import type { Role } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sprout,
  Mail,
  Lock,
  User as UserIcon,
  MapPin,
  Phone,
  Loader2,
  ShieldCheck,
  Eye,
  EyeOff,
  Leaf,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Mode = "login" | "register";

export function LoginView() {
  const login = useStore((s) => s.login);
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("BUYER");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") {
      if (!email || !password) {
        toast.error("Please enter your email and password");
        return;
      }
    } else {
      if (!name.trim() || !email || !password) {
        toast.error("Please fill in all required fields");
        return;
      }
      if (password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "login") {
        // Sign in — authenticate and enter the app
        const data = await api<{ user: AuthUser; error?: string }>(
          "/api/auth/login",
          {
            method: "POST",
            body: JSON.stringify({ email, password }),
          }
        );
        login(data.user);
        toast.success(`Welcome back, ${data.user.name.split(" ")[0]}!`);
      } else {
        // Sign up — create the account, then switch to sign-in mode
        await api("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({ name, email, password, role, location, phone }),
        });
        toast.success(
          "Account created successfully! Please sign in to continue."
        );
        // Reset to sign-in mode, keep the email pre-filled for convenience
        setMode("login");
        setPassword("");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* === FULL-SCREEN ANIMATED SUNSET FARM SCENE === */}
      <div className="absolute inset-0" aria-hidden>
        {/* SKY GRADIENT — deep blue to golden sunset */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, #1a3a5f 0%, #2c5282 15%, #4a7abc 30%, #7ba8d8 45%, #f9c784 62%, #ff9a56 78%, #ffcc80 90%, #ffd89b 100%)",
          }}
        />

        {/* SETTING SUN — lower right with golden glow */}
        <div className="absolute right-[12%] top-[55%]">
          {/* Large outer glow */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div
              className="size-72 rounded-full blur-3xl animate-pulse"
              style={{ background: "rgba(255, 221, 0, 0.3)" }}
            />
          </div>
          {/* Inner glow */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div
              className="size-44 rounded-full blur-2xl"
              style={{ background: "rgba(255, 200, 80, 0.5)" }}
            />
          </div>
          {/* Sun disc */}
          <div
            className="relative size-28 rounded-full"
            style={{
              background: "radial-gradient(circle, #ffeb3b 0%, #ffdd00 40%, #ff9a56 100%)",
              boxShadow: "0 0 60px 20px rgba(255, 221, 0, 0.5)",
              animation: "sunGlow 6s ease-in-out infinite alternate",
            }}
          />
          {/* Sun reflection rays */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-96 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(255,221,0,0.08) 0%, transparent 70%)",
            }}
          />
        </div>

        {/* CLOUDS — golden-lit sunset clouds */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute left-[8%] top-[12%] opacity-70"
            style={{ animation: "cloudDrift 50s linear infinite" }}
          >
            <SunsetCloud />
          </div>
          <div
            className="absolute right-[20%] top-[8%] opacity-60"
            style={{ animation: "cloudDrift 65s linear infinite", animationDelay: "-15s" }}
          >
            <SunsetCloud size={0.7} />
          </div>
          <div
            className="absolute left-[45%] top-[22%] opacity-50"
            style={{ animation: "cloudDrift 70s linear infinite", animationDelay: "-30s" }}
          >
            <SunsetCloud size={0.6} />
          </div>
        </div>

        {/* FLYING BIRDS — V-formation, dark silhouettes */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Flock 1 — lower sky */}
          <div className="absolute left-0 top-[30%]" style={{ animation: "birdFly1 30s linear infinite" }}>
            <Bird />
          </div>
          <div className="absolute left-0 top-[27%]" style={{ animation: "birdFly1 33s linear infinite", animationDelay: "-2s" }}>
            <Bird size={0.7} delay={0.3} />
          </div>
          <div className="absolute left-0 top-[33%]" style={{ animation: "birdFly1 35s linear infinite", animationDelay: "-5s" }}>
            <Bird size={0.65} delay={0.6} />
          </div>
          <div className="absolute left-0 top-[29%]" style={{ animation: "birdFly1 32s linear infinite", animationDelay: "-8s" }}>
            <Bird size={0.6} delay={0.9} />
          </div>
          {/* Flock 2 — higher sky, smaller */}
          <div className="absolute left-0 top-[18%]" style={{ animation: "birdFly2 40s linear infinite", animationDelay: "-10s" }}>
            <Bird size={0.5} delay={0.2} />
          </div>
          <div className="absolute left-0 top-[21%]" style={{ animation: "birdFly2 45s linear infinite", animationDelay: "-20s" }}>
            <Bird size={0.45} delay={0.5} />
          </div>
          <div className="absolute left-0 top-[16%]" style={{ animation: "birdFly2 42s linear infinite", animationDelay: "-28s" }}>
            <Bird size={0.4} delay={0.7} />
          </div>
        </div>

        {/* MIST/FOG — drifting between mountain layers */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute left-0 bottom-[42%] h-16 w-full"
            style={{
              background:
                "linear-gradient(to right, transparent, rgba(255,255,255,0.15) 30%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.15) 70%, transparent)",
              animation: "mistDrift 25s ease-in-out infinite alternate",
            }}
          />
          <div
            className="absolute left-0 bottom-[36%] h-12 w-full"
            style={{
              background:
                "linear-gradient(to right, transparent, rgba(255,220,180,0.12) 40%, rgba(255,220,180,0.18) 60%, transparent)",
              animation: "mistDrift 30s ease-in-out infinite alternate-reverse",
              animationDelay: "-5s",
            }}
          />
        </div>

        {/* MOUNTAINS — back layer (distant, hazy pale blue) */}
        <svg className="absolute bottom-[38%] left-0 w-full" viewBox="0 0 1200 200" preserveAspectRatio="none">
          <path
            d="M0,200 L0,120 Q100,80 200,100 T400,90 Q500,60 600,85 T800,75 Q900,50 1000,80 T1200,70 L1200,200 Z"
            fill="#5a7a9a"
            opacity="0.5"
          />
        </svg>

        {/* MOUNTAINS — mid layer (soft blue-gray, rolling) */}
        <svg className="absolute bottom-[30%] left-0 w-full" viewBox="0 0 1200 250" preserveAspectRatio="none">
          <defs>
            <linearGradient id="mountainMid2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3a5a7a" />
              <stop offset="100%" stopColor="#2d4a6a" />
            </linearGradient>
          </defs>
          <path
            d="M0,250 L0,150 Q80,100 160,130 Q240,80 320,110 Q400,70 480,100 Q560,60 640,95 Q720,75 800,105 Q880,70 960,100 Q1040,80 1120,110 Q1180,95 1200,105 L1200,250 Z"
            fill="url(#mountainMid2)"
            opacity="0.85"
          />
        </svg>

        {/* MOUNTAINS — front layer (dark slate silhouettes, jagged peaks) */}
        <svg className="absolute bottom-[22%] left-0 w-full" viewBox="0 0 1200 200" preserveAspectRatio="none">
          <defs>
            <linearGradient id="mountainFront2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2d3e50" />
              <stop offset="100%" stopColor="#1a2a3a" />
            </linearGradient>
          </defs>
          <path
            d="M0,200 L0,120 L60,80 L120,110 L180,50 L240,90 L300,40 L360,85 L420,30 L480,75 L540,45 L600,90 L660,35 L720,80 L780,50 L840,95 L900,40 L960,85 L1020,55 L1080,90 L1140,45 L1200,80 L1200,200 Z"
            fill="url(#mountainFront2)"
          />
        </svg>

        {/* RIVER — winding through the valley with reflection */}
        <svg className="absolute bottom-[15%] left-0 w-full" viewBox="0 0 1200 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="riverGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f9c784" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#4a90e2" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#2c5282" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          <path
            d="M0,60 Q200,50 350,55 Q500,60 600,45 Q700,30 800,40 Q900,50 1000,35 Q1100,25 1200,40 L1200,100 L0,100 Z"
            fill="url(#riverGrad)"
            opacity="0.7"
          />
          {/* Shimmer lines on river */}
          <g stroke="rgba(255,221,0,0.2)" strokeWidth="1" fill="none">
            <path d="M100,65 Q300,58 500,62 T900,55" />
            <path d="M200,72 Q400,65 600,68 T1000,62" />
          </g>
        </svg>

        {/* FARMLAND — golden fields with crop rows */}
        <div className="absolute bottom-0 left-0 w-full">
          {/* Back field — golden wheat */}
          <svg className="absolute bottom-[6%] left-0 w-full" viewBox="0 0 1200 80" preserveAspectRatio="none">
            <defs>
              <linearGradient id="wheatField" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffd700" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#daa520" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            <path d="M0,80 L0,30 Q200,20 400,28 T800,25 T1200,30 L1200,80 Z" fill="url(#wheatField)" />
            {/* Wheat row lines */}
            <g stroke="rgba(139,90,0,0.3)" strokeWidth="1.5" fill="none">
              <path d="M0,40 Q300,33 600,38 T1200,40" />
              <path d="M0,50 Q300,43 600,48 T1200,50" />
              <path d="M0,60 Q300,55 600,58 T1200,60" />
            </g>
          </svg>
          {/* Front field — green crops */}
          <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1200 50" preserveAspectRatio="none">
            <defs>
              <linearGradient id="greenField" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2e8b57" />
                <stop offset="100%" stopColor="#1a5f1a" />
              </linearGradient>
            </defs>
            <path d="M0,50 L0,15 Q150,8 300,12 T600,10 T900,14 T1200,12 L1200,50 Z" fill="url(#greenField)" />
            {/* Crop tufts */}
            <g fill="rgba(255,215,0,0.4)">
              {Array.from({ length: 35 }).map((_, i) => (
                <ellipse key={i} cx={i * 35 + 8} cy={14 + (i % 3) * 3} rx="2.5" ry="6" />
              ))}
            </g>
          </svg>
        </div>

        {/* DIRT ROAD — winding path */}
        <svg className="absolute bottom-[8%] left-[20%] w-[60%] h-32" viewBox="0 0 600 120" preserveAspectRatio="none" aria-hidden>
          <path
            d="M50,120 Q100,80 150,70 Q200,60 250,50 Q300,40 350,35 Q400,30 500,20"
            stroke="#8b7355"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            opacity="0.6"
          />
          <path
            d="M50,120 Q100,80 150,70 Q200,60 250,50 Q300,40 350,35 Q400,30 500,20"
            stroke="#6b5d4f"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            opacity="0.4"
            strokeDasharray="8 6"
          />
        </svg>

        {/* Trees — left side */}
        <svg className="absolute bottom-[14%] left-[5%] size-16" viewBox="0 0 40 60" aria-hidden>
          <rect x="17" y="38" width="5" height="18" fill="#654321" />
          <circle cx="20" cy="28" r="13" fill="#1a5f1a" />
          <circle cx="12" cy="32" r="8" fill="#2e8b57" />
          <circle cx="28" cy="32" r="8" fill="#2e8b57" />
        </svg>
        <svg className="absolute bottom-[12%] left-[12%] size-12" viewBox="0 0 40 60" aria-hidden>
          <rect x="17" y="38" width="5" height="18" fill="#654321" />
          <circle cx="20" cy="26" r="12" fill="#1a5f1a" />
          <circle cx="13" cy="32" r="7" fill="#2e8b57" />
          <circle cx="27" cy="32" r="7" fill="#2e8b57" />
        </svg>
        {/* Trees — right side */}
        <svg className="absolute bottom-[13%] right-[6%] size-20" viewBox="0 0 40 60" aria-hidden>
          <rect x="17" y="35" width="6" height="20" fill="#654321" />
          <circle cx="20" cy="25" r="15" fill="#1a5f1a" />
          <circle cx="10" cy="32" r="10" fill="#2e8b57" />
          <circle cx="30" cy="32" r="10" fill="#2e8b57" />
        </svg>
      </div>

      {/* === TOP BRAND BAR === */}
      <div className="absolute left-0 top-0 z-10 flex w-full items-center justify-between p-5 sm:p-6">
        <div className="flex items-center gap-2.5">
          <div className="grid size-10 place-items-center rounded-xl bg-white/20 backdrop-blur-md shadow-lg">
            <Sprout className="size-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight text-white drop-shadow-md">FarmMart</div>
            <div className="text-[10px] text-white/80 drop-shadow">AI Agriculture Marketplace</div>
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md sm:flex">
          <Leaf className="size-3.5" />
          Trusted by 10,000+ farmers
        </div>
      </div>

      {/* === CENTERED GLASSMORPHISM LOGIN CARD === */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md rounded-2xl border border-white/30 bg-white/85 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          {/* Mobile logo */}
          <div className="mb-6 flex items-center justify-center gap-2 md:hidden">
            <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Sprout className="size-5" />
            </div>
            <span className="text-xl font-bold">FarmMart</span>
          </div>

          {/* Mode toggle */}
          <div className="mb-6 inline-flex w-full rounded-lg border border-border bg-secondary/50 p-1">
            <button
              onClick={() => setMode("login")}
              className={cn(
                "flex-1 rounded-md px-5 py-1.5 text-sm font-medium transition-colors",
                mode === "login"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode("register")}
              className={cn(
                "flex-1 rounded-md px-5 py-1.5 text-sm font-medium transition-colors",
                mode === "register"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Sign Up
            </button>
          </div>

          <h2 className="text-2xl font-bold tracking-tight">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login"
              ? "Sign in to access the FarmMart marketplace."
              : "Join FarmMart to buy, sell, and grow with AI-powered insights."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "register" && (
              <Field
                id="name"
                label="Full name"
                icon={UserIcon}
                required
                value={name}
                onChange={setName}
                placeholder="e.g., Ravi Sharma"
                autoComplete="name"
              />
            )}

            <Field
              id="email"
              label="Email address"
              icon={Mail}
              required
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              autoComplete="email"
            />

            <div>
              <Label htmlFor="password" className="mb-1.5 flex items-center gap-1">
                <Lock className="size-3.5" /> Password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "login" ? "Your password" : "At least 6 characters"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {mode === "register" && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Use 6 or more characters.
                </p>
              )}
            </div>

            {mode === "register" && (
              <>
                <div>
                  <Label className="mb-1.5 block">I am a…</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                        <SelectItem key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field
                    id="location"
                    label="Location"
                    icon={MapPin}
                    value={location}
                    onChange={setLocation}
                    placeholder="City, State"
                  />
                  <Field
                    id="phone"
                    label="Phone"
                    icon={Phone}
                    value={phone}
                    onChange={setPhone}
                    placeholder="+91 …"
                  />
                </div>
              </>
            )}

            <Button
              type="submit"
              className="w-full gap-2"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  {mode === "login" ? "Sign In" : "Create Account"}
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          {/* Switch mode link */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                New to FarmMart?{" "}
                <button
                  onClick={() => setMode("register")}
                  className="font-medium text-primary hover:underline"
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setMode("login")}
                  className="font-medium text-primary hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" />
            Your data is protected with secure encryption
          </div>
        </div>
      </div>

      {/* === BOTTOM TAGLINE === */}
      <div className="absolute bottom-0 left-0 z-10 w-full p-4 text-center">
        <p className="text-sm font-medium text-white drop-shadow-md">
          From harvest to doorstep, powered by AI 🌾
        </p>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  autoComplete,
}: {
  id: string;
  label: string;
  icon: typeof Mail;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <div>
      <Label htmlFor={id} className="mb-1.5 flex items-center gap-1">
        <Icon className="size-3.5" /> {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
    </div>
  );
}

// Animated bird SVG with flapping wings
function Bird({ size = 1, delay = 0 }: { size?: number; delay?: number }) {
  return (
    <svg
      width={30 * size}
      height={14 * size}
      viewBox="0 0 30 14"
      fill="none"
      style={{ animation: `flap 0.5s ease-in-out infinite alternate`, animationDelay: `${delay}s` }}
    >
      <path
        d="M1 7 Q5 1 9 7 Q13 1 17 7 Q21 1 25 7 Q27 5 29 7"
        stroke="rgba(40,40,40,0.7)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

// Sunset-lit cloud SVG (golden edges, orange underside)
function SunsetCloud({ size = 1 }: { size?: number }) {
  return (
    <svg
      width={120 * size}
      height={60 * size}
      viewBox="0 0 120 60"
    >
      <defs>
        <linearGradient id={`cloudGrad-${size}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffd89b" />
          <stop offset="60%" stopColor="#ffcc80" />
          <stop offset="100%" stopColor="#ff9a56" />
        </linearGradient>
      </defs>
      <ellipse cx="30" cy="40" rx="25" ry="18" fill={`url(#cloudGrad-${size})`} />
      <ellipse cx="55" cy="30" rx="30" ry="22" fill={`url(#cloudGrad-${size})`} />
      <ellipse cx="85" cy="38" rx="28" ry="20" fill={`url(#cloudGrad-${size})`} />
      <ellipse cx="100" cy="44" rx="18" ry="14" fill={`url(#cloudGrad-${size})`} />
    </svg>
  );
}
