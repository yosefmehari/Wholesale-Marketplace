'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Locale, getTranslations } from '@/lib/i18n';
import { catalogService, Category } from '@/services/catalog.service';
import {
  Utensils,
  Shirt,
  Zap,
  Laptop,
  Home,
  Hammer,
  Wrench,
  Sparkles,
  Wheat,
  Package,
  Layers,
  ArrowRight,
  Loader2,
} from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  Utensils: <Utensils className="w-6 h-6" />,
  Shirt: <Shirt className="w-6 h-6" />,
  Zap: <Zap className="w-6 h-6" />,
  Laptop: <Laptop className="w-6 h-6" />,
  Home: <Home className="w-6 h-6" />,
  Hammer: <Hammer className="w-6 h-6" />,
  Wrench: <Wrench className="w-6 h-6" />,
  Sparkles: <Sparkles className="w-6 h-6" />,
  Wheat: <Wheat className="w-6 h-6" />,
  Package: <Package className="w-6 h-6" />,
};

export default function CategoriesPage() {
  const [locale, setLocale] = useState<Locale>('en');
  const t = getTranslations(locale);

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const res = await catalogService.getCategories();
        if (res.success && res.data) {
          setCategories(res.data);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header locale={locale} onLocaleChange={setLocale} t={t} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <nav className="text-xs text-slate-500 mb-2 flex items-center gap-1.5">
            <Link href="/" className="hover:text-emerald-700">Home</Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Categories</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Wholesale Categories Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse Ethiopia’s key industrial, agricultural, manufacturing, and commercial trade categories.
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-700 mb-2" />
            <span className="text-sm font-medium">Loading wholesale categories...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => {
              const iconComponent = (cat.icon && iconMap[cat.icon]) || <Layers className="w-6 h-6" />;
              return (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-700/50 hover:shadow-md transition flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-700 group-hover:text-white transition flex items-center justify-center mb-4">
                      {iconComponent}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      {cat.description || 'Explore commercial wholesale products.'}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-800">
                    <span>
                      {cat._count?.products || 0} Products Listed
                    </span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <Footer t={t} />
    </div>
  );
}
