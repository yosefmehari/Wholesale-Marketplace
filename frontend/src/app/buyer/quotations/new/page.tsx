'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Locale, getTranslations } from '@/lib/i18n';
import { quotationService } from '@/services/quotation.service';
import { catalogService, Supplier } from '@/services/catalog.service';
import { useAuth } from '@/context/auth-context';
import {
  FileText,
  Plus,
  Trash2,
  Building2,
  Calendar,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

const WHOLESALE_UNITS = [
  'CARTON',
  'BAG',
  'BOX',
  'CRATE',
  'PALLET',
  'CONTAINER',
  'PIECE',
  'KG',
  'METRIC_TON',
  'LITER',
  'METER',
  'ROLL',
  'SET',
  'DOZEN',
];

function NewRfqContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillSupplierId = searchParams.get('supplierId') || '';
  const prefillProductId = searchParams.get('productId') || '';

  const [locale, setLocale] = useState<Locale>('en');
  const t = getTranslations(locale);
  const { user, isLoading: authLoading } = useAuth();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState(prefillSupplierId);
  const [title, setTitle] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('Addis Ababa, Ethiopia');
  const [targetDeliveryDate, setTargetDeliveryDate] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<Array<{
    productId?: string;
    productName: string;
    quantity: number;
    unit: string;
    targetUnitPrice: string;
    notes: string;
  }>>([
    {
      productId: prefillProductId || undefined,
      productName: '',
      quantity: 100,
      unit: 'CARTON',
      targetUnitPrice: '',
      notes: '',
    },
  ]);

  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadSuppliers() {
      try {
        const res = await catalogService.getSuppliers();
        if (res.success && res.data) {
          setSuppliers(res.data);
          if (!selectedSupplierId && res.data.length > 0) {
            setSelectedSupplierId(res.data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load suppliers:', err);
      } finally {
        setIsLoadingSuppliers(false);
      }
    }

    loadSuppliers();
  }, []);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        productName: '',
        quantity: 50,
        unit: 'CARTON',
        targetUnitPrice: '',
        notes: '',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      setErrorMessage('Please select a verified supplier to receive your RFQ.');
      return;
    }

    for (const item of items) {
      if (!item.productName.trim() || item.quantity <= 0) {
        setErrorMessage('All line items require a valid product name and positive quantity.');
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await quotationService.createRfq({
        supplierBusinessId: selectedSupplierId,
        title: title.trim() || `Wholesale Procurement Request (${items.length} line items)`,
        deliveryLocation,
        targetDeliveryDate: targetDeliveryDate || undefined,
        targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
        notes: notes.trim() || undefined,
        items: items.map((it) => ({
          productId: it.productId,
          productName: it.productName.trim(),
          quantity: it.quantity,
          unit: it.unit,
          targetUnitPrice: it.targetUnitPrice ? parseFloat(it.targetUnitPrice) : undefined,
          notes: it.notes.trim() || undefined,
        })),
      });

      if (res.success && res.data) {
        router.push(`/buyer/quotations/${res.data.id}`);
      } else {
        setErrorMessage(res.error?.message || 'Failed to submit quotation request.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while submitting RFQ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header locale={locale} onLocaleChange={setLocale} t={t} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/buyer/quotations"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Quotations</span>
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-7 h-7 text-emerald-700" />
            <span>Request for Quotation (RFQ)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Request formal wholesale price proposals, quantity tiers, and delivery terms from verified suppliers
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Supplier & Title */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span>1. Supplier & Request Details</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Supplier *
                </label>
                {isLoadingSuppliers ? (
                  <div className="text-xs text-slate-400 py-2">Loading suppliers...</div>
                ) : (
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    required
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-xl focus:ring-1 focus:ring-emerald-600 bg-white"
                  >
                    {suppliers.map((sup) => (
                      <option key={sup.id} value={sup.id}>
                        {sup.name} ({sup.subCity ? `${sup.subCity}, ` : ''}{sup.city})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Request Subject / Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q4 Commercial Wheat Flour Supply"
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-xl focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery Destination
                </label>
                <input
                  type="text"
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  placeholder="e.g. Kality Warehouse, Addis Ababa"
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-xl focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Delivery Date
                </label>
                <input
                  type="date"
                  value={targetDeliveryDate}
                  onChange={(e) => setTargetDeliveryDate(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-xl focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Line Items Builder */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>2. Requested Products & Volume</span>
              </h2>

              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product Line</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                >
                  <div className="sm:col-span-5">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Product Name & Specification *
                    </label>
                    <input
                      type="text"
                      required
                      value={item.productName}
                      onChange={(e) => handleItemChange(idx, 'productName', e.target.value)}
                      placeholder="e.g. Grade 1 White Teff 50kg bag"
                      className="w-full text-xs py-1.5 px-2.5 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                      className="w-full text-xs py-1.5 px-2.5 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-emerald-600 font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Wholesale Unit
                    </label>
                    <select
                      value={item.unit}
                      onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                      className="w-full text-xs py-1.5 px-2.5 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-emerald-600"
                    >
                      {WHOLESALE_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u.toLowerCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Target Unit Price (ETB)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.targetUnitPrice}
                      onChange={(e) => handleItemChange(idx, 'targetUnitPrice', e.target.value)}
                      placeholder="Optional"
                      className="w-full text-xs py-1.5 px-2.5 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-emerald-600 font-mono"
                    />
                  </div>

                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      disabled={items.length <= 1}
                      className="p-2 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition"
                      title="Remove product line"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Additional Notes & Requirements */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <label className="block text-xs font-bold text-slate-700">
              Commercial Requirements, Quality Certifications, or Negotiation Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Seeking palletized delivery with laboratory test results. Looking for ongoing quarterly volume discounts."
              className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/buyer/quotations"
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
                  <span>Submitting RFQ...</span>
                </>
              ) : (
                <>
                  <span>Transmit RFQ to Supplier</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </main>

      <Footer t={t} />
    </div>
  );
}

export default function NewRfqPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
        </div>
      }
    >
      <NewRfqContent />
    </React.Suspense>
  );
}
