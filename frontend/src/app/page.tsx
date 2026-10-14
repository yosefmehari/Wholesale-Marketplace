'use client';

import React, { useState, useEffect } from 'react';
import { Locale, getTranslations } from '@/lib/i18n';
import { apiClient, ApiResponse } from '@/lib/api-client';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import {
  ShieldCheck,
  TrendingDown,
  FileCheck2,
  Truck,
  Search,
  CheckCircle2,
  AlertCircle,
  Activity,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface HealthData {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  defaultCurrency: string;
  timezone: string;
}

export default function HomePage() {
  const [locale, setLocale] = useState<Locale>('en');
  const [healthStatus, setHealthStatus] = useState<'loading' | 'online' | 'offline'>('loading');
  const [healthInfo, setHealthInfo] = useState<HealthData | null>(null);

  const t = getTranslations(locale);

  useEffect(() => {
    let isMounted = true;

    async function checkHealth() {
      try {
        const response: ApiResponse<HealthData> = await apiClient<HealthData>('/health');
        if (isMounted) {
          if (response.success && response.data) {
            setHealthStatus('online');
            setHealthInfo(response.data);
          } else {
            setHealthStatus('offline');
          }
        }
      } catch {
        if (isMounted) {
          setHealthStatus('offline');
        }
      }
    }

    checkHealth();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header locale={locale} onLocaleChange={setLocale} t={t} />

      <main className="flex-1">
        {/* System Health Status Banner */}
        <section className="bg-slate-100 border-b border-slate-200 py-2.5 px-4">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-500" />
              <span className="font-semibold text-slate-700">{t.systemHealth}:</span>
              {healthStatus === 'loading' && (
                <span className="inline-flex items-center gap-1.5 text-slate-500 font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  {t.connectingBackend}
                </span>
              )}
              {healthStatus === 'online' && (
                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {t.backendOnline} ({healthInfo?.service} v{healthInfo?.version} • {healthInfo?.environment})
                </span>
              )}
              {healthStatus === 'offline' && (
                <span className="inline-flex items-center gap-1.5 text-amber-800 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  {t.backendOffline} (Backend server not running on port 5000)
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-slate-500">
              <span>Currency: <strong className="text-slate-700 font-semibold">{healthInfo?.defaultCurrency || 'ETB'}</strong></span>
              <span>Timezone: <strong className="text-slate-700 font-semibold">{healthInfo?.timezone || 'Africa/Addis_Ababa'}</strong></span>
            </div>
          </div>
        </section>

        {/* Hero Section */}
        <section className="relative bg-gradient-to-b from-emerald-900 to-slate-900 text-white py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Wholesale Sourcing for Ethiopia & Addis Ababa</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
              {t.heroHeadline}
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              {t.heroSubtitle}
            </p>

            {/* Search Bar Preview */}
            <div className="mt-8 max-w-2xl mx-auto">
              <div className="relative flex items-center bg-white rounded-xl shadow-lg p-1.5 border border-slate-200">
                <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  className="w-full px-3 py-2 text-slate-800 placeholder-slate-400 text-sm focus:outline-none"
                  readOnly
                />
                <button className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition shrink-0">
                  {t.browseProducts}
                </button>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <button className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg text-sm font-semibold shadow-md transition">
                <span>{t.becomeSupplier}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-6 py-3 rounded-lg text-sm font-semibold border border-slate-700 transition">
                <span>{t.requestQuotation}</span>
              </button>
            </div>
          </div>
        </section>

        {/* Feature Pillars */}
        <section className="py-16 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Built specifically for Ethiopian B2B Trade
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Solving the wholesale fragmentation in Addis Ababa with transparent tier pricing, verified commercial profiles, and auditable procurement.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature 1 */}
              <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">
                  {t.verifiedSuppliers}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {t.verifiedSuppliersDesc}
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">
                  {t.tieredPricing}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {t.tieredPricingDesc}
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">
                  {t.secureSettlement}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {t.secureSettlementDesc}
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition">
                <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                  <Truck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">
                  {t.addisFulfillment}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {t.addisFulfillmentDesc}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer t={t} />
    </div>
  );
}
