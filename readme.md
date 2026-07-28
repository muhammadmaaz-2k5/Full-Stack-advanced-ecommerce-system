<div align="center">

<h1>🛒 Full-Stack Advanced E-Commerce System</h1>

<p>A production-grade, full-featured e-commerce platform built with <strong>Next.js 13</strong>, <strong>Supabase</strong>, <strong>TypeScript</strong>, and <strong>Tailwind CSS</strong> — featuring a complete storefront, admin dashboard, cart, orders, coupons, reviews, and more.</p>

<p>
  <a href="https://full-stack-advanced-ecommerce-syste.vercel.app/" target="_blank">
    <img src="https://img.shields.io/badge/🌐_Live_Demo-Visit_Site-4F46E5?style=for-the-badge" alt="Live Demo" />
  </a>
  &nbsp;
  <img src="https://img.shields.io/badge/Next.js-13.5-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  &nbsp;
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase" />
  &nbsp;
  <img src="https://img.shields.io/badge/TypeScript-5.2-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  &nbsp;
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.3-38BDF8?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS" />
</p>

</div>

---

## ✨ Features

### 🛍️ Customer Storefront
| Feature | Description |
|---|---|
| **Hero & Landing Page** | Animated hero section with featured products, category showcases, and trust badges |
| **Product Catalog** | Full browsable shop with filters by category, brand, price range, and rating |
| **Product Detail Pages** | Image gallery, reviews, variant selection, stock status, and related products |
| **Search** | Real-time product search across the entire catalog |
| **Shopping Cart** | Slide-over cart drawer with live quantity updates and subtotal calculation |
| **Wishlist** | Save favorite products for later |
| **Checkout** | Multi-step checkout with address management and order summary |
| **Payment Methods** | Credit/Debit Card and **Cash on Delivery (COD)** support |
| **Order Tracking** | Full order history and status tracking per customer |
| **Coupon Codes** | Apply promo codes with percentage or fixed-amount discounts |

### 🔐 Authentication
- Email + Password sign-up and login via **Supabase Auth**
- Protected routes for account, checkout, and order history
- Role-based access: `customer` vs `admin`

### 🛠️ Admin Dashboard
| Module | Capabilities |
|---|---|
| **Dashboard** | Revenue overview, sales charts (Recharts), KPI cards |
| **Products** | Create, edit, delete products; manage images, pricing, stock, featured flag |
| **Categories** | Hierarchical category management with image support |
| **Orders** | View and update order status through the full fulfilment workflow |
| **Customers** | Browse all registered customers |
| **Inventory** | Monitor stock levels and reserved stock |
| **Coupons** | Create/manage promo codes with expiry dates |
| **Reports** | Sales analytics and revenue breakdowns |
| **Settings** | Configure COD fees, max order limits, and store-wide settings |

### ⚙️ Technical Highlights
- **Next.js App Router** with Server Components for fast initial loads
- **Row-Level Security (RLS)** on all Supabase tables — zero trust by default
- **Optimistic UI** updates on cart and wishlist interactions
- **Dark / Light mode** with `next-themes`
- **Fully typed** end-to-end with TypeScript
- **shadcn/ui** component library for a polished, accessible UI
- **Zod** for schema validation + **React Hook Form** for robust forms

---

## 🗂️ Project Structure

