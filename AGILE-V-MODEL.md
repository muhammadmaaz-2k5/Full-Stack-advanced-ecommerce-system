# AGILE-V Model — Nimbus eCommerce Platform

This document maps the project's development lifecycle to the **Agile-V Model**, a hybrid approach that combines iterative Agile delivery with the verification-and-validation structure of the V-Model. Each phase on the left side of the "V" has a corresponding test level on the right side.

```
                    ┌─────────────────────────────────────────┐
                    │              Acceptance Testing           │
                    └──────────────────┬──────────────────────┘
                                       │
              ┌────────────────────────┴───────────────────────┐
              │            System Testing                       │
              └──────────────────┬─────────────────────────────┘
                                 │
        ┌────────────────────────┴─────────────────────────────┐
        │          Integration Testing                          │
        └──────────────────┬───────────────────────────────────┘
                           │
    ┌──────────────────────┴───────────────────────────────────┐
    │        Component / Unit Testing                           │
    └──────────────────┬────────────────────────────────────────┘
                       │
  ┌────────────────────┴──────────────────────────────────────┐
  │      Code Implementation (Sprint Delivery)                │
  └───────────────────────────────────────────────────────────┘
```

---

## 1. Requirements Analysis

**Agile equivalent:** Backlog refinement, user story mapping, sprint planning.

### 1.1 Functional Requirements

| ID  | Requirement                                      | Priority |
|-----|--------------------------------------------------|----------|
| FR1 | Customer registration and login                  | Must     |
| FR2 | Product browsing with search, filters, sorting   | Must     |
| FR3 | Product detail with variants and reviews         | Must     |
| FR4 | Shopping cart management                          | Must     |
| FR5 | Checkout with shipping, coupons, and tax          | Must     |
| FR6 | Order placement with inventory reduction          | Must     |
| FR7 | Order history and tracking                        | Must     |
| FR8 | Wishlist management                               | Should   |
| FR9 | Address book management                           | Should   |
| FR10| Admin dashboard with analytics                    | Must     |
| FR11| Admin product CRUD                                | Must     |
| FR12| Admin order management                            | Must     |
| FR13| Admin inventory management                        | Must     |
| FR14| Admin customer management                         | Should   |
| FR15| Reports and analytics                             | Should   |
| FR16| Role-based access (customer, admin, sales, etc.) | Must     |

### 1.2 Non-Functional Requirements

| ID   | Requirement                                              |
|------|----------------------------------------------------------|
| NFR1 | Responsive design (mobile, tablet, desktop)              |
| NFR2 | Page load under 3 seconds (LCP)                         |
| NFR3 | Row-level security on all database tables                |
| NFR4 | JWT-based authentication                                 |
| NFR5 | Accessible (WCAG 2.1 AA)                                 |
| NFR6 | SEO-friendly with server-side rendering                 |

### 1.3 User Roles

| Role               | Access Level                                          |
|--------------------|-------------------------------------------------------|
| Customer           | Shop, cart, checkout, own orders, wishlist, addresses |
| Admin              | Full access + admin dashboard                         |
| Sales Manager      | Orders, CRM, reports (read)                           |
| Warehouse Manager  | Inventory, shipping, stock adjustments                |
| Accountant         | Invoices, financial reports                           |

**→ Verification: Acceptance Testing** — Validate that each requirement is met by the delivered software through end-to-end user journeys per role.

---

## 2. System Design

**Agile equivalent:** Architecture spike, technical design review per sprint.

### 2.1 Architecture

```
Customer (Browser)
    ↓
Next.js Frontend (React, TypeScript, Tailwind, Shadcn UI)
    ↓
Supabase (PostgreSQL + Auth + Realtime)
    ↓
PostgreSQL Database
```

### 2.2 Database Schema (ER Overview)

```
categories ──< products >── brands
                  │
                  ├──< product_variants
                  ├──< reviews
                  ├──< wishlist
                  └──< cart_items >── carts

auth.users ──< customers
                ├──< addresses
                ├──< orders ──< order_items
                │       └──< invoices
                └──< carts

coupons (standalone)
```

### 2.3 Security Design

- Row-level security (RLS) on every table
- Owner-scoped policies for customer data
- Public read for catalog tables, admin write
- JWT authentication via Supabase Auth
- Role stored in `customers.role` column

**→ Verification: System Testing** — End-to-end testing of complete flows (signup → browse → cart → checkout → order → tracking) and security boundary testing (RLS policy validation, cross-user access attempts).

---

## 3. Architecture / Module Design

**Agile equivalent:** Component design within sprint, interface contracts.

### 3.1 Frontend Modules

