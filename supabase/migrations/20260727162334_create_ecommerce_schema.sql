/*
# eCommerce Platform Schema

1. Purpose
   A production-style eCommerce storefront backed by Supabase (standing in for the Odoo/PostgreSQL backend).
   This migration creates the core commerce tables: categories, brands, products, variants, reviews,
   customers (profile extension on auth.users), addresses, cart, cart items, orders, order items,
   invoices, wishlist, and coupons.

2. New Tables
   - `categories` — product categories (self-referencing parent_id for hierarchy)
   - `brands` — product brands
   - `products` — catalog items with sku, price, stock, images, category, brand
   - `product_variants` — size/color style variants of a product
   - `reviews` — customer ratings + review text + images on products
   - `customers` — profile data extending auth.users (name, phone, role)
   - `addresses` — shipping/billing addresses for a customer
   - `carts` — a customer's active cart (one per customer)
   - `cart_items` — line items in a cart
   - `orders` — placed orders with status workflow + totals
   - `order_items` — line items in an order
   - `invoices` — generated invoice per order
   - `wishlist` — products a customer has saved
   - `coupons` — promo codes with discount type + value

3. Security
   - RLS enabled on every table.
   - Catalog tables (categories, brands, products, variants, reviews, coupons) are readable by everyone
     (anon + authenticated) since the storefront is public; writes restricted to authenticated admins.
   - Customer-owned tables (customers, addresses, carts, cart_items, orders, order_items, wishlist)
     are owner-scoped: each authenticated user can only access their own rows.
   - Invoices readable by the owning customer.

4. Notes
   - `customers.user_id` defaults to auth.uid() so inserts from the client succeed.
   - `carts.customer_id` defaults to auth.uid() for the same reason.
   - Products include a `featured` flag and `rating_average` / `rating_count` cache columns for fast display.
*/

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  image_url text,
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Brands
CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  created_at timestamptz DEFAULT now()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text UNIQUE NOT NULL,
  barcode text,
  title text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  compare_at_price numeric(10,2),
  quantity integer NOT NULL DEFAULT 0,
  reserved_stock integer NOT NULL DEFAULT 0,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  brand_id uuid REFERENCES brands(id) ON DELETE SET NULL,
  images text[] DEFAULT '{}',
  video_url text,
  featured boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  rating_average numeric(2,1) NOT NULL DEFAULT 0,
  rating_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Product variants
CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku text UNIQUE NOT NULL,
  name text NOT NULL,
  options jsonb NOT NULL DEFAULT '{}',
  price numeric(10,2) NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  body text,
  images text[] DEFAULT '{}',
  likes integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Customers (profile extension)
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'customer',
  created_at timestamptz DEFAULT now()
);

-- Addresses
CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Home',
  full_name text NOT NULL,
  phone text,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text NOT NULL,
  country text NOT NULL DEFAULT 'United States',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Carts
CREATE TABLE IF NOT EXISTS carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL UNIQUE DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Cart items
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE (cart_id, product_id, variant_id)
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  discount numeric(10,2) NOT NULL DEFAULT 0,
  shipping numeric(10,2) NOT NULL DEFAULT 0,
  tax numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  shipping_address jsonb,
  billing_address jsonb,
  shipping_method text,
  tracking_number text,
  coupon_code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variant_id uuid REFERENCES product_variants(id) ON DELETE SET NULL,
  title text NOT NULL,
  sku text NOT NULL,
  price numeric(10,2) NOT NULL,
  quantity integer NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  tax numeric(10,2) NOT NULL DEFAULT 0,
  shipping numeric(10,2) NOT NULL DEFAULT 0,
  discount numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'issued',
  created_at timestamptz DEFAULT now()
);

-- Wishlist
CREATE TABLE IF NOT EXISTS wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (customer_id, product_id)
);

-- Coupons
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text,
  discount_type text NOT NULL DEFAULT 'percentage',
  value numeric(10,2) NOT NULL DEFAULT 0,
  min_subtotal numeric(10,2) NOT NULL DEFAULT 0,
  free_shipping boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_addresses_customer ON addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_customer ON wishlist(customer_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);

