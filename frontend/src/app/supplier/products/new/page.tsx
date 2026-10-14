'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Locale, getTranslations } from '@/lib/i18n';
import { useAuth } from '@/context/auth-context';
import { supplierService } from '@/services/supplier.service';
import { catalogService, Category } from '@/services/catalog.service';
import { WholesaleUnit } from '@/types';
import {
  Package,
  Plus,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
} from 'lucide-react';

interface TierInput {
  minQuantity: number;
  maxQuantity: number | null;
  unitPrice: number;
}

export default function NewProductPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const [locale, setLocale] = useState<Locale>('en');
  const t = getTranslations(locale);

  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [sku, setSku] = useState('');
  const [brand, setBrand] = useState('');
  const [wholesaleUnit, setWholesaleUnit] = useState<WholesaleUnit>('CARTON');
  const [minOrderQuantity, setMinOrderQuantity] = useState(5);
  const [leadTimeDays, setLeadTimeDays] = useState(2);
  const [initialStock, setInitialStock] = useState(100);
  const [imageUrl, setImageUrl] = useState('');

  // Dynamic price tiers
  const [priceTiers, setPriceTiers] = useState<TierInput[]>([
    { minQuantity: 5, maxQuantity: 19, unitPrice: 1500 },
    { minQuantity: 20, maxQuantity: 49, unitPrice: 1400 },
    { minQuantity: 50, maxQuantity: null, unitPrice: 1300 },
  ]);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    async function loadCategories() {
      const res = await catalogService.getCategories();
      if (res.success && res.data) {
        setCategories(res.data);
        if (res.data[0]) {
          setCategoryId(res.data[0].id);
        }
      }
    }
    loadCategories();
  }, [authLoading, isAuthenticated, router]);

  const addTier = () => {
    const lastTier = priceTiers[priceTiers.length - 1];
    const newMin = lastTier ? (lastTier.maxQuantity ? lastTier.maxQuantity + 1 : lastTier.minQuantity + 20) : 1;
    setPriceTiers([...priceTiers, { minQuantity: newMin, maxQuantity: null, unitPrice: 1000 }]);
  };

  const removeTier = (index: number) => {
    if (priceTiers.length <= 1) return;
    setPriceTiers(priceTiers.filter((_, i) => i !== index));
  };

  const updateTier = (index: number, field: keyof TierInput, value: number | null) => {
    const updated = [...priceTiers];
    updated[index] = { ...updated[index], [field]: value };
    setPriceTiers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await supplierService.createProduct(accessToken, {
        name,
        categoryId,
        description,
        sku: sku || undefined,
        brand: brand || undefined,
        wholesaleUnit,
        minOrderQuantity,
        leadTimeDays,
        initialStock,
        imageUrl: imageUrl || undefined,
        priceTiers,
      });

      if (res.success) {
        router.push('/supplier/products');
      } else {
        setError(res.error?.message || 'Failed to list product.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header locale={locale} onLocaleChange={setLocale} t={t} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="text-xs text-slate-500 mb-4 flex items-center gap-1.5">
          <Link href="/supplier/products" className="hover:text-emerald-700 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Products</span>
          </Link>
        </nav>

        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Create New Wholesale Product
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Define wholesale specifications, minimum order quantity, and quantity-based volume discount tiers.
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3.5 border border-red-200 flex items-start gap-2.5 text-xs text-red-700 mb-6">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 text-xs">
            {/* General Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Pure Sunflower Cooking Oil (Jerrycan 20L)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catalog Category</label>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Wholesale Packaging Unit</label>
                <select
                  value={wholesaleUnit}
                  onChange={(e) => setWholesaleUnit(e.target.value as WholesaleUnit)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium"
                >
                  <option value="CARTON">CARTON</option>
                  <option value="BOX">BOX</option>
                  <option value="BAG">BAG (Quintal / 50kg)</option>
                  <option value="KILOGRAM">KILOGRAM</option>
                  <option value="LITER">LITER</option>
                  <option value="PIECE">PIECE</option>
                  <option value="SET">SET</option>
                  <option value="DOZEN">DOZEN</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Minimum Order Quantity (MOQ)</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={minOrderQuantity}
                  onChange={(e) => setMinOrderQuantity(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lead Time (Business Days)</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={leadTimeDays}
                  onChange={(e) => setLeadTimeDays(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">SKU / Code (Optional)</label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g. OIL-SNF-20L"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Brand Name (Optional)</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Abyssinia Gold"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Product Description & Specs</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed commercial description, origin, grade, packaging dimensions, purity, etc."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                ></textarea>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Initial Stock (Units)</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={initialStock}
                  onChange={(e) => setInitialStock(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>

            {/* WHOLESALE TIER BUILDER */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-emerald-700" />
                  <h3 className="text-sm font-bold text-slate-900">Wholesale Quantity Price Tiers</h3>
                </div>
                <button
                  type="button"
                  onClick={addTier}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Tier</span>
                </button>
              </div>

              <div className="space-y-3">
                {priceTiers.map((tier, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center gap-3"
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500 font-medium">Min Qty:</span>
                      <input
                        type="number"
                        min={1}
                        value={tier.minQuantity}
                        onChange={(e) => updateTier(idx, 'minQuantity', parseInt(e.target.value, 10) || 1)}
                        className="w-20 px-2 py-1 text-xs border border-slate-300 rounded font-bold"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-slate-500 font-medium">Max Qty:</span>
                      <input
                        type="number"
                        min={tier.minQuantity}
                        value={tier.maxQuantity ?? ''}
                        onChange={(e) =>
                          updateTier(idx, 'maxQuantity', e.target.value ? parseInt(e.target.value, 10) : null)
                        }
                        placeholder="Unlimited (+)"
                        className="w-28 px-2 py-1 text-xs border border-slate-300 rounded"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-slate-500 font-medium">Unit Price (ETB):</span>
                      <input
                        type="number"
                        min={1}
                        value={tier.unitPrice}
                        onChange={(e) => updateTier(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-28 px-2 py-1 text-xs border border-slate-300 rounded font-extrabold text-emerald-800"
                      />
                    </div>

                    {priceTiers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTier(idx)}
                        className="p-1 text-slate-400 hover:text-red-600 transition ml-auto"
                        title="Remove tier"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
              <Link
                href="/supplier/products"
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 font-medium text-xs transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-xs transition disabled:opacity-50"
              >
                {isSubmitting ? 'Publishing Product...' : 'Publish Wholesale Product'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer t={t} />
    </div>
  );
}
