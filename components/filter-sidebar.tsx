'use client';

import { useState, useMemo } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import type { Brand, Category } from '@/lib/types';

export type Filters = {
  categories: string[];
  brands: string[];
  priceRange: [number, number];
  onSale: boolean;
  minRating: number;
};

export const DEFAULT_FILTERS: Filters = {
  categories: [],
  brands: [],
  priceRange: [0, 1500],
  onSale: false,
  minRating: 0,
};

export function FilterSidebar({
  categories,
  brands,
  filters,
  onChange,
  maxPrice = 1500,
}: {
  categories: Category[];
  brands: Brand[];
  filters: Filters;
  onChange: (f: Filters) => void;
  maxPrice?: number;
}) {
  const toggle = (key: 'categories' | 'brands', value: string) => {
    const list = filters[key];
    onChange({
      ...filters,
      [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-jakarta text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Categories
        </h3>
        <div className="mt-3 space-y-2">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center gap-2">
              <Checkbox
                id={`cat-${c.id}`}
                checked={filters.categories.includes(c.id)}
                onCheckedChange={() => toggle('categories', c.id)}
              />
              <Label htmlFor={`cat-${c.id}`} className="text-sm font-normal cursor-pointer">
                {c.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-jakarta text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Price Range
        </h3>
        <div className="mt-4 px-1">
          <Slider
            min={0}
            max={maxPrice}
            step={10}
            value={filters.priceRange}
            onValueChange={(v) => onChange({ ...filters, priceRange: [v[0], v[1]] as [number, number] })}
            className="my-2"
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>${filters.priceRange[0]}</span>
            <span>${filters.priceRange[1]}</span>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-jakarta text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Brands
        </h3>
        <div className="mt-3 space-y-2">
          {brands.map((b) => (
            <div key={b.id} className="flex items-center gap-2">
              <Checkbox
                id={`brand-${b.id}`}
                checked={filters.brands.includes(b.id)}
                onCheckedChange={() => toggle('brands', b.id)}
              />
              <Label htmlFor={`brand-${b.id}`} className="text-sm font-normal cursor-pointer">
                {b.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-jakarta text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Rating
        </h3>
        <div className="mt-3 space-y-2">
          {[4, 3, 2, 1].map((r) => (
            <div key={r} className="flex items-center gap-2">
              <Checkbox
                id={`rating-${r}`}
                checked={filters.minRating === r}
                onCheckedChange={() =>
                  onChange({ ...filters, minRating: filters.minRating === r ? 0 : r })
                }
              />
              <Label htmlFor={`rating-${r}`} className="text-sm font-normal cursor-pointer">
                {r}★ & up
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div className="flex items-center gap-2">
        <Checkbox
          id="on-sale"
          checked={filters.onSale}
          onCheckedChange={(v) => onChange({ ...filters, onSale: !!v })}
        />
        <Label htmlFor="on-sale" className="text-sm font-normal cursor-pointer">
          On sale only
        </Label>
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => onChange({ ...DEFAULT_FILTERS, priceRange: [0, maxPrice] })}
      >
        Clear all filters
      </Button>
    </div>
  );
}

export function MobileFilters({
  categories,
  brands,
  filters,
  onChange,
  maxPrice,
}: {
  categories: Category[];
  brands: Brand[];
  filters: Filters;
  onChange: (f: Filters) => void;
  maxPrice?: number;
}) {
  const [open, setOpen] = useState(false);
  const activeCount =
    filters.categories.length +
    filters.brands.length +
    (filters.onSale ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden">
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-xs font-bold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <FilterSidebar
            categories={categories}
            brands={brands}
            filters={filters}
            onChange={onChange}
            maxPrice={maxPrice}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
