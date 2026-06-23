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
      const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body =
        mode === "login"
          ? { email, password }
          : { name, email, password, role, location, phone };
      const data = await api<{ user: AuthUser; error?: string }>(url, {
        method: "POST",
        body: JSON.stringify(body),
      });
      login(data.user);
      toast.success(
        mode === "login"
          ? `Welcome back, ${data.user.name.split(" ")[0]}!`
          : `Account created. Welcome to FarmMart, ${data.user.name.split(" ")[0]}!`
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Left — brand / hero panel */}
      <div className="relative hidden md:flex md:w-1/2 lg:w-3/5 flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:p-14">
        {/* Background image with overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/farm-hero.jpg)" }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/85 via-primary/70 to-primary/90" />

        {/* Content */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-white/15 backdrop-blur">
            <Sprout className="size-6" />
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight">FarmMart</div>
            <div className="text-xs text-primary-foreground/80">
              AI-Powered Agriculture Marketplace
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-lg">
          <h1 className="text-3xl font-bold leading-tight lg:text-4xl">
            From harvest to doorstep, powered by AI.
          </h1>
          <p className="mt-3 text-base text-primary-foreground/85 lg:text-lg">
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

        <div className="relative z-10 flex items-center gap-2 text-sm text-primary-foreground/70">
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
