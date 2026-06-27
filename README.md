# 🌾 FarmMart — AI-Powered Agriculture Marketplace

> **From harvest to doorstep, powered by AI.**
>
> A production-grade agriculture marketplace connecting farmers, buyers, wholesalers, and transporters across India. Discover fresh produce, manage orders, get AI crop recommendations, weather forecasts, and real-time market intelligence — all in one platform.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

---

## 📸 Preview

### Login Page — 3D Animated Cinematic Background
- Full-screen AI-generated 3D farm landscape (mountains, rising sun, flying birds, farmland)
- Glassmorphism login card with frosted glass effect
- Mouse parallax — background and card respond to mouse movement
- Framer Motion entrance animations
- Google OAuth-style login with account picker
- Dark mode support

### Multi-Role Dashboards
- **Buyer Dashboard** — Loyalty points, AI recommendations, savings calculator, order tracking
- **Farmer Dashboard** — Inventory management, sales charts, achievement badges, harvest calendar
- **Transporter Dashboard** — Fleet overview, earnings chart, availability toggle, live delivery tracking
- **Wholesaler Dashboard** — Bulk ordering, wholesale pricing, market insights

---

## ✨ Features

### 🔐 Authentication & User Management
- Multi-role signup (Buyer, Farmer, Wholesaler, Transporter)
- Email/password authentication with validation
- Google OAuth-style login with saved account picker
- Profile editing with photo upload
- Dark mode toggle
- Session persistence across refreshes

### 🛒 Marketplace & Commerce
- Product discovery with search, filters (category, region, price, organic), and sorting
- **Deal of the Day** with live countdown timer
- Product detail dialog with price trend charts, reviews, and share buttons
- **Wishlist/Favorites** system with heart icon
- **Recently Viewed** products tracking
- Stock progress bars with color-coded indicators
- Bestseller badges for top-selling products
- Verified seller trust badges
- Bulk discount tiers on cart
- Savings calculator showing market price savings

### 💳 Payments & Checkout
- **6 payment methods**: UPI, Card, Net Banking, Wallet, EMI, Cash on Delivery
- **UPI payment flow**: App selection (PhonePe, Google Pay, Paytm) → PIN entry → Simulated UPI app screen → Payment confirmation
- Order confirmation with receipt/invoice dialog
- Print receipt functionality
- Quick reorder from past orders

### 📦 Order Management
- Live order status tracker (PENDING → CONFIRMED → PACKED → SHIPPED → DELIVERED)
- Cancel order with confirmation dialog and reason field
- Stock auto-reduction on purchase (products go "Out of stock" when sold out)
- Stock restoration on cancellation
- Estimated delivery dates
- Order receipt/invoice with print option

### 🤖 AI Features (Powered by Z.ai SDK)
- **AI Crop Advisor** — Context-aware farming chatbot for crop selection, pest management, irrigation, and market timing
- **Weather & Farm Advisory** — 7-day forecast with AI-generated farming recommendations
- **Category Weather Dashboard** — Role-specific weather advisories for 8 crop categories (Grains, Vegetables, Fruits, Pulses, Spices, Dairy, Nuts, Herbs)
- **Market Intelligence** — AI market briefing + charts (price trends, demand index, regional revenue, top sellers)
- **AI Tip of the Day** on buyer dashboard
- **Recommended for You** — AI-curated product suggestions

### 📊 Dashboards
- **Buyer**: KPIs, loyalty points with 4 tiers (Bronze→Platinum), quick actions, AI recommendations, Fresh from Farms section, recent orders
- **Farmer**: KPIs, sales trend chart, revenue by category pie chart, achievement badges (6 types), harvest calendar (12 months), inventory table with CRUD
- **Transporter**: KPIs, fleet overview, availability toggle, performance stats (on-time rate, distance, rating), 7-day earnings chart, live delivery progress bars
- **Wholesaler**: Full marketplace access with wholesale pricing

### 🎨 UI/UX
- 3D animated cinematic login background
- Glassmorphism design
- Framer Motion page transitions
- Mobile bottom navigation bar (app-style)
- Live chat support widget
- Notifications bell with role-specific clickable alerts
- Global search bar
- Responsive across all devices (mobile, tablet, desktop)
- Dark/light mode with next-themes
- Custom scrollbar styling
- Skeleton loading states

