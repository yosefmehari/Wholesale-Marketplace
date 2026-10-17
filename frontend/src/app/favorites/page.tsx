'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Locale, getTranslations } from '@/lib/i18n';
import { favoriteService, FavoriteItem } from '@/services/favorite.service';
import { useAuth } from '@/context/auth-context';
import {
  Heart,
  Package,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Building2,
  Loader2,
  ShoppingBag,
} from 'lucide-react';

export default function FavoritesPage() {
  const [locale, setLocale] = useState<Locale>('en');
  const t = getTranslations(locale);
  const { user, isLoading: authLoading } = useAuth();

  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadFavorites() {
      if (!user) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await favoriteService.getFavorites();
        if (res.success && res.data) {
          setFavorites(res.data);
        }
      } catch (err) {
        console.error('Failed to load favorites:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading) {
      loadFavorites();
    }
  }, [user, authLoading]);

  const handleRemove = async (productId: string) => {
    setRemovingId(productId);
    try {
      await favoriteService.removeFavorite(productId);
      setFavorites((prev) => prev.filter((f) => f.productId !== productId));
    } catch (err) {
      console.error('Failed to remove favorite:', err);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header locale={locale} onLocaleChange={setLocale} t={t} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-slate-500 mb-2 flex items-center gap-1.5">
          <Link href="/" className="hover:text-emerald-700">Home</Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Saved Favorites</span>
        </nav>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Heart className="w-7 h-7 text-rose-500 fill-rose-500" />
              <span>Saved Wholesale Products</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Your shortlisted products and wholesale suppliers for recurring orders or price comparison.
            </p>
          </div>

          <Link
            href="/products"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Browse More Products</span>
          </Link>
        </div>

        {authLoading || isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
            <p className="text-sm font-medium text-slate-600">Loading saved items...</p>
          </div>
        ) : !user ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300 p-8">
            <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">Login to view favorites</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
              Please sign in with your buyer account to access your saved wholesale products across all devices.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-xs"
            >
              Sign In to Your Account
            </Link>
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300 p-8">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">Your favorites list is empty</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
              You haven't saved any wholesale products yet. Click the heart icon on any product to save it here for quick access.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-xs"
            >
              Explore Products Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map(({ id: favId, product: p }) => {
              const primaryImage = p.images?.find((img) => img.isPrimary) || p.images?.[0];
              const lowestPrice = p.priceTiers && p.priceTiers.length > 0
                ? Math.min(...p.priceTiers.map((t) => t.unitPrice))
                : null;

              return (
                <div
                  key={favId}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="h-44 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                      {primaryImage ? (
                        <img
                          src={primaryImage.url}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-10 h-10 text-slate-300" />
                      )}

                      <button
                        onClick={() => handleRemove(p.id)}
                        disabled={removingId === p.id}
                        className="absolute top-2.5 right-2.5 p-2 bg-white/90 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-full shadow-md transition-colors"
                        title="Remove from favorites"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="absolute top-2.5 left-2.5">
                        <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-sm">
                          MOQ: {p.minOrderQuantity} {p.wholesaleUnit.toLowerCase()}s
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span className="truncate">{p.category?.name || 'Wholesale'}</span>
                        {p.business?.isVerified && (
                          <span className="flex items-center gap-0.5 text-emerald-700 font-semibold">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Verified</span>
                          </span>
                        )}
                      </div>

                      <Link href={`/products/${p.slug}`}>
                        <h3 className="font-bold text-slate-900 text-sm hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
                          {p.name}
                        </h3>
                      </Link>

                      <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{p.business?.name}</span>
                        {p.business?.subCity && (
                          <span className="text-[10px] text-slate-400">({p.business.subCity})</span>
                        )}
                      </div>

                      <div className="mt-3">
                        <span className="text-[10px] text-slate-400 block uppercase font-medium">
                          Starting Tier
                        </span>
                        <div className="text-sm font-extrabold text-emerald-800">
                          {lowestPrice ? `${lowestPrice.toLocaleString()} ETB` : 'Contact for Price'}
                          <span className="text-[10px] text-slate-500 font-normal ml-0.5">
                            /{p.wholesaleUnit.toLowerCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    <Link
                      href={`/products/${p.slug}`}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-600 hover:text-white rounded-lg transition-colors"
                    >
                      <span>View Pricing & Order</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
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
