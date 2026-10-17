'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Locale, getTranslations } from '@/lib/i18n';
import { orderService, Order, OrderStatus } from '@/services/order.service';
import { paymentService, Payment, PaymentMethod } from '@/services/payment.service';
import { useAuth } from '@/context/auth-context';
import {
  Package,
  Building2,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Truck,
  XCircle,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  FileText,
  DollarSign,
} from 'lucide-react';

const LIFECYCLE_STEPS: Array<{ key: OrderStatus; label: string }> = [
  { key: 'PENDING_CONFIRMATION', label: 'Order Placed' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'PROCESSING', label: 'Processing' },
  { key: 'READY_FOR_DISPATCH', label: 'Ready' },
  { key: 'SHIPPED', label: 'In Transit' },
  { key: 'DELIVERED', label: 'Delivered' },
];

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [locale, setLocale] = useState<Locale>('en');
  const t = getTranslations(locale);
  const { user } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancellation state
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Payment state
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'choose' | 'submit_proof' | 'telebirr_sim'>('choose');
  const [activePaymentId, setActivePaymentId] = useState<string | null>(null);

  const loadOrder = async () => {
    setIsLoading(true);
    try {
      const res = await orderService.getOrderDetails(resolvedParams.id);
      if (res.success && res.data) {
        setOrder(res.data);
      } else {
        setError(res.error?.message || 'Order not found');
      }
      // Also fetch payments
      const payRes = await paymentService.getOrderPayments(resolvedParams.id);
      if (payRes.success && payRes.data) {
        setPayments(payRes.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [resolvedParams.id]);

  const handleInitiatePayment = async () => {
    if (!order) return;
    setIsSubmittingPayment(true);
    try {
      const res = await paymentService.initiatePayment(order.id, selectedMethod);
      if (res.success && res.data) {
        setActivePaymentId(res.data.payment.id);
        if (selectedMethod === 'TELEBIRR') {
          setPaymentStep('telebirr_sim');
        } else {
          setPaymentStep('submit_proof');
        }
      } else {
        alert(res.error?.message || 'Failed to initiate payment');
      }
    } catch (err: any) {
      alert(err.message || 'Payment initiation failed');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleSubmitProof = async () => {
    if (!activePaymentId || !transactionRef.trim()) {
      alert('Please enter a valid bank transaction reference number');
      return;
    }
    setIsSubmittingPayment(true);
    try {
      const res = await paymentService.submitPaymentProof(
        activePaymentId,
        transactionRef.trim(),
        paymentNotes.trim() || undefined
      );
      if (res.success) {
        setShowPaymentModal(false);
        setPaymentStep('choose');
        setTransactionRef('');
        setPaymentNotes('');
        await loadOrder();
      } else {
        alert(res.error?.message || 'Failed to submit payment proof');
      }
    } catch (err: any) {
      alert(err.message || 'Submission failed');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleSimulateTelebirrComplete = async () => {
    if (!activePaymentId) return;
    setIsSubmittingPayment(true);
    try {
      // In sandbox/simulation, Telebirr completes via verification
      const res = await paymentService.verifyPayment(activePaymentId);
      if (res.success) {
        setShowPaymentModal(false);
        setPaymentStep('choose');
        await loadOrder();
      } else {
        alert(res.error?.message || 'Failed to verify Telebirr payment');
      }
    } catch (err: any) {
      alert(err.message || 'Telebirr simulation error');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleCancel = async () => {
    if (!order) return;
    setIsCancelling(true);
    try {
      const res = await orderService.cancelOrder(
        order.id,
        cancelReason.trim() || 'Cancelled from order detail page'
      );
      if (res.success) {
        setShowCancelModal(false);
        await loadOrder();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  const getStepStatus = (stepKey: OrderStatus) => {
    if (!order) return 'upcoming';
    if (order.status === 'CANCELLED' || order.status === 'REJECTED') {
      return 'cancelled';
    }

    const orderIndex = LIFECYCLE_STEPS.findIndex((s) => s.key === order.status);
    const stepIndex = LIFECYCLE_STEPS.findIndex((s) => s.key === stepKey);

    if (stepIndex < orderIndex) return 'completed';
    if (stepIndex === orderIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header locale={locale} onLocaleChange={setLocale} t={t} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Orders</span>
        </Link>

        {isLoading && (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
          </div>
        )}

        {error && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md mx-auto my-12">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
            <h2 className="text-base font-bold text-slate-900">Order Not Found</h2>
            <p className="text-xs text-slate-500 mt-1 mb-4">{error}</p>
            <Link
              href="/orders"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold"
            >
              <span>Return to Orders</span>
            </Link>
          </div>
        )}

        {!isLoading && order && (
          <div className="space-y-6">
            {/* Top Header Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
                    {order.orderNumber}
                  </h1>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                    order.status === 'DELIVERED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : order.status === 'CANCELLED' || order.status === 'REJECTED'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Placed on {new Date(order.createdAt).toLocaleString()}</span>
                  </span>
                  <span>•</span>
                  <span>Currency: ETB</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/orders/${order.id}/invoice`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-600" />
                  <span>Commercial Invoice</span>
                </Link>

                {order.status !== 'CANCELLED' && order.status !== 'REJECTED' && (
                  <button
                    onClick={() => {
                      setPaymentStep('choose');
                      setShowPaymentModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Pay / Submit Bank Slip</span>
                  </button>
                )}

                {order.status === 'PENDING_CONFIRMATION' && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="px-3 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold rounded-xl transition"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>

            {/* Lifecycle Stepper */}
            {order.status !== 'CANCELLED' && order.status !== 'REJECTED' ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-6">
                  Fulfillment Status Timeline
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
                  {LIFECYCLE_STEPS.map((step, idx) => {
                    const status = getStepStatus(step.key);

                    return (
                      <div key={step.key} className="text-center relative">
                        <div
                          className={`w-9 h-9 mx-auto rounded-full flex items-center justify-center font-bold text-xs transition mb-2 ${
                            status === 'completed'
                              ? 'bg-emerald-700 text-white'
                              : status === 'current'
                              ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-600'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {status === 'completed' ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <span>{idx + 1}</span>
                          )}
                        </div>
                        <span
                          className={`text-xs font-bold block ${
                            status === 'current'
                              ? 'text-emerald-800'
                              : status === 'completed'
                              ? 'text-slate-800'
                              : 'text-slate-400'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-xs text-rose-800 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">
                    {order.status === 'CANCELLED' ? 'Order Cancelled' : 'Order Rejected by Supplier'}
                  </span>
                  <p className="mt-1">
                    {order.cancellationReason || order.rejectionReason || 'No specific reason provided.'}
                  </p>
                  <p className="mt-1 text-[11px] text-rose-600">
                    All inventory reserved for this order was automatically returned to the supplier warehouse.
                  </p>
                </div>
              </div>
            )}

            {/* Main Content Grid: Items + Supplier / Address Details */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Ordered Items Table */}
              <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <h2 className="text-sm font-extrabold text-slate-900 pb-3 border-b border-slate-100">
                  Itemized Wholesale Products ({order.items.length})
                </h2>

                <div className="divide-y divide-slate-100">
                  {order.items.map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-sm text-slate-900 block truncate">
                          {item.productName}
                        </span>
                        <div className="text-xs text-slate-500 mt-0.5">
                          SKU: {item.productSku || 'Standard Wholesale SKU'} • Quantity: {item.quantity} {item.wholesaleUnit.toLowerCase()}s
                        </div>
                        <div className="text-xs text-emerald-800 font-semibold mt-0.5">
                          @ {item.unitPrice.toLocaleString()} ETB / {item.wholesaleUnit.toLowerCase()}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-extrabold text-sm text-slate-900">
                          {item.totalPrice.toLocaleString()} ETB
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-mono font-bold text-slate-800">{order.subtotal.toLocaleString()} ETB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Commission</span>
                    <span className="font-mono font-bold text-emerald-700">0.00 ETB</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-100 text-sm font-black text-slate-900">
                    <span>Grand Total</span>
                    <span className="font-mono text-emerald-800">{order.totalAmount.toLocaleString()} ETB</span>
                  </div>
                </div>

                {order.notes && (
                  <div className="pt-3 border-t border-slate-100 text-xs">
                    <span className="font-bold text-slate-700 block mb-0.5">Buyer Notes:</span>
                    <p className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      {order.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Sidebar: Supplier & Delivery Address */}
              <div className="lg:col-span-4 space-y-6">
                {/* Supplier Profile */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                    Supplier Fulfillment Center
                  </h3>

                  <div className="text-xs space-y-2">
                    <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-emerald-700" />
                      <span>{order.supplierBusiness?.name}</span>
                      {order.supplierBusiness?.isVerified && (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      )}
                    </div>

                    {order.supplierBusiness?.phone && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{order.supplierBusiness.phone}</span>
                      </div>
                    )}

                    {order.supplierBusiness?.email && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{order.supplierBusiness.email}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {order.supplierBusiness?.subCity}, {order.supplierBusiness?.city}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delivery Address */}
                {order.shippingAddress && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                    <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                      Delivery Destination
                    </h3>

                    <div className="text-xs space-y-1.5 text-slate-600">
                      <div className="font-bold text-slate-900">
                        {order.shippingAddress.recipientName}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{order.shippingAddress.phoneNumber}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>
                          {order.shippingAddress.subCity}, {order.shippingAddress.city}
                          {order.shippingAddress.woreda && ` • Woreda ${order.shippingAddress.woreda}`}
                        </span>
                      </div>
                      {order.shippingAddress.houseNumber && (
                        <div className="text-[11px] text-slate-500">
                          Warehouse / House: {order.shippingAddress.houseNumber}
                        </div>
                      )}
                      {order.shippingAddress.landmark && (
                        <div className="text-[11px] text-slate-400">
                          Landmark: {order.shippingAddress.landmark}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Payment & Settlement Summary Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                      Payment & Settlement
                    </h3>
                    <CreditCard className="w-4 h-4 text-emerald-700" />
                  </div>

                  {payments.length > 0 ? (
                    <div className="space-y-3">
                      {payments.map((p) => (
                        <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{p.paymentMethod.replace(/_/g, ' ')}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              p.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : p.status === 'SUBMITTED_FOR_VERIFICATION'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {p.status.replace(/_/g, ' ')}
                            </span>
                          </div>

                          <div className="text-slate-600">
                            Amount: <span className="font-mono font-bold text-slate-800">{p.amount.toLocaleString()} {p.currency}</span>
                          </div>

                          {p.transactionReference && (
                            <div className="text-slate-500 font-mono text-[11px] truncate">
                              Ref: {p.transactionReference}
                            </div>
                          )}

                          {p.verifiedAt && (
                            <div className="text-emerald-700 text-[10px] flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Verified {new Date(p.verifiedAt).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                        <span className="font-bold block">Payment Awaiting Settlement</span>
                        <p className="mt-0.5 text-[11px] text-amber-700">
                          Complete payment via Telebirr or direct Ethiopian bank wire transfer (CBE, Awash, Dashen).
                        </p>
                      </div>

                      {order.status !== 'CANCELLED' && order.status !== 'REJECTED' && (
                        <button
                          onClick={() => {
                            setPaymentStep('choose');
                            setShowPaymentModal(true);
                          }}
                          className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>Initiate Payment</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Status Audit Log */}
                {order.statusHistory && order.statusHistory.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                    <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                      Audit Trail & Status Log
                    </h3>

                    <div className="space-y-3 text-xs">
                      {order.statusHistory.map((hist) => (
                        <div key={hist.id} className="relative pl-4 border-l-2 border-emerald-500 space-y-0.5">
                          <span className="font-bold text-slate-900 block">
                            {hist.newStatus.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {new Date(hist.createdAt).toLocaleString()}
                          </span>
                          {hist.notes && (
                            <p className="text-[11px] text-slate-600">{hist.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Cancellation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
              <h3 className="text-base font-bold text-slate-900">Confirm Order Cancellation</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Cancelling will restore all reserved wholesale inventory to the supplier.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Cancellation
                </label>
                <textarea
                  rows={2}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Schedule adjustment"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  disabled={isCancelling}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
                >
                  {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && order && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">B2B Order Payment</h3>
                  <p className="text-xs text-slate-500">Order #{order.orderNumber} • {order.totalAmount.toLocaleString()} ETB</p>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              {paymentStep === 'choose' && (
                <div className="space-y-4">
                  <span className="text-xs font-semibold text-slate-700 block">
                    Select Ethiopian Payment Gateway / Channel:
                  </span>

                  <div className="space-y-2.5">
                    <label
                      onClick={() => setSelectedMethod('BANK_TRANSFER')}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                        selectedMethod === 'BANK_TRANSFER'
                          ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payMethod"
                        checked={selectedMethod === 'BANK_TRANSFER'}
                        onChange={() => setSelectedMethod('BANK_TRANSFER')}
                        className="mt-1 text-emerald-700"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-slate-900 block">Bank Wire Transfer (CBE, Awash, Dashen, Abyssinia)</span>
                        <p className="text-slate-500 mt-0.5">
                          Direct deposit to WholesaleHub corporate escrow account. Upload or input transaction slip ref.
                        </p>
                      </div>
                    </label>

                    <label
                      onClick={() => setSelectedMethod('TELEBIRR')}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                        selectedMethod === 'TELEBIRR'
                          ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payMethod"
                        checked={selectedMethod === 'TELEBIRR'}
                        onChange={() => setSelectedMethod('TELEBIRR')}
                        className="mt-1 text-emerald-700"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-slate-900 block">Telebirr SuperApp / Web Checkout</span>
                        <p className="text-slate-500 mt-0.5">
                          Instant mobile wallet settlement with official Ethio Telecom gateway.
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setShowPaymentModal(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleInitiatePayment}
                      disabled={isSubmittingPayment}
                      className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      {isSubmittingPayment && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Continue</span>
                    </button>
                  </div>
                </div>
              )}

              {paymentStep === 'telebirr_sim' && (
                <div className="space-y-4">
                  <div className="p-4 bg-sky-50 rounded-xl border border-sky-200 text-xs text-sky-900 space-y-2">
                    <span className="font-bold block">Telebirr Sandbox Payment Flow</span>
                    <p className="text-sky-800">
                      Amount: <span className="font-mono font-bold">{order.totalAmount.toLocaleString()} ETB</span>
                    </p>
                    <p className="text-[11px] text-sky-700 leading-relaxed">
                      Telebirr Web H5 payment session generated. In sandbox mode, click Simulate Complete Payment to trigger automated webhook verification and receipt creation.
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setPaymentStep('choose')}
                      disabled={isSubmittingPayment}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSimulateTelebirrComplete}
                      disabled={isSubmittingPayment}
                      className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      {isSubmittingPayment && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Simulate Complete Payment</span>
                    </button>
                  </div>
                </div>
              )}

              {paymentStep === 'submit_proof' && (
                <div className="space-y-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-900 block">WholesaleHub Escrow Bank Accounts:</span>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                      <div className="p-2 bg-white rounded-lg border border-slate-100">
                        <span className="font-bold text-slate-800 block">Commercial Bank of Ethiopia (CBE)</span>
                        <span className="font-mono text-emerald-800 font-bold">1000234567890</span>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-100">
                        <span className="font-bold text-slate-800 block">Awash Bank</span>
                        <span className="font-mono text-emerald-800 font-bold">01320876543200</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Bank Transaction / Deposit Slip Reference Number *
                    </label>
                    <input
                      type="text"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      placeholder="e.g. FT234859032 or CBE-BIRR-9842"
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Additional Notes / Depositor Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      placeholder="e.g. Deposited by Alemayehu Kebede from Finfine Branch"
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setPaymentStep('choose')}
                      disabled={isSubmittingPayment}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSubmitProof}
                      disabled={isSubmittingPayment}
                      className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      {isSubmittingPayment && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Submit Payment Proof</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer t={t} />
    </div>
  );
}
