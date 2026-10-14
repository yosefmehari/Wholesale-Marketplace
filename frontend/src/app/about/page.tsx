'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Locale, getTranslations } from '@/lib/i18n';
import { ShieldCheck, TrendingDown, Truck, Users, CheckCircle2, ArrowRight } from 'lucide-react';

export default function AboutPage() {
  const [locale, setLocale] = useState<Locale>('en');
  const t = getTranslations(locale);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header locale={locale} onLocaleChange={setLocale} t={t} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          <div>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest bg-emerald-100 px-3 py-1 rounded-full">
              About WholesaleHub
            </span>
            <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Transforming B2B Wholesale Commerce in Ethiopia
            </h1>
            <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
              WholesaleHub Ethiopia is an enterprise digital marketplace engineered to solve supply chain fragmentation across Addis Ababa and throughout Ethiopia. We connect verified manufacturers, primary importers, and authorized distributors directly with commercial buyers, cooperatives, and retailers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <ShieldCheck className="w-8 h-8 text-emerald-700 mb-3" />
              <h3 className="text-base font-bold text-slate-900 mb-1">Strict Business Verification</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Suppliers undergo administrative review of commercial registrations, TIN numbers, and factory licenses before receiving verified badges.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <TrendingDown className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="text-base font-bold text-slate-900 mb-1">Transparent Tiered Pricing</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Clear quantity breaks, published wholesale minimums (MOQ), and automated bulk savings ensure predictable procurement.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <Users className="w-8 h-8 text-indigo-600 mb-3" />
              <h3 className="text-base font-bold text-slate-900 mb-1">Formal Quotation Negotiation</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Auditable RFQ workflows allow buyers and suppliers to negotiate terms, lead times, and discounts with versioned history.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <Truck className="w-8 h-8 text-amber-600 mb-3" />
              <h3 className="text-base font-bold text-slate-900 mb-1">Addis Ababa & Regional Delivery</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Logistics configured for Ethiopian commercial hubs with clear delivery terms, dispatch tracking, and proof of receipt.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-emerald-800 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold">Ready to modernize your wholesale procurement?</h3>
              <p className="text-xs text-emerald-200 mt-1">
                Create a buyer account or register your factory as a verified supplier today.
              </p>
            </div>
            <Link
              href="/register"
              className="px-5 py-2.5 bg-white text-emerald-900 text-xs font-bold rounded-xl shadow-xs shrink-0 hover:bg-emerald-50 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </main>

      <Footer t={t} />
    </div>
  );
}
