'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Locale, getTranslations } from '@/lib/i18n';
import { catalogService, Product, Category } from '@/services/catalog.service';
import { Search, Filter, ShieldCheck, Tag, Building2, Package, ArrowRight, Loader2 } from 'lucide-react';

export default function ProductsPage() {
  const [locale, setLocale] = useState<Locale>('en');
  const t = getTranslations(locale);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [prodRes, catRes] = await Promise.all([
          catalogService.getProducts({
            search,
            ...(selectedCategory ? { category: selectedCategory } : {}),
            sortBy,
          }),
          catalogService.getCategories(),
        ]);

        if (prodRes.success && prodRes.data) {
          setProducts(prodRes.data.products);
        }
        if (catRes.success && catRes.data) {
          setCategories(catRes.data);
        }
      } catch (err) {
        console.error('Failed to load catalog data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    const timer = setTimeout(() => {
      loadData();
    }, 200);

    return () => clearTimeout(timer);
  }, [search, selectedCategory, sortBy]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header locale={locale} onLocaleChange={setLocale} t={t} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb & Header */}
        <div className="mb-6">
          <nav className="text-xs text-slate-500 mb-2 flex items-center gap-1.5">
            <Link href="/" className="hover:text-emerald-700">Home</Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Wholesale Products</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Wholesale Products Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Discover verified Ethiopian manufacturers, bulk price tiers, and commercial supplies in Addis Ababa.
          </p>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, brands, or SKUs..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-slate-900"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="py-2 px-3 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-800 font-medium"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="py-2 px-3 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-800 font-medium"
            >
              <option value="newest">Sort by: Newest</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-700 mb-3" />
            <span className="text-sm font-medium">Loading wholesale catalog...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-md mx-auto my-8">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No wholesale products found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search keywords, clearing your category filter, or check back soon as verified suppliers list new inventory.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const primaryImage = product.images?.[0]?.url || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80';
              const startingTier = product.priceTiers?.[0];

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition flex flex-col group"
                >
                  {/* Image */}
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

                  {/* Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Supplier Badge */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{product.business?.name}</span>
                        {product.business?.isVerified && (
                          <span title="Verified Supplier">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          </span>
                        )}
                      </div>

                      {/* Product Name */}
                      <Link href={`/products/${product.slug}`}>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition line-clamp-2 leading-snug">
                          {product.name}
                        </h3>
                      </Link>
                    </div>

                    {/* Price Tiers Preview */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-end justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                          Starting From
                        </span>
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
                        title="View wholesale tiers"
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
