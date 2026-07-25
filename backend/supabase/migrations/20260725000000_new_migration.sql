-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    _id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    "isVerified" BOOLEAN DEFAULT FALSE,
    "isAdmin" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Brands Table
CREATE TABLE IF NOT EXISTS brands (
    _id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    _id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    _id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC NOT NULL,
    "discountPercentage" NUMERIC DEFAULT 0,
    category TEXT NOT NULL REFERENCES categories(_id) ON DELETE CASCADE,
    brand TEXT NOT NULL REFERENCES brands(_id) ON DELETE CASCADE,
    "stockQuantity" INTEGER NOT NULL,
    thumbnail TEXT NOT NULL,
    images TEXT[] NOT NULL,
    "isDeleted" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    _id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "user" TEXT NOT NULL REFERENCES users(_id) ON DELETE CASCADE,
    item JSONB NOT NULL,
    address JSONB NOT NULL,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Dispatched', 'Out for delivery', 'Cancelled')),
    "paymentMode" TEXT NOT NULL CHECK ("paymentMode" IN ('COD', 'UPI', 'CARD')),
    total NUMERIC NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Carts Table
CREATE TABLE IF NOT EXISTS carts (
    _id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "user" TEXT NOT NULL REFERENCES users(_id) ON DELETE CASCADE,
    product TEXT NOT NULL REFERENCES products(_id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1
);

-- Addresses Table
CREATE TABLE IF NOT EXISTS addresses (
    _id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "user" TEXT NOT NULL REFERENCES users(_id) ON DELETE CASCADE,
    street TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    country TEXT NOT NULL,
    type TEXT NOT NULL
);

-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    _id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "user" TEXT NOT NULL REFERENCES users(_id) ON DELETE CASCADE,
    product TEXT NOT NULL REFERENCES products(_id) ON DELETE CASCADE,
    rating NUMERIC NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Wishlists Table
CREATE TABLE IF NOT EXISTS wishlists (
    _id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "user" TEXT NOT NULL REFERENCES users(_id) ON DELETE CASCADE,
    product TEXT NOT NULL REFERENCES products(_id) ON DELETE CASCADE,
    note TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- OTPs Table
CREATE TABLE IF NOT EXISTS otps (
    _id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "user" TEXT NOT NULL REFERENCES users(_id) ON DELETE CASCADE,
    otp TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL
);

-- Password Reset Tokens Table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    _id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "user" TEXT NOT NULL REFERENCES users(_id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL
);

-- Create basic indexes for foreign keys and common query fields
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders("user");
CREATE INDEX IF NOT EXISTS idx_carts_user ON carts("user");
CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses("user");
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product);
CREATE INDEX IF NOT EXISTS idx_wishlists_user ON wishlists("user");
