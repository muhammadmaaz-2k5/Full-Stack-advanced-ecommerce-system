'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, Mail, Lock, Loader2, Zap, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/lib/context/auth-context';
import { toast } from 'sonner';

type TestRole = {
  email: string;
  password: string;
  role: string;
  label: string;
  desc: string;
  color: string;
};

const TEST_ROLES: TestRole[] = [
  { email: 'customer@nimbus.shop', password: 'NimbusTest2025!', role: 'customer', label: 'Customer', desc: 'Browse, shop, checkout', color: 'bg-blue-500' },
  { email: 'admin@nimbus.shop', password: 'NimbusTest2025!', role: 'admin', label: 'Admin', desc: 'Full access + dashboard', color: 'bg-emerald-500' },
  { email: 'sales@nimbus.shop', password: 'NimbusTest2025!', role: 'sales_manager', label: 'Sales Manager', desc: 'Orders and CRM', color: 'bg-amber-500' },
  { email: 'warehouse@nimbus.shop', password: 'NimbusTest2025!', role: 'warehouse_manager', label: 'Warehouse', desc: 'Inventory and shipping', color: 'bg-violet-500' },
  { email: 'accountant@nimbus.shop', password: 'NimbusTest2025!', role: 'accountant', label: 'Accountant', desc: 'Invoices and reports', color: 'bg-rose-500' },
];

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const { signIn, signUp } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickLoading, setQuickLoading] = useState<string | null>(null);
  const [showTestLogins, setShowTestLogins] = useState(false);

  const isRegister = mode === 'register';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        const { error } = await signUp(name, email, password);
        if (error) {
          toast.error(error);
        } else {
          toast.success('Account created! Welcome to Nimbus.');
          router.push('/');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error);
        } else {
          toast.success('Welcome back!');
          router.push('/');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (role: TestRole) => {
    setQuickLoading(role.role);
    try {
      const { error } = await signIn(role.email, role.password);
      if (error) {
        toast.error(error);
      } else {
        toast.success('Signed in as ' + role.label);
        router.push(role.role === 'admin' ? '/admin' : '/');
      }
    } finally {
      setQuickLoading(null);
    }
  };

  const chevronClass = 'h-4 w-4 transition-transform ' + (showTestLogins ? 'rotate-180' : '');

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <ShoppingBag className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-jakarta text-xl font-bold">Nimbus</span>
          </Link>
        </div>

        <div className="rounded-xl border bg-card p-8 shadow-sm">
          <h1 className="font-jakarta text-2xl font-bold tracking-tight">
            {isRegister ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isRegister
              ? 'Sign up to start shopping and track your orders.'
              : 'Sign in to your account to continue.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {isRegister && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder={isRegister ? 'At least 6 characters' : 'Your password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isRegister ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          {!isRegister && (
            <>
              <div className="relative my-6">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
                  or use a test account
                </span>
              </div>

              <button
                onClick={() => setShowTestLogins(!showTestLogins)}
                className="flex w-full items-center justify-between rounded-lg border border-dashed bg-muted/30 px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60"
              >
                <span className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Quick test role login
                </span>
                <ChevronDown className={chevronClass} />
              </button>

              {showTestLogins && (
                <div className="mt-3 space-y-2">
                  {TEST_ROLES.map((role) => (
                    <button
                      key={role.role}
                      onClick={() => quickLogin(role)}
                      disabled={quickLoading !== null}
                      className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 disabled:opacity-50"
                    >
                      <div className={'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ' + role.color + ' text-xs font-bold text-white'}>
                        {role.label.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{role.label}</p>
                        <p className="text-xs text-muted-foreground">{role.desc}</p>
                      </div>
                      {quickLoading === role.role ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : (
                        <span className="text-xs font-medium text-primary">Login</span>
                      )}
                    </button>
                  ))}
                  <p className="pt-1 text-center text-xs text-muted-foreground">
                    All test accounts use password: <span className="font-mono font-medium">NimbusTest2025!</span>
                  </p>
                </div>
              )}
            </>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isRegister ? (
              <>
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Sign in
                </Link>
              </>
            ) : (
              <>
                Don&apos;t have an account?{' '}
                <Link href="/register" className="font-medium text-primary hover:underline">
                  Sign up
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
