import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { ProductDetail } from '@/components/product-detail';
import type { Product, ProductVariant, Review } from '@/lib/types';

export const dynamic = 'force-static';

async function getProductData(id: string) {
  const [product, variants, reviews] = await Promise.all([
    supabase
      .from('products')
      .select('*, category:categories(*), brand:brands(*)')
      .eq('id', id)
      .maybeSingle(),
    supabase.from('product_variants').select('*').eq('product_id', id).order('name'),
    supabase.from('reviews').select('*').eq('product_id', id).order('created_at', { ascending: false }),
  ]);

  const prod = product.data as Product | null;
  let related: Product[] = [];
  if (prod?.category_id) {
    const { data } = await supabase
      .from('products')
      .select('*, category:categories(*), brand:brands(*)')
      .eq('category_id', prod.category_id)
      .neq('id', id)
      .eq('active', true)
      .limit(4);
    related = (data as Product[]) ?? [];
  }

  return {
    product: prod,
    variants: (variants.data as ProductVariant[]) ?? [],
    reviews: (reviews.data as Review[]) ?? [],
    related,
  };
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const { product, variants, reviews, related } = await getProductData(params.id);
  if (!product) notFound();

  return (
    <ProductDetail
      product={product}
      variants={variants}
      reviews={reviews}
      related={related}
    />
  );
}
