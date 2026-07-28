import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { ProductGrid } from '@/components/product-grid';
import type { Product, Category, Brand } from '@/lib/types';

export const dynamic = 'force-static';

async function getCategoryData(slug: string) {
  const [category, products, categories, brands] = await Promise.all([
    supabase.from('categories').select('*').eq('slug', slug).maybeSingle(),
    supabase
      .from('products')
      .select('*, category:categories(*), brand:brands(*)')
      .eq('active', true)
      .order('featured', { ascending: false }),
    supabase.from('categories').select('*').order('name'),
    supabase.from('brands').select('*').order('name'),
  ]);

  return {
    category: category.data as Category | null,
    products: (products.data as Product[]) ?? [],
    categories: (categories.data as Category[]) ?? [],
    brands: (brands.data as Brand[]) ?? [],
  };
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const { category, products, categories, brands } = await getCategoryData(params.slug);

  if (!category) notFound();

  const filtered = products.filter((p) => p.category_id === category.id);

  return (
    <div className="container-page py-8">
      <div className="mb-8">
        <nav className="mb-2 text-sm text-muted-foreground">
          <span>Shop</span> <span className="mx-1">/</span>{' '}
          <span className="text-foreground">{category.name}</span>
        </nav>
        <h1 className="font-jakarta text-3xl font-bold tracking-tight">{category.name}</h1>
        {category.description && (
          <p className="mt-1 max-w-2xl text-muted-foreground">{category.description}</p>
        )}
      </div>
      <ProductGrid
        products={filtered}
        categories={categories}
        brands={brands}
        maxPrice={1500}
      />
    </div>
  );
}
