'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Locale, getTranslations } from '@/lib/i18n';
import { useAuth } from '@/context/auth-context';
import { supplierService } from '@/services/supplier.service';
import { Product } from '@/services/catalog.service';
import {
  Package,
  PlusCircle,
  Edit,
  Boxes,
  ArrowLeft,
  Loader2,
  Tag,
} from 'lucide-react';

export default function SupplierProductsPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const [locale, setLocale] = useState<Locale>('en');
  const t = getTranslations(locale);

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    async function loadProducts() {
      if (!accessToken) return;
      setIsLoading(true);
      try {
        const res = await supplierService.getProducts(accessToken);
        if (res.success && res.data) {
          setProducts(res.data);
        }
      } catch (err) {
        console.error('Failed to load supplier products:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (accessToken) {
      loadProducts();
    }
  }, [accessToken, isAuthenticated, authLoading, router]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header locale={locale} onLocaleChange={setLocale} t={t} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <nav className="text-xs text-slate-500 mb-2 flex items-center gap-1.5">
              <Link href="/supplier/dashboard" className="hover:text-emerald-700">Dashboard</Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">Products</span>
            </nav>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Manage Wholesale Listings
            </h1>
          </div>

          <Link
            href="/supplier/products/new"
            className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Product</span>
          </Link>
        </div>

        {isLoading ? (
          <div className="py-24 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-700 mx-auto mb-2" />
            <span className="text-xs">Loading products...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto my-8">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No products listed yet</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Start by listing your first wholesale product with custom quantity price tiers and minimum order quantities.
            </p>
            <Link
              href="/supplier/products/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Product</span>
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Unit / MOQ</th>
                    <th className="py-3 px-4">Wholesale Tiers</th>
                    <th className="py-3 px-4">Stock</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => {
                    const primaryImg = p.images?.[0]?.url;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                              {primaryImg ? (
                                <img src={primaryImg} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <Link
                                href={`/products/${p.slug}`}
                                className="font-bold text-slate-900 hover:text-emerald-700 line-clamp-1"
                              >
                                {p.name}
                              </Link>
                              <span className="text-[11px] text-slate-400 block">SKU: {p.sku || 'N/A'}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {p.category?.name}
                        </td>

                        <td className="py-3 px-4 text-slate-600">
                          <span className="font-semibold text-slate-900">{p.wholesaleUnit}</span>
                          <span className="text-[11px] text-slate-400 block">MOQ: {p.minOrderQuantity}</span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            {p.priceTiers?.map((t) => (
                              <div key={t.id} className="text-[11px] text-slate-700">
                                {t.minQuantity}{t.maxQuantity ? `–${t.maxQuantity}` : '+'} @{' '}
                                <strong className="text-emerald-800">{Number(t.unitPrice).toLocaleString()} ETB</strong>
                              </div>
                            ))}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900">
                            {p.inventory?.quantity || 0}
                          </span>
                          <span className="text-[11px] text-slate-400 block">units</span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/products/${p.slug}`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 inline-block transition mr-1"
                            title="View public product"
                          >
                            <Package className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
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
