'use client';

import React from 'react';
import Link from 'next/link';
import { Locale, supportedLocales, Translations } from '@/lib/i18n';
import { useAuth } from '@/context/auth-context';
import { Globe, User as UserIcon, LogOut, Heart } from 'lucide-react';

interface HeaderProps {
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  t: Translations;
}

export const Header: React.FC<HeaderProps> = ({ locale, onLocaleChange, t }) => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-700 flex items-center justify-center text-white shadow-sm font-bold text-xl">
              W
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 block leading-tight">
                Wholesale<span className="text-emerald-700">Hub</span>
              </span>
              <span className="text-xs text-slate-500 font-medium tracking-wide flex items-center gap-1">
                Ethiopia <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span> Addis Ababa
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/products" className="text-slate-900 font-semibold hover:text-emerald-700 transition">
              {t.navProducts}
            </Link>
            <Link href="/categories" className="hover:text-emerald-700 transition">
              {t.navCategories}
            </Link>
            <Link href="/suppliers" className="hover:text-emerald-700 transition">
              {t.navSuppliers}
            </Link>
            <Link href="/about" className="hover:text-emerald-700 transition">
              {t.navAbout}
            </Link>
            <Link href="/contact" className="hover:text-emerald-700 transition">
              {t.navContact}
            </Link>
          </nav>

          {/* Right Action Section */}
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 border border-slate-200 text-xs">
              <Globe className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
              {supportedLocales.map((loc) => (
                <button
                  key={loc.code}
                  onClick={() => onLocaleChange(loc.code)}
                  className={`px-2 py-1 rounded text-xs font-medium transition ${
                    locale === loc.code
                      ? 'bg-white text-emerald-800 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title={loc.label}
                >
                  {loc.code.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Auth Buttons */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/favorites"
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition"
                  title="Saved Favorites"
                >
                  <Heart className="w-4 h-4" />
                </Link>
                <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  <UserIcon className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="font-semibold">{user.fullName}</span>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-700 border border-slate-200 hover:border-red-200 rounded-lg transition"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition"
                >
                  {t.login}
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition"
                >
                  {t.register}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
