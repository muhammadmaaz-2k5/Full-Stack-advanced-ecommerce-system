'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, ChevronRight, Loader2, Banknote, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/context/auth-context';
import { supabase } from '@/lib/supabase/client';
import { formatPrice, formatDate } from '@/lib/format';
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '@/lib/types';
import type { Order } from '@/lib/types';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  packed: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400',
  ready_to_ship: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400',
  shipped: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400',
  delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('orders')
      .select('*')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders((data as Order[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div>
        <h1 className="mb-6 font-jakarta text-2xl font-bold tracking-tight">My Orders</h1>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <Package className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 font-medium">No orders yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            When you place an order, it will appear here.
          </p>
          <Button asChild className="mt-4">
            <Link href="/shop">Start Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 font-jakarta text-2xl font-bold tracking-tight">My Orders</h1>
      <div className="space-y-3">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/account/orders/${order.id}`}
            className="flex items-center justify-between rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">{order.order_number}</p>
                <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <Badge className={STATUS_COLORS[order.status] ?? ''}>
                  {ORDER_STATUS_LABELS[order.status] ?? order.status}
                </Badge>
                <div className="mt-1 flex items-center justify-end gap-1">
                  {order.payment_method === 'cod' ? (
                    <Banknote className="h-3 w-3 text-amber-600" />
                  ) : (
                    <CreditCard className="h-3 w-3 text-blue-600" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {PAYMENT_METHOD_LABELS[order.payment_method] ?? order.payment_method}
                  </span>
                </div>
                <p className="mt-1 font-jakarta font-semibold">{formatPrice(order.total)}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
