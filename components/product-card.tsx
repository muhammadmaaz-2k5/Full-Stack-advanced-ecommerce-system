'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, Star, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/lib/context/cart-context';
import { useAuth } from '@/lib/context/auth-context';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { formatPrice, discountPercent } from '@/lib/format';
import type { Product } from '@/lib/types';
import { cn } from '@/lib/utils';

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const off = discountPercent(product.price, product.compare_at_price);

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to add items to your cart');
      return;
    }
    await addItem(product, null, 1);
    toast.success(`${product.title} added to cart`);
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to save items');
      return;
    }
    const { error } = await supabase
      .from('wishlist')
      .upsert({ customer_id: user.id, product_id: product.id });
    if (error) toast.error('Could not save to wishlist');
    else toast.success('Saved to wishlist');
  };

  return (
    <Link href={`/products/${product.id}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
        {product.images?.[0] && (
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        {off > 0 && (
          <Badge className="absolute left-3 top-3 bg-destructive text-destructive-foreground">
            -{off}%
          </Badge>
        )}
        <div className="absolute right-3 top-3 flex flex-col gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 rounded-full bg-background/90 shadow-sm"
            onClick={handleWishlist}
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>
        <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <Button className="w-full" size="sm" onClick={handleAdd}>
            <ShoppingBag className="mr-1.5 h-4 w-4" /> Add to Cart
          </Button>
        </div>
      </div>
      <div className="mt-3 space-y-1">
        {product.brand && (
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {product.brand.name}
          </p>
        )}
        <h3 className="line-clamp-1 text-sm font-medium">{product.title}</h3>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            <Star className="h-3.5 w-3.5 fill-primary text-primary" />
            <span className="text-xs font-medium">{product.rating_average.toFixed(1)}</span>
          </div>
          <span className="text-xs text-muted-foreground">({product.rating_count})</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-jakarta font-semibold">{formatPrice(product.price)}</span>
          {product.compare_at_price && product.compare_at_price > product.price && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.compare_at_price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
