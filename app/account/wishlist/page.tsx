'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product-card';
import { useAuth } from '@/lib/context/auth-context';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Product } from '@/lib/types';

export default function WishlistPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!user) return;
    supabase
      .from('wishlist')
      .select('product:products(*, category:categories(*), brand:brands(*))')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setProducts(((data as unknown as { product: Product }[])?.map((d) => d.product)) ?? []);
        setLoading(false);
      });
  };

  useEffect(load, [user]);

  const remove = async (productId: string) => {
    if (!user) return;
    await supabase.from('wishlist').delete().eq('customer_id', user.id).eq('product_id', productId);
    toast.success('Removed from wishlist');
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div>
        <h1 className="mb-6 font-jakarta text-2xl font-bold tracking-tight">My Wishlist</h1>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <Heart className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 font-medium">Your wishlist is empty</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap the heart icon on any product to save it here.
          </p>
          <Button asChild className="mt-4">
            <Link href="/shop">Browse Products</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 font-jakarta text-2xl font-bold tracking-tight">My Wishlist</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <div key={p.id} className="relative">
            <ProductCard product={p} />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-10 h-8 w-8 rounded-full bg-background/90 shadow-sm"
              onClick={() => remove(p.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
