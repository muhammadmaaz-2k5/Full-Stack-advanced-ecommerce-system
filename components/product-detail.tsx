'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Star, ShoppingBag, Heart, Minus, Plus, Truck, ShieldCheck, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useCart } from '@/lib/context/cart-context';
import { useAuth } from '@/lib/context/auth-context';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { formatPrice, discountPercent } from '@/lib/format';
import type { Product, ProductVariant, Review } from '@/lib/types';
import { cn } from '@/lib/utils';

export function ProductDetail({
  product,
  variants,
  reviews,
  related,
}: {
  product: Product;
  variants: ProductVariant[];
  reviews: Review[];
  related: Product[];
}) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    variants[0] ?? null
  );
  const [quantity, setQuantity] = useState(1);

  const price = selectedVariant?.price ?? product.price;
  const off = discountPercent(price, product.compare_at_price);
  const inStock = (selectedVariant?.quantity ?? product.quantity) > 0;

  const handleAdd = async () => {
    if (!user) {
      toast.error('Please sign in to add items to your cart');
      return;
    }
    await addItem(product, selectedVariant, quantity);
    toast.success(`${product.title} added to cart`);
  };

  const handleWishlist = async () => {
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
    <div className="container-page py-8">
      <nav className="mb-6 text-sm text-muted-foreground">
        <span>Shop</span> <span className="mx-1">/</span>
        {product.category && (
          <>
            <span>{product.category.name}</span> <span className="mx-1">/</span>
          </>
        )}
        <span className="text-foreground">{product.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Images */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
            {product.images?.[selectedImage] && (
              <Image
                src={product.images[selectedImage]}
                alt={product.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            )}
            {off > 0 && (
              <Badge className="absolute left-4 top-4 bg-destructive text-destructive-foreground">
                -{off}% OFF
              </Badge>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={cn(
                    'relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors',
                    selectedImage === i ? 'border-primary' : 'border-transparent'
                  )}
                >
                  <Image src={img} alt="" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          {product.brand && (
            <p className="text-sm font-medium uppercase tracking-wide text-primary">
              {product.brand.name}
            </p>
          )}
          <h1 className="font-jakarta text-3xl font-bold tracking-tight">{product.title}</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'h-4 w-4',
                    i < Math.round(product.rating_average)
                      ? 'fill-primary text-primary'
                      : 'text-muted-foreground/30'
                  )}
                />
              ))}
            </div>
            <span className="text-sm font-medium">{product.rating_average.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">
              ({product.rating_count} reviews)
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="font-jakarta text-3xl font-bold">{formatPrice(price)}</span>
            {product.compare_at_price && product.compare_at_price > price && (
              <span className="text-lg text-muted-foreground line-through">
                {formatPrice(product.compare_at_price)}
              </span>
            )}
          </div>

          <p className="text-muted-foreground">{product.description}</p>

          {/* Variants */}
          {variants.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Options</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={cn(
                      'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                      selectedVariant?.id === v.id
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-input hover:border-primary/50'
                    )}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity + Add to cart */}
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-lg border">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-r-none"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-l-none"
                onClick={() => setQuantity((q) => q + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button size="lg" className="flex-1" onClick={handleAdd} disabled={!inStock}>
              <ShoppingBag className="mr-2 h-5 w-5" />
              {inStock ? 'Add to Cart' : 'Out of Stock'}
            </Button>
            <Button variant="outline" size="icon" className="h-12 w-12" onClick={handleWishlist}>
              <Heart className="h-5 w-5" />
            </Button>
          </div>

          {inStock ? (
            <p className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
              <Check className="h-4 w-4" /> In stock —{' '}
              {selectedVariant?.quantity ?? product.quantity} available
            </p>
          ) : (
            <p className="text-sm text-destructive">Currently out of stock</p>
          )}

          <Separator />

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center gap-1 text-center">
              <Truck className="h-5 w-5 text-primary" />
              <p className="text-xs font-medium">Free Shipping</p>
              <p className="text-xs text-muted-foreground">Orders over $75</p>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <RotateCcw className="h-5 w-5 text-primary" />
              <p className="text-xs font-medium">30-Day Returns</p>
              <p className="text-xs text-muted-foreground">Easy returns</p>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <p className="text-xs font-medium">2-Year Warranty</p>
              <p className="text-xs text-muted-foreground">Full coverage</p>
            </div>
          </div>

          <Separator />

          {/* Tabs */}
          <Tabs defaultValue="description">
            <TabsList className="w-full">
              <TabsTrigger value="description" className="flex-1">
                Description
              </TabsTrigger>
              <TabsTrigger value="specs" className="flex-1">
                Specifications
              </TabsTrigger>
              <TabsTrigger value="reviews" className="flex-1">
                Reviews ({reviews.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="pt-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            </TabsContent>
            <TabsContent value="specs" className="pt-4">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">SKU</dt>
                  <dd className="font-medium">{product.sku}</dd>
                </div>
                {product.barcode && (
                  <div>
                    <dt className="text-muted-foreground">Barcode</dt>
                    <dd className="font-medium">{product.barcode}</dd>
                  </div>
                )}
                {product.brand && (
                  <div>
                    <dt className="text-muted-foreground">Brand</dt>
                    <dd className="font-medium">{product.brand.name}</dd>
                  </div>
                )}
                {product.category && (
                  <div>
                    <dt className="text-muted-foreground">Category</dt>
                    <dd className="font-medium">{product.category.name}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-muted-foreground">Warranty</dt>
                  <dd className="font-medium">2 Years</dd>
                </div>
              </dl>
            </TabsContent>
            <TabsContent value="reviews" className="pt-4">
              <ReviewList reviews={reviews} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="mb-6 font-jakarta text-2xl font-bold tracking-tight">
            You might also like
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCardLite key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { ProductCard } from '@/components/product-card';

function ProductCardLite({ product }: { product: Product }) {
  return <ProductCard product={product} />;
}

function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No reviews yet. Be the first to review this product!
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {reviews.map((r) => (
        <div key={r.id} className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'h-4 w-4',
                    i < r.rating ? 'fill-primary text-primary' : 'text-muted-foreground/30'
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(r.created_at).toLocaleDateString()}
            </span>
          </div>
          {r.title && <p className="mt-2 font-medium">{r.title}</p>}
          {r.body && <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>}
        </div>
      ))}
    </div>
  );
}
