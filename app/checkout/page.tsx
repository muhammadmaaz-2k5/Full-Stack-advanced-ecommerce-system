'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Loader2, Check, CreditCard, Truck, MapPin, Tag, Banknote, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCart } from '@/lib/context/cart-context';
import { useAuth } from '@/lib/context/auth-context';
import { supabase } from '@/lib/supabase/client';
import { formatPrice, generateOrderNumber, generateInvoiceNumber } from '@/lib/format';
import { toast } from 'sonner';
import type { Address, StoreSettings } from '@/lib/types';

const SHIPPING_METHODS = [
  { id: 'standard', label: 'Standard Shipping', desc: '5-7 business days', price: 0 },
  { id: 'express', label: 'Express Shipping', desc: '2-3 business days', price: 12.99 },
  { id: 'overnight', label: 'Overnight Shipping', desc: 'Next business day', price: 24.99 },
];

const TAX_RATE = 0.08;

export default function CheckoutPage() {
  const { items, subtotal, clearCart, loading } = useCart();
  const { user, profile } = useAuth();
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; freeShipping: boolean } | null>(null);
  const [placing, setPlacing] = useState(false);
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      supabase
        .from('addresses')
        .select('*')
        .eq('customer_id', user.id)
        .order('is_default', { ascending: false })
        .then(({ data }) => {
          setAddresses((data as Address[]) ?? []);
          if (data && data.length > 0) {
            setSelectedAddress(data.find((a) => a.is_default)?.id ?? data[0].id);
          }
        });
    }
    supabase
      .from('store_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => {
        setSettings(data as StoreSettings | null);
      });
  }, [user]);

  const codEnabled = settings?.cod_enabled ?? false;
  const codFee = codEnabled && paymentMethod === 'cod' ? (settings?.cod_fee ?? 0) : 0;
  const codAvailable =
    codEnabled &&
    (!settings?.cod_max_order || subtotal <= settings.cod_max_order);

  const shippingCost = SHIPPING_METHODS.find((s) => s.id === shippingMethod)?.price ?? 0;
  const discount = appliedCoupon?.discount ?? 0;
  const freeShip = appliedCoupon?.freeShipping && shippingMethod === 'standard';
  const finalShipping = freeShip ? 0 : shippingCost;
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = taxableAmount * TAX_RATE;
  const total = taxableAmount + finalShipping + tax + codFee;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.toUpperCase())
      .eq('active', true)
      .maybeSingle();

    if (!data) {
      toast.error('Invalid or expired coupon code');
      return;
    }
    if (subtotal < data.min_subtotal) {
      toast.error(`Minimum subtotal of ${formatPrice(data.min_subtotal)} required`);
      return;
    }

    let disc = 0;
    if (data.discount_type === 'percentage') {
      disc = (subtotal * data.value) / 100;
    } else {
      disc = data.value;
    }
    setAppliedCoupon({ code: data.code, discount: disc, freeShipping: data.free_shipping });
    toast.success(`Coupon ${data.code} applied!`);
  };

  const placeOrder = async () => {
    if (!user) return;
    if (items.length === 0) return;
    if (!selectedAddress && addresses.length > 0) {
      toast.error('Please select a shipping address');
      return;
    }
    if (paymentMethod === 'cod' && !codAvailable) {
      toast.error('Cash on delivery is not available for this order');
      return;
    }

    setPlacing(true);
    try {
      const orderNumber = generateOrderNumber();
      const addr = addresses.find((a) => a.id === selectedAddress);
      const shippingAddr = addr
        ? {
            full_name: addr.full_name,
            phone: addr.phone,
            address_line1: addr.address_line1,
            address_line2: addr.address_line2,
            city: addr.city,
            state: addr.state,
            postal_code: addr.postal_code,
            country: addr.country,
          }
        : null;

      const isCOD = paymentMethod === 'cod';

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: user.id,
          order_number: orderNumber,
          status: 'confirmed',
          subtotal,
          discount,
          shipping: finalShipping,
          tax,
          total,
          shipping_address: shippingAddr,
          billing_address: shippingAddr,
          shipping_method: SHIPPING_METHODS.find((s) => s.id === shippingMethod)?.label,
          coupon_code: appliedCoupon?.code ?? null,
          payment_method: paymentMethod,
          payment_status: isCOD ? 'unpaid' : 'paid',
          cod_fee: codFee,
          cod_collected: false,
        })
        .select('id')
        .single();

      if (orderError || !order) {
        toast.error('Could not place order');
        return;
      }

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        title: item.product?.title ?? '',
        sku: item.variant?.sku ?? item.product?.sku ?? '',
        price: Number(item.variant?.price ?? item.product?.price ?? 0),
        quantity: item.quantity,
        image_url: item.product?.images?.[0] ?? null,
      }));

      await supabase.from('order_items').insert(orderItems);

      await supabase.from('invoices').insert({
        invoice_number: generateInvoiceNumber(),
        order_id: order.id,
        customer_id: user.id,
        subtotal,
        tax,
        shipping: finalShipping,
        discount,
        total,
        status: isCOD ? 'issued' : 'paid',
        payment_method: paymentMethod,
        cod_fee: codFee,
      });

      for (const item of items) {
        const newQty = Math.max(0, (item.product?.quantity ?? 0) - item.quantity);
        await supabase.from('products').update({ quantity: newQty }).eq('id', item.product_id);
      }

      await clearCart();
      toast.success(isCOD ? 'Order placed! Pay with cash on delivery.' : 'Order placed successfully!');
      router.push(`/account/orders/${order.id}`);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-page flex flex-col items-center justify-center py-20 text-center">
        <p className="font-jakarta text-xl font-semibold">Your cart is empty</p>
        <p className="mt-2 text-muted-foreground">Add items before checking out.</p>
        <Button asChild className="mt-6">
          <Link href="/shop">Browse Products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <Link
        href="/shop"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Continue shopping
      </Link>

      <h1 className="mb-8 font-jakarta text-3xl font-bold tracking-tight">Checkout</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* Left: forms */}
        <div className="space-y-8">
          {/* Shipping address */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h2 className="font-jakarta text-lg font-semibold">Shipping Address</h2>
            </div>
            {addresses.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No addresses saved yet. Add one to your account to check out.
                </p>
                <Button asChild variant="outline" className="mt-3">
                  <Link href="/account/addresses">Add Address</Link>
                </Button>
              </div>
            ) : (
              <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress}>
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      htmlFor={addr.id}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                    >
                      <RadioGroupItem id={addr.id} value={addr.id} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{addr.full_name}</p>
                          {addr.is_default && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {addr.address_line1}
                          {addr.address_line2 ? `, ${addr.address_line2}` : ''}
                          <br />
                          {addr.city}, {addr.state} {addr.postal_code}
                          <br />
                          {addr.country}
                          {addr.phone ? ` · ${addr.phone}` : ''}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </RadioGroup>
            )}
          </section>

          {/* Shipping method */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              <h2 className="font-jakarta text-lg font-semibold">Shipping Method</h2>
            </div>
            <RadioGroup value={shippingMethod} onValueChange={setShippingMethod}>
              <div className="space-y-3">
                {SHIPPING_METHODS.map((m) => (
                  <label
                    key={m.id}
                    htmlFor={m.id}
                    className="flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem id={m.id} value={m.id} />
                      <div>
                        <p className="font-medium">{m.label}</p>
                        <p className="text-sm text-muted-foreground">{m.desc}</p>
                      </div>
                    </div>
                    <span className="font-medium">{m.price === 0 ? 'Free' : formatPrice(m.price)}</span>
                  </label>
                ))}
              </div>
            </RadioGroup>
          </section>

          {/* Payment method */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <h2 className="font-jakarta text-lg font-semibold">Payment Method</h2>
            </div>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="space-y-3">
                {/* Card */}
                <label
                  htmlFor="pay-card"
                  className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <RadioGroupItem id="pay-card" value="card" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <p className="font-medium">Credit / Debit Card</p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Secure payment via Stripe. Your card is charged immediately.
                    </p>
                    {paymentMethod === 'card' && (
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="card" className="text-xs">Card number</Label>
                          <Input id="card" placeholder="4242 4242 4242 4242" disabled />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="name" className="text-xs">Name on card</Label>
                          <Input id="name" placeholder={profile?.name ?? ''} disabled />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="exp" className="text-xs">Expiry</Label>
                          <Input id="exp" placeholder="MM/YY" disabled />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="cvc" className="text-xs">CVC</Label>
                          <Input id="cvc" placeholder="123" disabled />
                        </div>
                      </div>
                    )}
                  </div>
                </label>

                {/* COD */}
                {codEnabled && (
                  <label
                    htmlFor="pay-cod"
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 ${
                      !codAvailable ? 'opacity-50' : ''
                    }`}
                  >
                    <RadioGroupItem id="pay-cod" value="cod" className="mt-1" disabled={!codAvailable} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Banknote className="h-5 w-5 text-emerald-600" />
                        <p className="font-medium">Cash on Delivery</p>
                        {settings?.cod_fee ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                            +{formatPrice(settings.cod_fee)} fee
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                            No extra fee
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {settings?.cod_instructions ?? 'Pay with cash when your order is delivered.'}
                      </p>
                      {!codAvailable && settings?.cod_max_order && (
                        <p className="mt-1 text-xs text-destructive">
                          COD available for orders up to {formatPrice(settings.cod_max_order)}
                        </p>
                      )}
                    </div>
                  </label>
                )}
              </div>
            </RadioGroup>
            <p className="mt-3 text-xs text-muted-foreground">
              This is a demo store — no real payment will be processed.
            </p>
          </section>
        </div>

        {/* Right: summary */}
        <div>
          <div className="sticky top-24 rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="mb-4 font-jakarta text-lg font-semibold">Order Summary</h2>

            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                    {item.product?.images?.[0] && (
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.title}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="line-clamp-1 text-sm font-medium">{item.product?.title}</p>
                    {item.variant && (
                      <p className="text-xs text-muted-foreground">{item.variant.name}</p>
                    )}
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-sm font-medium">
                    {formatPrice((Number(item.variant?.price ?? item.product?.price ?? 0)) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            {/* Coupon */}
            <div className="mb-4 flex gap-2">
              <div className="relative flex-1">
                <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Promo code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" onClick={applyCoupon}>
                Apply
              </Button>
            </div>

            {appliedCoupon && (
              <div className="mb-4 flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-sm dark:bg-emerald-950/30">
                <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                  <Check className="h-4 w-4" /> {appliedCoupon.code} applied
                </span>
                <button
                  onClick={() => setAppliedCoupon(null)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Remove
                </button>
              </div>
            )}

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Discount</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{finalShipping === 0 ? 'Free' : formatPrice(finalShipping)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax (8%)</span>
                <span>{formatPrice(tax)}</span>
              </div>
              {codFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">COD Fee</span>
                  <span>{formatPrice(codFee)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex items-center justify-between text-base font-bold">
                <span>Total</span>
                <span className="font-jakarta">{formatPrice(total)}</span>
              </div>
              {paymentMethod === 'cod' && (
                <div className="mt-2 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs dark:bg-amber-950/30">
                  <Banknote className="h-4 w-4 text-amber-600" />
                  <span className="text-amber-700 dark:text-amber-400">
                    Pay {formatPrice(total)} in cash on delivery
                  </span>
                </div>
              )}
            </div>

            <Button
              className="mt-4 w-full"
              size="lg"
              onClick={placeOrder}
              disabled={placing || addresses.length === 0 || (paymentMethod === 'cod' && !codAvailable)}
            >
              {placing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Placing order...
                </>
              ) : (
                <>
                  Place Order · {formatPrice(total)}
                </>
              )}
            </Button>
            {addresses.length === 0 && (
              <p className="mt-2 text-center text-xs text-destructive">
                Add a shipping address to place your order
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
