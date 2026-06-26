"use client";

import { useState, useRef, useEffect } from "react";
import { useStore, type AuthUser } from "@/lib/store";
import { api, ROLE_LABELS } from "@/lib/api";
import type { Role } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  Sparkles,
  ArrowLeft,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

type Mode = "login" | "register";

export function LoginView() {
  const login = useStore((s) => s.login);
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Google login state
  const [googleOpen, setGoogleOpen] = useState(false);
  const [googleStep, setGoogleStep] = useState<"accounts" | "enter" | "loading">("accounts");
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");
  const [googleError, setGoogleError] = useState("");
  const [savedAccounts, setSavedAccounts] = useState<{ email: string; name: string }[]>([]);

  // Simulated "Chrome logged-in accounts" — these represent Google accounts
  // that are already signed into the Chrome browser, just like real Google OAuth
  const CHROME_ACCOUNTS = [
    { email: "alex.patel@gmail.com", name: "Alex Patel" },
    { email: "priya.sharma@gmail.com", name: "Priya Sharma" },
  ];

  // Load saved Google accounts from localStorage and merge with Chrome accounts
  useEffect(() => {
    if (!googleOpen) return;
    try {
      const stored = localStorage.getItem("farmmart-google-accounts");
      const userAccounts: { email: string; name: string }[] = stored
        ? JSON.parse(stored)
        : [];
      // Merge Chrome accounts with user-saved accounts (no duplicates)
      const merged = [...CHROME_ACCOUNTS];
      for (const acc of userAccounts) {
        if (!merged.find((m) => m.email === acc.email)) {
          merged.push(acc);
        }
      }
      setSavedAccounts(merged);
    } catch {
      setSavedAccounts(CHROME_ACCOUNTS);
    }
  }, [googleOpen]);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("BUYER");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");

  // Mouse parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });
  const bgX = useTransform(springX, [-0.5, 0.5], [20, -20]);
  const bgY = useTransform(springY, [-0.5, 0.5], [10, -10]);
  const cardX = useTransform(springX, [-0.5, 0.5], [-8, 8]);
  const cardY = useTransform(springY, [-0.5, 0.5], [-5, 5]);
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      mouseX.set(x);
      mouseY.set(y);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

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
        await api("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({ name, email, password, role, location, phone }),
        });
        toast.success("Account created successfully! Please sign in to continue.");
        setMode("login");
        setPassword("");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const socialLogin = (provider: string) => {
    if (provider === "Google") {
      setGoogleOpen(true);
      setGoogleStep("accounts");
      setGoogleEmail("");
      setGoogleName("");
      setGoogleError("");
    } else {
      toast.info(`${provider} login is not available in this demo. Please use email or Google sign-in.`);
    }
  };

  // Save a Google account to localStorage so it shows in the picker next time
  const saveGoogleAccount = (email: string, name: string) => {
    try {
      const stored = localStorage.getItem("farmmart-google-accounts");
      const accounts: { email: string; name: string }[] = stored
        ? JSON.parse(stored)
        : [];
      // Don't duplicate
      if (!accounts.find((a) => a.email === email)) {
        accounts.push({ email, name });
        localStorage.setItem(
          "farmmart-google-accounts",
          JSON.stringify(accounts)
        );
        setSavedAccounts(accounts);
      }
    } catch {
      // ignore
    }
  };

  // Handle Google account selection — calls the Google auth API
  const handleGoogleLogin = async (selectedEmail?: string, selectedName?: string) => {
    const finalEmail = (selectedEmail || googleEmail).trim().toLowerCase();
    const finalName = selectedName || googleName || finalEmail.split("@")[0];

    if (!finalEmail || !/^\S+@\S+\.\S+$/.test(finalEmail)) {
      setGoogleError("Please enter a valid email address");
      return;
    }

    setGoogleStep("loading");
    setGoogleError("");
    try {
      const data = await api<{ user: AuthUser }>("/api/auth/google", {
        method: "POST",
        body: JSON.stringify({
          email: finalEmail,
          name: finalName,
          avatar: null,
        }),
      });
      // Save this account so it appears in the picker next time
      saveGoogleAccount(finalEmail, data.user.name);
      login(data.user);
      toast.success(`Signed in with Google as ${data.user.name.split(" ")[0]}!`);
      setGoogleOpen(false);
    } catch (e) {
      setGoogleStep("enter");
      setGoogleError(e instanceof Error ? e.message : "Google sign-in failed");
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* === 3D RENDERED BACKGROUND with parallax === */}
      <motion.div
        ref={sceneRef}
        className="absolute inset-0"
        style={{ x: bgX, y: bgY, scale: 1.05 }}
        aria-hidden
      >
        {/* 3D rendered background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/login-3d-bg.jpg)" }}
        />
        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/40" />
      </motion.div>

      {/* === ANIMATED OVERLAYS === */}
      {/* Drifting clouds */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute left-[5%] top-[8%] opacity-40" style={{ animation: "cloudDrift 50s linear infinite" }}>
          <SunsetCloud />
        </div>
        <div className="absolute right-[20%] top-[5%] opacity-35" style={{ animation: "cloudDrift 65s linear infinite", animationDelay: "-15s" }}>
          <SunsetCloud size={0.7} />
        </div>
        <div className="absolute left-[55%] top-[15%] opacity-30" style={{ animation: "cloudDrift 70s linear infinite", animationDelay: "-30s" }}>
          <SunsetCloud size={0.6} />
        </div>
      </div>

      {/* Flying birds */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute left-0 top-[22%]" style={{ animation: "birdFly1 30s linear infinite" }}>
          <Bird />
        </div>
        <div className="absolute left-0 top-[19%]" style={{ animation: "birdFly1 33s linear infinite", animationDelay: "-3s" }}>
          <Bird size={0.7} delay={0.3} />
        </div>
        <div className="absolute left-0 top-[25%]" style={{ animation: "birdFly1 35s linear infinite", animationDelay: "-6s" }}>
          <Bird size={0.65} delay={0.6} />
        </div>
        <div className="absolute left-0 top-[14%]" style={{ animation: "birdFly2 40s linear infinite", animationDelay: "-10s" }}>
          <Bird size={0.5} delay={0.2} />
        </div>
        <div className="absolute left-0 top-[17%]" style={{ animation: "birdFly2 45s linear infinite", animationDelay: "-20s" }}>
          <Bird size={0.45} delay={0.5} />
        </div>
        <div className="absolute left-0 top-[12%]" style={{ animation: "birdFly2 42s linear infinite", animationDelay: "-28s" }}>
          <Bird size={0.4} delay={0.7} />
        </div>
      </div>

      {/* Sun glow */}
      <div className="absolute right-[8%] top-[45%] pointer-events-none" aria-hidden>
        <div
          className="size-80 rounded-full blur-3xl animate-pulse"
          style={{ background: "rgba(255, 200, 80, 0.2)" }}
        />
      </div>

      {/* Floating dust particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              background: "rgba(255, 230, 180, 0.6)",
              animation: `floatParticle ${8 + (i % 5)}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* Drifting mist */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div
          className="absolute left-0 bottom-[28%] h-24 w-full"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(255,220,180,0.1) 30%, rgba(255,220,180,0.15) 50%, rgba(255,220,180,0.1) 70%, transparent)",
            animation: "mistDrift 25s ease-in-out infinite alternate",
          }}
        />
      </div>

      {/* === TOP BRAND BAR === */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="absolute left-0 top-0 z-20 flex w-full items-center justify-between p-5 sm:p-6"
      >
        <div className="flex items-center gap-2.5">
          <div className="grid size-10 place-items-center rounded-xl bg-white/20 backdrop-blur-md shadow-lg">
            <Sprout className="size-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight text-white drop-shadow-lg">FarmMart</div>
            <div className="text-[10px] text-white/80 drop-shadow">AI Agriculture Marketplace</div>
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md sm:flex">
          <Leaf className="size-3.5" />
          Trusted by 10,000+ farmers
        </div>
      </motion.div>

      {/* === CENTERED GLASSMORPHISM LOGIN CARD === */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ x: cardX, y: cardY }}
          className="w-full max-w-md"
        >
          {/* Floating animation wrapper */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="rounded-3xl border border-white/30 bg-white/80 p-6 shadow-2xl backdrop-blur-2xl sm:p-8"
              style={{ boxShadow: "0 25px 60px -10px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1) inset" }}
            >
              {/* Logo + heading */}
              <div className="mb-6 text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.8, delay: 0.3, type: "spring" }}
                  className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg"
                >
                  <Sprout className="size-7 text-primary-foreground" />
                </motion.div>
                <h1 className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
                  {mode === "login" ? "Welcome Back" : "Create Account"}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {mode === "login"
                    ? "Sign in to access the FarmMart marketplace"
                    : "Join FarmMart to buy, sell, and grow with AI"}
                </p>
              </div>

              {/* Mode toggle */}
              <div className="mb-6 inline-flex w-full rounded-xl border border-border bg-secondary/50 p-1">
                <button
                  onClick={() => setMode("login")}
                  className={cn(
                    "flex-1 rounded-lg px-5 py-2 text-sm font-medium transition-all",
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
                    "flex-1 rounded-lg px-5 py-2 text-sm font-medium transition-all",
                    mode === "register"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Sign Up
                </button>
              </div>

              <form onSubmit={submit} className="space-y-4">
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
                </div>

                {/* Remember me + Forgot password (login mode only) */}
                {mode === "login" && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={rememberMe}
                        onCheckedChange={(c) => setRememberMe(c === true)}
                      />
                      <span className="text-sm text-muted-foreground">Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => toast.info("Password reset link will be sent to your email")}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

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

                {/* Login button with glow */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    className="w-full gap-2 shadow-lg transition-all hover:shadow-primary/30 hover:shadow-xl"
                    size="lg"
                    disabled={loading}
                    style={{ boxShadow: "0 4px 20px -2px rgba(80,120,60,0.4)" }}
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
                </motion.div>
              </form>

              {/* Divider */}
              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-border/60" />
                <span className="text-xs text-muted-foreground">or continue with</span>
                <div className="h-px flex-1 bg-border/60" />
              </div>

              {/* Social login buttons */}
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => socialLogin("Google")}
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium transition-all hover:bg-accent hover:shadow-md"
                >
                  <GoogleIcon />
                  Google
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => socialLogin("GitHub")}
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium transition-all hover:bg-accent hover:shadow-md"
                >
                  <GitHubIcon />
                  GitHub
                </motion.button>
              </div>

              {/* Switch mode */}
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

              {/* Security footer */}
              <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5 text-primary" />
                Your data is protected with 256-bit encryption
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* === BOTTOM TAGLINE === */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-0 left-0 z-10 w-full p-4 text-center"
      >
        <p className="text-sm font-medium text-white drop-shadow-lg">
          From harvest to doorstep, powered by AI 🌾
        </p>
      </motion.div>

      {/* === GOOGLE LOGIN DIALOG === */}
      <Dialog
        open={googleOpen}
        onOpenChange={(o) => {
          setGoogleOpen(o);
          if (!o) {
            setGoogleStep("accounts");
            setGoogleError("");
          }
        }}
      >
        <DialogContent className="max-w-sm p-0 overflow-hidden" aria-describedby={undefined}>
          {googleStep === "loading" ? (
            // Step 3: Loading screen — Google's "Signing in..." screen
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <DialogHeader className="sr-only">
                <DialogTitle>Signing in with Google</DialogTitle>
              </DialogHeader>
              <div className="mb-4">
                <GoogleLogo />
              </div>
              <Loader2 className="size-8 animate-spin text-blue-600" />
              <p className="mt-4 text-sm font-medium text-gray-700">
                Signing you in…
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Please wait while we verify your account
              </p>
            </div>
          ) : googleStep === "accounts" && savedAccounts.length > 0 ? (
            // Step 1: Choose an account — shows saved accounts like Chrome's account picker
            <div className="flex flex-col">
              <DialogHeader className="sr-only">
                <DialogTitle>Choose an account</DialogTitle>
                <DialogDescription>
                  to continue to FarmMart
                </DialogDescription>
              </DialogHeader>

              {/* Google-style header */}
              <div className="flex flex-col items-center px-6 pt-8 pb-2">
                <GoogleLogo />
                <h2 className="mt-4 text-xl font-normal text-gray-800">
                  Choose an account
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  to continue to FarmMart
                </p>
              </div>

              {/* Saved account list */}
              <div className="px-2 py-3 space-y-1">
                {savedAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    onClick={() => handleGoogleLogin(acc.email, acc.name)}
                    className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-gray-50"
                  >
                    {/* Account avatar */}
                    <div className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-sm font-bold text-white">
                      {acc.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-gray-800">
                        {acc.name}
                      </div>
                      <div className="truncate text-xs text-gray-500">
                        {acc.email}
                      </div>
                    </div>
                  </button>
                ))}

                {/* Use another account */}
                <button
                  onClick={() => {
                    setGoogleStep("enter");
                    setGoogleEmail("");
                    setGoogleError("");
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-gray-50"
                >
                  <div className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-gray-300">
                    <UserIcon className="size-5 text-gray-500" />
                  </div>
                  <div className="text-sm font-medium text-gray-700">
                    Use another account
                  </div>
                </button>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3 text-xs text-gray-500">
                <select className="bg-transparent text-gray-500 outline-none">
                  <option>English (United States)</option>
                </select>
                <div className="flex gap-4">
                  <span className="cursor-pointer hover:text-gray-700">Help</span>
                  <span className="cursor-pointer hover:text-gray-700">Privacy</span>
                  <span className="cursor-pointer hover:text-gray-700">Terms</span>
                </div>
              </div>
            </div>
          ) : (
            // Step 2: Enter email — for new accounts or "Use another account"
            <div className="flex flex-col">
              <DialogHeader className="sr-only">
                <DialogTitle>Sign in with Google</DialogTitle>
                <DialogDescription>Enter your email to continue to FarmMart</DialogDescription>
              </DialogHeader>

              {/* Google-style header */}
              <div className="flex flex-col items-center px-6 pt-8 pb-4">
                <GoogleLogo />
                <h2 className="mt-4 text-xl font-normal text-gray-800">
                  Sign in with Google
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  to continue to FarmMart
                </p>
              </div>

              <div className="px-6 pb-6 space-y-3">
                {/* Error message */}
                {googleError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs text-red-700">
                    {googleError}
                  </div>
                )}

                {/* Email input */}
                <div>
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleGoogleLogin()}
                    className="h-12 rounded-lg border-gray-300 text-sm"
                    autoFocus
                  />
                  <p className="mt-1.5 text-xs text-gray-500">
                    Not your computer? Use Guest mode to sign in privately.
                  </p>
                </div>

                {/* Back button (if accounts exist) */}
                {savedAccounts.length > 0 && (
                  <button
                    onClick={() => setGoogleStep("accounts")}
                    className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-800"
                  >
                    <ArrowLeft className="size-3.5" /> Back
                  </button>
                )}

                {/* Continue button */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => {
                      const demoName = googleEmail.trim().split("@")[0] || "New User";
                      handleGoogleLogin(googleEmail.trim() || "newuser@gmail.com", demoName);
                    }}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    Create account
                  </button>
                  <Button
                    onClick={() => handleGoogleLogin()}
                    disabled={!googleEmail.trim()}
                    className="h-10 rounded-full bg-blue-600 px-6 text-sm font-medium hover:bg-blue-700"
                  >
                    Next
                  </Button>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3 text-xs text-gray-500">
                <select className="bg-transparent text-gray-500 outline-none">
                  <option>English (United States)</option>
                </select>
                <div className="flex gap-4">
                  <span className="cursor-pointer hover:text-gray-700">Help</span>
                  <span className="cursor-pointer hover:text-gray-700">Privacy</span>
                  <span className="cursor-pointer hover:text-gray-700">Terms</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// === Helper Components ===

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
      style={{ animation: "flap 0.5s ease-in-out infinite alternate", animationDelay: `${delay}s` }}
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

// Sunset-lit cloud SVG
function SunsetCloud({ size = 1 }: { size?: number }) {
  return (
    <svg width={120 * size} height={60 * size} viewBox="0 0 120 60">
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

// Google icon (small, for buttons)
function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

// Google logo (large, for dialog header)
function GoogleLogo() {
  return (
    <svg className="h-10 w-10" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

// GitHub icon
function GitHubIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}
