'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Locale, getTranslations } from '@/lib/i18n';
import { catalogService, Supplier } from '@/services/catalog.service';
import {
  ShieldCheck,
  Building2,
  MapPin,
  Calendar,
  Phone,
  Mail,
  Truck,
  Package,
  ArrowRight,
  ArrowLeft,
  FileText,
  Loader2,
} from 'lucide-react';

export default function SupplierDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const [locale, setLocale] = useState<Locale>('en');
  const t = getTranslations(locale);

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const res = await catalogService.getSupplierBySlug(resolvedParams.slug);
        if (res.success && res.data) {
          setSupplier(res.data);
        }
      } catch (err) {
        console.error('Failed to load supplier details:', err);
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

  if (!supplier) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Header locale={locale} onLocaleChange={setLocale} t={t} />
        <main className="flex-1 max-w-7xl mx-auto px-4 py-16 text-center">
          <h2 className="text-xl font-bold text-slate-800">Supplier Not Found</h2>
          <Link
            href="/suppliers"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Supplier Directory</span>
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
        <nav className="text-xs text-slate-500 mb-6 flex items-center gap-1.5">
          <Link href="/" className="hover:text-emerald-700">Home</Link>
          <span>/</span>
          <Link href="/suppliers" className="hover:text-emerald-700">Suppliers</Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">{supplier.name}</span>
        </nav>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold text-2xl shadow-sm shrink-0">
                {supplier.name.charAt(0)}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                    {supplier.name}
                  </h1>
                  {supplier.isVerified && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Verified Commercial Profile
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {supplier.city}, {supplier.subCity || 'Addis Ababa'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {supplier.businessType}
                  </span>
                  {supplier.supplierProfile?.establishedYear && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Est. {supplier.supplierProfile.establishedYear}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/buyer/quotations/new?supplierId=${supplier.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                <FileText className="w-4 h-4" />
                <span>Request Quotation (RFQ)</span>
              </Link>
            </div>
          </div>

          <p className="mt-6 pt-6 border-t border-slate-100 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-4xl">
            {supplier.description ||
              'Verified Ethiopian wholesale manufacturer and commercial distributor operating in Addis Ababa.'}
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-6 border-t border-slate-100 text-xs text-slate-600">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block font-medium">Factory / Commercial Address:</span>
              <span className="font-semibold text-slate-800">{supplier.addressLine}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block font-medium">Delivery Terms:</span>
              <span className="font-semibold text-slate-800">
                {supplier.supplierProfile?.deliveryTerms || 'Pickup in Addis Ababa or negotiated commercial transport.'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block font-medium">Min. Commercial Order:</span>
              <span className="font-semibold text-slate-800">
                {supplier.supplierProfile?.minimumOrderAmount
                  ? `${Number(supplier.supplierProfile.minimumOrderAmount).toLocaleString()} ETB`
                  : 'Flexible based on MOQ'}
              </span>
            </div>
          </div>
        </div>

        {/* Supplier's Catalog */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">
            Published Wholesale Products ({supplier.products?.length || 0})
          </h2>

          {!supplier.products || supplier.products.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
              <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-xs">No products currently published by this supplier.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {supplier.products.map((product) => {
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
                        <span className="text-[11px] font-semibold text-emerald-800 block mb-1">
                          {product.category?.name}
                        </span>
                        <Link href={`/products/${product.slug}`}>
                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition line-clamp-2 leading-snug">
                            {product.name}
                          </h3>
                        </Link>
                      </div>

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
        </div>
      </main>

      <Footer t={t} />
    </div>
  );
}
