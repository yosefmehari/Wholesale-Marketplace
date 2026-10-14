'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Locale, getTranslations } from '@/lib/i18n';

export default function PrivacyPage() {
  const [locale, setLocale] = useState<Locale>('en');
  const t = getTranslations(locale);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header locale={locale} onLocaleChange={setLocale} t={t} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <h1 className="text-2xl font-extrabold text-slate-900">
            Privacy & Business Data Protection Policy
          </h1>
          <p className="text-xs text-slate-400">Last updated: October 2026 • Addis Ababa, Ethiopia</p>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">1. Information Collection</h2>
            <p>
              WholesaleHub Ethiopia collects information necessary to execute commercial wholesale trade, including representative contact details, enterprise registration information, physical warehouse locations, and transaction records.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">2. Confidential Commercial Documents</h2>
            <p>
              Business verification documents—such as tax identification certificates, audited bank details, and trade licenses—are encrypted and stored in private access-controlled storage. They are never published to public buyer-facing pages.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">3. Negotiation Privacy</h2>
            <p>
              Quotation revisions, bespoke pricing discussions, and target price negotiation logs between buyers and suppliers remain strictly private to the authorized participants of the quotation thread.
            </p>
          </section>
        </div>
      </main>

      <Footer t={t} />
    </div>
  );
}