### 🏗️ Investor-Ready Features
- Market opportunity banner ($350B TAM, $24B SAM)
- Revenue model breakdown (4 streams: transaction, logistics, subscription, API)
- Platform traction stats (GTV, users, orders, retention)
- "Partner with FarmMart" CTA with investor contact
- Company registration details (CIN)

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 16** | App Router, API routes, SSR |
| **TypeScript 5** | Type-safe development |
| **Tailwind CSS 4** | Utility-first styling |
| **shadcn/ui** | Component library (New York style) |
| **Prisma ORM** | Database schema & queries (SQLite) |
| **Zustand** | State management with persistence |
| **Framer Motion** | Page transitions & micro-interactions |
| **Recharts** | Data visualization (charts) |
| **Lucide Icons** | Icon system |
| **next-themes** | Dark/light mode |
| **Sonner** | Toast notifications |

---

## 📁 Project Structure

```
FarmMart/
├── src/
│   ├── app/
│   │   ├── api/                    # Backend API routes
│   │   │   ├── ai/                 # AI endpoints (crop-advisor, weather)
│   │   │   ├── auth/               # Login, register, google, profile
│   │   │   ├── orders/             # Order CRUD + status management
│   │   │   ├── products/           # Product CRUD + filtering
│   │   │   ├── dashboard/          # Farmer dashboard stats
│   │   │   ├── market/             # Market insights data
│   │   │   ├── reviews/            # Product reviews
│   │   │   └── upload/             # Image upload (products + avatars)
│   │   ├── globals.css             # Custom theme + animations
│   │   ├── layout.tsx              # Root layout with ThemeProvider
│   │   └── page.tsx                # Main app with view routing
│   │
│   ├── components/
│   │   ├── farmmart/               # FarmMart components
│   │   │   ├── login-view.tsx              # 3D animated login page
│   │   │   ├── marketplace-view.tsx        # Product marketplace
│   │   │   ├── product-card.tsx            # Product card with wishlist
│   │   │   ├── product-detail-dialog.tsx   # Product details + reviews
│   │   │   ├── cart-view.tsx              # Cart + checkout + UPI flow
│   │   │   ├── orders-view.tsx            # Orders + cancel + receipt
│   │   │   ├── dashboard-view.tsx         # Farmer dashboard
│   │   │   ├── buyer-dashboard-view.tsx   # Buyer dashboard
│   │   │   ├── transporter-dashboard-view.tsx # Transporter dashboard
│   │   │   ├── advisor-view.tsx           # AI Crop Advisor chat
│   │   │   ├── weather-view.tsx           # Weather + category advisories
│   │   │   ├── insights-view.tsx          # Market intelligence
│   │   │   ├── header.tsx                 # Navigation + search + notifications
│   │   │   ├── footer.tsx                 # Footer + investor CTA
│   │   │   ├── mobile-nav.tsx             # Bottom navigation bar
│   │   │   ├── live-chat-widget.tsx       # Support chat widget
│   │   │   ├── profile-edit-dialog.tsx    # Profile editing + avatar
│   │   │   ├── add-product-dialog.tsx     # Product creation + photo upload
│   │   │   ├── user-avatar.tsx            # Reusable avatar component
│   │   │   └── ...
│   │   └── ui/                     # shadcn/ui components
│   │
│   ├── lib/
│   │   ├── store.ts                # Zustand store (auth, cart, wishlist)
│   │   ├── types.ts                # TypeScript type definitions
│   │   ├── api.ts                  # API helpers + formatters
│   │   └── db.ts                   # Prisma client
│   │
│   └── hooks/
│       ├── use-mobile.ts           # Mobile detection hook
│       └── use-toast.ts            # Toast hook
│
├── prisma/
│   └── schema.prisma               # Database schema (User, Product, Order, etc.)
│
├── public/
│   ├── farm-hero.jpg               # Login background image
│   ├── login-3d-bg.jpg             # 3D rendered farm scene
│   ├── products/                   # Product images
│   └── logo.svg                    # FarmMart logo
│
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.ts
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v20 or higher
- **Bun** (package manager) — [Install Bun](https://bun.sh/)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Ranjith9916/FarmMart.git
cd FarmMart
```

2. **Install dependencies**
```bash
bun install
```

3. **Set up environment variables**
```bash
# Create a .env file in the root directory
echo "DATABASE_URL=file:./dev.db" > .env
```

4. **Set up the database**
```bash
bun run db:push
```

5. **Start the development server**
```bash
bun run dev
```

