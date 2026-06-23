"use client";

import { useState } from "react";
import { useStore, type AuthUser } from "@/lib/store";
import { api, ROLE_LABELS } from "@/lib/api";
import type { Role } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Sprout,
  Leaf,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Truck,
  Bot,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Sprout as SproutIcon,
} from "lucide-react";
import { toast } from "sonner";

const DEMO_ACCOUNTS: { role: Role; email: string; name: string; blurb: string }[] = [
  { role: "BUYER", email: "buyer@farmmart.io", name: "Aarav Mehta", blurb: "Shop fresh produce" },
  { role: "FARMER", email: "ravi@farmmart.io", name: "Ravi Sharma", blurb: "List & sell crops" },
  { role: "WHOLESALER", email: "bulk@farmmart.io", name: "Global Traders", blurb: "Bulk ordering" },
  { role: "TRANSPORTER", email: "fleet@farmmart.io", name: "FastTrack", blurb: "Delivery fleet" },
];

export function LoginView() {
  const login = useStore((s) => s.login);

  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [signupRole, setSignupRole] = useState<Role>("BUYER");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const submitSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Please enter your email and password");
      return;
    }
    setLoading(true);
    try {
      const data = await api<{ user: AuthUser }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      login(data.user);
      toast.success(`Welcome back, ${data.user.name.split(" ")[0]}!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const submitSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Please enter your name and email");
      return;
    }
    setLoading(true);
    try {
      const data = await api<{ user: AuthUser }>("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name, email, role: signupRole }),
      });
      login(data.user);
      toast.success(`Account created. Welcome to FarmMart, ${name.split(" ")[0]}!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (acc: (typeof DEMO_ACCOUNTS)[number]) => {
    setEmail(acc.email);
    setPassword("farmmart");
    setLoading(true);
    try {
      const data = await api<{ user: AuthUser }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: acc.email, password: "farmmart" }),
      });
      login(data.user);
      toast.success(`Signed in as ${acc.name} (${ROLE_LABELS[acc.role]})`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Quick login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Left: branding / hero panel */}
      <aside className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground">
        <div className="fm-grid-pattern absolute inset-0 opacity-20" aria-hidden />
        <div
          className="absolute -right-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute -bottom-32 -left-16 size-96 rounded-full bg-amber-300/20 blur-3xl"
          aria-hidden
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-white/15 backdrop-blur">
            <Sprout className="size-6" />
          </div>
          <div className="leading-tight">
            <div className="text-xl font-bold">FarmMart</div>
            <div className="text-xs text-primary-foreground/80">
              AI Agriculture Marketplace
            </div>
          </div>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 max-w-md">
          <Badge className="mb-4 gap-1 bg-white/15 text-primary-foreground hover:bg-white/20">
            <Leaf className="size-3" /> Farm to market, powered by AI
          </Badge>
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Fresh produce from verified farms, delivered nationwide.
          </h1>
          <p className="mt-3 text-base text-primary-foreground/85">
            Join thousands of farmers, buyers, wholesalers, and transporters
            trading on India&apos;s smartest agriculture platform.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              { icon: Truck, label: "Pan-India logistics" },
              { icon: ShieldCheck, label: "Secure payments" },
              { icon: Bot, label: "AI crop advisory" },
              { icon: TrendingUp, label: "Market intelligence" },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.label}
                  className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 text-sm backdrop-blur"
                >
                  <Icon className="size-4 shrink-0" />
                  {f.label}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative z-10 flex gap-8">
          {[
            { n: "20+", l: "Daily listings" },
            { n: "8", l: "Verified farmers" },
            { n: "4.8★", l: "Avg. rating" },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-2xl font-bold">{s.n}</div>
              <div className="text-xs text-primary-foreground/75">{s.l}</div>
            </div>
          ))}
        </div>
      </aside>

      {/* Right: auth form panel */}
      <main className="flex flex-1 items-center justify-center bg-background px-4 py-8 sm:px-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-6 flex items-center justify-center gap-2 lg:hidden">
            <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Sprout className="size-5" />
            </div>
            <span className="text-xl font-bold">FarmMart</span>
          </div>

          <div className="mb-6 text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight">
              {tab === "signin" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {tab === "signin"
                ? "Sign in to continue to your FarmMart dashboard."
                : "Join FarmMart and start trading fresh produce today."}
            </p>
          </div>

          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as "signin" | "signup")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* Sign In */}
            <TabsContent value="signin" className="mt-5">
              <form onSubmit={submitSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@farmmart.io"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      onClick={() =>
                        toast.info("Demo password is: farmmart", {
                          description: "Use it with any demo account below.",
                        })
                      }
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPwd ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="farmmart"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPwd ? "Hide password" : "Show password"}
                    >
                      {showPwd ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <Checkbox
                    checked={remember}
                    onCheckedChange={(c) => setRemember(c === true)}
                  />
                  <span className="text-muted-foreground">Remember me for 30 days</span>
                </label>

                <Button
                  type="submit"
                  className="w-full gap-2"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ArrowRight className="size-4" />
                  )}
                  Sign In
                </Button>
              </form>

              {/* Divider */}
              <div className="my-5 flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">
                  or quick-login as
                </span>
                <Separator className="flex-1" />
              </div>

              {/* Quick-login chips */}
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => quickLogin(acc)}
                    disabled={loading}
                    className="group flex flex-col items-start gap-0.5 rounded-xl border border-border/70 bg-card p-2.5 text-left transition-all hover:border-primary/40 hover:shadow-sm disabled:opacity-50"
                  >
                    <div className="flex w-full items-center justify-between">
                      <Badge className="bg-primary/15 text-primary text-[10px]">
                        {ROLE_LABELS[acc.role]}
                      </Badge>
                      <ArrowRight className="size-3 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <span className="text-xs font-semibold">{acc.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {acc.blurb}
                    </span>
                  </button>
                ))}
              </div>

              <p className="mt-4 rounded-lg bg-accent/50 p-2.5 text-center text-xs text-accent-foreground">
                <ShieldCheck className="mr-1 inline size-3 text-primary" />
                Demo password for all accounts:{" "}
                <code className="font-mono font-bold">farmmart</code>
              </p>
            </TabsContent>

            {/* Sign Up */}
            <TabsContent value="signup" className="mt-5">
              <form onSubmit={submitSignUp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      autoComplete="name"
                      placeholder="e.g., Priya Nair"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="su-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="su-email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="su-role">I am a…</Label>
                  <Select
                    value={signupRole}
                    onValueChange={(v) => setSignupRole(v as Role)}
                  >
                    <SelectTrigger id="su-role" className="w-full">
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

                <div className="space-y-1.5">
                  <Label htmlFor="su-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="su-password"
                      type={showPwd ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPwd ? "Hide password" : "Show password"}
                    >
                      {showPwd ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Demo only — no real password is stored.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full gap-2"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <SproutIcon className="size-4" />
                  )}
                  Create Account
                </Button>

                <div className="flex items-start gap-2 rounded-lg bg-accent/40 p-2.5 text-xs text-accent-foreground">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  <span>
                    By signing up you get instant access to the marketplace, AI
                    crop advisor, weather advisories, and market intelligence.
                  </span>
                </div>
              </form>
            </TabsContent>
          </Tabs>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} FarmMart · Secure 256-bit encryption
          </p>
        </div>
      </main>
    </div>
  );
}
