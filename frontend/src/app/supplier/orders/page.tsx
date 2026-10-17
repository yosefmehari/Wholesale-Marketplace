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
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Loader2,
  XCircle,
  Building2,
  Phone,
  MapPin,
  ArrowRight,
} from 'lucide-react';

export default function SupplierOrdersPage() {
  const [locale, setLocale] = useState<Locale>('en');
  const t = getTranslations(locale);
  const { user, isLoading: authLoading } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [activeStatus, setActiveStatus] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const res = await orderService.getSupplierOrders({
        status: activeStatus === 'ALL' ? undefined : activeStatus,
        page,
        limit: 10,
      });

      if (res.success && res.data) {
        setOrders(res.data.orders);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Failed to load supplier orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      loadOrders();
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [user, authLoading, activeStatus, page]);

  const handleStatusTransition = async (orderId: string, nextStatus: OrderStatus, notes?: string) => {
    setActionLoadingId(orderId);
    try {
      const res = await orderService.updateOrderStatus(orderId, nextStatus, notes);
      if (res.success) {
        await loadOrders();
      } else {
        alert(res.error?.message || 'Failed to update order status');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating order');
    } finally {
      setActionLoadingId(null);
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
              <span>Supplier Fulfillment Portal</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Manage incoming commercial wholesale purchase orders, stock dispatch, and fulfillment verification
            </p>
          </div>

          <Link
            href="/supplier/inventory"
            className="text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl self-start sm:self-auto transition"
          >
            Manage Inventory
          </Link>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none border-b border-slate-200">
          {[
            { label: 'All Orders', value: 'ALL' },
            { label: 'Pending Confirmation', value: 'PENDING_CONFIRMATION' },
            { label: 'Confirmed', value: 'CONFIRMED' },
            { label: 'Processing', value: 'PROCESSING' },
            { label: 'Ready for Dispatch', value: 'READY_FOR_DISPATCH' },
            { label: 'In Transit', value: 'SHIPPED' },
            { label: 'Delivered', value: 'DELIVERED' },
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

        {!isLoading && orders.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto my-12 shadow-xs">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h2 className="text-base font-bold text-slate-900">No incoming orders found</h2>
            <p className="text-xs text-slate-500 mt-1">
              {activeStatus === 'ALL'
                ? 'Your business has not received any wholesale orders yet.'
                : `No orders currently in status "${activeStatus.replace(/_/g, ' ')}".`}
            </p>
          </div>
        )}

        {!isLoading && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((ord) => {
              const isActionLoading = actionLoadingId === ord.id;

              return (
                <div
                  key={ord.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-base font-extrabold text-slate-900">
                        {ord.orderNumber}
                      </span>
                      <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ${
                        ord.status === 'DELIVERED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ord.status === 'PENDING_CONFIRMATION'
                          ? 'bg-amber-100 text-amber-800'
                          : ord.status === 'CANCELLED' || ord.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {ord.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(ord.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Buyer & Destination Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                        Commercial Buyer
                      </span>
                      <div className="font-bold text-slate-900">
                        {ord.buyerBusiness?.name || ord.buyerUser?.fullName}
                      </div>
                      <div className="text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{ord.buyerUser?.phone || 'No phone provided'}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                        Delivery Destination
                      </span>
                      <div className="text-slate-800 font-semibold">
                        {ord.shippingAddress?.recipientName} ({ord.shippingAddress?.phoneNumber})
                      </div>
                      <div className="text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>
                          {ord.shippingAddress?.subCity}, {ord.shippingAddress?.city}
                          {ord.shippingAddress?.woreda && ` • Woreda ${ord.shippingAddress.woreda}`}
                        </span>
                      </div>
                    </div>

                    <div className="text-left md:text-right">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                        Total Order Amount
                      </span>
                      <span className="text-lg font-black text-emerald-800 font-mono">
                        {ord.totalAmount.toLocaleString()} ETB
                      </span>
                    </div>
                  </div>

                  {/* Line items list */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                    <span className="text-slate-500 font-bold block mb-2">
                      Fulfillment Items ({ord.items.length}):
                    </span>
                    <div className="divide-y divide-slate-200/60">
                      {ord.items.map((item) => (
                        <div key={item.id} className="py-1.5 flex items-center justify-between">
                          <span className="font-semibold text-slate-800">
                            {item.productName} × {item.quantity} {item.wholesaleUnit.toLowerCase()}s
                          </span>
                          <span className="font-mono text-slate-700">
                            {item.totalPrice.toLocaleString()} ETB
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status Progression Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <Link
                      href={`/orders/${ord.id}`}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline"
                    >
                      View Full Audit Trail &rarr;
                    </Link>

                    <div className="flex items-center gap-2">
                      {ord.status === 'PENDING_CONFIRMATION' && (
                        <>
                          <button
                            onClick={() => handleStatusTransition(ord.id, 'REJECTED', 'Stock unavailable or capacity reached')}
                            disabled={isActionLoading}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleStatusTransition(ord.id, 'CONFIRMED', 'Supplier verified stock and confirmed')}
                            disabled={isActionLoading}
                            className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                          >
                            {isActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            <span>Confirm Order</span>
                          </button>
                        </>
                      )}

                      {ord.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleStatusTransition(ord.id, 'PROCESSING', 'Warehouse processing order')}
                          disabled={isActionLoading}
                          className="px-4 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                        >
                          {isActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          <span>Start Warehouse Processing</span>
                        </button>
                      )}

                      {ord.status === 'PROCESSING' && (
                        <button
                          onClick={() => handleStatusTransition(ord.id, 'READY_FOR_DISPATCH', 'Goods packaged and ready at loading dock')}
                          disabled={isActionLoading}
                          className="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                        >
                          {isActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          <span>Mark Ready for Dispatch</span>
                        </button>
                      )}

                      {ord.status === 'READY_FOR_DISPATCH' && (
                        <button
                          onClick={() => handleStatusTransition(ord.id, 'SHIPPED', 'Dispatched with logistics carrier')}
                          disabled={isActionLoading}
                          className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                        >
                          {isActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          <span>Dispatch / Mark In Transit</span>
                        </button>
                      )}

                      {ord.status === 'SHIPPED' && (
                        <button
                          onClick={() => handleStatusTransition(ord.id, 'DELIVERED', 'Buyer acknowledged delivery at destination')}
                          disabled={isActionLoading}
                          className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                        >
                          {isActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          <span>Confirm Delivery Complete</span>
                        </button>
                      )}
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
