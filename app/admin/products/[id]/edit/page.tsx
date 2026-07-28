'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ProductForm } from '@/components/admin/product-form';
import { supabase } from '@/lib/supabase/client';
import type { Product } from '@/lib/types';

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null | undefined>(undefined);

  useEffect(() => {
    if (!params.id) return;
    supabase
      .from('products')
      .select('*, category:categories(*), brand:brands(*)')
      .eq('id', params.id)
      .maybeSingle()
      .then(({ data }) => {
        setProduct((data as Product) ?? null);
      });
  }, [params.id]);

  if (product === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (product === null) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Product not found.</p>
      </div>
    );
  }

  return <ProductForm product={product} />;
}
