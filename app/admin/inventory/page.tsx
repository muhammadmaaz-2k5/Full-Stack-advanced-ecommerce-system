'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Loader2, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Product } from '@/lib/types';

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, string>>({});

  const load = async () => {
    const { data } = await supabase
      .from('products')
      .select('*, category:categories(name)')
      .order('quantity', { ascending: true });
    setProducts((data as Product[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStock = async (id: string) => {
    const newQty = Number(editing[id]);
    if (isNaN(newQty)) return;
    const { error } = await supabase.from('products').update({ quantity: newQty }).eq('id', id);
    if (error) toast.error('Could not update stock');
    else {
      toast.success('Stock updated');
      setProducts(products.map((p) => (p.id === id ? { ...p, quantity: newQty } : p)));
      setEditing({ ...editing, [id]: '' });
    }
  };

  const lowStock = products.filter((p) => p.quantity < 10);
  const totalStock = products.reduce((sum, p) => sum + p.quantity, 0);
  const outOfStock = products.filter((p) => p.quantity === 0).length;

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
        <h1 className="font-jakarta text-2xl font-bold tracking-tight">Inventory</h1>
        <p className="text-sm text-muted-foreground">Track and manage stock levels across your warehouse</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-3 font-jakarta text-2xl font-bold">{totalStock}</p>
            <p className="text-sm text-muted-foreground">Total Units in Stock</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/40">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <p className="mt-3 font-jakarta text-2xl font-bold">{lowStock.length}</p>
            <p className="text-sm text-muted-foreground">Low Stock Alerts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 dark:bg-red-950/40">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <p className="mt-3 font-jakarta text-2xl font-bold">{outOfStock}</p>
            <p className="text-sm text-muted-foreground">Out of Stock</p>
          </CardContent>
        </Card>
      </div>

      {lowStock.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-amber-800 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" /> Restock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-700 dark:text-amber-500">
              {lowStock.length} product{lowStock.length !== 1 ? 's' : ''} need attention. Consider generating a purchase
              request for the items below.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stock Levels</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Current Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Adjust</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                  <TableCell className="text-right">
                    <span className={p.quantity === 0 ? 'text-destructive' : p.quantity < 10 ? 'text-amber-600 dark:text-amber-400' : ''}>
                      {p.quantity}
                    </span>
                  </TableCell>
                  <TableCell>
                    {p.quantity === 0 ? (
                      <Badge variant="destructive">Out of Stock</Badge>
                    ) : p.quantity < 10 ? (
                      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">Low</Badge>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">In Stock</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Input
                        type="number"
                        placeholder="New qty"
                        value={editing[p.id] ?? ''}
                        onChange={(e) => setEditing({ ...editing, [p.id]: e.target.value })}
                        className="h-8 w-20"
                      />
                      <Button size="sm" variant="outline" onClick={() => updateStock(p.id)} disabled={!editing[p.id]}>
                        Update
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
