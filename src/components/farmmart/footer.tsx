"use client";

import { Sprout, Leaf, CloudSun, TrendingUp, ShieldCheck, Building2, Mail, Phone, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {/* === Investor / Partner CTA Banner === */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-accent/30 to-background p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="size-5 text-primary" />
                <h3 className="text-lg font-bold">Partner with FarmMart</h3>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                We're building India's largest AI-powered agriculture marketplace. <br className="hidden sm:block" />
                Seed round open · Backed by agri-tech visionaries.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href="mailto:invest@farmmart.io?subject=Investment Inquiry - FarmMart"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-lg hover:scale-105"
              >
                <Mail className="size-4" />
                Investor Deck
              </a>
              <a
                href="mailto:partners@farmmart.io?subject=Partnership Inquiry"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-accent"
              >
                <Globe className="size-4" />
                Partner With Us
              </a>
            </div>
          </div>
        </div>

        {/* === Revenue Model === */}
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Transaction Fee", desc: "2-5% commission on every order", icon: "💳", highlight: "Primary revenue" },
            { title: "Logistics Fee", desc: "15% of shipping cost per delivery", icon: "🚚", highlight: "Recurring" },
            { title: "Premium Subscriptions", desc: "₹499/mo for advanced analytics & AI", icon: "⭐", highlight: "SaaS model" },
            { title: "Data & API", desc: "Market intelligence API for enterprises", icon: "📊", highlight: "B2B SaaS" },
          ].map((r) => (
            <div key={r.title} className="rounded-xl border border-border/60 bg-card p-3">
              <div className="flex items-center justify-between">
                <span className="text-xl">{r.icon}</span>
                <Badge className="bg-primary/10 text-primary text-[8px]">{r.highlight}</Badge>
              </div>
              <div className="mt-1.5 text-xs font-semibold">{r.title}</div>
              <div className="text-[10px] text-muted-foreground">{r.desc}</div>
            </div>
          ))}
        </div>

        {/* === Footer Links === */}
        <div className="grid gap-6 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Sprout className="size-4" />
              </div>
              <span className="text-base font-bold">FarmMart</span>
            </div>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              A production-grade AI-powered agriculture marketplace connecting
              farmers, buyers, wholesalers, and transporters — from harvest to
              doorstep.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/60 px-2.5 py-1 text-xs font-medium text-accent-foreground">
                <Leaf className="size-3" /> Farm-fresh
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/60 px-2.5 py-1 text-xs font-medium text-accent-foreground">
                <CloudSun className="size-3" /> Weather-aware
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/60 px-2.5 py-1 text-xs font-medium text-accent-foreground">
                <TrendingUp className="size-3" /> Market intelligence
              </span>
            </div>
            {/* Contact info */}
            <div className="mt-4 space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Mail className="size-3" /> invest@farmmart.io
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="size-3" /> +91 1800 123 4567
              </div>
              <div className="flex items-center gap-1.5">
                <Globe className="size-3" /> www.farmmart.io
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Platform</h4>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              <li>Marketplace</li>
              <li>AI Crop Advisor</li>
              <li>Weather Forecast</li>
              <li>Market Insights</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold">For Business</h4>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              <li>Farmer Dashboard</li>
              <li>Wholesale Buying</li>
              <li>Logistics Network</li>
              <li>Inventory Tracking</li>
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-6 rounded-xl border border-border/60 bg-background p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-sm font-semibold">Stay Updated</h4>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Get market prices, weather alerts & AI tips in your inbox.
              </p>
            </div>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-primary sm:w-48"
              />
              <button className="rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-6 flex flex-col items-center justify-between gap-2 border-t border-border/60 pt-4 text-xs text-muted-foreground sm:flex-row">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="size-3.5 text-primary" />
            Secure payments &amp; verified sellers
          </span>
          <span>© {new Date().getFullYear()} FarmMart Technologies Pvt. Ltd. · CIN: U01100MH2024PTC123456</span>
        </div>
      </div>
    </footer>
  );
}