| Module              | Responsibility                                      |
|---------------------|-----------------------------------------------------|
| `app/page.tsx`      | Home page (hero, categories, featured)              |
| `app/shop/`         | Product listing with filters                        |
| `app/categories/`   | Category-filtered listing                            |
| `app/products/`     | Product detail (variants, reviews, related)         |
| `app/checkout/`     | Checkout flow (address, shipping, payment, coupon)  |
| `app/login/`        | Login + test role quick-login                        |
| `app/register/`     | Customer registration                                |
| `app/account/`      | Profile, orders, wishlist, addresses                 |
| `app/admin/`        | Dashboard, orders, products, inventory, customers, reports |

### 3.2 Shared Components

| Component            | Responsibility                                    |
|----------------------|---------------------------------------------------|
| `lib/context/auth`   | Auth state, sign in/up/out, profile loading       |
| `lib/context/cart`   | Cart state, add/update/remove items, subtotal     |
| `components/site-header` | Navigation, search, cart badge, account menu  |
| `components/cart-drawer` | Slide-out cart with quantity controls         |
| `components/product-card` | Reusable product card with quick-add          |
| `components/product-grid` | Filterable, sortable product grid             |
| `components/filter-sidebar` | Category, brand, price, rating filters      |

### 3.3 Data Layer

| Module                | Responsibility                                    |
|-----------------------|---------------------------------------------------|
| `lib/supabase/client` | Browser Supabase singleton                        |
| `lib/supabase/server` | Server-side Supabase with cookie auth              |
| `lib/types`           | TypeScript types for all database entities         |
| `lib/format`           | Price, date formatting, order/invoice generators  |

**→ Verification: Integration Testing** — Test that modules work together: auth context → cart context → checkout → order creation → inventory reduction → invoice generation.

---

## 4. Detailed Design (Unit Level)

**Agile equivalent:** Task breakdown, implementation within sprint.

### 4.1 Key Functions

| Function                  | Input                          | Output           | Test Cases                                    |
|--------------------------|--------------------------------|------------------|-----------------------------------------------|
| `formatPrice()`           | number                         | string "$X.XX"   | 0, negative, large, decimal                   |
| `discountPercent()`       | price, compareAt               | number 0-100     | no discount, full discount, null compareAt    |
| `generateOrderNumber()`   | none                           | "ORD-XXX-XXXX"   | uniqueness, format                            |
| `addItem()` (cart)        | product, variant, qty          | cart updated     | new item, existing item, out of stock         |
| `quickLogin()` (auth)     | TestRole                       | session created  | each role, invalid credentials                |
| `updateStatus()` (admin)  | orderId, status                | order updated    | valid transition, invalid ID                  |
| `applyCoupon()`           | code                           | discount applied | valid, expired, below minimum, invalid         |

**→ Verification: Unit / Component Testing** — Test individual functions and React components in isolation. Each function has defined inputs, expected outputs, and edge cases.

---

## 5. Implementation (Sprint Delivery)

**Agile equivalent:** Sprint execution, continuous integration.

### 5.1 Sprint Breakdown

| Sprint | Deliverable                                          | Status   |
|--------|------------------------------------------------------|----------|
| 1      | Database schema, Supabase setup, auth context         | Complete |
| 2      | Storefront home, shop listing, product detail          | Complete |
| 3      | Cart, checkout, order placement, inventory automation  | Complete |
| 4      | Customer account pages (orders, wishlist, addresses)   | Complete |
| 5      | Admin dashboard, orders, products, inventory, reports   | Complete |
| 6      | Test role login system, hero redesign, documentation   | Complete |

### 5.2 Coding Standards

- TypeScript strict mode
- Server components by default, `"use client"` only when needed
- Shadcn UI + Tailwind CSS for all styling
- Lucide React for icons
- No external UI libraries beyond Shadcn
- Consistent 8px spacing system
- 6-color ramp system (primary, secondary, accent, success, warning, error)

### 5.3 Build Verification

- `npm run build` — production build must pass
- `npm run typecheck` — TypeScript must pass with no errors
- ESLint configured (warnings allowed, errors blocked)

---

## 6. Test Levels (Right Side of the V)

### 6.1 Unit Testing

**Scope:** Individual functions, hooks, and components.

| Target                  | Test Cases                                              |
|------------------------|---------------------------------------------------------|
| `formatPrice`          | 0 → "$0.00", 149.5 → "$149.50", null → "$0.00"         |
| `discountPercent`      | (100, 200) → 50, (100, null) → 0, (100, 100) → 0       |
| `formatDate`           | ISO string → "MMM D, YYYY"                              |
| `generateOrderNumber`  | Returns "ORD-XXX-XXXX" format, unique on rapid calls    |
| ProductCard render     | Renders title, price, rating; add-to-cart calls addItem |
| AuthForm validation    | Empty email → error, short password → error            |

