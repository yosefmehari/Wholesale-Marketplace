'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Locale, getTranslations } from '@/lib/i18n';
import { useAuth } from '@/context/auth-context';
import {
  settlementService,
  SupplierSettlement,
  SettlementsResponse,
} from '@/services/settlement.service';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  ChevronRight,
  Building2,
  FileText,
} from 'lucide-react';

const STATUS_TABS = [
  { key: 'ALL', label: 'All Settlements' },
  { key: 'CALCULATED', label: 'Calculated / Due' },
  { key: 'PAID', label: 'Paid Out' },
  { key: 'PENDING', label: 'Pending Processing' },
];

export default function SupplierSettlementsPage() {
  const [locale, setLocale] = useState<Locale>('en');
  const t = getTranslations(locale);
  const { user, isLoading: authLoading } = useAuth();

  const [settlements, setSettlements] = useState<SupplierSettlement[]>([]);
  const [summary, setSummary] = useState<{ totalPendingPayout: number; totalCommissionDeducted: number }>({
    totalPendingPayout: 0,
    totalCommissionDeducted: 0,
  });
  const [activeStatus, setActiveStatus] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);

  const loadSettlements = async () => {
    setIsLoading(true);
    try {
      const res = await settlementService.getSupplierSettlements({
        status: activeStatus === 'ALL' ? undefined : activeStatus,
        page,
        limit: 10,
      });

      if (res.success && res.data) {
        setSettlements(res.data.settlements);
        setSummary(res.data.summary);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Failed to load supplier settlements:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      loadSettlements();
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [authLoading, user, activeStatus, page]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header locale={locale} onLocaleChange={setLocale} t={t} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb / Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link href="/supplier/dashboard" className="hover:text-emerald-700 transition">
                Supplier Portal
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-bold">Settlements & Payouts</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Supplier Settlements Ledger
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Automated platform commission deduction (3.0%) and supplier payout reconciliation in Ethiopian Birr (ETB).
            </p>
          </div>

          <Link
            href="/supplier/orders"
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition"
          >
            <Receipt className="w-4 h-4 text-slate-500" />
            <span>Fulfillment Orders</span>
          </Link>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 block">Pending Payout Balance</span>
              <span className="text-xl font-black text-slate-900 font-mono">
                {summary.totalPendingPayout.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 block">WholesaleHub Platform Fee</span>
              <span className="text-xl font-black text-slate-900 font-mono">
                3.00% <span className="text-xs text-slate-400 font-normal">Fixed B2B</span>
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 block">Total Commission Deducted</span>
              <span className="text-xl font-black text-slate-900 font-mono">
                {summary.totalCommissionDeducted.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB
              </span>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6 overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveStatus(tab.key);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeStatus === tab.key
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Settlements Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
            </div>
          ) : settlements.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No Settlements Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Settlements are generated automatically when wholesale orders are marked confirmed or delivered.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Settlement #</th>
                    <th className="py-3 px-4">Order Ref</th>
                    <th className="py-3 px-4 text-right">Gross Total</th>
                    <th className="py-3 px-4 text-right">Fee (3%)</th>
                    <th className="py-3 px-4 text-right">Net Payout</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Payout Reference</th>
                    <th className="py-3 px-4 text-right">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {settlements.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {s.settlementNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/orders/${s.orderId}`}
                          className="font-mono text-emerald-700 hover:underline font-bold inline-flex items-center gap-1"
                        >
                          <span>{s.order?.orderNumber || 'Order Details'}</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-700">
                        {s.grossOrderAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-rose-600 font-medium">
                        -{s.commissionAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-800">
                        {s.netPayoutAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            s.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : s.status === 'CALCULATED'
                              ? 'bg-blue-100 text-blue-800'
                              : s.status === 'WITHHELD'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {s.payoutReference || <span className="text-slate-400 italic">Pending Transfer</span>}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/orders/${s.orderId}/invoice`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg font-bold text-[11px] border border-slate-200 transition"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Invoice</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer t={t} />
    </div>
  );
}
