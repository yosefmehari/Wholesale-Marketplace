'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Locale, getTranslations } from '@/lib/i18n';
import { useAuth } from '@/context/auth-context';
import { supplierService, SupplierDashboardData } from '@/services/supplier.service';
import {
  ShieldCheck,
  AlertTriangle,
  Package,
  Boxes,
  PlusCircle,
  FileCheck2,
  TrendingUp,
  ArrowRight,
  Building2,
  Loader2,
} from 'lucide-react';

export default function SupplierDashboardPage() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const [locale, setLocale] = useState<Locale>('en');
  const t = getTranslations(locale);

  const [data, setData] = useState<SupplierDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    async function loadDashboard() {
      if (!accessToken) return;
      setIsLoading(true);
      try {
        const res = await supplierService.getDashboard(accessToken);
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load supplier dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (accessToken) {
      loadDashboard();
    }
  }, [accessToken, isAuthenticated, authLoading, router]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header locale={locale} onLocaleChange={setLocale} t={t} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span>Supplier Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {data?.business?.name || 'Supplier Dashboard'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage your wholesale product catalog, tier pricing, inventory stock, and verification.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/supplier/products/new"
              className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-xs transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>List New Product</span>
            </Link>
          </div>
        </div>

        {/* Verification Status Alert Banner */}
        {data?.supplierProfile?.verificationStatus === 'PENDING' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-900">
                  Business Verification Pending
                </h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  Your commercial profile is awaiting administrative review. You can create product drafts, but they will be published publicly once verified.
                </p>
              </div>
            </div>
            <Link
              href="/supplier/verification"
              className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-lg shrink-0 transition"
            >
              Upload Verification Documents
            </Link>
          </div>
        )}

        {data?.supplierProfile?.verificationStatus === 'APPROVED' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-8 flex items-center gap-3 text-xs text-emerald-800">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              <strong>Verified Commercial Supplier:</strong> Your business credentials are approved for live wholesale trade in Addis Ababa.
            </span>
          </div>
        )}

        {/* Metric Cards */}
        {isLoading ? (
          <div className="py-16 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-700 mx-auto mb-2" />
            <span className="text-xs">Loading operational metrics...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Total Products</span>
                <Package className="w-5 h-5 text-slate-400" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {data?.stats?.totalProducts || 0}
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
                {data?.stats?.publishedProducts || 0} Published & Live
              </span>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Inventory In Stock</span>
                <Boxes className="w-5 h-5 text-slate-400" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {(data?.stats?.totalUnitsInStock || 0).toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Commercial wholesale units
              </span>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Low Stock Warnings</span>
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-700">
                {data?.stats?.lowStockAlerts || 0}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Below reorder thresholds
              </span>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Verification</span>
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-lg font-black text-slate-900 uppercase">
                {data?.supplierProfile?.verificationStatus || 'PENDING'}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {data?.business?.city || 'Addis Ababa'}
              </span>
            </div>
          </div>
        )}

        {/* Quick Access Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/supplier/products"
            className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-emerald-700/50 hover:shadow-md transition flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                <Package className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition">
                Manage Products & Tiers
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Add, edit, or archive product listings and configure volume price brackets.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-emerald-800">
              <span>View Product Catalog</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </Link>

          <Link
            href="/supplier/inventory"
            className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-emerald-700/50 hover:shadow-md transition flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
                <Boxes className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition">
                Inventory & Stock Management
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Update stock levels, set reorder alerts, and track reserved quantities.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-blue-800">
              <span>Manage Stock Levels</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </Link>

          <Link
            href="/supplier/verification"
            className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-emerald-700/50 hover:shadow-md transition flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-3">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-700 transition">
                Verification Documents
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Upload trade licenses, TIN certificates, and tax compliance documents.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-indigo-800">
              <span>Check Verification Status</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </Link>
        </div>
      </main>

      <Footer t={t} />
    </div>
  );
}
