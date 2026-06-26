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
  TrendingUp,
  Truck,
  Bot,
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
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Left — animated 3D farm scene */}
      <div className="relative hidden md:flex md:w-1/2 lg:w-3/5 flex-col justify-between overflow-hidden bg-gradient-to-b from-sky-300 via-amber-100 to-green-600 p-10 text-white lg:p-14">
        {/* === SKY GRADIENT === */}
        <div className="absolute inset-0 bg-gradient-to-b from-orange-200 via-sky-300 to-sky-200" aria-hidden />

        {/* === RISING SUN === */}
        <div className="absolute left-1/2 top-[18%] -translate-x-1/2" aria-hidden>
          {/* Sun glow */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="size-72 rounded-full bg-amber-300/40 blur-3xl animate-pulse" />
          </div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="size-48 rounded-full bg-amber-300/60 blur-2xl" />
          </div>
          {/* Sun disc */}
          <div
            className="relative size-32 rounded-full bg-gradient-to-b from-amber-300 to-orange-400 shadow-[0_0_80px_40px_rgba(251,191,36,0.4)]"
            style={{ animation: "sunRise 8s ease-in-out infinite alternate" }}
          />
        </div>

        {/* === CLOUDS === */}
        <div className="absolute inset-0 overflow-hidden" aria-hidden>
          <div
            className="absolute left-[5%] top-[12%] opacity-80"
            style={{ animation: "cloudDrift 40s linear infinite" }}
          >
            <Cloud />
          </div>
          <div
            className="absolute right-[8%] top-[8%] opacity-70"
            style={{ animation: "cloudDrift 55s linear infinite", animationDelay: "-10s" }}
          >
            <Cloud size={0.7} />
          </div>
          <div
            className="absolute left-[40%] top-[20%] opacity-60"
            style={{ animation: "cloudDrift 60s linear infinite", animationDelay: "-25s" }}
          >
            <Cloud size={0.6} />
          </div>
        </div>

        {/* === FLYING BIRDS === */}
        <div className="absolute inset-0 overflow-hidden" aria-hidden>
          {/* Bird flock 1 */}
          <div
            className="absolute left-0 top-[25%]"
            style={{ animation: "birdFly1 25s linear infinite" }}
          >
            <Bird />
          </div>
          <div
            className="absolute left-0 top-[22%]"
            style={{ animation: "birdFly1 28s linear infinite", animationDelay: "-3s" }}
          >
            <Bird size={0.7} delay={0.3} />
          </div>
          <div
            className="absolute left-0 top-[28%]"
            style={{ animation: "birdFly1 30s linear infinite", animationDelay: "-6s" }}
          >
            <Bird size={0.6} delay={0.6} />
          </div>
          {/* Bird flock 2 (higher, smaller) */}
          <div
            className="absolute left-0 top-[15%]"
            style={{ animation: "birdFly2 35s linear infinite", animationDelay: "-8s" }}
          >
            <Bird size={0.5} delay={0.2} />
          </div>
          <div
            className="absolute left-0 top-[18%]"
            style={{ animation: "birdFly2 40s linear infinite", animationDelay: "-15s" }}
          >
            <Bird size={0.45} delay={0.5} />
          </div>
          <div
            className="absolute left-0 top-[13%]"
            style={{ animation: "birdFly2 38s linear infinite", animationDelay: "-22s" }}
          >
            <Bird size={0.4} delay={0.8} />
          </div>
        </div>

        {/* === MOUNTAINS (back layer — distant, hazy) === */}
        <svg
          className="absolute bottom-[28%] left-0 w-full"
          viewBox="0 0 1200 200"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M0,200 L0,120 L100,60 L200,100 L320,40 L450,90 L580,30 L720,80 L850,50 L1000,90 L1100,40 L1200,80 L1200,200 Z"
            fill="rgba(120,130,160,0.4)"
          />
        </svg>

        {/* === MOUNTAINS (mid layer) === */}
        <svg
          className="absolute bottom-[22%] left-0 w-full"
          viewBox="0 0 1200 250"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <linearGradient id="mountainMid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5b6b7a" />
              <stop offset="60%" stopColor="#4a5a6a" />
              <stop offset="100%" stopColor="#3a4a5a" />
            </linearGradient>
          </defs>
          <path
            d="M0,250 L0,140 L80,50 L160,110 L260,30 L380,100 L500,20 L620,90 L740,40 L880,100 L1000,50 L1120,110 L1200,60 L1200,250 Z"
            fill="url(#mountainMid)"
          />
          {/* Snow caps */}
          <path
            d="M260,30 L230,55 L250,50 L270,60 L290,45 Z M500,20 L470,50 L490,45 L510,55 L530,40 Z M740,40 L710,65 L730,60 L750,70 L770,55 Z"
            fill="rgba(255,255,255,0.7)"
          />
        </svg>

        {/* === MOUNTAINS (front layer — closer, darker) === */}
        <svg
          className="absolute bottom-[16%] left-0 w-full"
          viewBox="0 0 1200 200"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <linearGradient id="mountainFront" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3d4f5c" />
              <stop offset="100%" stopColor="#2a3a47" />
            </linearGradient>
          </defs>
          <path
            d="M0,200 L0,100 L120,30 L250,90 L400,10 L560,80 L700,20 L860,90 L1020,30 L1200,80 L1200,200 Z"
            fill="url(#mountainFront)"
          />
          <path
            d="M400,10 L370,40 L390,35 L410,45 L430,30 Z M700,20 L670,50 L690,45 L710,55 L730,40 Z"
            fill="rgba(255,255,255,0.8)"
          />
        </svg>

        {/* === FARMLAND — rolling green hills === */}
        <div className="absolute bottom-0 left-0 w-full" aria-hidden>
          {/* Back hills */}
          <svg
            className="absolute bottom-[8%] left-0 w-full"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M0,120 L0,60 Q150,20 300,50 T600,40 T900,55 T1200,35 L1200,120 Z"
              fill="#5a9e3e"
            />
          </svg>
          {/* Crop rows mid */}
          <svg
            className="absolute bottom-[3%] left-0 w-full"
            viewBox="0 0 1200 100"
            preserveAspectRatio="none"
          >
            <path
              d="M0,100 L0,40 Q200,10 400,35 T800,25 T1200,40 L1200,100 Z"
              fill="#4a8e2e"
            />
            {/* Crop row lines */}
            <g stroke="rgba(255,255,255,0.15)" strokeWidth="2" fill="none">
              <path d="M0,55 Q300,30 600,45 T1200,50" />
              <path d="M0,65 Q300,40 600,55 T1200,60" />
              <path d="M0,75 Q300,55 600,68 T1200,72" />
              <path d="M0,85 Q300,68 600,80 T1200,84" />
            </g>
          </svg>
          {/* Front field */}
          <svg
            className="absolute bottom-0 left-0 w-full"
            viewBox="0 0 1200 60"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="fieldFront" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3d7e22" />
                <stop offset="100%" stopColor="#2d6e15" />
              </linearGradient>
            </defs>
            <path
              d="M0,60 L0,20 Q200,5 500,15 T1000,12 T1200,20 L1200,60 Z"
              fill="url(#fieldFront)"
            />
            {/* Wheat/crop tufts */}
            <g fill="rgba(255,220,100,0.5)">
              {Array.from({ length: 30 }).map((_, i) => (
                <ellipse
                  key={i}
                  cx={i * 42 + 10}
                  cy={18 + (i % 3) * 4}
                  rx="3"
                  ry="8"
                />
              ))}
            </g>
          </svg>
        </div>

        {/* === Trees === */}
        <svg
          className="absolute bottom-[14%] left-[8%] size-16"
          viewBox="0 0 40 60"
          aria-hidden
        >
          <rect x="17" y="35" width="6" height="20" fill="#5a3e2a" />
          <circle cx="20" cy="25" r="14" fill="#3d7e22" />
          <circle cx="12" cy="30" r="9" fill="#4a8e2e" />
          <circle cx="28" cy="30" r="9" fill="#4a8e2e" />
        </svg>
        <svg
          className="absolute bottom-[12%] right-[12%] size-20"
          viewBox="0 0 40 60"
          aria-hidden
        >
          <rect x="17" y="35" width="6" height="20" fill="#5a3e2a" />
          <circle cx="20" cy="22" r="16" fill="#3d7e22" />
          <circle cx="10" cy="30" r="10" fill="#4a8e2e" />
          <circle cx="30" cy="30" r="10" fill="#4a8e2e" />
        </svg>

        {/* === Content overlay === */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-white/20 backdrop-blur-md shadow-lg">
            <Sprout className="size-6 text-white" />
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight drop-shadow-md">FarmMart</div>
            <div className="text-xs text-white/90 drop-shadow">
              AI-Powered Agriculture Marketplace
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-lg">
          <h1 className="text-3xl font-bold leading-tight drop-shadow-md lg:text-4xl">
            From harvest to doorstep, powered by AI.
          </h1>
          <p className="mt-3 text-base text-white/90 drop-shadow lg:text-lg">
            Connect with verified farmers, buyers, wholesalers, and transporters
            across India. Discover fresh produce, get AI crop advice, weather
            forecasts, and real-time market intelligence.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Feature icon={TrendingUp} label="Market intelligence" />
            <Feature icon={Bot} label="AI crop advisor" />
            <Feature icon={Truck} label="Pan-India logistics" />
            <Feature icon={ShieldCheck} label="Secure payments" />
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-sm text-white/80 drop-shadow">
          <Leaf className="size-4" />
          <span>Trusted by 10,000+ farmers across 12 states</span>
        </div>
      </div>

      {/* Right — auth form panel */}
      <div className="flex flex-1 items-center justify-center bg-background p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 md:hidden">
            <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Sprout className="size-5" />
            </div>
            <span className="text-xl font-bold">FarmMart</span>
          </div>

          {/* Mode toggle */}
          <div className="mb-6 inline-flex rounded-lg border border-border bg-secondary/50 p-1">
            <button
              onClick={() => setMode("login")}
              className={cn(
                "rounded-md px-5 py-1.5 text-sm font-medium transition-colors",
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
                "rounded-md px-5 py-1.5 text-sm font-medium transition-colors",
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
    </div>
  );
}

function Feature({
  icon: Icon,
  label,
}: {
  icon: typeof Sprout;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 backdrop-blur">
      <Icon className="size-4 shrink-0" />
      <span className="text-sm font-medium">{label}</span>
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

// Cloud SVG
function Cloud({ size = 1 }: { size?: number }) {
  return (
    <svg
      width={120 * size}
      height={60 * size}
      viewBox="0 0 120 60"
      fill="white"
    >
      <ellipse cx="30" cy="40" rx="25" ry="18" />
      <ellipse cx="55" cy="30" rx="30" ry="22" />
      <ellipse cx="85" cy="38" rx="28" ry="20" />
      <ellipse cx="100" cy="44" rx="18" ry="14" />
    </svg>
  );
}