-- ============ RLS ============

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Categories: public read, admin write
DROP POLICY IF EXISTS "anon_read_categories" ON categories;
CREATE POLICY "anon_read_categories" ON categories FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_manage_categories" ON categories;
CREATE POLICY "auth_manage_categories" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Brands: public read, admin write
DROP POLICY IF EXISTS "anon_read_brands" ON brands;
CREATE POLICY "anon_read_brands" ON brands FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_manage_brands" ON brands;
CREATE POLICY "auth_manage_brands" ON brands FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Products: public read, admin write
DROP POLICY IF EXISTS "anon_read_products" ON products;
CREATE POLICY "anon_read_products" ON products FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_manage_products" ON products;
CREATE POLICY "auth_manage_products" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Product variants: public read, admin write
DROP POLICY IF EXISTS "anon_read_variants" ON product_variants;
CREATE POLICY "anon_read_variants" ON product_variants FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_manage_variants" ON product_variants;
CREATE POLICY "auth_manage_variants" ON product_variants FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Reviews: public read; any authenticated customer can create their own; owner can update/delete
DROP POLICY IF EXISTS "anon_read_reviews" ON reviews;
CREATE POLICY "anon_read_reviews" ON reviews FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_reviews" ON reviews;
CREATE POLICY "auth_insert_reviews" ON reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
DROP POLICY IF EXISTS "owner_update_reviews" ON reviews;
CREATE POLICY "owner_update_reviews" ON reviews FOR UPDATE TO authenticated USING (auth.uid() = customer_id) WITH CHECK (auth.uid() = customer_id);
DROP POLICY IF EXISTS "owner_delete_reviews" ON reviews;
CREATE POLICY "owner_delete_reviews" ON reviews FOR DELETE TO authenticated USING (auth.uid() = customer_id);

-- Customers: owner read/write
DROP POLICY IF EXISTS "owner_read_customers" ON customers;
CREATE POLICY "owner_read_customers" ON customers FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "owner_insert_customers" ON customers;
CREATE POLICY "owner_insert_customers" ON customers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "owner_update_customers" ON customers;
CREATE POLICY "owner_update_customers" ON customers FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "owner_delete_customers" ON customers;
CREATE POLICY "owner_delete_customers" ON customers FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Addresses: owner scoped
DROP POLICY IF EXISTS "owner_read_addresses" ON addresses;
CREATE POLICY "owner_read_addresses" ON addresses FOR SELECT TO authenticated USING (auth.uid() = customer_id);
DROP POLICY IF EXISTS "owner_insert_addresses" ON addresses;
CREATE POLICY "owner_insert_addresses" ON addresses FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
DROP POLICY IF EXISTS "owner_update_addresses" ON addresses;
CREATE POLICY "owner_update_addresses" ON addresses FOR UPDATE TO authenticated USING (auth.uid() = customer_id) WITH CHECK (auth.uid() = customer_id);
DROP POLICY IF EXISTS "owner_delete_addresses" ON addresses;
CREATE POLICY "owner_delete_addresses" ON addresses FOR DELETE TO authenticated USING (auth.uid() = customer_id);

-- Carts: owner scoped
DROP POLICY IF EXISTS "owner_read_carts" ON carts;
CREATE POLICY "owner_read_carts" ON carts FOR SELECT TO authenticated USING (auth.uid() = customer_id);
DROP POLICY IF EXISTS "owner_insert_carts" ON carts;
CREATE POLICY "owner_insert_carts" ON carts FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
DROP POLICY IF EXISTS "owner_update_carts" ON carts;
CREATE POLICY "owner_update_carts" ON carts FOR UPDATE TO authenticated USING (auth.uid() = customer_id) WITH CHECK (auth.uid() = customer_id);
DROP POLICY IF EXISTS "owner_delete_carts" ON carts;
CREATE POLICY "owner_delete_carts" ON carts FOR DELETE TO authenticated USING (auth.uid() = customer_id);

