'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Locale, getTranslations } from '@/lib/i18n';
import { quotationService, QuotationRequest } from '@/services/quotation.service';
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
  Loader2,
  DollarSign,
  Truck,
} from 'lucide-react';

export default function SupplierQuotationResponsePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>('en');
  const t = getTranslations(locale);
  const { user } = useAuth();

  const [rfq, setRfq] = useState<QuotationRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Proposal form state
  const [items, setItems] = useState<Array<{
    productId?: string | null;
    productName: string;
    quantity: number;
    unit: string;
    offeredUnitPrice: string;
    notes?: string | null;
  }>>([]);
  const [shippingFee, setShippingFee] = useState('0');
  const [leadTimeDays, setLeadTimeDays] = useState('3');
  const [validDays, setValidDays] = useState('14');
  const [paymentTerms, setPaymentTerms] = useState('Direct bank transfer within 7 business days');
  const [supplierNotes, setSupplierNotes] = useState('');

  const loadRfq = async () => {
    setIsLoading(true);
    try {
      const res = await quotationService.getRfqDetails(resolvedParams.id);
      if (res.success && res.data) {
        setRfq(res.data);
        const latestQuote = res.data.quotations?.[0];
        if (latestQuote && latestQuote.items) {
          setItems(
            latestQuote.items.map((it) => ({
              productId: it.productId,
              productName: it.productName,
              quantity: it.quantity,
              unit: it.unit,
              offeredUnitPrice: it.offeredUnitPrice ? it.offeredUnitPrice.toString() : '',
              notes: it.notes,
            }))
          );
          if (latestQuote.shippingFee) setShippingFee(latestQuote.shippingFee.toString());
          if (latestQuote.leadTimeDays) setLeadTimeDays(latestQuote.leadTimeDays.toString());
          if (latestQuote.paymentTerms) setPaymentTerms(latestQuote.paymentTerms);
        }
      }
    } catch (err) {
      console.error('Failed to load RFQ:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRfq();
  }, [resolvedParams.id]);

  const handleItemPriceChange = (index: number, val: string) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], offeredUnitPrice: val };
      return updated;
    });
  };

  const calculatedSubtotal = items.reduce(
    (sum, it) => sum + (parseFloat(it.offeredUnitPrice) || 0) * it.quantity,
    0
  );
  const calculatedTotal = calculatedSubtotal + (parseFloat(shippingFee) || 0);

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfq) return;

    for (const item of items) {
      if (!item.offeredUnitPrice || parseFloat(item.offeredUnitPrice) <= 0) {
        setErrorMessage(`Please enter a valid unit price for "${item.productName}".`);
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await quotationService.submitSupplierQuote(rfq.id, {
        items: items.map((it) => ({
          productId: it.productId || undefined,
          productName: it.productName,
          quantity: it.quantity,
          unit: it.unit,
          offeredUnitPrice: parseFloat(it.offeredUnitPrice),
          notes: it.notes || undefined,
        })),
        shippingFee: parseFloat(shippingFee) || 0,
        leadTimeDays: parseInt(leadTimeDays, 10) || 3,
        validDays: parseInt(validDays, 10) || 14,
        paymentTerms,
        supplierNotes: supplierNotes.trim() || undefined,
      });

      if (res.success) {
        router.push('/supplier/quotations');
      } else {
        setErrorMessage(res.error?.message || 'Failed to submit quote.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while submitting quotation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header locale={locale} onLocaleChange={setLocale} t={t} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/supplier/quotations"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Supplier RFQ List</span>
        </Link>

        {isLoading && (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
          </div>
        )}

        {!isLoading && rfq && (
          <form onSubmit={handleSubmitQuote} className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-extrabold text-slate-900">
                    {rfq.rfqNumber}
                  </span>
                  <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800">
                    {rfq.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <h1 className="text-xl font-bold text-slate-900 mt-1">{rfq.title}</h1>
                <div className="text-xs text-slate-500 mt-1">
                  Buyer: <strong className="text-slate-800">{rfq.buyerBusiness?.name}</strong> • Destination: {rfq.deliveryLocation}
                </div>
              </div>

              {rfq.targetPrice && (
                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Buyer Target Budget
                  </span>
                  <span className="text-lg font-black text-slate-900 font-mono">
                    {Number(rfq.targetPrice).toLocaleString()} ETB
                  </span>
                </div>
              )}
            </div>

            {/* Price Proposal Builder */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h2 className="text-sm font-extrabold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-700" />
                <span>Line Items & Unit Price Proposal</span>
              </h2>

              <div className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <span className="font-bold text-xs text-slate-900 block">
                        {item.productName}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Volume: {item.quantity} {item.unit.toLowerCase()}s
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                          Offered Unit Rate (ETB) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={item.offeredUnitPrice}
                          onChange={(e) => handleItemPriceChange(idx, e.target.value)}
                          placeholder="e.g. 4500"
                          className="w-32 text-xs py-1.5 px-2.5 border border-slate-300 rounded-lg font-mono font-bold focus:ring-1 focus:ring-emerald-600"
                        />
                      </div>

                      <div className="w-28 text-right font-mono font-bold text-xs text-slate-900">
                        {((parseFloat(item.offeredUnitPrice) || 0) * item.quantity).toLocaleString()} ETB
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Calculation */}
              <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Logistics / Shipping Fee (ETB)
                  </label>
                  <input
                    type="number"
                    value={shippingFee}
                    onChange={(e) => setShippingFee(e.target.value)}
                    className="w-full text-xs py-1.5 px-2.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fulfillment Lead Time (Days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={leadTimeDays}
                    onChange={(e) => setLeadTimeDays(e.target.value)}
                    className="w-full text-xs py-1.5 px-2.5 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Offer Validity (Days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={validDays}
                    onChange={(e) => setValidDays(e.target.value)}
                    className="w-full text-xs py-1.5 px-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-600">Calculated Offer Total:</span>
                <span className="text-xl font-black text-emerald-800 font-mono">
                  {calculatedTotal.toLocaleString()} ETB
                </span>
              </div>
            </div>

            {/* Commercial terms & notes */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Terms
                </label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Supplier Remarks / Fulfillment Guarantees
                </label>
                <textarea
                  rows={3}
                  value={supplierNotes}
                  onChange={(e) => setSupplierNotes(e.target.value)}
                  placeholder="e.g. Free pallet wrap, batch laboratory certificate included with transport."
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {errorMessage}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Link
                href="/supplier/quotations"
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Transmitting Formal Quotation...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Formal Quotation</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>

      <Footer t={t} />
    </div>
  );
}
