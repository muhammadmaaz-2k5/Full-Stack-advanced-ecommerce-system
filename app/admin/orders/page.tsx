'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, Eye, Banknote, CreditCard, Check, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { supabase } from '@/lib/supabase/client';
import { formatPrice, formatDate } from '@/lib/format';
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/types';
import { toast } from 'sonner';
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

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  unpaid: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  refunded: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  partially_paid: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
};

const STATUSES = ['pending', 'confirmed', 'packed', 'ready_to_ship', 'shipped', 'delivered', 'completed', 'cancelled'];
const PAYMENT_STATUSES = ['paid', 'unpaid', 'refunded', 'partially_paid'];

type OrderWithCustomer = Order & { customer?: { name: string; email: string } | null };

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  const load = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, customer:customers(name, email)')
      .order('created_at', { ascending: false });
    setOrders((data as OrderWithCustomer[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) {
      toast.error('Could not update order status');
    } else {
      setOrders(orders.map((o) => (o.id === id ? { ...o, status } : o)));
      toast.success('Order status updated');
    }
  };

  const updatePaymentStatus = async (id: string, paymentStatus: string) => {
    const codCollected = paymentStatus === 'paid';
    const { error } = await supabase
      .from('orders')
      .update({ payment_status: paymentStatus, cod_collected: codCollected })
      .eq('id', id);
    if (error) {
      toast.error('Could not update payment status');
    } else {
      setOrders(orders.map((o) => (o.id === id ? { ...o, payment_status: paymentStatus, cod_collected: codCollected } : o)));
      toast.success('Payment status updated');
    }
  };

  const markCODCollected = async (id: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ payment_status: 'paid', cod_collected: true })
      .eq('id', id);
    if (error) {
      toast.error('Could not mark as collected');
    } else {
      setOrders(orders.map((o) => (o.id === id ? { ...o, payment_status: 'paid', cod_collected: true } : o)));
      toast.success('COD payment marked as collected');
    }
  };

  const filtered = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (paymentFilter !== 'all' && o.payment_method !== paymentFilter) return false;
    if (search && !o.order_number.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const codUnpaid = filtered.filter((o) => o.payment_method === 'cod' && o.payment_status === 'unpaid');
  const codRevenue = codUnpaid.reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-jakarta text-2xl font-bold tracking-tight">Orders</h1>
        <p className="text-sm text-muted-foreground">Manage and fulfill customer orders</p>
      </div>

      {/* COD summary */}
      {codUnpaid.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/40">
                <DollarSign className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-jakarta text-lg font-bold">{codUnpaid.length} COD order{codUnpaid.length !== 1 ? 's' : ''} awaiting collection</p>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  {formatPrice(codRevenue)} in cash to be collected on delivery
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by order number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Payment method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="card">Card</SelectItem>
            <SelectItem value="cod">Cash on Delivery</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">No orders found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Order Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-sm font-medium">{o.order_number}</TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{o.customer?.name ?? 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{o.customer?.email ?? ''}</p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(o.created_at)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          {o.payment_method === 'cod' ? (
                            <Banknote className="h-3.5 w-3.5 text-amber-600" />
                          ) : (
                            <CreditCard className="h-3.5 w-3.5 text-blue-600" />
                          )}
                          <span className="text-xs font-medium">
                            {PAYMENT_METHOD_LABELS[o.payment_method] ?? o.payment_method}
                          </span>
                        </div>
                        {o.payment_method === 'cod' && o.payment_status === 'unpaid' ? (
                          <Select
                            value={o.payment_status}
                            onValueChange={(v) => updatePaymentStatus(o.id, v)}
                          >
                            <SelectTrigger className="h-7 w-[130px] text-xs">
                              <Badge className={PAYMENT_STATUS_COLORS[o.payment_status] ?? ''}>
                                {PAYMENT_STATUS_LABELS[o.payment_status] ?? o.payment_status}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              {PAYMENT_STATUSES.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {PAYMENT_STATUS_LABELS[s]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={PAYMENT_STATUS_COLORS[o.payment_status] ?? ''}>
                            {PAYMENT_STATUS_LABELS[o.payment_status] ?? o.payment_status}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v)}>
                        <SelectTrigger className="h-8 w-[140px]">
                          <Badge className={STATUS_COLORS[o.status] ?? ''}>
                            {ORDER_STATUS_LABELS[o.status] ?? o.status}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {ORDER_STATUS_LABELS[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right font-jakarta font-semibold">
                      {formatPrice(o.total)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {o.payment_method === 'cod' && o.payment_status === 'unpaid' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1 text-xs"
                            onClick={() => markCODCollected(o.id)}
                          >
                            <Check className="h-3 w-3" /> Mark Collected
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" asChild>
                          <a href={`/account/orders/${o.id}`}>
                            <Eye className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