```
├── app/                    # Next.js App Router
│   ├── page.tsx            # Home page (featured products, categories, hero)
│   ├── shop/               # Full product catalog with filters
│   ├── products/[id]/      # Product detail page
│   ├── categories/         # Category browsing pages
│   ├── checkout/           # Checkout flow
│   ├── account/            # Customer account (orders, addresses, profile)
│   ├── login/              # Authentication pages
│   ├── register/           
│   └── admin/              # Admin dashboard (protected)
│       ├── page.tsx         # Dashboard overview & charts
│       ├── products/        # Product management
│       ├── orders/          # Order management
│       ├── categories/      # Category management
│       ├── customers/       # Customer list
│       ├── inventory/       # Stock management
│       ├── reports/         # Analytics & reports
│       └── settings/        # Store settings (COD, etc.)
│
├── components/             # Shared React components
│   ├── site-header.tsx     # Navigation with cart drawer & search
│   ├── site-footer.tsx     
│   ├── product-card.tsx    
│   ├── product-detail.tsx  
│   ├── product-grid.tsx    
│   ├── cart-drawer.tsx     # Slide-over cart UI
│   ├── filter-sidebar.tsx  # Shop filter panel
│   ├── auth-form.tsx       # Unified login/register form
│   └── ui/                 # shadcn/ui component library
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts       # Browser Supabase client
│   │   └── server.ts       # Server-side Supabase client (SSR)
│   ├── context/
│   │   ├── auth-context.tsx # Auth state & session management
│   │   └── cart-context.tsx # Cart state management
│   ├── types.ts            # All TypeScript interfaces
│   ├── format.ts           # Price, date, number formatters
│   └── utils.ts            # Utility helpers (cn, etc.)
│
├── hooks/
│   └── use-toast.ts        # Toast notification hook
│
└── supabase/
    └── migrations/         # SQL migration files
        ├── 20260727162334_create_ecommerce_schema.sql  # Full DB schema
        └── 20260728070113_add_cod_payment_support.sql  # COD feature migration
```

---

## 🗄️ Database Schema

The Supabase PostgreSQL database includes the following tables, all with **Row-Level Security** enabled:

```
categories        → Product categories (hierarchical, self-referencing)
brands            → Product brands with logos
products          → Catalog items (SKU, price, stock, images, featured flag)
product_variants  → Size/color variants per product
reviews           → Customer ratings, text reviews, and images
customers         → User profiles extending auth.users
addresses         → Shipping/billing addresses per customer
carts             → Active cart per customer
cart_items        → Line items in a cart
orders            → Placed orders with full status workflow
order_items       → Line items per order
invoices          → Auto-generated invoices per order
wishlist          → Saved products per customer
coupons           → Promo codes (percentage, fixed, free shipping)
store_settings    → Global store config (COD fees, limits)
```

**Order Status Workflow:**
`pending` → `confirmed` → `packed` → `ready_to_ship` → `shipped` → `delivered` → `completed`

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) ≥ 18
- [npm](https://npmjs.com/) or [yarn](https://yarnpkg.com/)
- A [Supabase](https://supabase.com/) project

### 1. Clone the Repository

```bash
git clone https://github.com/muhammadmaaz-2k5/Full-Stack-advanced-ecommerce-system.git
cd Full-Stack-advanced-ecommerce-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> You can find these in your Supabase project under **Settings → API**.

### 4. Apply Database Migrations

In your Supabase project's **SQL Editor**, run the migration files in order:

1. `supabase/migrations/20260727162334_create_ecommerce_schema.sql`
2. `supabase/migrations/20260728070113_add_cod_payment_support.sql`

Or with the Supabase CLI:

```bash
supabase db push
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/muhammadmaaz-2k5/Full-Stack-advanced-ecommerce-system)

1. Import the repository on [Vercel](https://vercel.com)
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables
3. Deploy — Vercel handles the rest

### Netlify

A `netlify.toml` is included for seamless Netlify deployment with the Next.js plugin pre-configured.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 13](https://nextjs.org/) (App Router) |
| **Language** | [TypeScript 5.2](https://www.typescriptlang.org/) |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL + Auth + RLS) |
| **Styling** | [Tailwind CSS 3.3](https://tailwindcss.com/) |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Forms** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| **Animations** | [tailwindcss-animate](https://github.com/jamiebuilds/tailwindcss-animate) |
| **Theming** | [next-themes](https://github.com/pacocoursey/next-themes) |
| **Carousel** | [Embla Carousel](https://www.embla-carousel.com/) |

---

## 📸 Screenshots

| Storefront | Admin Dashboard |
|---|---|
| Hero section with featured products and categories | Revenue overview, KPIs, and sales charts |
| Full product catalog with filter sidebar | Product management with full CRUD |
| Product detail with gallery and reviews | Order management with status workflow |

> 🔗 **Live Demo:** [https://full-stack-advanced-ecommerce-syste.vercel.app/](https://full-stack-advanced-ecommerce-syste.vercel.app/)

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

Made with ❤️ by <a href="https://github.com/muhammadmaaz-2k5">Muhammad Maaz</a>

⭐ Star this repo if you found it helpful!

</div>
