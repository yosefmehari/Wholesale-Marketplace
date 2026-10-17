'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Locale, getTranslations } from '@/lib/i18n';
import { quotationService, QuotationRequest } from '@/services/quotation.service';
import { addressService, Address } from '@/services/address.service';
import { useAuth } from '@/context/auth-context';
import {
  FileText,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  XCircle,
  Loader2,
  ShieldCheck,
  Truck,
  MessageSquare,
  DollarSign,
} from 'lucide-react';

export default function BuyerQuotationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>('en');
  const t = getTranslations(locale);
  const { user } = useAuth();

  const [rfq, setRfq] = useState<QuotationRequest | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionMessage, setRevisionMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [rfqRes, addrRes] = await Promise.all([
        quotationService.getRfqDetails(resolvedParams.id),
        addressService.getAddresses(),
      ]);

      if (rfqRes.success && rfqRes.data) {
        setRfq(rfqRes.data);
      } else {
        setError(rfqRes.error?.message || 'Quotation not found');
      }

      if (addrRes.success && addrRes.data && addrRes.data.length > 0) {
        setAddresses(addrRes.data);
        const defaultAddr = addrRes.data.find((a) => a.isDefault) || addrRes.data[0];
        setSelectedAddressId(defaultAddr.id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load quotation');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [resolvedParams.id]);

  const handleAccept = async () => {
    if (!rfq) return;
    setActionLoading(true);
    try {
      const res = await quotationService.acceptQuotation(rfq.id, {
        shippingAddressId: selectedAddressId || undefined,
      });

      if (res.success && res.data) {
        router.push(`/orders/${res.data.id}`);
      } else {
        alert(res.error?.message || 'Failed to accept quotation');
      }
    } catch (err: any) {
      alert(err.message || 'Error accepting quotation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!rfq || !revisionMessage.trim()) return;
    setActionLoading(true);
    try {
      const res = await quotationService.requestRevision(rfq.id, revisionMessage.trim());
      if (res.success) {
        setShowRevisionModal(false);
        setRevisionMessage('');
        await loadData();
      } else {
        alert(res.error?.message || 'Failed to request revision');
      }
    } catch (err: any) {
      alert(err.message || 'Error submitting revision request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!rfq || !confirm('Are you sure you want to decline this quotation proposal?')) return;
    setActionLoading(true);
    try {
      const res = await quotationService.declineRfq(rfq.id, 'Declined by buyer');
      if (res.success) {
        await loadData();
      }
    } catch (err: any) {
      alert(err.message || 'Error declining quotation');
    } finally {
      setActionLoading(false);
    }
  };

  const latestQuote = rfq?.quotations?.[0];
  const isExpired = latestQuote && new Date() > new Date(latestQuote.validUntil);
  const canAcceptOrNegotiate =
    rfq?.status === 'SUBMITTED' || rfq?.status === 'BUYER_REVISION_REQUESTED';

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header locale={locale} onLocaleChange={setLocale} t={t} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/buyer/quotations"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Quotations</span>
        </Link>

        {isLoading && (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
          </div>
        )}

        {error && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md mx-auto my-12">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
            <h2 className="text-base font-bold text-slate-900">Quotation Not Found</h2>
            <p className="text-xs text-slate-500 mt-1 mb-4">{error}</p>
          </div>
        )}

        {!isLoading && rfq && (
          <div className="space-y-6">
            {/* Top Header Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
                    {rfq.rfqNumber}
                  </h1>
                  <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800">
                    {rfq.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-800 mt-1">{rfq.title}</h2>
                <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                  <span>Destination: {rfq.deliveryLocation}</span>
                  <span>•</span>
                  <span>Created: {new Date(rfq.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>Expires: {new Date(rfq.expiresAt).toLocaleDateString()}</span>
                </div>
              </div>

              {canAcceptOrNegotiate && !isExpired && (
                <div className="flex items-center gap-2.5 self-start sm:self-auto">
                  <button
                    onClick={handleDecline}
                    disabled={actionLoading}
                    className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-xl transition"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => setShowRevisionModal(true)}
                    disabled={actionLoading}
                    className="px-4 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Request Revision</span>
                  </button>
                  <button
                    onClick={() => setShowAcceptModal(true)}
                    disabled={actionLoading}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-sm transition flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Accept & Place Order</span>
                  </button>
                </div>
              )}
            </div>

            {/* Main Content: Formal Proposal & Revision Log */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Proposal Details */}
              <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-700" />
                    <span>
                      Formal Proposal {latestQuote ? `(Version ${latestQuote.versionNumber})` : ''}
                    </span>
                  </h3>
                  {latestQuote && (
                    <span className="text-xs text-slate-500 font-semibold">
                      Valid until: {new Date(latestQuote.validUntil).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {latestQuote && latestQuote.items && (
                  <div className="divide-y divide-slate-100">
                    {latestQuote.items.map((item) => (
                      <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                        <div>
                          <span className="font-bold text-xs text-slate-900 block">
                            {item.productName}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Quantity: {item.quantity} {item.unit.toLowerCase()}s @{' '}
                            <strong className="text-emerald-800">
                              {item.offeredUnitPrice.toLocaleString()} ETB
                            </strong>{' '}
                            / {item.unit.toLowerCase()}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-xs text-slate-900">
                          {item.lineTotal.toLocaleString()} ETB
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {latestQuote && (
                  <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-mono font-bold">{latestQuote.subtotal.toLocaleString()} ETB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Logistics & Freight</span>
                      <span className="font-mono font-bold">
                        {latestQuote.shippingFee > 0 ? `${latestQuote.shippingFee.toLocaleString()} ETB` : 'Included'}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-100 text-sm font-black text-slate-900">
                      <span>Total Proposed Amount</span>
                      <span className="font-mono text-emerald-800">
                        {latestQuote.totalPrice.toLocaleString()} ETB
                      </span>
                    </div>
                  </div>
                )}

                {latestQuote?.supplierNotes && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                    <span className="font-bold text-slate-900 block">Supplier Remarks:</span>
                    <p className="leading-relaxed">{latestQuote.supplierNotes}</p>
                  </div>
                )}

                {latestQuote?.paymentTerms && (
                  <div className="text-xs text-slate-600 flex items-center gap-2">
                    <span className="font-bold text-slate-700">Commercial Terms:</span>
                    <span>{latestQuote.paymentTerms}</span>
                  </div>
                )}
              </div>

              {/* Sidebar: Supplier Info & Revision History */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                    Supplier Organization
                  </h3>
                  <div className="text-xs space-y-1.5">
                    <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-emerald-700" />
                      <span>{rfq.supplierBusiness?.name}</span>
                      {rfq.supplierBusiness?.isVerified && (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      )}
                    </div>
                    <div className="text-slate-500">
                      {rfq.supplierBusiness?.subCity}, {rfq.supplierBusiness?.city}
                    </div>
                  </div>
                </div>

                {/* Revision History Log */}
                {rfq.revisions && rfq.revisions.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                    <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                      Negotiation Audit Trail
                    </h3>

                    <div className="space-y-3 text-xs">
                      {rfq.revisions.map((rev) => (
                        <div key={rev.id} className="relative pl-3.5 border-l-2 border-emerald-600 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">
                              v{rev.versionNumber} • {rev.action.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block">
                            {new Date(rev.createdAt).toLocaleString()}
                          </span>
                          {rev.message && (
                            <p className="text-[11px] text-slate-600 pt-0.5">{rev.message}</p>
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

        {/* Accept Modal */}
        {showAcceptModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
              <h3 className="text-base font-bold text-slate-900">Accept Quotation Proposal</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Accepting this quotation will bind the agreed commercial terms and instantly generate a
                wholesale purchase order for fulfillment.
              </p>

              {addresses.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Delivery Destination
                  </label>
                  <select
                    value={selectedAddressId}
                    onChange={(e) => setSelectedAddressId(e.target.value)}
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
                  >
                    {addresses.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.recipientName} ({a.subCity}, {a.city})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAcceptModal(false)}
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAccept}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Confirm & Generate Order</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Revision Modal */}
        {showRevisionModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
              <h3 className="text-base font-bold text-slate-900">Request Counter-Offer / Revision</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Describe desired price adjustments, delivery schedule changes, or bulk packaging requirements.
              </p>

              <textarea
                rows={3}
                value={revisionMessage}
                onChange={(e) => setRevisionMessage(e.target.value)}
                placeholder="e.g. Could we reduce the unit rate by 2% if we commit to an ongoing bi-weekly order?"
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-1 focus:ring-emerald-600"
              />

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRevisionModal(false)}
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRequestRevision}
                  disabled={actionLoading || !revisionMessage.trim()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  <span>Transmit Revision Request</span>
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