6. **Open in browser**
```
http://localhost:3000
```

### Build for Production

```bash
bun run build
bun run start
```

---

## 🗄️ Database Schema

The project uses **Prisma ORM** with **SQLite** (file-based, no external database needed).

### Models

| Model | Description |
|-------|-------------|
| `User` | Multi-role users (Buyer, Farmer, Wholesaler, Transporter) with profile, avatar, and transporter-specific fields |
| `Product` | Farm products with category, pricing, stock, images, reviews, and price history |
| `Order` | Orders with items, status tracking, payment details, and shipping info |
| `OrderItem` | Individual items within an order |
| `Review` | Product reviews with ratings |
| `PriceSnapshot` | Historical price data for trend charts |
| `CropRecommendation` | Saved AI crop advisor conversations |
| `WeatherCache` | Cached weather data per location |

---

## 🔑 Key Workflows

### Buyer Journey
1. Sign up as Buyer → Land on Buyer Dashboard
2. Browse Marketplace → Add to Cart → Apply filters/search
3. Checkout → Choose payment method (UPI/Card/Net Banking/Wallet/EMI/COD)
4. For UPI: Select app → Enter PIN → Confirm in simulated app screen
5. Track order status → Receive delivery → Reorder or write review

### Farmer Journey
1. Sign up as Farmer → Land on Farm Dashboard
2. Click "Sell Product" → Upload photo + fill details → Publish
3. Monitor inventory, sales charts, and achievement badges
4. Receive orders → Advance status (Confirm → Pack → Ship)
5. Check harvest calendar for seasonal planning

### Transporter Journey
1. Sign up as Transporter (with vehicle details) → Land on Transporter Dashboard
2. Toggle availability (Online/Offline)
3. View pending pickups → Mark as picked up
4. Track in-transit deliveries with live progress bars
5. Mark as delivered → View earnings chart

---

## 📱 Responsive Design

- **Mobile** (< 768px): Bottom navigation bar, stacked layouts, hamburger menu
- **Tablet** (768px - 1024px): 2-3 column grids, full nav
- **Desktop** (> 1024px): Full sidebar, 4-column product grid, multi-panel layouts

---

## 🎨 Design System

### Color Palette
- **Primary**: Emerald green (`oklch(0.55 0.13 150)`) — agriculture theme
- **Accent**: Warm amber (`oklch(0.95 0.04 85)`) — harvest/sun
- **Background**: Soft off-white with green tint
- **Dark mode**: Full dark theme with adjusted contrast

### Typography
- **Font**: Geist Sans (Google Fonts)
- **Headings**: Bold, large, with gradient text support
- **Body**: Regular weight, comfortable line height

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server on port 3000 |
| `bun run build` | Build for production |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run db:push` | Push Prisma schema to database |
| `bun run db:generate` | Regenerate Prisma client |
| `bun run db:migrate` | Create database migration |
| `bun run db:reset` | Reset database |

---

## 🔒 Security Features

- Password validation (min 6 characters)
- Email format validation
- Duplicate email prevention
- Stock validation before order creation
- Payment method validation
- Image upload validation (type + size)

---

## 🌐 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Email/password login |
| POST | `/api/auth/register` | New user registration |
| POST | `/api/auth/google` | Google OAuth login |
| PATCH | `/api/auth/profile` | Update user profile |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products with filters |
| POST | `/api/products` | Create product (farmer) |
| GET | `/api/products/[id]` | Get product details |
| PATCH | `/api/products/[id]` | Update product |
| DELETE | `/api/products/[id]` | Delete product |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | List orders by user/role |
| POST | `/api/orders` | Create order (checkout) |
| PATCH | `/api/orders/[id]` | Update order status |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/crop-advisor` | AI farming advice chat |
| GET | `/api/ai/weather` | Weather forecast + advisory |
| GET | `/api/ai/weather/category` | Category-specific weather |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Farmer dashboard stats |
| GET | `/api/market/insights` | Market intelligence data |
| POST | `/api/reviews` | Submit product review |
| POST | `/api/upload` | Upload image file |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Ranjith**
- GitHub: [@Ranjith9916](https://github.com/Ranjith9916)

---

## ⭐ Show Your Support

If you found this project helpful, please give it a ⭐ on GitHub!

---

<div align="center">

**FarmMart** — *From harvest to doorstep, powered by AI.* 🌾

</div>
