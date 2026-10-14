'use client';

import React, { useState, useEffect } from 'react';
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
  Package,
  ArrowRight,
  Search,
  Loader2,
} from 'lucide-react';

export default function SuppliersPage() {
  const [locale, setLocale] = useState<Locale>('en');
  const t = getTranslations(locale);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const res = await catalogService.getSuppliers({ search });
        if (res.success && res.data) {
          setSuppliers(res.data);
        }
      } catch (err) {
        console.error('Failed to load suppliers:', err);
      } finally {
        setIsLoading(false);
      }
    }

    const timer = setTimeout(() => {
      load();
    }, 200);

    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header locale={locale} onLocaleChange={setLocale} t={t} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <nav className="text-xs text-slate-500 mb-2 flex items-center gap-1.5">
            <Link href="/" className="hover:text-emerald-700">Home</Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Suppliers Directory</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Verified Ethiopian Suppliers
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Connect directly with audited manufacturers, primary importers, and authorized distributors in Addis Ababa.
          </p>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-8 max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by company name or product line..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-slate-900"
            />
          </div>
        </div>

        {/* Supplier Cards */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-700 mb-2" />
            <span className="text-sm font-medium">Loading verified suppliers...</span>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-md mx-auto my-8">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No suppliers found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Check back soon as new verified suppliers complete our administrative verification review.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md transition group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-xl shadow-xs">
                      {supplier.name.charAt(0)}
                    </div>
                    {supplier.isVerified && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verified
                      </span>
                    )}
                  </div>

                  <Link href={`/suppliers/${supplier.slug}`}>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition leading-snug">
                      {supplier.name}
                    </h3>
                  </Link>

                  <div className="mt-2 space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{supplier.city}{supplier.subCity ? `, ${supplier.subCity}` : ''}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span className="capitalize">{supplier.businessType.toLowerCase()}</span>
                    </div>

                    {supplier.supplierProfile?.establishedYear && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Est. {supplier.supplierProfile.establishedYear}</span>
                      </div>
                    )}
                  </div>

                  <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {supplier.description || 'Verified manufacturer and bulk commercial wholesale distributor.'}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">
                    {supplier._count?.products || 0} Listed Products
                  </span>
                  <Link
                    href={`/suppliers/${supplier.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                  >
                    <span>View Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer t={t} />
    </div>
  );
}
