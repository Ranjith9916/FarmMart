"use client";

import { useStore } from "@/lib/store";
import { Header } from "@/components/farmmart/header";
import { Footer } from "@/components/farmmart/footer";
import { LoginView } from "@/components/farmmart/login-view";
import { MarketplaceView } from "@/components/farmmart/marketplace-view";
import { ProductDetailDialog } from "@/components/farmmart/product-detail-dialog";
import { CartView } from "@/components/farmmart/cart-view";
import { OrdersView } from "@/components/farmmart/orders-view";
import { DashboardView } from "@/components/farmmart/dashboard-view";
import { AdvisorView } from "@/components/farmmart/advisor-view";
import { WeatherView } from "@/components/farmmart/weather-view";
import { InsightsView } from "@/components/farmmart/insights-view";

export default function Home() {
  const { authed, view } = useStore();

  // Not authenticated — show the login / signup page (no header/footer)
  if (!authed) {
    return <LoginView />;
  }

  // Authenticated — show the full app shell
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
