"use client";

import { Sprout, Leaf, CloudSun, TrendingUp, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
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
        <div className="mt-6 flex flex-col items-center justify-between gap-2 border-t border-border/60 pt-4 text-xs text-muted-foreground sm:flex-row">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="size-3.5 text-primary" />
            Secure payments &amp; verified sellers
          </span>
          <span>© {new Date().getFullYear()} FarmMart. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
