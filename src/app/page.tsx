"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import { Header } from "@/components/farmmart/header";
import { Footer } from "@/components/farmmart/footer";
import { MarketplaceView } from "@/components/farmmart/marketplace-view";
import { ProductDetailDialog } from "@/components/farmmart/product-detail-dialog";
import { CartView } from "@/components/farmmart/cart-view";
import { OrdersView } from "@/components/farmmart/orders-view";
import { DashboardView } from "@/components/farmmart/dashboard-view";
import { AdvisorView } from "@/components/farmmart/advisor-view";
import { WeatherView } from "@/components/farmmart/weather-view";
import { InsightsView } from "@/components/farmmart/insights-view";

export default function Home() {
  const view = useStore((s) => s.view);

  // Ensure the database is seeded on first load (idempotent)
  useEffect(() => {
    api("/api/seed", { method: "POST" }).catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {view === "marketplace" && <MarketplaceView />}
        {view === "cart" && <CartView />}
        {view === "orders" && <OrdersView />}
        {view === "dashboard" && <DashboardView />}
        {view === "advisor" && <AdvisorView />}
        {view === "weather" && <WeatherView />}
        {view === "insights" && <InsightsView />}
      </main>
      <Footer />
      <ProductDetailDialog />
    </div>
  );
}
