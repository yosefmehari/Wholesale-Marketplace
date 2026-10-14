import React from 'react';
import { Translations } from '@/lib/i18n';
import { ShieldCheck, MapPin, Building, Mail } from 'lucide-react';

interface FooterProps {
  t: Translations;
}

export const Footer: React.FC<FooterProps> = ({ t }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-emerald-600 flex items-center justify-center text-white font-bold text-lg">
                W
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Wholesale<span className="text-emerald-500">Hub</span> Ethiopia
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              {t.tagline}. Designed for verified businesses, manufacturers, importers, and bulk buyers across Addis Ababa and Ethiopia.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Addis Ababa, Ethiopia</span>
            </div>
          </div>

          {/* Sourcing */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Wholesale Sourcing
            </h4>
            <ul className="space-y-2 text-xs">
              <li><span className="hover:text-white cursor-pointer transition">Browse All Categories</span></li>
              <li><span className="hover:text-white cursor-pointer transition">Verified Manufacturers</span></li>
              <li><span className="hover:text-white cursor-pointer transition">Importers & Distributors</span></li>
              <li><span className="hover:text-white cursor-pointer transition">Request Bulk Quotation</span></li>
            </ul>
          </div>

          {/* Suppliers */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              For Suppliers
            </h4>
            <ul className="space-y-2 text-xs">
              <li><span className="hover:text-white cursor-pointer transition">Supplier Onboarding</span></li>
              <li><span className="hover:text-white cursor-pointer transition">Business Verification Requirements</span></li>
              <li><span className="hover:text-white cursor-pointer transition">Wholesale Tier Pricing Rules</span></li>
              <li><span className="hover:text-white cursor-pointer transition">Supplier Dashboard</span></li>
            </ul>
          </div>

          {/* Trust & Legal */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Trust & Compliance
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Business Profiles</span>
              </li>
              <li><span className="hover:text-white cursor-pointer transition">Terms of Service</span></li>
              <li><span className="hover:text-white cursor-pointer transition">Privacy Policy</span></li>
              <li><span className="hover:text-white cursor-pointer transition">Commercial Invoicing</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {t.allRightsReserved}</p>
          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <span>ETB (Ethiopian Birr)</span>
            <span>•</span>
            <span>Africa/Addis_Ababa Timezone</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
