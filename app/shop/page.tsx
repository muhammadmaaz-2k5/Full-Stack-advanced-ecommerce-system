import { supabase } from '@/lib/supabase/client';
import { ProductGrid } from '@/components/product-grid';
import type { Product, Category, Brand } from '@/lib/types';

export const dynamic = 'force-static';

async function getShopData() {
  const [products, categories, brands] = await Promise.all([
    supabase
      .from('products')
      .select('*, category:categories(*), brand:brands(*)')
      .eq('active', true)
      .order('featured', { ascending: false }),
    supabase.from('categories').select('*').order('name'),
    supabase.from('brands').select('*').order('name'),
  ]);

  return {
    products: (products.data as Product[]) ?? [],
    categories: (categories.data as Category[]) ?? [],
    brands: (brands.data as Brand[]) ?? [],
  };
}

export default async function ShopPage() {
  const { products, categories, brands } = await getShopData();

  return (
    <div className="container-page py-8">
      <div className="mb-8">
        <h1 className="font-jakarta text-3xl font-bold tracking-tight">All Products</h1>
        <p className="mt-1 text-muted-foreground">
          Browse our full catalog of premium electronics and accessories
        </p>
      </div>
      <ProductGrid products={products} categories={categories} brands={brands} maxPrice={1500} />
    </div>
  );
}
