'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Locale, getTranslations } from '@/lib/i18n';
import { useAuth } from '@/context/auth-context';
import { supplierService, VerificationDocument } from '@/services/supplier.service';
import { DocumentType, VerificationStatus } from '@/types';
import {
  ShieldCheck,
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

export default function SupplierVerificationPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const [locale, setLocale] = useState<Locale>('en');
  const t = getTranslations(locale);

  const [status, setStatus] = useState<VerificationStatus>('PENDING');
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [documentType, setDocumentType] = useState<DocumentType>('BUSINESS_LICENSE');
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    async function loadStatus() {
      if (!accessToken) return;
      setIsLoading(true);
      try {
        const res = await supplierService.getVerificationStatus(accessToken);
        if (res.success && res.data) {
          setStatus(res.data.verificationStatus);
          setDocuments(res.data.documents);
        }
      } catch (err) {
        console.error('Failed to load verification:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (accessToken) {
      loadStatus();
    }
  }, [accessToken, isAuthenticated, authLoading, router]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setIsSubmitting(true);

    try {
      const res = await supplierService.submitVerificationDocument(accessToken, {
        documentType,
        fileName: fileName || `${documentType.toLowerCase()}.pdf`,
        fileUrl: fileUrl || `https://storage.wholesalehub.et/private/${Date.now()}.pdf`,
        fileSize: 1048576, // 1MB sample
        mimeType: 'application/pdf',
      });

      if (res.success && res.data) {
        setDocuments([res.data, ...documents]);
        setFileName('');
        setFileUrl('');
        setSuccessMsg(true);
        setTimeout(() => setSuccessMsg(false), 4000);
      }
    } catch (err) {
      console.error('Failed to submit document:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header locale={locale} onLocaleChange={setLocale} t={t} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="text-xs text-slate-500 mb-4 flex items-center gap-1.5">
          <Link href="/supplier/dashboard" className="hover:text-emerald-700 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Verification</span>
        </nav>

        {/* Status header banner */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  Business Compliance & Verification
                </h1>
                <span
                  className={`text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full ${
                    status === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : status === 'REJECTED'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                WholesaleHub verifies every Ethiopian manufacturer, importer, and distributor before enabling live trade.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Form */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs mb-8">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
            Submit Compliance Document
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Upload your Ethiopian Business License, Taxpayer Identification (TIN) Certificate, or VAT Registration document.
          </p>

          {successMsg && (
            <div className="p-3 mb-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Document successfully uploaded and queued for administrative review.</span>
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Document Type</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                <option value="BUSINESS_LICENSE">Commercial Business License (ንግድ ፈቃድ)</option>
                <option value="TIN_CERTIFICATE">TIN Registration Certificate (የግብር ከፋይ መለያ ቁጥር)</option>
                <option value="VAT_CERTIFICATE">VAT Registration Certificate (የተጨማሪ እሴት ታክስ)</option>
                <option value="IMPORT_EXPORT_PERMIT">Import/Export Permit</option>
                <option value="OTHER">Other Regulatory Document</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Document Reference / Name</label>
              <input
                type="text"
                required
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="e.g. Addis-Ababa-Trade-License-2026.pdf"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Document Storage URI / URL</label>
              <input
                type="text"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://... or storage key"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Verification documents are securely encrypted and never shared with the public.
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-xs transition disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>{isSubmitting ? 'Uploading...' : 'Submit Document'}</span>
            </button>
          </form>
        </div>

        {/* Previously submitted documents */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            Submitted Verification Records ({documents.length})
          </h2>

          {isLoading ? (
            <div className="py-8 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-700 mx-auto" />
            </div>
          ) : documents.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No verification documents submitted yet.
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-emerald-700 shrink-0" />
                    <div>
                      <strong className="block text-slate-900 font-semibold">{doc.fileName}</strong>
                      <span className="text-[11px] text-slate-400 capitalize">
                        {doc.documentType.replace('_', ' ').toLowerCase()}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      doc.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer t={t} />
    </div>
  );
}
