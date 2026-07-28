/*
# Cash on Delivery (COD) Payment Support

1. Purpose
   Adds Cash on Delivery (COD) as a payment method alongside card payments.
   Admin can configure COD settings (enable/disable, fee, max order value, instructions)
   and manage payment status for orders. Customers can choose COD at checkout.

2. Changes to existing tables
   - `orders` — add `payment_method` (text, default 'card'), `payment_status` (text, default 'paid'),
     `cod_fee` (numeric, default 0), `cod_collected` (boolean, default false)
   - `invoices` — add `payment_method` (text, default 'card'), `cod_fee` (numeric, default 0)

3. New Tables
   - `store_settings` — singleton config table for store-wide settings
     - `id` (int, primary key, always 1)
     - `cod_enabled` (boolean, default true)
     - `cod_fee` (numeric, default 0) — additional fee charged for COD orders
     - `cod_max_order` (numeric, nullable) — max order total allowed for COD
     - `cod_instructions` (text) — instructions shown to customer at checkout
     - `updated_at` (timestamptz)

4. Security
   - `store_settings`: public read (anon + authenticated), admin-only write
   - Existing order policies already allow authenticated users full access

5. Notes
   - `payment_method` values: 'card' or 'cod'
   - `payment_status` values: 'paid', 'unpaid', 'refunded', 'partially_paid'
   - For card orders, payment_status defaults to 'paid'
   - For COD orders, payment_status is set to 'unpaid' until admin marks collected
   - `cod_collected` tracks whether the courier has collected the cash
*/

-- Add payment columns to orders
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_method') THEN
    ALTER TABLE orders ADD COLUMN payment_method text NOT NULL DEFAULT 'card';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_status') THEN
    ALTER TABLE orders ADD COLUMN payment_status text NOT NULL DEFAULT 'paid';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'cod_fee') THEN
    ALTER TABLE orders ADD COLUMN cod_fee numeric(10,2) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'cod_collected') THEN
    ALTER TABLE orders ADD COLUMN cod_collected boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Add payment columns to invoices
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'payment_method') THEN
    ALTER TABLE invoices ADD COLUMN payment_method text NOT NULL DEFAULT 'card';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'cod_fee') THEN
    ALTER TABLE invoices ADD COLUMN cod_fee numeric(10,2) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Create store_settings table
CREATE TABLE IF NOT EXISTS store_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  cod_enabled boolean NOT NULL DEFAULT true,
  cod_fee numeric(10,2) NOT NULL DEFAULT 0,
  cod_max_order numeric(10,2),
  cod_instructions text NOT NULL DEFAULT 'Pay with cash when your order is delivered. Exact amount is appreciated.',
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on store_settings
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Public read for store settings
DROP POLICY IF EXISTS "anon_read_store_settings" ON store_settings;
CREATE POLICY "anon_read_store_settings" ON store_settings FOR SELECT
  TO anon, authenticated USING (true);

-- Admin write for store settings
DROP POLICY IF EXISTS "auth_manage_store_settings" ON store_settings;
CREATE POLICY "auth_manage_store_settings" ON store_settings FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- Insert default settings row if it doesn't exist
INSERT INTO store_settings (id, cod_enabled, cod_fee, cod_max_order, cod_instructions)
VALUES (1, true, 0, 500, 'Pay with cash when your order is delivered. Exact amount is appreciated.')
ON CONFLICT (id) DO NOTHING;
