import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Truck, ShieldCheck, RotateCcw, Headphones, Star, TrendingUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product-card';
import { supabase } from '@/lib/supabase/client';
import type { Product, Category } from '@/lib/types';

export const dynamic = 'force-static';

async function getHomeData() {
  const [featured, categories] = await Promise.all([
    supabase
      .from('products')
      .select('*, category:categories(*), brand:brands(*)')
      .eq('featured', true)
      .eq('active', true)
      .order('rating_count', { ascending: false })
      .limit(8),
    supabase.from('categories').select('*').order('name').limit(6),
  ]);

  return {
    featured: (featured.data as Product[]) ?? [],
    categories: (categories.data as Category[]) ?? [],
  };
}

const FEATURES = [
  { icon: Truck, title: 'Free Shipping', desc: 'On orders over $75' },
  { icon: ShieldCheck, title: '2-Year Warranty', desc: 'On all electronics' },
  { icon: RotateCcw, title: '30-Day Returns', desc: 'No questions asked' },
  { icon: Headphones, title: '24/7 Support', desc: 'Expert help anytime' },
];

export default async function HomePage() {
  const { featured, categories } = await getHomeData();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-muted/40 via-background to-background">
        {/* Background grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* Glow accents */}
        <div className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="container-page relative">
          <div className="grid items-center gap-12 py-16 md:grid-cols-2 md:py-24 lg:py-28">
            {/* Left: copy */}
            <div className="space-y-7">
              <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3.5 py-1.5 text-sm font-medium shadow-sm backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>New collection just dropped</span>
                <span className="flex h-1.5 w-1.5 rounded-full bg-primary" />
              </div>

              <h1 className="font-jakarta text-4xl font-bold leading-[1.1] tracking-tight text-balance sm:text-5xl lg:text-6xl">
                Premium tech,
                <br />
                <span className="bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">
                  delivered with care.
                </span>
              </h1>

              <p className="max-w-md text-lg leading-relaxed text-muted-foreground text-balance">
                Shop the latest electronics, audio and wearables from top brands. Backed by our
                ERP-powered inventory and fast, reliable shipping.
              </p>

              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="h-12 px-7 text-base shadow-lg shadow-primary/20">
                  <Link href="/shop">
                    Shop Now <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 px-7 text-base">
                  <Link href="/categories/electronics">Browse Categories</Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-8 pt-6">
                <div>
                  <p className="font-jakarta text-2xl font-bold">12k+</p>
                  <p className="text-sm text-muted-foreground">Products</p>
                </div>
                <div className="h-10 w-px bg-border" />
                <div>
                  <p className="font-jakarta text-2xl font-bold">98%</p>
                  <p className="text-sm text-muted-foreground">Satisfaction</p>
                </div>
                <div className="h-10 w-px bg-border" />
                <div>
                  <p className="font-jakarta text-2xl font-bold">48h</p>
                  <p className="text-sm text-muted-foreground">Delivery</p>
                </div>
              </div>
            </div>

            {/* Right: product showcase */}
            <div className="relative">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border bg-muted shadow-2xl">
                <Image
                  src="https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=900"
                  alt="Premium headphones"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </div>

              {/* Floating rating card */}
              <div className="absolute -left-4 top-8 hidden rounded-xl border bg-background/95 p-3.5 shadow-xl backdrop-blur md:block">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-sm font-semibold">4.9</span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">2,400+ reviews</p>
              </div>

              {/* Floating sales card */}
              <div className="absolute -right-4 bottom-8 hidden rounded-xl border bg-background/95 p-3.5 shadow-xl backdrop-blur md:block">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Best Seller</p>
                    <p className="text-xs text-muted-foreground">This week</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features bar */}
      <section className="border-b bg-background">
        <div className="container-page grid grid-cols-2 gap-4 py-6 md:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex items-center gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">{f.title}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container-page py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-jakarta text-2xl font-bold tracking-tight sm:text-3xl">
              Shop by Category
            </h2>
            <p className="mt-1 text-muted-foreground">Find exactly what you need</p>
          </div>
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/shop">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-muted"
            >
              {cat.image_url && (
                <Image
                  src={cat.image_url}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 16vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-4">
                <h3 className="font-jakarta text-base font-semibold text-white">{cat.name}</h3>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-white/80 opacity-0 transition-opacity group-hover:opacity-100">
                  Shop now <ArrowRight className="h-3 w-3" />
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="bg-muted/30 py-16">
        <div className="container-page">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="font-jakarta text-2xl font-bold tracking-tight sm:text-3xl">
                Featured Products
              </h2>
              <p className="mt-1 text-muted-foreground">Hand-picked favorites our customers love</p>
            </div>
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/shop">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="container-page py-16">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-12 text-white md:px-16 md:py-16">
          <div className="relative z-10 max-w-lg">
            <h2 className="font-jakarta text-2xl font-bold tracking-tight sm:text-3xl">
              Get 10% off your first order
            </h2>
            <p className="mt-2 text-white/90">
              Use code <span className="font-mono font-bold">WELCOME10</span> at checkout. Plus free
              shipping on orders over $75.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-6">
              <Link href="/shop">Start Shopping</Link>
            </Button>
          </div>
          <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/10" />
          <div className="absolute -bottom-16 -right-16 h-72 w-72 rounded-full bg-white/5" />
        </div>
      </section>
    </>
  );
}
