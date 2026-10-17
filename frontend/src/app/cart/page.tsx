'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Locale, getTranslations } from '@/lib/i18n';
import { cartService, CartData, CartItem } from '@/services/cart.service';
import { useAuth } from '@/context/auth-context';
import {
  ShoppingCart,
  Trash2,
  Building2,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Package,
  Loader2,
  Store,
} from 'lucide-react';

export default function CartPage() {
  const [locale, setLocale] = useState<Locale>('en');
  const t = getTranslations(locale);
  const { user, isLoading: authLoading } = useAuth();

  const [cart, setCart] = useState<CartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  const loadCart = async () => {
    try {
      const res = await cartService.getCart();
      if (res.success && res.data) {
        setCart(res.data);
      }
    } catch (err) {
      console.error('Failed to load cart:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        loadCart();
      } else {
        setIsLoading(false);
      }
    }
  }, [user, authLoading]);

  const handleUpdateQuantity = async (item: CartItem, newQty: number) => {
    if (newQty <= 0) return;
    setUpdatingItemId(item.id);
    try {
      await cartService.updateItemQuantity(item.id, newQty);
      await loadCart();
    } catch (err) {
      console.error('Failed to update quantity:', err);
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setUpdatingItemId(itemId);
    try {
      await cartService.removeItem(itemId);
      await loadCart();
    } catch (err) {
      console.error('Failed to remove item:', err);
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleClearCart = async () => {
    if (!confirm('Are you sure you want to clear all items from your wholesale cart?')) return;
    setIsLoading(true);
    try {
      await cartService.clearCart();
      await loadCart();
    } catch (err) {
      console.error('Failed to clear cart:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header locale={locale} onLocaleChange={setLocale} t={t} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <ShoppingCart className="w-7 h-7 text-emerald-700" />
              <span>Wholesale Cart</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Commercial bulk orders partitioned by verified supplier fulfillment
            </p>
          </div>

          {cart && cart.items.length > 0 && (
            <button
              onClick={handleClearCart}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1.5 self-start sm:self-auto py-1 px-2.5 rounded-lg border border-rose-200 hover:bg-rose-50 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Cart</span>
            </button>
          )}
        </div>

        {/* Auth prompt */}
        {!authLoading && !user && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md mx-auto my-12 shadow-xs">
            <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-slate-900">Sign in to Access Your B2B Cart</h2>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Wholesale purchasing and live price tiers require an active business account.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-700 text-white font-bold text-sm rounded-xl hover:bg-emerald-800 transition"
            >
              <span>Sign In to Account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-700 mb-2" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && user && (!cart || cart.items.length === 0) && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto my-8 shadow-xs">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h2 className="text-base font-bold text-slate-900">Your wholesale cart is empty</h2>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Discover verified Ethiopian manufacturers, direct importers, and distributors in our wholesale catalog.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-700 text-white font-bold text-xs rounded-xl hover:bg-emerald-800 transition"
            >
              <span>Explore Marketplace Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Cart items list & summary */}
        {!isLoading && cart && cart.items.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Supplier Groups */}
            <div className="lg:col-span-8 space-y-6">
              {cart.supplierGroups.map((group) => (
                <div
                  key={group.supplier.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
                >
                  {/* Supplier Header */}
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-700" />
                      <span className="font-bold text-sm text-slate-900">
                        {group.supplier.name}
                      </span>
                      {group.supplier.subCity && (
                        <span className="text-xs text-slate-500">
                          ({group.supplier.subCity}, {group.supplier.city})
                        </span>
                      )}
                      {group.supplier.isVerified && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Verified</span>
                        </span>
                      )}
                    </div>

                    <span className="text-xs font-semibold text-slate-600">
                      Subtotal: {group.subtotal.toLocaleString()} ETB
                    </span>
                  </div>

                  {/* Items Table */}
                  <div className="divide-y divide-slate-100">
                    {group.items.map((item) => {
                      const isUpdating = updatingItemId === item.id;

                      return (
                        <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-slate-200">
                              {item.product.primaryImage ? (
                                <img
                                  src={item.product.primaryImage}
                                  alt={item.product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="w-6 h-6 text-slate-300" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <Link
                                href={`/products/${item.product.slug}`}
                                className="font-bold text-sm text-slate-900 hover:text-emerald-700 transition line-clamp-1"
                              >
                                {item.product.name}
                              </Link>
                              <div className="text-xs text-slate-500 mt-0.5">
                                Unit Rate: <span className="font-bold text-emerald-800">{item.unitPrice.toLocaleString()} ETB</span> / {item.wholesaleUnit.toLowerCase()}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                MOQ: {item.minOrderQuantity} {item.wholesaleUnit.toLowerCase()}s | Stock: {item.availableStock}
                              </div>

                              {/* Validation notices */}
                              {!item.isMoqSatisfied && (
                                <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  <span>Quantity is below Minimum Order Quantity ({item.minOrderQuantity})</span>
                                </div>
                              )}
                              {!item.isStockAvailable && (
                                <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  <span>Exceeds available supplier inventory ({item.availableStock})</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Quantity Controls & Line Total */}
                          <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleUpdateQuantity(item, item.quantity - 1)}
                                disabled={isUpdating || item.quantity <= 1}
                                className="w-7 h-7 rounded border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  if (val > 0) handleUpdateQuantity(item, val);
                                }}
                                disabled={isUpdating}
                                className="w-16 text-center text-xs font-bold py-1 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600"
                              />
                              <button
                                onClick={() => handleUpdateQuantity(item, item.quantity + 1)}
                                disabled={isUpdating || item.quantity >= item.availableStock}
                                className="w-7 h-7 rounded border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                              >
                                +
                              </button>
                            </div>

                            <div className="w-24 text-right">
                              <span className="font-extrabold text-sm text-slate-900 block font-mono">
                                {item.totalPrice.toLocaleString()} ETB
                              </span>
                            </div>

                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={isUpdating}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary & Checkout Action */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs sticky top-24 space-y-4">
              <h2 className="font-extrabold text-base text-slate-900 pb-3 border-b border-slate-100">
                Order Summary
              </h2>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Total Wholesale Units</span>
                  <span className="font-bold text-slate-800">{cart.totalItems}</span>
                </div>
                <div className="flex justify-between">
                  <span>Supplier Shipments</span>
                  <span className="font-bold text-slate-800">{cart.supplierGroups.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Marketplace Platform Fee</span>
                  <span className="font-bold text-emerald-700">0.00 ETB (Waived)</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Delivery</span>
                  <span className="text-slate-500">Calculated at dispatch</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Total Est. Subtotal</span>
                  <span className="text-xl font-black text-emerald-800">
                    {cart.subtotal.toLocaleString()} ETB
                  </span>
                </div>
              </div>

              {cart.hasValidationErrors && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Some items violate minimum order quantities or exceed available stock. Adjust quantities before proceeding.
                  </span>
                </div>
              )}

              <Link
                href="/checkout"
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm text-center flex items-center justify-center gap-2 shadow-sm transition ${
                  cart.hasValidationErrors
                    ? 'bg-slate-300 text-slate-500 pointer-events-none'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                }`}
              >
                <span>Proceed to Multi-Supplier Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                Orders are partitioned by supplier. Each verified supplier fulfills and invoices their shipment independently.
              </p>
            </div>
          </div>
        )}
      </main>

      <Footer t={t} />
    </div>
  );
}
