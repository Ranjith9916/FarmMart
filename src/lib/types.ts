// FarmMart shared types

export type Role = "BUYER" | "FARMER" | "WHOLESALER" | "TRANSPORTER";

export type ViewKey =
  | "marketplace"
  | "cart"
  | "orders"
  | "dashboard"
  | "advisor"
  | "weather"
  | "insights";

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  unit: string;
  stock: number;
  imageUrl: string;
  location: string;
  organic: boolean;
  harvestDate: string | null;
  tags: string | null;
  rating: number;
  reviewCount: number;
  sold: number;
  active: boolean;
  farmerId: string;
  farmer: {
    id: string;
    name: string;
    location: string | null;
    rating: number;
    avatar: string | null;
  };
  createdAt: string;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  unit: string;
  quantity: number;
  imageUrl: string;
  farmerId: string;
  farmerName: string;
  stock: number;
}

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PACKED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  imageUrl: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  buyerId: string;
  farmerId: string;
  farmer: { id: string; name: string };
  buyer?: { id: string; name: string; location?: string | null };
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentStatus: string;
  paymentMethod: string;
  shippingAddress: string;
  transporterId: string | null;
  trackingNote: string | null;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: { id: string; name: string };
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface WeatherDay {
  date: string;
  day: string;
  tempHigh: number;
  tempLow: number;
  condition: string;
  icon: string;
  humidity: number;
  rainfall: number;
  wind: number;
}

export interface WeatherData {
  location: string;
  current: {
    temp: number;
    condition: string;
    icon: string;
    humidity: number;
    wind: number;
    rainfall: number;
  };
  forecast: WeatherDay[];
  advisory: string;
}

export interface DashboardStats {
  totalProducts: number;
  totalStock: number;
  totalSales: number;
  totalRevenue: number;
  pendingOrders: number;
  lowStockCount: number;
  revenueByCategory: { category: string; revenue: number }[];
  salesTrend: { date: string; sales: number }[];
  topProducts: { name: string; sold: number; revenue: number }[];
  recentOrders: Order[];
}

export interface MarketInsights {
  categoryDistribution: { category: string; count: number; avgPrice: number }[];
  priceTrends: { name: string; data: { date: string; price: number }[] }[];
  topRegions: { location: string; products: number; revenue: number }[];
  topSelling: { name: string; category: string; sold: number; revenue: number }[];
  demandIndex: { category: string; demand: number }[];
}
