'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Product, Category, Brand } from '@/lib/types';

type ProductFormProps = {
  product?: Product | null;
};

type FormState = {
  sku: string;
  barcode: string;
  title: string;
  description: string;
  price: string;
  compare_at_price: string;
  quantity: string;
  category_id: string;
  brand_id: string;
  featured: boolean;
  active: boolean;
  images: string;
  video_url: string;
};

const EMPTY: FormState = {
  sku: '',
  barcode: '',
  title: '',
  description: '',
  price: '',
  compare_at_price: '',
  quantity: '',
  category_id: '',
  brand_id: '',
  featured: false,
  active: true,
  images: '',
  video_url: '',
};

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);

  const isEdit = !!product;

  useEffect(() => {
    Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('brands').select('*').order('name'),
    ]).then(([c, b]) => {
      setCategories((c.data as Category[]) ?? []);
      setBrands((b.data as Brand[]) ?? []);
    });

    if (product) {
      setForm({
        sku: product.sku,
        barcode: product.barcode ?? '',
        title: product.title,
        description: product.description ?? '',
        price: String(product.price),
        compare_at_price: product.compare_at_price ? String(product.compare_at_price) : '',
        quantity: String(product.quantity),
        category_id: product.category_id ?? '',
        brand_id: product.brand_id ?? '',
        featured: product.featured,
        active: product.active,
        images: product.images?.join('\n') ?? '',
        video_url: product.video_url ?? '',
      });
    }
  }, [product]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.sku.trim() || !form.title.trim() || !form.price) {
      toast.error('SKU, title, and price are required');
      return;
    }

    setLoading(true);

    const images = form.images
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      sku: form.sku.trim(),
      barcode: form.barcode.trim() || null,
      title: form.title.trim(),
      description: form.description.trim() || null,
      price: Number(form.price) || 0,
      compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
      quantity: Number(form.quantity) || 0,
      category_id: form.category_id || null,
      brand_id: form.brand_id || null,
      featured: form.featured,
      active: form.active,
      images,
      video_url: form.video_url.trim() || null,
    };

    if (isEdit && product) {
      const { error } = await supabase.from('products').update(payload).eq('id', product.id);
      if (error) {
        toast.error('Could not update product: ' + error.message);
      } else {
        toast.success('Product updated successfully');
        router.push('/admin/products');
      }
    } else {
      const { error } = await supabase.from('products').insert(payload);
      if (error) {
        toast.error('Could not create product: ' + error.message);
      } else {
        toast.success('Product created successfully');
        router.push('/admin/products');
      }
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
            <Link href="/admin/products">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-jakarta text-2xl font-bold tracking-tight">
              {isEdit ? 'Edit Product' : 'New Product'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isEdit ? 'Update product details' : 'Add a new product to your catalog'}
            </p>
          </div>
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isEdit ? 'Save Changes' : 'Create Product'}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    value={form.sku}
                    onChange={(e) => set('sku', e.target.value)}
                    placeholder="e.g. NMB-001"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input
                    id="barcode"
                    value={form.barcode}
                    onChange={(e) => set('barcode', e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Product Title *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="e.g. Wireless Noise-Cancelling Headphones"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea
                  id="desc"
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  rows={5}
                  placeholder="Write a compelling product description..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pricing & Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => set('price', e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compare">Compare At ($)</Label>
                  <Input
                    id="compare"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.compare_at_price}
                    onChange={(e) => set('compare_at_price', e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qty">Stock Quantity</Label>
                  <Input
                    id="qty"
                    type="number"
                    min="0"
                    value={form.quantity}
                    onChange={(e) => set('quantity', e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
              {form.compare_at_price && Number(form.compare_at_price) > Number(form.price) && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  {Math.round(((Number(form.compare_at_price) - Number(form.price)) / Number(form.compare_at_price)) * 100)}% off displayed on storefront
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="images">Image URLs</Label>
                <Textarea
                  id="images"
                  value={form.images}
                  onChange={(e) => set('images', e.target.value)}
                  rows={4}
                  placeholder="One URL per line..."
                />
                <p className="text-xs text-muted-foreground">Paste each image URL on a new line. The first image is used as the main product image.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="video">Video URL</Label>
                <Input
                  id="video"
                  value={form.video_url}
                  onChange={(e) => set('video_url', e.target.value)}
                  placeholder="Optional, e.g. YouTube embed link"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Organization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category_id} onValueChange={(v) => set('category_id', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Brand</Label>
                <Select value={form.brand_id} onValueChange={(v) => set('brand_id', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Visibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="active">Active</Label>
                  <p className="text-xs text-muted-foreground">Visible in storefront</p>
                </div>
                <Switch
                  id="active"
                  checked={form.active}
                  onCheckedChange={(v) => set('active', v)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="featured">Featured</Label>
                  <p className="text-xs text-muted-foreground">Show on home page</p>
                </div>
                <Switch
                  id="featured"
                  checked={form.featured}
                  onCheckedChange={(v) => set('featured', v)}
                />
              </div>
            </CardContent>
          </Card>

          {form.images && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const first = form.images.split('\n').map((s) => s.trim()).find(Boolean);
                  return first ? (
                    <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={first} alt="Preview" className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex aspect-square items-center justify-center rounded-lg border bg-muted text-sm text-muted-foreground">
                      No image
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </form>
  );
}
