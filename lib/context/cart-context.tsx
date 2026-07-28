'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/context/auth-context';
import type { CartItem, Product, ProductVariant } from '@/lib/types';

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  loading: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  addItem: (product: Product, variant: ProductVariant | null, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refresh: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [cartId, setCartId] = useState<string | null>(null);

  const loadCart = useCallback(async (uid: string) => {
    setLoading(true);
    const { data: cart } = await supabase
      .from('carts')
      .select('id')
      .eq('customer_id', uid)
      .maybeSingle();

    let cId = cart?.id;
    if (!cId) {
      const { data: newCart } = await supabase
        .from('carts')
        .insert({ customer_id: uid })
        .select('id')
        .single();
      cId = newCart?.id;
    }
    setCartId(cId ?? null);

    if (cId) {
      const { data: cartItems } = await supabase
        .from('cart_items')
        .select('*, product:products(*), variant:product_variants(*)')
        .eq('cart_id', cId)
        .order('created_at', { ascending: false });
      setItems((cartItems as CartItem[]) ?? []);
    } else {
      setItems([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      loadCart(user.id);
    } else {
      setItems([]);
      setCartId(null);
    }
  }, [user, loadCart]);

  const addItem = useCallback(
    async (product: Product, variant: ProductVariant | null, quantity = 1) => {
      if (!cartId) return;
      const existing = items.find(
        (i) => i.product_id === product.id && i.variant_id === (variant?.id ?? null)
      );
      if (existing) {
        await supabase
          .from('cart_items')
          .update({ quantity: existing.quantity + quantity })
          .eq('id', existing.id);
      } else {
        await supabase.from('cart_items').insert({
          cart_id: cartId,
          product_id: product.id,
          variant_id: variant?.id ?? null,
          quantity,
        });
      }
      await loadCart(user!.id);
      setOpen(true);
    },
    [cartId, items, user, loadCart]
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (quantity <= 0) {
        await removeItem(itemId);
        return;
      }
      await supabase.from('cart_items').update({ quantity }).eq('id', itemId);
      if (user) await loadCart(user.id);
    },
    [user, loadCart]
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      await supabase.from('cart_items').delete().eq('id', itemId);
      if (user) await loadCart(user.id);
    },
    [user, loadCart]
  );

  const clearCart = useCallback(async () => {
    if (!cartId) return;
    await supabase.from('cart_items').delete().eq('cart_id', cartId);
    setItems([]);
  }, [cartId]);

  const refresh = useCallback(async () => {
    if (user) await loadCart(user.id);
  }, [user, loadCart]);

  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce(
    (sum, i) => sum + (Number(i.variant?.price ?? i.product?.price ?? 0)) * i.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        subtotal,
        loading,
        open,
        setOpen,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        refresh,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
