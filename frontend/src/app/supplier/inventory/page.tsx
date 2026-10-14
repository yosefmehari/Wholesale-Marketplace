'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Locale, getTranslations } from '@/lib/i18n';
import { useAuth } from '@/context/auth-context';
import { supplierService, InventoryItem } from '@/services/supplier.service';
import {
  Boxes,
  AlertTriangle,
  Check,
  Save,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

export default function SupplierInventoryPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const [locale, setLocale] = useState<Locale>('en');
  const t = getTranslations(locale);

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<number>(0);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    async function load() {
      if (!accessToken) return;
      setIsLoading(true);
      try {
        const res = await supplierService.getInventory(accessToken);
        if (res.success && res.data) {
          setItems(res.data);
        }
      } catch (err) {
        console.error('Failed to load inventory:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (accessToken) {
      load();
    }
  }, [accessToken, isAuthenticated, authLoading, router]);

  const handleSaveStock = async (productId: string) => {
    if (!accessToken) return;
    try {
      await supplierService.updateStock(accessToken, productId, editQty);
      setItems(
        items.map((it) =>
          it.productId === productId ? { ...it, quantity: editQty, lowStockAlert: editQty <= it.reorderThreshold } : it
        )
      );
      setEditingId(null);
      setSaveSuccess(productId);
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to update stock:', err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header locale={locale} onLocaleChange={setLocale} t={t} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <nav className="text-xs text-slate-500 mb-2 flex items-center gap-1.5">
            <Link href="/supplier/dashboard" className="hover:text-emerald-700">Dashboard</Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Inventory Manager</span>
          </nav>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Inventory & Stock Control
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time commercial stock levels, threshold warnings, and fulfillment availability.
          </p>
        </div>

        {isLoading ? (
          <div className="py-24 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-700 mx-auto mb-2" />
            <span className="text-xs">Loading inventory records...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto my-8">
            <Boxes className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No inventory tracked yet</h3>
            <p className="text-xs text-slate-500 mt-1">
              Add products in the catalog to begin tracking stock.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Wholesale Unit</th>
                    <th className="py-3 px-4">In Stock</th>
                    <th className="py-3 px-4">Reserved</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Quick Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{item.product.name}</span>
                        <span className="text-[11px] text-slate-400">SKU: {item.product.sku || 'N/A'}</span>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-700">
                        {item.product.wholesaleUnit}
                      </td>

                      <td className="py-3 px-4">
                        {editingId === item.productId ? (
                          <input
                            type="number"
                            min={0}
                            value={editQty}
                            onChange={(e) => setEditQty(parseInt(e.target.value, 10) || 0)}
                            className="w-20 px-2 py-1 text-xs border border-emerald-600 rounded font-bold"
                          />
                        ) : (
                          <span className="text-sm font-extrabold text-slate-900">
                            {item.quantity.toLocaleString()}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-500 font-medium">
                        {item.reservedQuantity.toLocaleString()}
                      </td>

                      <td className="py-3 px-4">
                        {item.quantity <= item.reorderThreshold ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Low Stock (≤{item.reorderThreshold})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            In Stock
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {editingId === item.productId ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleSaveStock(item.productId)}
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold text-xs"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2.5 py-1 border border-slate-300 hover:bg-slate-100 rounded text-slate-600 text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingId(item.productId);
                              setEditQty(item.quantity);
                            }}
                            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline"
                          >
                            Adjust Stock
                          </button>
                        )}
                        {saveSuccess === item.productId && (
                          <span className="text-[10px] text-emerald-600 block mt-0.5 font-bold">Saved!</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <Footer t={t} />
    </div>
  );
}
