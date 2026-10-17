'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { invoiceService, InvoiceData } from '@/services/invoice.service';
import {
  Printer,
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileText,
  Building2,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

export default function OrderInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [data, setData] = useState<InvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInvoice() {
      setIsLoading(true);
      try {
        const res = await invoiceService.getInvoiceByOrder(resolvedParams.id);
        if (res.success && res.data) {
          setData(res.data);
        } else {
          setError(res.error?.message || 'Invoice not found');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch invoice');
      } finally {
        setIsLoading(false);
      }
    }
    fetchInvoice();
  }, [resolvedParams.id]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 sm:py-10 print:bg-white print:p-0">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Navigation & Print Actions (Hidden on Print) */}
        <div className="print:hidden flex items-center justify-between mb-6">
          <Link
            href={`/orders/${resolvedParams.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Order #{data?.order.orderNumber || resolvedParams.id}</span>
          </Link>

          <button
            onClick={handlePrint}
            disabled={isLoading || !data}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-xs transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 bg-white rounded-2xl border border-slate-200">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-700 mb-2" />
            <span className="text-xs font-medium">Generating Commercial Invoice...</span>
          </div>
        )}

        {error && (
          <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center my-6">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
            <h2 className="text-base font-bold text-slate-900">Failed to Load Invoice</h2>
            <p className="text-xs text-slate-500 mt-1 mb-4">{error}</p>
            <Link
              href={`/orders/${resolvedParams.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold"
            >
              <span>Back to Order</span>
            </Link>
          </div>
        )}

        {!isLoading && data && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm print:shadow-none print:border-none p-8 sm:p-12 text-slate-900">
            {/* Header / Brand */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-slate-200 pb-8 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-700 flex items-center justify-center text-white font-black text-lg">
                    W
                  </div>
                  <div>
                    <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">
                      WholesaleHub Ethiopia
                    </h1>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                      B2B Commercial Marketplace
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                  Official Commercial Sales Document issued under Ethiopian B2B trade regulations.
                </p>
              </div>

              <div className="sm:text-right">
                <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase rounded-md tracking-wider mb-2">
                  Commercial Invoice
                </span>
                <div className="font-mono text-base font-black text-slate-900">
                  {data.invoice.invoiceNumber}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Issued: {new Date(data.invoice.issuedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <div className="text-xs text-slate-500">
                  Order Ref: <span className="font-mono font-bold text-slate-700">{data.order.orderNumber}</span>
                </div>
              </div>
            </div>

            {/* Seller & Buyer Party Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-b border-slate-200 text-xs">
              {/* Seller / Supplier */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-1.5">
                <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block mb-1">
                  Seller / Supplier Details
                </span>
                <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-700" />
                  <span>{data.supplier.name}</span>
                </div>
                <div className="text-slate-600">
                  <span className="font-semibold text-slate-700">TIN Number:</span>{' '}
                  <span className="font-mono font-bold">{data.supplier.tinNumber || 'N/A'}</span>
                </div>
                {data.supplier.registrationNumber && (
                  <div className="text-slate-600">
                    <span className="font-semibold text-slate-700">Trade Reg. No:</span>{' '}
                    <span className="font-mono">{data.supplier.registrationNumber}</span>
                  </div>
                )}
                <div className="text-slate-600">
                  <span className="font-semibold text-slate-700">Address:</span>{' '}
                  {data.supplier.addressLine || data.supplier.subCity}, {data.supplier.city}, Ethiopia
                </div>
                <div className="text-slate-600">
                  <span className="font-semibold text-slate-700">Phone:</span> {data.supplier.phone}
                </div>
                <div className="text-slate-600">
                  <span className="font-semibold text-slate-700">Email:</span> {data.supplier.email}
                </div>
              </div>

              {/* Buyer */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-1.5">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                  Billed To / Buyer
                </span>
                <div className="text-sm font-bold text-slate-900">
                  {data.buyer.name}
                </div>
                {data.buyer.tinNumber ? (
                  <div className="text-slate-600">
                    <span className="font-semibold text-slate-700">Buyer TIN:</span>{' '}
                    <span className="font-mono font-bold">{data.buyer.tinNumber}</span>
                  </div>
                ) : (
                  <div className="text-slate-400 italic">No Buyer TIN recorded</div>
                )}
                <div className="text-slate-600">
                  <span className="font-semibold text-slate-700">Phone:</span> {data.buyer.phone || 'N/A'}
                </div>
                <div className="text-slate-600">
                  <span className="font-semibold text-slate-700">Email:</span> {data.buyer.email}
                </div>
                {data.buyer.address && (
                  <div className="text-slate-600">
                    <span className="font-semibold text-slate-700">Delivery:</span>{' '}
                    {data.buyer.address.subCity}, {data.buyer.address.city}
                  </div>
                )}
              </div>
            </div>

            {/* Line Items Table */}
            <div className="py-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-2">#</th>
                    <th className="py-3 px-2">Description / SKU</th>
                    <th className="py-3 px-2 text-center">Unit</th>
                    <th className="py-3 px-2 text-right">Quantity</th>
                    <th className="py-3 px-2 text-right">Unit Price (ETB)</th>
                    <th className="py-3 px-2 text-right">Total (ETB)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {data.items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-2 text-slate-400 font-mono">{index + 1}</td>
                      <td className="py-3.5 px-2">
                        <div className="font-bold text-slate-900">{item.productName}</div>
                        {item.sku && (
                          <div className="text-[11px] text-slate-400 font-mono">SKU: {item.sku}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-2 text-center text-slate-600 font-medium">
                        {item.wholesaleUnit}
                      </td>
                      <td className="py-3.5 px-2 text-right font-mono font-bold text-slate-900">
                        {item.quantity.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-2 text-right font-mono">
                        {item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-2 text-right font-mono font-bold text-slate-900">
                        {item.totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Totals & Payment Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-slate-200 items-start">
              {/* Payment Proof / Settlement Note */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Payment Verification Status
                </span>
                {data.payment ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Method: {data.payment.paymentMethod.replace(/_/g, ' ')}</span>
                    </div>
                    {data.payment.transactionReference && (
                      <div className="text-slate-600">
                        <span className="font-semibold">Txn Reference:</span>{' '}
                        <span className="font-mono font-bold text-slate-800">
                          {data.payment.transactionReference}
                        </span>
                      </div>
                    )}
                    {data.payment.verifiedAt && (
                      <div className="text-slate-500 text-[11px]">
                        Verified at {new Date(data.payment.verifiedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-500 italic">
                    Payment pending or awaiting bank transfer receipt confirmation.
                  </p>
                )}
                <div className="pt-2 text-[11px] text-slate-400">
                  All transactions processed securely via WholesaleHub Ethiopia escrow & settlement engine.
                </div>
              </div>

              {/* Totals Table */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Subtotal Amount:</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {data.invoice.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB
                  </span>
                </div>
                <div className="flex justify-between py-1 text-slate-600">
                  <span>VAT / Tax (15% Included/Assessed):</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {data.invoice.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB
                  </span>
                </div>
                <div className="flex justify-between py-2.5 border-t border-b border-slate-200 text-sm font-black text-slate-900">
                  <span>Total Payable:</span>
                  <span className="font-mono text-emerald-800 text-base">
                    {data.invoice.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {data.invoice.currency}
                  </span>
                </div>
              </div>
            </div>

            {/* Official Footer */}
            <div className="pt-12 text-center text-[11px] text-slate-400 border-t border-slate-100 mt-8 space-y-1">
              <p>This is a computer-generated commercial document issued on WholesaleHub Ethiopia.</p>
              <p>For questions regarding this invoice, contact support@wholesalehub.et or the seller directly.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
