'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Download, Truck, Package, Check, Banknote, CreditCard, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/lib/context/auth-context';
import { supabase } from '@/lib/supabase/client';
import { formatPrice, formatDateTime } from '@/lib/format';
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/types';
import type { Order, OrderItem, Invoice } from '@/lib/types';

const STEPS = ['pending', 'confirmed', 'packed', 'ready_to_ship', 'shipped', 'delivered', 'completed'];

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('orders').select('*').eq('id', params.id).maybeSingle(),
      supabase.from('order_items').select('*').eq('order_id', params.id),
      supabase.from('invoices').select('*').eq('order_id', params.id).maybeSingle(),
    ]).then(([o, i, inv]) => {
      setOrder(o.data as Order | null);
      setItems((i.data as OrderItem[]) ?? []);
      setInvoice(inv.data as Invoice | null);
      setLoading(false);
    });
  }, [user, params.id]);

  if (loading) {
    return <div className="flex items-center justify-center py-20">Loading...</div>;
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p>Order not found</p>
        <Button asChild className="mt-4"><Link href="/account/orders">Back to orders</Link></Button>
      </div>
    );
  }

  const currentStep = STEPS.indexOf(order.status);
  const addr = order.shipping_address as Record<string, string> | null;

  return (
    <div>
      <Link
        href="/account/orders"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-jakarta text-2xl font-bold tracking-tight">{order.order_number}</h1>
          <p className="text-sm text-muted-foreground">Placed on {formatDateTime(order.created_at)}</p>
        </div>
        <Badge className="text-sm">{ORDER_STATUS_LABELS[order.status] ?? order.status}</Badge>
      </div>

      {/* Order tracking */}
      {order.status !== 'cancelled' && (
        <div className="mt-6 rounded-xl border bg-card p-6">
          <h2 className="mb-4 font-jakarta text-lg font-semibold">Order Tracking</h2>
          <div className="flex items-center">
            {STEPS.map((step, i) => {
              const done = i <= currentStep;
              return (
                <div key={step} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${
                        done ? 'border-primary bg-primary text-primary-foreground' : 'border-muted bg-background text-muted-foreground'
                      }`}
                    >
                      {done ? <Check className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                    </div>
                    <span className="mt-1.5 hidden text-[11px] font-medium sm:block">
                      {ORDER_STATUS_LABELS[step]}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`mx-2 h-0.5 flex-1 rounded-full ${i < currentStep ? 'bg-primary' : 'bg-muted'}`} />
                  )}
                </div>
              );
            })}
          </div>
          {order.tracking_number && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-sm">
              <Truck className="h-4 w-4 text-primary" />
              <span>Tracking number: <span className="font-mono font-medium">{order.tracking_number}</span></span>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Items */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 font-jakarta text-lg font-semibold">Items</h2>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                  {item.image_url && (
                    <Image src={item.image_url} alt={item.title} fill sizes="80px" className="object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                  <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400"><span>Discount</span><span>-{formatPrice(order.discount)}</span></div>
            )}
            <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{order.shipping === 0 ? 'Free' : formatPrice(order.shipping)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{formatPrice(order.tax)}</span></div>
            <Separator className="my-2" />
            <div className="flex justify-between text-base font-bold"><span>Total</span><span className="font-jakarta">{formatPrice(order.total)}</span></div>
            {order.cod_fee > 0 && (
              <div className="flex justify-between"><span className="text-muted-foreground">COD Fee</span><span>{formatPrice(order.cod_fee)}</span></div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {addr && (
            <div className="rounded-xl border bg-card p-6">
              <h2 className="mb-3 font-jakarta text-sm font-semibold uppercase tracking-wide text-muted-foreground">Shipping Address</h2>
              <p className="text-sm">{addr.full_name}</p>
              <p className="text-sm text-muted-foreground">{addr.address_line1}</p>
              {addr.address_line2 && <p className="text-sm text-muted-foreground">{addr.address_line2}</p>}
              <p className="text-sm text-muted-foreground">{addr.city}, {addr.state} {addr.postal_code}</p>
              <p className="text-sm text-muted-foreground">{addr.country}</p>
              {addr.phone && <p className="mt-1 text-sm text-muted-foreground">{addr.phone}</p>}
            </div>
          )}
          {order.shipping_method && (
            <div className="rounded-xl border bg-card p-6">
              <h2 className="mb-3 font-jakarta text-sm font-semibold uppercase tracking-wide text-muted-foreground">Shipping Method</h2>
              <p className="text-sm">{order.shipping_method}</p>
            </div>
          )}
          {/* Payment info */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-3 font-jakarta text-sm font-semibold uppercase tracking-wide text-muted-foreground">Payment</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {order.payment_method === 'cod' ? (
                  <Banknote className="h-5 w-5 text-amber-600" />
                ) : (
                  <CreditCard className="h-5 w-5 text-blue-600" />
                )}
                <span className="text-sm font-medium">{PAYMENT_METHOD_LABELS[order.payment_method] ?? order.payment_method}</span>
              </div>
              <div className="flex items-center gap-2">
                {order.payment_status === 'paid' ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Clock className="h-4 w-4 text-amber-600" />
                )}
                <span className="text-sm text-muted-foreground">
                  {PAYMENT_STATUS_LABELS[order.payment_status] ?? order.payment_status}
                </span>
              </div>
              {order.payment_method === 'cod' && order.payment_status === 'unpaid' && (
                <div className="rounded-lg bg-amber-50 p-3 text-xs dark:bg-amber-950/30">
                  <p className="font-medium text-amber-700 dark:text-amber-400">
                    Please have {formatPrice(order.total)} ready in cash when your order is delivered.
                  </p>
                </div>
              )}
            </div>
          </div>
          {invoice && (
            <div className="rounded-xl border bg-card p-6">
              <h2 className="mb-3 font-jakarta text-sm font-semibold uppercase tracking-wide text-muted-foreground">Invoice</h2>
              <p className="text-sm font-mono">{invoice.invoice_number}</p>
              <Button asChild variant="outline" size="sm" className="mt-3 w-full">
                <Link href={`/account/orders/${params.id}/invoice`}>
                  <Download className="mr-2 h-4 w-4" /> Download Invoice
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