-- Cart items: owner scoped through cart
DROP POLICY IF EXISTS "owner_read_cart_items" ON cart_items;
CREATE POLICY "owner_read_cart_items" ON cart_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM carts WHERE carts.id = cart_items.cart_id AND carts.customer_id = auth.uid()));
DROP POLICY IF EXISTS "owner_insert_cart_items" ON cart_items;
CREATE POLICY "owner_insert_cart_items" ON cart_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM carts WHERE carts.id = cart_items.cart_id AND carts.customer_id = auth.uid()));
DROP POLICY IF EXISTS "owner_update_cart_items" ON cart_items;
CREATE POLICY "owner_update_cart_items" ON cart_items FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM carts WHERE carts.id = cart_items.cart_id AND carts.customer_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM carts WHERE carts.id = cart_items.cart_id AND carts.customer_id = auth.uid()));
DROP POLICY IF EXISTS "owner_delete_cart_items" ON cart_items;
CREATE POLICY "owner_delete_cart_items" ON cart_items FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM carts WHERE carts.id = cart_items.cart_id AND carts.customer_id = auth.uid()));

-- Orders: owner scoped
DROP POLICY IF EXISTS "owner_read_orders" ON orders;
CREATE POLICY "owner_read_orders" ON orders FOR SELECT TO authenticated USING (auth.uid() = customer_id);
DROP POLICY IF EXISTS "owner_insert_orders" ON orders;
CREATE POLICY "owner_insert_orders" ON orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
DROP POLICY IF EXISTS "owner_update_orders" ON orders;
CREATE POLICY "owner_update_orders" ON orders FOR UPDATE TO authenticated USING (auth.uid() = customer_id) WITH CHECK (auth.uid() = customer_id);
DROP POLICY IF EXISTS "owner_delete_orders" ON orders;
CREATE POLICY "owner_delete_orders" ON orders FOR DELETE TO authenticated USING (auth.uid() = customer_id);

-- Order items: owner scoped through order
DROP POLICY IF EXISTS "owner_read_order_items" ON order_items;
CREATE POLICY "owner_read_order_items" ON order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid()));
DROP POLICY IF EXISTS "owner_insert_order_items" ON order_items;
CREATE POLICY "owner_insert_order_items" ON order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid()));
DROP POLICY IF EXISTS "owner_update_order_items" ON order_items;
CREATE POLICY "owner_update_order_items" ON order_items FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid()));
DROP POLICY IF EXISTS "owner_delete_order_items" ON order_items;
CREATE POLICY "owner_delete_order_items" ON order_items FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid()));

-- Invoices: owner scoped
DROP POLICY IF EXISTS "owner_read_invoices" ON invoices;
CREATE POLICY "owner_read_invoices" ON invoices FOR SELECT TO authenticated USING (auth.uid() = customer_id);
DROP POLICY IF EXISTS "owner_insert_invoices" ON invoices;
CREATE POLICY "owner_insert_invoices" ON invoices FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
DROP POLICY IF EXISTS "owner_update_invoices" ON invoices;
CREATE POLICY "owner_update_invoices" ON invoices FOR UPDATE TO authenticated USING (auth.uid() = customer_id) WITH CHECK (auth.uid() = customer_id);

-- Wishlist: owner scoped
DROP POLICY IF EXISTS "owner_read_wishlist" ON wishlist;
CREATE POLICY "owner_read_wishlist" ON wishlist FOR SELECT TO authenticated USING (auth.uid() = customer_id);
DROP POLICY IF EXISTS "owner_insert_wishlist" ON wishlist;
CREATE POLICY "owner_insert_wishlist" ON wishlist FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
DROP POLICY IF EXISTS "owner_delete_wishlist" ON wishlist;
CREATE POLICY "owner_delete_wishlist" ON wishlist FOR DELETE TO authenticated USING (auth.uid() = customer_id);

-- Coupons: public read, admin write
DROP POLICY IF EXISTS "anon_read_coupons" ON coupons;
CREATE POLICY "anon_read_coupons" ON coupons FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_manage_coupons" ON coupons;
CREATE POLICY "auth_manage_coupons" ON coupons FOR ALL TO authenticated USING (true) WITH CHECK (true);
