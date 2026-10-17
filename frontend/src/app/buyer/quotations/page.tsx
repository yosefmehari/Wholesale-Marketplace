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
  Plus,
  Loader2,
  ShieldCheck,
  XCircle,
  RotateCcw,
} from 'lucide-react';

const STATUS_TABS: Array<{ label: string; value: string }> = [
  { label: 'All Requests', value: 'ALL' },
  { label: 'Pending Supplier', value: 'PENDING_SUPPLIER_REVIEW' },
  { label: 'Offers Received', value: 'SUBMITTED' },
  { label: 'Revision In Progress', value: 'BUYER_REVISION_REQUESTED' },
  { label: 'Converted to Orders', value: 'CONVERTED_TO_ORDER' },
  { label: 'Declined', value: 'DECLINED' },
];

export default function BuyerQuotationsPage() {
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
        role: 'buyer',
        status: activeStatus === 'ALL' ? undefined : activeStatus,
        page,
        limit: 10,
      });

      if (res.success && res.data) {
        setRfqs(res.data.rfqs);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Failed to load RFQs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        loadRfqs();
      } else {
        setIsLoading(false);
      }
    }
  }, [user, authLoading, activeStatus, page]);

  const getStatusBadge = (status: QuotationStatus) => {
    switch (status) {
      case 'PENDING_SUPPLIER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3" />
            <span>Pending Supplier</span>
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            <span>Formal Offer Received</span>
          </span>
        );
      case 'BUYER_REVISION_REQUESTED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
            <RotateCcw className="w-3 h-3" />
            <span>Revision Requested</span>
          </span>
        );
      case 'ACCEPTED':
      case 'CONVERTED_TO_ORDER':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800">
            <CheckCircle2 className="w-3 h-3" />
            <span>Order Generated</span>
          </span>
        );
      case 'DECLINED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
            <XCircle className="w-3 h-3" />
            <span>Declined</span>
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
            <AlertCircle className="w-3 h-3" />
            <span>Expired</span>
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header locale={locale} onLocaleChange={setLocale} t={t} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-7 h-7 text-emerald-700" />
              <span>Quotation Requests (RFQs)</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Commercial custom wholesale pricing proposals, negotiation revisions, and binding agreements
            </p>
          </div>

          <Link
            href="/buyer/quotations/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Request New Quotation</span>
          </Link>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 scrollbar-none border-b border-slate-200">
          {STATUS_TABS.map((tab) => (
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

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && rfqs.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto my-12 shadow-xs">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h2 className="text-base font-bold text-slate-900">No quotation requests found</h2>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Request tailored wholesale offers directly from verified suppliers in Ethiopia.
            </p>
            <Link
              href="/buyer/quotations/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white font-bold text-xs rounded-xl hover:bg-emerald-800 transition"
            >
              <span>Submit Your First RFQ</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* RFQs List */}
        {!isLoading && rfqs.length > 0 && (
          <div className="space-y-4">
            {rfqs.map((rfq) => {
              const latestQuote = rfq.quotations?.[0];

              return (
                <div
                  key={rfq.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-sm sm:text-base font-extrabold text-slate-900">
                        {rfq.rfqNumber}
                      </span>
                      {getStatusBadge(rfq.status)}
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(rfq.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="py-3 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-5">
                      <h3 className="font-bold text-sm text-slate-900 mb-1">{rfq.title}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{rfq.supplierBusiness?.name}</span>
                        {rfq.supplierBusiness?.isVerified && (
                          <ShieldCheck className="w-3 h-3 text-emerald-700" />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Destination: {rfq.deliveryLocation}
                      </div>
                    </div>

                    <div className="md:col-span-4 text-xs">
                      {latestQuote ? (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Latest Proposal (v{latestQuote.versionNumber})
                          </span>
                          <div className="font-extrabold text-sm text-emerald-800 font-mono mt-0.5">
                            {latestQuote.totalPrice > 0
                              ? `${latestQuote.totalPrice.toLocaleString()} ETB`
                              : 'Pending Supplier Pricing'}
                          </div>
                          <span className="text-[11px] text-slate-500">
                            {latestQuote.items?.length || 0} line item(s) • Valid until{' '}
                            {new Date(latestQuote.validUntil).toLocaleDateString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Awaiting initial offer</span>
                      )}
                    </div>

                    <div className="md:col-span-3 flex justify-start md:justify-end">
                      <Link
                        href={`/buyer/quotations/${rfq.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
                      >
                        <span>Review & Negotiate</span>
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
