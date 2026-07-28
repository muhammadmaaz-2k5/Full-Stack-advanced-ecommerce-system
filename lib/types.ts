export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  created_at: string;
};

export type Brand = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_at: string;
};

export type Product = {
  id: string;
  sku: string;
  barcode: string | null;
  title: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  quantity: number;
  reserved_stock: number;
  category_id: string | null;
  brand_id: string | null;
  images: string[];
  video_url: string | null;
  featured: boolean;
  active: boolean;
  rating_average: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
  category?: Category;
  brand?: Brand;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  sku: string;
  name: string;
  options: Record<string, string>;
  price: number;
  quantity: number;
  created_at: string;
};

export type Review = {
  id: string;
  product_id: string;
  customer_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  images: string[];
  likes: number;
  created_at: string;
};

export type Customer = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  created_at: string;
};

export type Address = {
  id: string;
  customer_id: string;
  label: string;
  full_name: string;
  phone: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
};

export type Cart = {
  id: string;
  customer_id: string;
  created_at: string;
  updated_at: string;
};

export type CartItem = {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  created_at: string;
  product?: Product;
  variant?: ProductVariant;
};

export type Order = {
  id: string;
  customer_id: string;
  order_number: string;
  status: string;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  shipping_address: Record<string, unknown> | null;
  billing_address: Record<string, unknown> | null;
  shipping_method: string | null;
  tracking_number: string | null;
  coupon_code: string | null;
  payment_method: string;
  payment_status: string;
  cod_fee: number;
  cod_collected: boolean;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  title: string;
  sku: string;
  price: number;
  quantity: number;
  image_url: string | null;
  created_at: string;
};

export type Invoice = {
  id: string;
  invoice_number: string;
  order_id: string;
  customer_id: string;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  status: string;
  payment_method: string;
  cod_fee: number;
  created_at: string;
};

export type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  value: number;
  min_subtotal: number;
  free_shipping: boolean;
  active: boolean;
  expires_at: string | null;
  created_at: string;
};

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'packed',
  'ready_to_ship',
  'shipped',
  'delivered',
  'completed',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  packed: 'Packed',
  ready_to_ship: 'Ready to Ship',
  shipped: 'Shipped',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  card: 'Credit / Debit Card',
  cod: 'Cash on Delivery',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  paid: 'Paid',
  unpaid: 'Unpaid',
  refunded: 'Refunded',
  partially_paid: 'Partially Paid',
};

export type StoreSettings = {
  id: number;
  cod_enabled: boolean;
  cod_fee: number;
  cod_max_order: number | null;
  cod_instructions: string;
  updated_at: string;
};
