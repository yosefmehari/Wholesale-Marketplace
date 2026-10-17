'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Locale, getTranslations } from '@/lib/i18n';
import { catalogService, Product } from '@/services/catalog.service';
import { cartService } from '@/services/cart.service';
import { useAuth } from '@/context/auth-context';
import {
  ShieldCheck,
  Building2,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ArrowLeft,
  ShoppingCart,
  FileText,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const [locale, setLocale] = useState<Locale>('en');
  const t = getTranslations(locale);

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [cartSuccess, setCartSuccess] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      setIsLoading(true);
      try {
        const res = await catalogService.getProductBySlug(resolvedParams.slug);
        if (res.success && res.data) {
          setProduct(res.data);
          setSelectedImage(res.data.images?.[0]?.url || '');
          setQuantity(res.data.minOrderQuantity || 1);
        }
      } catch (err) {
        console.error('Failed to load product details:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadProduct();
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

  if (!product) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Header locale={locale} onLocaleChange={setLocale} t={t} />
        <main className="flex-1 max-w-7xl mx-auto px-4 py-16 text-center">
          <h2 className="text-xl font-bold text-slate-800">Product Not Found</h2>
          <p className="text-xs text-slate-500 mt-2 mb-6">
            The requested wholesale product could not be located or has been archived.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Catalog</span>
          </Link>
        </main>
        <Footer t={t} />
      </div>
    );
  }

  // Calculate active price tier based on selected quantity
  const activeTier =
    product.priceTiers?.find((tier) => {
      if (tier.maxQuantity) {
        return quantity >= tier.minQuantity && quantity <= tier.maxQuantity;
      }
      return quantity >= tier.minQuantity;
    }) || product.priceTiers?.[0];

  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const unitPrice = activeTier ? Number(activeTier.unitPrice) : 0;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = async () => {
    if (!product) return;
    setIsAdding(true);
    setAddError(null);
    try {
      const res = await cartService.addToCart(product.id, quantity);
      if (res.success) {
        setCartSuccess(true);
        setTimeout(() => setCartSuccess(false), 3500);
      } else {
        setAddError(res.error?.message || 'Failed to add item to wholesale cart');
      }
    } catch (err: any) {
      setAddError(err.message || 'Please sign in to add items to your wholesale cart');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header locale={locale} onLocaleChange={setLocale} t={t} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-slate-500 mb-6 flex items-center gap-1.5">
          <Link href="/" className="hover:text-emerald-700">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-emerald-700">Products</Link>
          <span>/</span>
          <Link href={`/categories/${product.category.slug}`} className="hover:text-emerald-700">
            {product.category.name}
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold truncate max-w-xs">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-6 space-y-4">
            <div className="aspect-4/3 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex items-center justify-center p-4">
              <img
                src={selectedImage || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80'}
                alt={product.name}
                className="max-h-full max-w-full object-contain rounded-lg"
              />
            </div>

            {product.images && product.images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {product.images.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(img.url)}
                    className={`w-20 h-20 rounded-xl border bg-white overflow-hidden p-1 shrink-0 transition ${
                      selectedImage === img.url
                        ? 'border-emerald-700 ring-2 ring-emerald-700/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <img src={img.url} alt="thumbnail" className="w-full h-full object-cover rounded-lg" />
                  </button>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Product Specifications & Details
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
                <div>
                  <span className="text-slate-400 block font-medium">SKU:</span>
                  <span className="font-semibold text-slate-800">{product.sku || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Brand:</span>
                  <span className="font-semibold text-slate-800">{product.brand || 'Unbranded'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Packaging Unit:</span>
                  <span className="font-semibold text-slate-800">{product.wholesaleUnit}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Lead Time:</span>
                  <span className="font-semibold text-slate-800">{product.leadTimeDays} business days</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Pricing, Tiers, Quantity & CTAs */}
          <div className="lg:col-span-6 space-y-6">
            {/* Header info */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  {product.category.name}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500 font-medium">
                  MOQ: {product.minOrderQuantity} {product.wholesaleUnit.toLowerCase()}s
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
                {product.name}
              </h1>

              {/* Verified Supplier preview */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span>Supplier:</span>
                <Link
                  href={`/suppliers/${product.business.slug}`}
                  className="font-bold text-slate-800 hover:text-emerald-700 underline flex items-center gap-1"
                >
                  {product.business.name}
                  {product.business.isVerified && (
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                </Link>
                <span className="text-slate-400">({product.business.city})</span>
              </div>
            </div>

            {/* WHOLESALE TIER PRICING TABLE */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Wholesale Volume Pricing Tiers
                </h3>
                <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                  Currency: ETB
                </span>
              </div>

              <div className="overflow-hidden border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Order Quantity</th>
                      <th className="py-2.5 px-3">Unit Price (ETB)</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {product.priceTiers?.map((tier, idx) => {
                      const isCurrentActive = tier.id === activeTier?.id;
                      return (
                        <tr
                          key={tier.id || idx}
                          className={`transition ${
                            isCurrentActive
                              ? 'bg-emerald-50/60 font-semibold text-emerald-950'
                              : 'text-slate-700 hover:bg-slate-50/50'
                          }`}
                        >
                          <td className="py-2.5 px-3">
                            {tier.minQuantity}
                            {tier.maxQuantity ? ` – ${tier.maxQuantity}` : '+'} {product.wholesaleUnit.toLowerCase()}s
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold">
                            {Number(tier.unitPrice).toLocaleString()} ETB
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {isCurrentActive ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                                Active Tier
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Quantity selector & total calculator */}
              <div className="pt-2 border-t border-slate-100 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Purchase Quantity ({product.wholesaleUnit.toLowerCase()}s)
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQuantity(Math.max(product.minOrderQuantity, quantity - 1))}
                        className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={product.minOrderQuantity}
                        value={quantity}
                        onChange={(e) =>
                          setQuantity(Math.max(product.minOrderQuantity, parseInt(e.target.value, 10) || product.minOrderQuantity))
                        }
                        className="w-20 text-center py-1.5 px-2 text-sm font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-900"
                      />
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 block font-medium">Estimated Subtotal</span>
                    <div className="text-xl sm:text-2xl font-black text-emerald-800">
                      {totalPrice.toLocaleString()} ETB
                    </div>
                    <span className="text-[11px] text-slate-500">
                      @ {unitPrice.toLocaleString()} ETB / {product.wholesaleUnit.toLowerCase()}
                    </span>
                  </div>
                </div>

                {cartSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Item added to wholesale cart!</span>
                    </div>
                    <Link href="/cart" className="font-bold underline hover:text-emerald-950">
                      View Cart &rarr;
                    </Link>
                  </div>
                )}

                {addError && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{addError}</span>
                  </div>
                )}

                {/* CTAs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleAddToCart}
                    disabled={isAdding}
                    className="flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-bold py-3 px-4 rounded-xl text-sm shadow-sm transition"
                  >
                    {isAdding ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShoppingCart className="w-4 h-4" />
                    )}
                    <span>{isAdding ? 'Adding...' : 'Add to Wholesale Cart'}</span>
                  </button>

                  <Link
                    href={`/buyer/quotations/new?productId=${product.id}`}
                    className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-4 rounded-xl text-sm shadow-sm transition"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Request Quotation (RFQ)</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Supplier Trust & Delivery Policy */}
            <div className="bg-slate-100 p-5 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Truck className="w-4 h-4 text-emerald-700" />
                <span>Supplier Delivery & Payment Policy</span>
              </div>
              <p>
                {product.business.supplierProfile?.deliveryTerms ||
                  'Factory gate pickup in Addis Ababa or negotiated bulk logistics.'}
              </p>
              <p>
                <strong>Payment Terms:</strong>{' '}
                {product.business.supplierProfile?.paymentTerms || 'Telebirr, Bank Transfer, or Letter of Credit.'}
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer t={t} />
    </div>
  );
}
