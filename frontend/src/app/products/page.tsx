'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Locale, getTranslations } from '@/lib/i18n';
import { catalogService, Product, Category } from '@/services/catalog.service';
import { favoriteService } from '@/services/favorite.service';
import { useAuth } from '@/context/auth-context';
import {
  Search,
  Filter,
  ShieldCheck,
  Tag,
  Building2,
  Package,
  ArrowRight,
  Loader2,
  Heart,
  SlidersHorizontal,
  RotateCcw,
  MapPin,
} from 'lucide-react';

const ADDIS_SUB_CITIES = [
  'Addis Ketema (Merkato)',
  'Bole',
  'Kirkos',
  'Akaki Kality',
  'Nifas Silk-Lafto',
  'Yeka',
  'Arada',
  'Gulele',
  'Lideta',
  'Kolfe Keranio',
  'Lemi Kura',
];

const WHOLESALE_UNITS = [
  { value: 'CARTON', label: 'Carton' },
  { value: 'BOX', label: 'Box' },
  { value: 'BAG', label: 'Bag' },
  { value: 'KILOGRAM', label: 'Kilogram (kg)' },
  { value: 'PIECE', label: 'Piece' },
  { value: 'LITER', label: 'Liter' },
];

export default function ProductsPage() {
  const [locale, setLocale] = useState<Locale>('en');
  const t = getTranslations(locale);
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [subCity, setSubCity] = useState('');
  const [unit, setUnit] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [maxMoq, setMaxMoq] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  // Favorites state
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());
  const [isTogglingFav, setIsTogglingFav] = useState<string | null>(null);

  // Load favorites if user logged in
  useEffect(() => {
    if (user) {
      favoriteService.getFavorites().then((res) => {
        if (res.success && res.data) {
          const ids = new Set(res.data.map((f) => f.productId));
          setFavoritedIds(ids);
        }
      });
    }
  }, [user]);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const queryParams: Record<string, string> = {
          sortBy,
        };
        if (search.trim()) queryParams.search = search.trim();
        if (selectedCategory) queryParams.category = selectedCategory;
        if (subCity) {
          // clean the display name e.g. "Addis Ketema (Merkato)" -> "Addis Ketema"
          const cleanSubCity = subCity.split('(')[0].trim();
          queryParams.subCity = cleanSubCity;
        }
        if (unit) queryParams.unit = unit;
        if (minPrice) queryParams.minPrice = minPrice;
        if (maxPrice) queryParams.maxPrice = maxPrice;
        if (maxMoq) queryParams.maxMoq = maxMoq;
        if (inStockOnly) queryParams.inStock = 'true';

        const [prodRes, catRes] = await Promise.all([
          catalogService.getProducts(queryParams),
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
    }, 250);

    return () => clearTimeout(timer);
  }, [search, selectedCategory, subCity, unit, minPrice, maxPrice, maxMoq, inStockOnly, sortBy]);

  const handleToggleFavorite = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert('Please log in as a buyer to save favorite items.');
      return;
    }

    setIsTogglingFav(productId);
    const isCurrentlyFav = favoritedIds.has(productId);

    try {
      if (isCurrentlyFav) {
        await favoriteService.removeFavorite(productId);
        setFavoritedIds((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      } else {
        await favoriteService.addFavorite(productId);
        setFavoritedIds((prev) => {
          const next = new Set(prev);
          next.add(productId);
          return next;
        });
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    } finally {
      setIsTogglingFav(null);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSubCity('');
    setUnit('');
    setMinPrice('');
    setMaxPrice('');
    setMaxMoq('');
    setInStockOnly(false);
    setSortBy('newest');
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header locale={locale} onLocaleChange={setLocale} t={t} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb & Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
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

          {user && (
            <Link
              href="/favorites"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors self-start sm:self-auto"
            >
              <Heart className="w-4 h-4 fill-rose-600 text-rose-600" />
              <span>Saved Favorites ({favoritedIds.size})</span>
            </Link>
          )}
        </div>

        {/* Search & Top Controls */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
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
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="font-medium text-slate-500">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="py-2 px-3 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-800 font-medium"
              >
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="moq_asc">Lowest MOQ First</option>
                <option value="name_asc">Product Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Layout: Sidebar Filters + Products Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filter Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                  <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                  <span>Filter Products</span>
                </div>
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-slate-400 hover:text-emerald-700 flex items-center gap-1 transition-colors"
                  title="Reset all filters"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-800"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Addis Ababa Sub-City */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Location (Addis Ababa)</span>
                </label>
                <select
                  value={subCity}
                  onChange={(e) => setSubCity(e.target.value)}
                  className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-800"
                >
                  <option value="">All Addis Ababa</option>
                  {ADDIS_SUB_CITIES.map((sc) => (
                    <option key={sc} value={sc}>
                      {sc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Wholesale Unit */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Wholesale Unit
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-800"
                >
                  <option value="">All Units</option>
                  {WHOLESALE_UNITS.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range (ETB) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Price Range (ETB)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="Min ETB"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-900"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Max ETB"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-900"
                  />
                </div>
              </div>

              {/* Max MOQ */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Maximum MOQ
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 50 cartons"
                  value={maxMoq}
                  onChange={(e) => setMaxMoq(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-900"
                />
              </div>

              {/* In-Stock Toggle */}
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span>In Stock Only</span>
                </label>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
                <p className="text-sm font-medium text-slate-600">Filtering products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300 p-8">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">No wholesale products found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                  We could not find any products matching your specific search filters. Try widening your criteria or resetting filters.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            ) : (
              <div>
                <div className="text-xs font-semibold text-slate-500 mb-4 flex items-center justify-between">
                  <span>Showing {products.length} wholesale listings</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((p) => {
                    const primaryImage = p.images?.find((img) => img.isPrimary) || p.images?.[0];
                    const lowestPrice = p.priceTiers && p.priceTiers.length > 0
                      ? Math.min(...p.priceTiers.map((t) => t.unitPrice))
                      : null;
                    const highestPrice = p.priceTiers && p.priceTiers.length > 0
                      ? Math.max(...p.priceTiers.map((t) => t.unitPrice))
                      : null;
                    const isFavorited = favoritedIds.has(p.id);

                    return (
                      <div
                        key={p.id}
                        className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col group relative"
                      >
                        {/* Image & Favorite Button */}
                        <div className="h-44 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                          {primaryImage ? (
                            <img
                              src={primaryImage.url}
                              alt={primaryImage.altText || p.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <Package className="w-10 h-10 text-slate-300" />
                          )}

                          <button
                            type="button"
                            onClick={(e) => handleToggleFavorite(e, p.id)}
                            disabled={isTogglingFav === p.id}
                            className={`absolute top-2.5 right-2.5 p-2 rounded-full shadow-md backdrop-blur-xs transition-transform active:scale-90 ${
                              isFavorited
                                ? 'bg-rose-500 text-white'
                                : 'bg-white/90 text-slate-400 hover:text-rose-500 hover:bg-white'
                            }`}
                            title={isFavorited ? 'Remove from favorites' : 'Save to favorites'}
                          >
                            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-white' : ''}`} />
                          </button>

                          <div className="absolute top-2.5 left-2.5">
                            <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-sm">
                              MOQ: {p.minOrderQuantity} {p.wholesaleUnit.toLowerCase()}s
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                              <span className="truncate">{p.category?.name || 'General'}</span>
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
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-slate-400 block uppercase font-medium">
                                Wholesale Tier
                              </span>
                              <div className="text-sm font-extrabold text-emerald-800">
                                {lowestPrice ? (
                                  lowestPrice === highestPrice ? (
                                    <span>{lowestPrice.toLocaleString()} ETB</span>
                                  ) : (
                                    <span>
                                      {lowestPrice.toLocaleString()} – {highestPrice?.toLocaleString()} ETB
                                    </span>
                                  )
                                ) : (
                                  <span>Inquire for Price</span>
                                )}
                                <span className="text-[10px] text-slate-500 font-normal ml-0.5">
                                  /{p.wholesaleUnit.toLowerCase()}
                                </span>
                              </div>
                            </div>

                            <Link
                              href={`/products/${p.slug}`}
                              className="p-2 bg-emerald-50 text-emerald-800 rounded-lg hover:bg-emerald-600 hover:text-white transition-colors"
                              title="View Wholesale Pricing Details"
                            >
                              <ArrowRight className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer t={t} />
    </div>
  );
}
