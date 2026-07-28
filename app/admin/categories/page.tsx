'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Loader2,
  Pencil,
  Trash2,
  FolderTree,
  Package,
  X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Category } from '@/lib/types';

type CategoryWithCount = Category & { product_count?: number };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    parent_id: '',
  });

  const load = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    const cats = (data as Category[]) ?? [];

    const counts = await Promise.all(
      cats.map((c) =>
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('category_id', c.id)
      )
    );

    setCategories(
      cats.map((c, i) => ({
        ...c,
        product_count: counts[i].count ?? 0,
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  const openEdit = (c: Category | null) => {
    setEditing(c);
    if (c) {
      setForm({
        name: c.name,
        slug: c.slug,
        description: c.description ?? '',
        image_url: c.image_url ?? '',
        parent_id: c.parent_id ?? '',
      });
    } else {
      setForm({ name: '', slug: '', description: '', image_url: '', parent_id: '' });
    }
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();

    const slug = form.slug.trim() || slugify(form.name);
    if (!form.name.trim() || !slug) {
      toast.error('Name is required');
      return;
    }

    const payload = {
      name: form.name.trim(),
      slug,
      description: form.description.trim() || null,
      image_url: form.image_url.trim() || null,
      parent_id: form.parent_id || null,
    };

    if (editing) {
      const { error } = await supabase.from('categories').update(payload).eq('id', editing.id);
      if (error) {
        toast.error('Could not update category: ' + error.message);
        return;
      }
      toast.success('Category updated');
    } else {
      const { error } = await supabase.from('categories').insert(payload);
      if (error) {
        toast.error('Could not create category: ' + error.message);
        return;
      }
      toast.success('Category created');
    }
    setOpen(false);
    load();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('categories').delete().eq('id', deleteId);
    if (error) {
      toast.error('Could not delete category: ' + error.message);
    } else {
      toast.success('Category deleted');
      load();
    }
    setDeleteId(null);
  };

  const topLevel = categories.filter((c) => !c.parent_id);
  const childrenOf = (parentId: string) => categories.filter((c) => c.parent_id === parentId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-jakarta text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground">Organize products into categories</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openEdit(null)}>
              <Plus className="mr-2 h-4 w-4" /> Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Category' : 'Add New Category'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={save} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cat-name">Name *</Label>
                <Input
                  id="cat-name"
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value, slug: editing ? form.slug : slugify(e.target.value) });
                  }}
                  placeholder="e.g. Electronics"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-slug">Slug</Label>
                <Input
                  id="cat-slug"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="auto-generated from name"
                />
                <p className="text-xs text-muted-foreground">Used in the URL. Lowercase, hyphens only.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-desc">Description</Label>
                <Textarea
                  id="cat-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-img">Image URL</Label>
                <Input
                  id="cat-img"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Parent Category</Label>
                <Select
                  value={form.parent_id}
                  onValueChange={(v) => setForm({ ...form, parent_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None (top-level)" />
                  </SelectTrigger>
                  <SelectContent>
                    {topLevel
                      .filter((c) => c.id !== editing?.id)
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Nest this category under a parent for sub-categories.</p>
              </div>
              <DialogFooter>
                <Button type="submit">{editing ? 'Save Changes' : 'Create Category'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <FolderTree className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-jakarta text-2xl font-bold">{categories.length}</p>
              <p className="text-sm text-muted-foreground">Total Categories</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/40">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-jakarta text-2xl font-bold">
                {categories.reduce((sum, c) => sum + (c.product_count ?? 0), 0)}
              </p>
              <p className="text-sm text-muted-foreground">Categorized Products</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/40">
              <FolderTree className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-jakarta text-2xl font-bold">{topLevel.length}</p>
              <p className="text-sm text-muted-foreground">Top-Level Categories</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : categories.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-muted-foreground">No categories yet.</p>
              <Button className="mt-4" onClick={() => openEdit(null)}>
                <Plus className="mr-2 h-4 w-4" /> Create your first category
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-right">Products</TableHead>
                  <TableHead>Sub-categories</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topLevel.map((c) => {
                  const subs = childrenOf(c.id);
                  return (
                    <>
                      <TableRow key={c.id} className="font-medium">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {c.image_url ? (
                              <div className="h-9 w-9 overflow-hidden rounded-md bg-muted">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={c.image_url} alt="" className="h-full w-full object-cover" />
                              </div>
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                                <FolderTree className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <span>{c.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{c.slug}</TableCell>
                        <TableCell className="text-right">{c.product_count ?? 0}</TableCell>
                        <TableCell>
                          {subs.length > 0 ? (
                            <Badge variant="secondary">{subs.length} sub</Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEdit(c)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setDeleteId(c.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {subs.map((sub) => (
                        <TableRow key={sub.id} className="bg-muted/30">
                          <TableCell className="pl-8">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground">↳</span>
                              {sub.image_url ? (
                                <div className="h-7 w-7 overflow-hidden rounded bg-muted">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={sub.image_url} alt="" className="h-full w-full object-cover" />
                                </div>
                              ) : null}
                              <span>{sub.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{sub.slug}</TableCell>
                          <TableCell className="text-right">{sub.product_count ?? 0}</TableCell>
                          <TableCell>—</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEdit(sub)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setDeleteId(sub.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this category?</AlertDialogTitle>
            <AlertDialogDescription>
              Products in this category will remain but lose their category association. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
