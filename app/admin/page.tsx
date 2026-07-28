'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase/client';
import { formatPrice } from '@/lib/format';
import { ORDER_STATUS_LABELS } from '@/lib/types';

type Stat = {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: typeof DollarSign;
};

type OrderRow = {
  id: string;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
  customer_name: string;
};

const COLORS = ['#hsl(160 84% 39%)', '#hsl(200 70% 50%)', '#hsl(30 80% 55%)', '#hsl(280 65% 60%)', '#hsl(340 75% 55%)'];

export default function AdminDashboard() {
  const [stats, setStats] = useState({ revenue: 0, orders: 0, customers: 0, products: 0 });
  const [recentOrders, setRecentOrders] = useState<OrderRow[]>([]);
  const [topProducts, setTopProducts] = useState<{ name: string; sales: number }[]>([]);
  const [statusData, setStatusData] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [orders, products, customers] = await Promise.all([
        supabase.from('orders').select('total, status, created_at, order_number, id'),
        supabase.from('products').select('title, rating_count, quantity'),
        supabase.from('customers').select('id'),
      ]);

      const orderList = orders.data ?? [];
      const revenue = orderList.reduce((sum: number, o: any) => sum + Number(o.total), 0);

      setStats({
        revenue,
        orders: orderList.length,
        customers: customers.data?.length ?? 0,
        products: products.data?.length ?? 0,
      });

      const recent = (orderList as any[])
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 6)
        .map((o) => ({
          id: o.id,
          order_number: o.order_number,
          total: Number(o.total),
          status: o.status,
          created_at: o.created_at,
          customer_name: 'Customer',
        }));
      setRecentOrders(recent);

      const top = (products.data ?? [])
        .map((p: any) => ({ name: p.title, sales: p.rating_count }))
        .sort((a: any, b: any) => b.sales - a.sales)
        .slice(0, 5);
      setTopProducts(top);

      const statusCounts: Record<string, number> = {};
      orderList.forEach((o: any) => {
        statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1;
      });
      setStatusData(
        Object.entries(statusCounts).map(([k, v]) => ({
          name: ORDER_STATUS_LABELS[k] ?? k,
          value: v,
        }))
      );

      setLoading(false);
    }
    load();
  }, []);

  // Generate 6-month revenue chart data from orders
  const [chartData, setChartData] = useState<{ month: string; revenue: number; orders: number }[]>([]);
  useEffect(() => {
    supabase.from('orders').select('total, created_at').then(({ data }) => {
      const months: Record<string, { revenue: number; orders: number }> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleDateString('en-US', { month: 'short' });
        months[key] = { revenue: 0, orders: 0 };
      }
      (data ?? []).forEach((o: any) => {
        const d = new Date(o.created_at);
        const key = d.toLocaleDateString('en-US', { month: 'short' });
        if (months[key]) {
          months[key].revenue += Number(o.total);
          months[key].orders += 1;
        }
      });
      setChartData(Object.entries(months).map(([month, v]) => ({ month, ...v })));
    });
  }, []);

  const statCards: Stat[] = [
    { label: 'Total Revenue', value: formatPrice(stats.revenue), change: '+12.5%', trend: 'up', icon: DollarSign },
    { label: 'Orders', value: String(stats.orders), change: '+8.2%', trend: 'up', icon: ShoppingCart },
    { label: 'Customers', value: String(stats.customers), change: '+5.1%', trend: 'up', icon: Users },
    { label: 'Products', value: String(stats.products), change: '+2.0%', trend: 'up', icon: Package },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-jakarta text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your store performance</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <span
                  className={`flex items-center gap-1 text-xs font-medium ${
                    s.trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {s.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {s.change}
                </span>
              </div>
              <p className="mt-3 font-jakarta text-2xl font-bold">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue & Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(160 84% 39%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(160 84% 39%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 12 }} />
                <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--background))',
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(160 84% 39%)" strokeWidth={2} fill="url(#rev)" />
                <Area type="monotone" dataKey="orders" stroke="hsl(200 70% 50%)" strokeWidth={2} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50}>
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--background))',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                No order data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top products bar chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Products by Popularity</CardTitle>
        </CardHeader>
        <CardContent>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                <XAxis type="number" className="text-xs" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={140} className="text-xs" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--background))',
                  }}
                />
                <Bar dataKey="sales" fill="hsl(160 84% 39%)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
              No product data yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Orders</CardTitle>
          <a href="/admin/orders" className="flex items-center gap-1 text-sm text-primary hover:underline">
            View all <ArrowUpRight className="h-3 w-3" />
          </a>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No orders yet</p>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{o.order_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{ORDER_STATUS_LABELS[o.status] ?? o.status}</Badge>
                    <span className="font-jakarta font-semibold">{formatPrice(o.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
