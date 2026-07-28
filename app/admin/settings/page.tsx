'use client';

import { useState, useEffect } from 'react';
import { Banknote, Loader2, Save, Settings as SettingsIcon, DollarSign, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase/client';
import { formatPrice } from '@/lib/format';
import { toast } from 'sonner';
import type { StoreSettings } from '@/lib/types';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    cod_enabled: true,
    cod_fee: '0',
    cod_max_order: '',
    cod_instructions: 'Pay with cash when your order is delivered. Exact amount is appreciated.',
  });

  useEffect(() => {
    supabase
      .from('store_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const s = data as StoreSettings;
          setSettings(s);
          setForm({
            cod_enabled: s.cod_enabled,
            cod_fee: String(s.cod_fee),
            cod_max_order: s.cod_max_order ? String(s.cod_max_order) : '',
            cod_instructions: s.cod_instructions,
          });
        }
        setLoading(false);
      });
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from('store_settings')
      .update({
        cod_enabled: form.cod_enabled,
        cod_fee: Number(form.cod_fee) || 0,
        cod_max_order: form.cod_max_order ? Number(form.cod_max_order) : null,
        cod_instructions: form.cod_instructions,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);
    if (error) {
      toast.error('Could not save settings: ' + error.message);
    } else {
      toast.success('COD settings saved');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const previewFee = Number(form.cod_fee) || 0;
  const previewMax = form.cod_max_order ? Number(form.cod_max_order) : null;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-jakarta text-2xl font-bold tracking-tight">Store Settings</h1>
        <p className="text-sm text-muted-foreground">Configure payment methods and store policies</p>
      </div>

      <form onSubmit={save} className="space-y-6">
        {/* COD Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/40">
                <Banknote className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-base">Cash on Delivery (COD)</CardTitle>
                <CardDescription>Let customers pay with cash when their order arrives</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <Switch
                  id="cod-enabled"
                  checked={form.cod_enabled}
                  onCheckedChange={(v) => setForm({ ...form, cod_enabled: v })}
                />
                <div>
                  <Label htmlFor="cod-enabled" className="cursor-pointer">
                    Enable Cash on Delivery
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    When enabled, customers can select COD at checkout
                  </p>
                </div>
              </div>
              <Badge className={form.cod_enabled ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : ''}>
                {form.cod_enabled ? 'Active' : 'Disabled'}
              </Badge>
            </div>

            {form.cod_enabled && (
              <>
                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cod-fee">COD Fee ($)</Label>
                    <Input
                      id="cod-fee"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.cod_fee}
                      onChange={(e) => setForm({ ...form, cod_fee: e.target.value })}
                      placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground">
                      Extra charge added to COD orders. Set to 0 for no fee.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cod-max">Max Order Total ($)</Label>
                    <Input
                      id="cod-max"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.cod_max_order}
                      onChange={(e) => setForm({ ...form, cod_max_order: e.target.value })}
                      placeholder="No limit"
                    />
                    <p className="text-xs text-muted-foreground">
                      Orders above this amount must pay by card. Leave empty for no limit.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cod-instructions">Customer Instructions</Label>
                  <Textarea
                    id="cod-instructions"
                    rows={3}
                    value={form.cod_instructions}
                    onChange={(e) => setForm({ ...form, cod_instructions: e.target.value })}
                    placeholder="Instructions shown to customers at checkout..."
                  />
                  <p className="text-xs text-muted-foreground">
                    This text appears on the checkout page when COD is selected.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Preview */}
        {form.cod_enabled && (
          <Card className="border-dashed bg-muted/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm">Checkout Preview</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-emerald-600" />
                <span className="font-medium">Cash on Delivery</span>
                {previewFee > 0 ? (
                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                    +{formatPrice(previewFee)} fee
                  </Badge>
                ) : (
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                    No extra fee
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">{form.cod_instructions}</p>
              {previewMax && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Available for orders up to {formatPrice(previewMax)}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Card payment info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/40">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base">Card Payments</CardTitle>
                <CardDescription>Online card payments are always enabled</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Switch checked disabled />
              <span>Credit / Debit Card — always available at checkout</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
