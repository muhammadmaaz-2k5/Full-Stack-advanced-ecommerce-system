'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/lib/context/auth-context';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Address } from '@/lib/types';

export default function AddressesPage() {
  const { user, profile } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    label: 'Home',
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'United States',
  });

  const load = () => {
    if (!user) return;
    supabase
      .from('addresses')
      .select('*')
      .eq('customer_id', user.id)
      .order('is_default', { ascending: false })
      .then(({ data }) => {
        setAddresses((data as Address[]) ?? []);
        setLoading(false);
      });
  };

  useEffect(load, [user]);

  useEffect(() => {
    if (profile?.name) setForm((f) => ({ ...f, full_name: profile.name }));
  }, [profile]);

  const addAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from('addresses').insert({
      ...form,
      customer_id: user.id,
    });
    if (error) {
      toast.error('Could not add address');
    } else {
      toast.success('Address added');
      setOpen(false);
      setForm({ label: 'Home', full_name: '', phone: '', address_line1: '', address_line2: '', city: '', state: '', postal_code: '', country: 'United States' });
      load();
    }
  };

  const removeAddress = async (id: string) => {
    await supabase.from('addresses').delete().eq('id', id);
    toast.success('Address removed');
    load();
  };

  const setDefault = async (id: string) => {
    if (!user) return;
    await supabase.from('addresses').update({ is_default: false }).eq('customer_id', user.id);
    await supabase.from('addresses').update({ is_default: true }).eq('id', id);
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-jakarta text-2xl font-bold tracking-tight">My Addresses</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Address
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Address</DialogTitle>
            </DialogHeader>
            <form onSubmit={addAddress} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="label">Label</Label>
                  <Input id="label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input id="full_name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address1">Address Line 1</Label>
                <Input id="address1" value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address2">Address Line 2</Label>
                <Input id="address2" value={form.address_line2} onChange={(e) => setForm({ ...form, address_line2: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="postal">Postal Code</Label>
                  <Input id="postal" value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} required />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save Address</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {addresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <MapPin className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 font-medium">No addresses saved</p>
          <p className="mt-1 text-sm text-muted-foreground">Add an address for faster checkout.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((addr) => (
            <div key={addr.id} className="rounded-xl border bg-card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {addr.label}
                  </span>
                  {addr.is_default && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                      Default
                    </span>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeAddress(addr.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <p className="mt-3 font-medium">{addr.full_name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {addr.address_line1}
                {addr.address_line2 ? `, ${addr.address_line2}` : ''}
                <br />
                {addr.city}, {addr.state} {addr.postal_code}
                <br />
                {addr.country}
                {addr.phone ? ` · ${addr.phone}` : ''}
              </p>
              {!addr.is_default && (
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setDefault(addr.id)}>
                  Set as default
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
