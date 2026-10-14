'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Locale, getTranslations } from '@/lib/i18n';
import { UserRole } from '@/types';
import { Lock, Mail, User as UserIcon, Phone, AlertCircle, ArrowRight, Check, Shield } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [locale, setLocale] = useState<Locale>('en');
  const t = getTranslations(locale);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('BUYER');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password strength checks
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordStrong = hasMinLength && hasUpper && hasLower && hasNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordStrong) {
      setError('Please meet all password security requirements before proceeding.');
      return;
    }

    setIsSubmitting(true);
    const result = await register({
      fullName,
      email,
      phone: phone || undefined,
      password,
      role,
    });
    setIsSubmitting(false);

    if (result.success) {
      router.push('/');
    } else {
      setError(result.error || 'Registration failed. Please check form inputs.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header locale={locale} onLocaleChange={setLocale} t={t} />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg w-full space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-sm">
              W
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
              Create your WholesaleHub account
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Join Ethiopia’s premier digital wholesale trading network
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3.5 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            {/* Account Type Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Select Your Business Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('BUYER')}
                  className={`p-3 text-left rounded-xl border transition ${
                    role === 'BUYER'
                      ? 'border-emerald-700 bg-emerald-50/50 text-emerald-950 ring-1 ring-emerald-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">Wholesale Buyer</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Retailers, Cooperatives, Commercial Buyers</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('SUPPLIER')}
                  className={`p-3 text-left rounded-xl border transition ${
                    role === 'SUPPLIER'
                      ? 'border-emerald-700 bg-emerald-50/50 text-emerald-950 ring-1 ring-emerald-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">Supplier / Seller</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Manufacturers, Importers, Wholesalers</div>
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Representative Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Abebe Balcha"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-slate-900"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Corporate / Business Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="procurement@company.et"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-slate-900"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ethiopian Mobile Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+251 911 234567 or 0911234567"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-slate-900"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-slate-900"
                />
              </div>

              {/* Password Requirements Badges */}
              <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px] text-slate-500">
                <span className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-700 font-medium' : ''}`}>
                  <Check className={`w-3 h-3 ${hasMinLength ? 'text-emerald-600' : 'text-slate-300'}`} />
                  8+ characters
                </span>
                <span className={`flex items-center gap-1 ${hasUpper ? 'text-emerald-700 font-medium' : ''}`}>
                  <Check className={`w-3 h-3 ${hasUpper ? 'text-emerald-600' : 'text-slate-300'}`} />
                  Uppercase letter
                </span>
                <span className={`flex items-center gap-1 ${hasLower ? 'text-emerald-700 font-medium' : ''}`}>
                  <Check className={`w-3 h-3 ${hasLower ? 'text-emerald-600' : 'text-slate-300'}`} />
                  Lowercase letter
                </span>
                <span className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-700 font-medium' : ''}`}>
                  <Check className={`w-3 h-3 ${hasNumber ? 'text-emerald-600' : 'text-slate-300'}`} />
                  At least one digit
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2.5 px-4 rounded-lg text-sm shadow-sm transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Creating Account...</span>
              ) : (
                <>
                  <span>Complete Registration</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="border-t border-slate-200 pt-4 text-center">
            <p className="text-xs text-slate-600">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-emerald-700 hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer t={t} />
    </div>
  );
}