### 6.2 Integration Testing

**Scope:** Module-to-module interaction.

| Flow                                              | Test Steps                                           |
|---------------------------------------------------|------------------------------------------------------|
| Auth → Cart                                       | Sign in → add item → cart updates with correct qty   |
| Cart → Checkout → Order                           | Add items → checkout → order created → cart cleared   |
| Order → Inventory                                 | Place order → product quantity decremented            |
| Order → Invoice                                   | Place order → invoice row created with correct totals |
| Coupon → Checkout totals                         | Apply coupon → discount + shipping recalculated       |
| Auth state → Header UI                            | Sign in → user menu appears with profile name         |

### 6.3 System Testing

**Scope:** End-to-end user journeys.

| Journey                              | Steps                                                        |
|--------------------------------------|--------------------------------------------------------------|
| New customer purchase                | Register → add address → browse → add to cart → checkout → order |
| Returning customer                   | Login → view order history → track order → reorder          |
| Admin product management             | Login as admin → add product → edit → verify in storefront   |
| Admin order fulfillment              | Login as admin → view orders → update status → verify tracking |
| Inventory management                 | Login as admin → adjust stock → verify low-stock alert      |
| Wishlist flow                        | Browse → save to wishlist → view in account → remove        |
| Test role quick login                | Login page → expand test logins → click each role → verify access |

### 6.4 Acceptance Testing

**Scope:** Validate against original requirements per user role.

| Role             | Acceptance Criteria                                           |
|------------------|---------------------------------------------------------------|
| Customer         | Can register, browse, search, filter, cart, checkout, track  |
| Admin            | Can access dashboard, manage products, orders, inventory       |
| Sales Manager    | Can view orders and customer data                             |
| Warehouse Mgr    | Can view and adjust inventory, see stock alerts               |
| Accountant       | Can view invoices and financial reports                       |

---

## 7. Traceability Matrix

| Requirement | Design Module              | Implementation File                  | Test Level     |
|-------------|---------------------------|--------------------------------------|----------------|
| FR1 Auth    | auth-context.tsx           | lib/context/auth-context.tsx         | Unit, System   |
| FR2 Browse  | product-grid, filter       | app/shop/page.tsx                    | Integration    |
| FR3 Detail  | product-detail             | app/products/[id]/page.tsx           | System         |
| FR4 Cart    | cart-context, cart-drawer   | lib/context/cart-context.tsx        | Unit, Integration |
| FR5 Checkout| checkout page              | app/checkout/page.tsx               | System         |
| FR6 Orders | checkout → orders table    | app/checkout/page.tsx               | Integration    |
| FR7 History | orders pages               | app/account/orders/                  | System         |
| FR8 Wishlist| wishlist page              | app/account/wishlist/page.tsx       | System         |
| FR9 Address | addresses page             | app/account/addresses/page.tsx       | System         |
| FR10 Dashboard | admin dashboard          | app/admin/page.tsx                  | System         |
| FR11 Products | admin products           | app/admin/products/page.tsx          | System         |
| FR12 Orders  | admin orders              | app/admin/orders/page.tsx           | System         |
| FR13 Inventory| admin inventory          | app/admin/inventory/page.tsx        | System         |
| FR14 Customers| admin customers          | app/admin/customers/page.tsx         | System         |
| FR15 Reports | admin reports             | app/admin/reports/page.tsx          | System         |
| FR16 Roles  | auth-context, test login   | components/auth-form.tsx            | Acceptance     |

---

## 8. Continuous Integration

```
Git Push
  ↓
GitHub Actions
  ↓
├── npm install
├── npm run typecheck (tsc --noEmit)
├── npm run lint (next lint)
├── npm run build (next build)
└── Deploy on success
```

Every push triggers the CI pipeline. A failed typecheck, lint error, or build failure blocks deployment.

---

## 9. Test Accounts

| Role             | Email                    | Password     |
|------------------|--------------------------|--------------|
| Customer         | customer@nimbus.shop     | NimbusTest2025!   |
| Admin            | admin@nimbus.shop        | NimbusTest2025!   |
| Sales Manager    | sales@nimbus.shop        | NimbusTest2025!   |
| Warehouse Mgr    | warehouse@nimbus.shop    | NimbusTest2025!   |
| Accountant       | accountant@nimbus.shop   | NimbusTest2025!   |

All accounts are pre-seeded in the database with appropriate role assignments.
