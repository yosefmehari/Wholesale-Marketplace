'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Locale, getTranslations } from '@/lib/i18n';
import { orderService, Order, OrderStatus } from '@/services/order.service';
import { useAuth } from '@/context/auth-context';
import {
  Package,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  ShieldCheck,
  XCircle,
  Truck,
  Filter,
} from 'lucide-react';

const STATUS_TABS: Array<{ label: string; value: string }> = [
  { label: 'All Orders', value: 'ALL' },
  { label: 'Pending', value: 'PENDING_CONFIRMATION' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Shipped', value: 'SHIPPED' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export default function OrdersPage() {
  const [locale, setLocale] = useState<Locale>('en');
  const t = getTranslations(locale);
  const { user, isLoading: authLoading } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [activeStatus, setActiveStatus] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);

  // Cancellation dialog state
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const res = await orderService.getBuyerOrders({
        status: activeStatus === 'ALL' ? undefined : activeStatus,
        page,
        limit: 10,
      });

      if (res.success && res.data) {
        setOrders(res.data.orders);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        loadOrders();
      } else {
        setIsLoading(false);
      }
    }
  }, [user, authLoading, activeStatus, page]);

  const handleConfirmCancel = async () => {
    if (!cancellingOrder) return;
    setIsCancelling(true);
    setCancelError(null);
    try {
      const res = await orderService.cancelOrder(
        cancellingOrder.id,
        cancelReason.trim() || 'Procurement schedule change'
      );
      if (res.success) {
        setCancellingOrder(null);
        setCancelReason('');
        await loadOrders();
      } else {
        setCancelError(res.error?.message || 'Failed to cancel order');
      }
    } catch (err: any) {
      setCancelError(err.message || 'Error cancelling order');
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING_CONFIRMATION':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3" />
            <span>Pending Confirmation</span>
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
            <CheckCircle2 className="w-3 h-3" />
            <span>Supplier Confirmed</span>
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
            <Package className="w-3 h-3" />
            <span>Processing Stock</span>
          </span>
        );
      case 'READY_FOR_DISPATCH':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
            <Truck className="w-3 h-3" />
            <span>Ready for Dispatch</span>
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            <Truck className="w-3 h-3" />
            <span>In Transit</span>
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800">
            <CheckCircle2 className="w-3 h-3" />
            <span>Delivered & Verified</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
            <XCircle className="w-3 h-3" />
            <span>Cancelled</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
            <AlertCircle className="w-3 h-3" />
            <span>Supplier Declined</span>
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
              <Package className="w-7 h-7 text-emerald-700" />
              <span>Wholesale Orders</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Track and manage all purchase orders partitioned by verified suppliers
            </p>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition self-start sm:self-auto"
          >
            <span>New Bulk Order</span>
            <ArrowRight className="w-3.5 h-3.5" />
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
        {!isLoading && orders.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto my-12 shadow-xs">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h2 className="text-base font-bold text-slate-900">No orders found</h2>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              {activeStatus === 'ALL'
                ? "You haven't placed any wholesale orders yet."
                : `No orders matching status "${activeStatus.replace(/_/g, ' ')}".`}
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white font-bold text-xs rounded-xl hover:bg-emerald-800 transition"
            >
              <span>Explore Wholesale Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Orders list */}
        {!isLoading && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-sm sm:text-base font-extrabold text-slate-900">
                      {ord.orderNumber}
                    </span>
                    {getStatusBadge(ord.status)}
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(ord.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="py-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* Supplier info */}
                  <div className="md:col-span-4 text-xs">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">
                      Fulfilling Supplier
                    </span>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{ord.supplierBusiness?.name || 'Verified Supplier'}</span>
                      {ord.supplierBusiness?.isVerified && (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      )}
                    </div>
                    {ord.supplierBusiness?.subCity && (
                      <span className="text-slate-500 text-[11px] block mt-0.5">
                        {ord.supplierBusiness.subCity}, {ord.supplierBusiness.city}
                      </span>
                    )}
                  </div>

                  {/* Items snapshot */}
                  <div className="md:col-span-5 text-xs text-slate-600">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                      Ordered Line Items ({ord.items.length})
                    </span>
                    <div className="space-y-1">
                      {ord.items.slice(0, 2).map((item) => (
                        <div key={item.id} className="truncate">
                          <span className="font-semibold text-slate-800">{item.productName}</span>{' '}
                          <span className="text-slate-500">
                            ({item.quantity} {item.wholesaleUnit.toLowerCase()}s @ {item.unitPrice.toLocaleString()} ETB)
                          </span>
                        </div>
                      ))}
                      {ord.items.length > 2 && (
                        <span className="text-[11px] text-slate-400 font-medium">
                          + {ord.items.length - 2} more item(s)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Order Total & Details CTA */}
                  <div className="md:col-span-3 flex md:flex-col items-center md:items-end justify-between gap-3">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Order Total
                      </span>
                      <span className="text-base sm:text-lg font-black text-emerald-800 font-mono">
                        {ord.totalAmount.toLocaleString()} ETB
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {ord.status === 'PENDING_CONFIRMATION' && (
                        <button
                          onClick={() => setCancellingOrder(ord)}
                          className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg border border-rose-200 transition"
                        >
                          Cancel
                        </button>
                      )}

                      <Link
                        href={`/orders/${ord.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-xs text-slate-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Cancellation Confirmation Modal */}
        {cancellingOrder && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Cancel Wholesale Order?</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {cancellingOrder.orderNumber}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Cancelling this order will release the reserved wholesale inventory back to the supplier.
                This action is only available before the supplier confirms fulfillment.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cancellation Reason (Optional)
                </label>
                <textarea
                  rows={2}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Schedule adjustment or incorrect quantity"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              {cancelError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                  {cancelError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCancellingOrder(null);
                    setCancelError(null);
                  }}
                  disabled={isCancelling}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Keep Order
                </button>

                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={isCancelling}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  {isCancelling ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5" />
                  )}
                  <span>Confirm Cancellation</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer t={t} />
    </div>
  );
}
