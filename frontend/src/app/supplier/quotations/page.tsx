'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Locale, getTranslations } from '@/lib/i18n';
import { quotationService, QuotationRequest, QuotationStatus } from '@/services/quotation.service';
import { useAuth } from '@/context/auth-context';
import {
  FileText,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  XCircle,
  RotateCcw,
} from 'lucide-react';

export default function SupplierQuotationsPage() {
  const [locale, setLocale] = useState<Locale>('en');
  const t = getTranslations(locale);
  const { user, isLoading: authLoading } = useAuth();

  const [rfqs, setRfqs] = useState<QuotationRequest[]>([]);
  const [activeStatus, setActiveStatus] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);

  const loadRfqs = async () => {
    setIsLoading(true);
    try {
      const res = await quotationService.getRfqs({
        role: 'supplier',
        status: activeStatus === 'ALL' ? undefined : activeStatus,
        page,
        limit: 10,
      });

      if (res.success && res.data) {
        setRfqs(res.data.rfqs);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Failed to load supplier RFQs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      loadRfqs();
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [user, authLoading, activeStatus, page]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header locale={locale} onLocaleChange={setLocale} t={t} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-7 h-7 text-emerald-700" />
              <span>Supplier RFQ Portal</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Review custom procurement requests from commercial buyers and submit competitive bulk quotes
            </p>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 scrollbar-none border-b border-slate-200">
          {[
            { label: 'All RFQs', value: 'ALL' },
            { label: 'Action Required', value: 'PENDING_SUPPLIER_REVIEW' },
            { label: 'Revision Requested', value: 'BUYER_REVISION_REQUESTED' },
            { label: 'Proposals Submitted', value: 'SUBMITTED' },
            { label: 'Converted to Orders', value: 'CONVERTED_TO_ORDER' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setActiveStatus(tab.value);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                activeStatus === tab.value
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
          </div>
        )}

        {!isLoading && rfqs.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto my-12 shadow-xs">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h2 className="text-base font-bold text-slate-900">No quotation requests found</h2>
            <p className="text-xs text-slate-500 mt-1">
              {activeStatus === 'ALL'
                ? 'Your business has not received any RFQs yet.'
                : `No quotation requests matching status "${activeStatus.replace(/_/g, ' ')}".`}
            </p>
          </div>
        )}

        {!isLoading && rfqs.length > 0 && (
          <div className="space-y-4">
            {rfqs.map((rfq) => {
              const latestQuote = rfq.quotations?.[0];

              return (
                <div
                  key={rfq.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-sm sm:text-base font-extrabold text-slate-900">
                        {rfq.rfqNumber}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800">
                        {rfq.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(rfq.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-5 text-xs">
                      <h3 className="font-bold text-sm text-slate-900 mb-0.5">{rfq.title}</h3>
                      <div className="flex items-center gap-1 text-slate-600">
                        <Building2 className="w-3 h-3 text-emerald-700" />
                        <span>Buyer: {rfq.buyerBusiness?.name || 'Commercial Buyer'}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Target Destination: {rfq.deliveryLocation}
                      </div>
                    </div>

                    <div className="md:col-span-4 text-xs">
                      {latestQuote && (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Offered Amount (v{latestQuote.versionNumber})
                          </span>
                          <span className="font-extrabold text-sm text-emerald-800 font-mono">
                            {latestQuote.totalPrice.toLocaleString()} ETB
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-3 flex justify-start md:justify-end">
                      <Link
                        href={`/supplier/quotations/${rfq.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
                      >
                        <span>{rfq.status === 'PENDING_SUPPLIER_REVIEW' ? 'Submit Quote' : 'View Quote'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
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
