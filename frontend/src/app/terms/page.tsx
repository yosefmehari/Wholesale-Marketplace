'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Locale, getTranslations } from '@/lib/i18n';

export default function TermsPage() {
  const [locale, setLocale] = useState<Locale>('en');
  const t = getTranslations(locale);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header locale={locale} onLocaleChange={setLocale} t={t} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <h1 className="text-2xl font-extrabold text-slate-900">
            Terms of Commercial Wholesale Service
          </h1>
          <p className="text-xs text-slate-400">Last updated: October 2026 • Addis Ababa, Ethiopia</p>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">1. Commercial Platform Scope</h2>
            <p>
              WholesaleHub Ethiopia provides a B2B platform connecting verified manufacturers, importers, distributors, and bulk retail buyers. All transactions conducted on the platform represent commercial wholesale orders subject to minimum order quantities (MOQ).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">2. Supplier Verification & Compliance</h2>
            <p>
              Suppliers must possess valid commercial registrations, taxpayer identification numbers (TIN), and required regulatory permits in the Federal Democratic Republic of Ethiopia. Submission of fraudulent documents results in immediate account termination.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">3. Tiered Pricing & Purchase Orders</h2>
            <p>
              Prices displayed in Ethiopian Birr (ETB) reflect quantity brackets established by suppliers. Upon confirmation of an order or agreed Request For Quotation (RFQ), agreed commercial terms are permanently locked and cannot be altered retroactively.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">4. Payment & Platform Settlements</h2>
            <p>
              Transactions are settled through authorized digital payment adapters (such as Telebirr), direct commercial bank wire transfers, or verified cash on delivery. Platform commissions are computed on eligible completed transactions.
            </p>
          </section>
        </div>
      </main>

      <Footer t={t} />
    </div>
  );
}
