"use client";

import { useEffect, useRef } from "react";
import { useStore, useHydrated } from "@/lib/store";
import { Header } from "@/components/farmmart/header";
import { Footer } from "@/components/farmmart/footer";
import { MobileNav } from "@/components/farmmart/mobile-nav";
import { LoginView } from "@/components/farmmart/login-view";
import { MarketplaceView } from "@/components/farmmart/marketplace-view";
import { ProductDetailDialog } from "@/components/farmmart/product-detail-dialog";
import { CartView } from "@/components/farmmart/cart-view";
import { OrdersView } from "@/components/farmmart/orders-view";
import { DashboardView } from "@/components/farmmart/dashboard-view";
import { AdvisorView } from "@/components/farmmart/advisor-view";
import { WeatherView } from "@/components/farmmart/weather-view";
import { InsightsView } from "@/components/farmmart/insights-view";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const { authed, view } = useStore();
  const hydrated = useHydrated();
  const mainRef = useRef<HTMLElement>(null);

  // Scroll to top when view changes
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view]);

  if (!hydrated) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authed) {
    return <LoginView />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main ref={mainRef} className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {view === "marketplace" && <MarketplaceView />}
            {view === "cart" && <CartView />}
            {view === "orders" && <OrdersView />}
            {view === "dashboard" && <DashboardView />}
            {view === "advisor" && <AdvisorView />}
            {view === "weather" && <WeatherView />}
            {view === "insights" && <InsightsView />}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <ProductDetailDialog />
      <MobileNav />
    </div>
  );
}
