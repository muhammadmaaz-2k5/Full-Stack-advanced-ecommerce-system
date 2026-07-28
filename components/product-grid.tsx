'use client';

import { useState, useMemo } from 'react';
import { ProductCard } from '@/components/product-card';
import { FilterSidebar, MobileFilters, DEFAULT_FILTERS, type Filters } from '@/components/filter-sidebar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product, Brand, Category } from '@/lib/types';

type SortKey = 'featured' | 'price_asc' | 'price_desc' | 'rating' | 'newest';

export function ProductGrid({
  products,
  categories,
  brands,
  maxPrice = 1500,
  loading = false,
}: {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  maxPrice?: number;
  loading?: boolean;
}) {
  const [filters, setFilters] = useState<Filters>({ ...DEFAULT_FILTERS, priceRange: [0, maxPrice] });
  const [sort, setSort] = useState<SortKey>('featured');

  const filtered = useMemo(() => {
    let list = [...products];

    if (filters.categories.length > 0) {
      list = list.filter((p) => p.category_id && filters.categories.includes(p.category_id));
    }
    if (filters.brands.length > 0) {
      list = list.filter((p) => p.brand_id && filters.brands.includes(p.brand_id));
    }
    list = list.filter((p) => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]);
    if (filters.onSale) {
      list = list.filter((p) => p.compare_at_price && p.compare_at_price > p.price);
    }
    if (filters.minRating > 0) {
      list = list.filter((p) => p.rating_average >= filters.minRating);
    }

    switch (sort) {
      case 'price_asc':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        list.sort((a, b) => b.rating_average - a.rating_average);
        break;
      case 'newest':
        list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      default:
        list.sort((a, b) => Number(b.featured) - Number(a.featured));
    }
    return list;
  }, [products, filters, sort]);

  return (
    <div className="flex gap-8">
      <aside className="hidden w-60 flex-shrink-0 lg:block">
        <div className="sticky top-24">
          <FilterSidebar
            categories={categories}
            brands={brands}
            filters={filters}
            onChange={setFilters}
            maxPrice={maxPrice}
          />
        </div>
      </aside>

      <div className="flex-1">
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {loading ? 'Loading...' : `${filtered.length} product${filtered.length !== 1 ? 's' : ''}`}
          </p>
          <div className="flex items-center gap-2">
            <MobileFilters
              categories={categories}
              brands={brands}
              filters={filters}
              onChange={setFilters}
              maxPrice={maxPrice}
            />
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="rating">Top Rated</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-square rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
            <p className="font-medium">No products found</p>
            <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
