'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Locale, getTranslations } from '@/lib/i18n';
import { catalogService, Category, Product } from '@/services/catalog.service';
import { Building2, ShieldCheck, ArrowRight, Package, Loader2 } from 'lucide-react';

export default function CategoryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const [locale, setLocale] = useState<Locale>('en');
  const t = getTranslations(locale);

  const [category, setCategory] = useState<(Category & { products: Product[] }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const res = await catalogService.getCategoryBySlug(resolvedParams.slug);
        if (res.success && res.data) {
          setCategory(res.data);
        }
      } catch (err) {
        console.error('Failed to load category:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [resolvedParams.slug]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Header locale={locale} onLocaleChange={setLocale} t={t} />
        <div className="flex-1 flex items-center justify-center py-24 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-700 mb-2" />
        </div>
        <Footer t={t} />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Header locale={locale} onLocaleChange={setLocale} t={t} />
        <main className="flex-1 max-w-7xl mx-auto px-4 py-16 text-center">
          <h2 className="text-xl font-bold text-slate-800">Category Not Found</h2>
          <Link href="/categories" className="mt-4 inline-block text-sm text-emerald-700 font-semibold underline">
            View All Categories
          </Link>
        </main>
        <Footer t={t} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header locale={locale} onLocaleChange={setLocale} t={t} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <nav className="text-xs text-slate-500 mb-2 flex items-center gap-1.5">
            <Link href="/" className="hover:text-emerald-700">Home</Link>
            <span>/</span>
            <Link href="/categories" className="hover:text-emerald-700">Categories</Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold">{category.name}</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {category.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
            {category.description}
          </p>
        </div>

        {/* Products in Category */}
        {!category.products || category.products.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-md mx-auto my-8">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No products currently in this category</h3>
            <p className="text-xs text-slate-500 mt-1">
              Check back soon or explore other categories.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {category.products.map((product) => {
              const primaryImage = product.images?.[0]?.url || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80';
              const startingTier = product.priceTiers?.[0];

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition flex flex-col group"
                >
                  <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                    <img
                      src={primaryImage}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-white/90 backdrop-blur px-2 py-0.5 rounded shadow-xs text-slate-800">
                        MOQ: {product.minOrderQuantity} {product.wholesaleUnit.toLowerCase()}s
                      </span>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{product.business?.name}</span>
                        {product.business?.isVerified && (
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        )}
                      </div>

                      <Link href={`/products/${product.slug}`}>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition line-clamp-2 leading-snug">
                          {product.name}
                        </h3>
                      </Link>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-end justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">Starting From</span>
                        <div className="text-base font-extrabold text-emerald-800">
                          {startingTier ? (
                            <>
                              {Number(startingTier.unitPrice).toLocaleString()} ETB
                              <span className="text-[11px] font-normal text-slate-500">
                                /{product.wholesaleUnit.toLowerCase()}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-slate-500">Contact for pricing</span>
                          )}
                        </div>
                      </div>

                      <Link
                        href={`/products/${product.slug}`}
                        className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-700 hover:text-white transition"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer t={t} />
    </div>
  );
}
