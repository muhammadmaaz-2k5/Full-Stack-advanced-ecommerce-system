'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase/client';
import { formatPrice } from '@/lib/format';
import { Loader2 } from 'lucide-react';

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState<{ date: string; orders: number; revenue: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; products: number }[]>([]);
  const [totals, setTotals] = useState({ revenue: 0, orders: 0, avgOrder: 0 });

  useEffect(() => {
    async function load() {
      const [orders, products] = await Promise.all([
        supabase.from('orders').select('total, created_at'),
        supabase.from('products').select('category:categories(name)'),
      ]);

      const orderList = orders.data ?? [];
      const revenue = orderList.reduce((sum: number, o: any) => sum + Number(o.total), 0);
      setTotals({
        revenue,
        orders: orderList.length,
        avgOrder: orderList.length > 0 ? revenue / orderList.length : 0,
      });

      // Daily orders for last 14 days
      const days: Record<string, { orders: number; revenue: number }> = {};
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        days[key] = { orders: 0, revenue: 0 };
      }
      orderList.forEach((o: any) => {
        const d = new Date(o.created_at);
        const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (days[key]) {
          days[key].orders += 1;
          days[key].revenue += Number(o.total);
        }
      });
      setDailyData(Object.entries(days).map(([date, v]) => ({ date, ...v })));

      // Products per category
      const catCounts: Record<string, number> = {};
      (products.data ?? []).forEach((p: any) => {
        const name = p.category?.name ?? 'Uncategorized';
        catCounts[name] = (catCounts[name] ?? 0) + 1;
      });
      setCategoryData(Object.entries(catCounts).map(([name, products]) => ({ name, products })));

      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-jakarta text-2xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-sm text-muted-foreground">Sales performance and inventory insights</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="mt-1 font-jakarta text-2xl font-bold">{formatPrice(totals.revenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total Orders</p>
            <p className="mt-1 font-jakarta text-2xl font-bold">{totals.orders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Avg. Order Value</p>
            <p className="mt-1 font-jakarta text-2xl font-bold">{formatPrice(totals.avgOrder)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Orders (Last 14 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--background))',
                }}
              />
              <Line type="monotone" dataKey="orders" stroke="hsl(160 84% 39%)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Products by Category</CardTitle>
        </CardHeader>
        <CardContent>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--background))',
                  }}
                />
                <Bar dataKey="products" fill="hsl(200 70% 50%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
              No data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
