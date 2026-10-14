'use client';

import React from 'react';
import { Locale, supportedLocales, Translations } from '@/lib/i18n';
import { Globe, Building2, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  t: Translations;
}

export const Header: React.FC<HeaderProps> = ({ locale, onLocaleChange, t }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
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
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <span className="text-slate-900 font-semibold cursor-pointer hover:text-emerald-700 transition">
              {t.navProducts}
            </span>
            <span className="cursor-pointer hover:text-emerald-700 transition">
              {t.navCategories}
            </span>
            <span className="cursor-pointer hover:text-emerald-700 transition">
              {t.navSuppliers}
            </span>
            <span className="cursor-pointer hover:text-emerald-700 transition">
              {t.navAbout}
            </span>
            <span className="cursor-pointer hover:text-emerald-700 transition">
              {t.navContact}
            </span>
          </nav>

          {/* Right Action Section: Language Selector & Sign In */}
          <div className="flex items-center gap-3">
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

            <button className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition">
              {t.login}
            </button>
            <button className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition">
              {t.register}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
