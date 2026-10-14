export type Locale = 'en' | 'am' | 'om';

export interface Translations {
  siteName: string;
  tagline: string;
  heroHeadline: string;
  heroSubtitle: string;
  searchPlaceholder: string;
  browseProducts: string;
  becomeSupplier: string;
  requestQuotation: string;
  verifiedSuppliers: string;
  verifiedSuppliersDesc: string;
  tieredPricing: string;
  tieredPricingDesc: string;
  secureSettlement: string;
  secureSettlementDesc: string;
  addisFulfillment: string;
  addisFulfillmentDesc: string;
  systemHealth: string;
  connectingBackend: string;
  backendOnline: string;
  backendOffline: string;
  navProducts: string;
  navCategories: string;
  navSuppliers: string;
  navAbout: string;
  navContact: string;
  login: string;
  register: string;
  allRightsReserved: string;
}

export const translations: Record<Locale, Translations> = {
  en: {
    siteName: 'WholesaleHub Ethiopia',
    tagline: 'Ethiopia’s Premier B2B Wholesale Marketplace',
    heroHeadline: 'Connect Directly with Ethiopia’s Top Manufacturers & Wholesalers',
    heroSubtitle:
      'Discover wholesale pricing, negotiate bulk orders, request quotations, and streamline your supply chain across Addis Ababa and beyond.',
    searchPlaceholder: 'Search products, bulk quantities, manufacturers, or categories...',
    browseProducts: 'Browse Products',
    becomeSupplier: 'Join as Supplier',
    requestQuotation: 'Request Quotation',
    verifiedSuppliers: 'Verified Ethiopian Suppliers',
    verifiedSuppliersDesc: 'Rigorous vetting of manufacturers, importers, and large-scale distributors.',
    tieredPricing: 'Transparent Tiered Pricing',
    tieredPricingDesc: 'Automated quantity-based wholesale discounts with clear MOQs and units.',
    secureSettlement: 'Auditable B2B Commerce',
    secureSettlementDesc: 'Structured purchase orders, official invoices, and formal negotiation trails.',
    addisFulfillment: 'Reliable Regional Delivery',
    addisFulfillmentDesc: 'Configurable logistics covering Addis Ababa sub-cities and regional hubs.',
    systemHealth: 'Backend API Status',
    connectingBackend: 'Checking API health...',
    backendOnline: 'API Online & Operational',
    backendOffline: 'API Unreachable',
    navProducts: 'Products',
    navCategories: 'Categories',
    navSuppliers: 'Suppliers',
    navAbout: 'About',
    navContact: 'Contact',
    login: 'Sign In',
    register: 'Create Account',
    allRightsReserved: 'WholesaleHub Ethiopia. All rights reserved.',
  },
  am: {
    siteName: 'ሆልሴልሀብ ኢትዮጵያ',
    tagline: 'የኢትዮጵያ ቀዳሚ የጅምላ ንግድ የገበያ መድረክ',
    heroHeadline: 'ከኢትዮጵያ ምርጥ አምራቾች እና የጅምላ ሻጮች ጋር በቀጥታ ይገናኙ',
    heroSubtitle:
      'የጅምላ ዋጋዎችን ያግኙ፣ የጅምላ ትዕዛዞችን ይደራደሩ፣ የዋጋ ማቅረቢያ ይጠይቁ፣ እና በአዲስ አበባ እና በመላው ኢትዮጵያ ንግድዎን ያሳድጉ።',
    searchPlaceholder: 'ምርቶችን፣ የጅምላ መጠንን፣ አምራቾችን ወይም ምድቦችን ይፈልጉ...',
    browseProducts: 'ምርቶችን ይመልከቱ',
    becomeSupplier: 'እንደ አቅራቢ ይመዝገቡ',
    requestQuotation: 'የዋጋ ማቅረቢያ ይጠይቁ',
    verifiedSuppliers: 'የተረጋገጡ የኢትዮጵያ አቅራቢዎች',
    verifiedSuppliersDesc: 'የአምራቾች፣ አስመጪዎች እና አከፋፋዮች ጥብቅ የሕጋዊነት ማረጋገጫ።',
    tieredPricing: 'ግልጽ የጅምላ ቅናሾች',
    tieredPricingDesc: 'በትዕዛዝ ብዛት ላይ የተመሰረተ ራስ-ሰር የዋጋ ቅናሽ እና ዝቅተኛ የትዕዛዝ ገደብ።',
    secureSettlement: 'አስተማማኝ የንግድ ግብይት',
    secureSettlementDesc: 'መደበኛ ደረሰኞች፣ ግልጽ የግዥ ውሎች እና ሕጋዊ የድርድር ሂደት።',
    addisFulfillment: 'አስተማማኝ የትራንስፖርት አገልግሎት',
    addisFulfillmentDesc: 'የአዲስ አበባ ክፍለ ከተሞችን እና የክልል ከተሞችን የሚያካትት የትራንስፖርት አማራጮች።',
    systemHealth: 'የስርዓቱ ዝግጁነት ሁኔታ',
    connectingBackend: 'የስርዓት ዝግጁነት በመፈተሽ ላይ...',
    backendOnline: 'ስርዓቱ ዝግጁ ነው እና በመስራት ላይ ይገኛል',
    backendOffline: 'ስርዓቱ አልተገናኘም',
    navProducts: 'ምርቶች',
    navCategories: 'ምድቦች',
    navSuppliers: 'አቅራቢዎች',
    navAbout: 'ስለ እኛ',
    navContact: 'ያግኙን',
    login: 'ግባ',
    register: 'ተመዝገብ',
    allRightsReserved: 'ሆልሴልሀብ ኢትዮጵያ። መብቱ በሕግ የተጠበቀ ነው።',
  },
  om: {
    siteName: 'HoolseelHab Itoophiyaa',
    tagline: 'Gabaa Jumlaa B2B Filatamaa Itoophiyaa',
    heroHeadline: 'Oomishtoota fi Daldaltoota Jumlaa Itoophiyaa Waliin Kallattiin Walqunnamaa',
    heroSubtitle:
      'Gatii jumlaa argadhaa, ajajawwan gurguddoo irratti mari’adhaa, gatii dhiyeessaa gaafadhaa, Finfinnee fi guutuu Itoophiyaatti daldala keessan babal’isaa.',
    searchPlaceholder: 'Oomishoota, baay’ina jumlaa, oomishtoota ykn gareewwan barbaadaa...',
    browseProducts: 'Oomishoota Daawwadhaa',
    becomeSupplier: 'Dhiyeessaa Ta’aa',
    requestQuotation: 'Gatii Gaafadhaa',
    verifiedSuppliers: 'Dhiyeessitoota Mirkanaa’an',
    verifiedSuppliersDesc: 'Mirkaneessa seera qabeessummaa oomishtootaa, galchitoowwanii fi raabsitootaa.',
    tieredPricing: 'Hir’isa Gatii Sadarkaa Qabu',
    tieredPricingDesc: 'Baay’ina ajajaa irratti hundaa’ee hir’isa gatii ofumaan hojjetu.',
    secureSettlement: 'Daldala Nageenya Qabu',
    secureSettlementDesc: 'Nagahee seeraa, unkaalee ajajaa fi marii ifa ta’e.',
    addisFulfillment: 'Tajaajila Dhiyeessaa Finfinnee',
    addisFulfillmentDesc: 'Kutaalee magaalaa Finfinnee fi naannoolee dhiheessuuf kan qophaa’e.',
    systemHealth: 'Haala Hojii API',
    connectingBackend: 'Haala API qorachaa jira...',
    backendOnline: 'API Hojjechaa Jira',
    backendOffline: 'API Hin Argamne',
    navProducts: 'Oomishoota',
    navCategories: 'Gareewwan',
    navSuppliers: 'Dhiyeessitoota',
    navAbout: 'Waa’ee Keenya',
    navContact: 'Nu Qunnamaa',
    login: 'Seensaa',
    register: 'Galmaa’aa',
    allRightsReserved: 'HoolseelHab Itoophiyaa. Mirgi hundi seeraan kan eegame.',
  },
};

export const defaultLocale: Locale = 'en';

export const supportedLocales: { code: Locale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'am', label: 'አማርኛ (Amharic)' },
  { code: 'om', label: 'Afaan Oromoo' },
];

export function getTranslations(locale: Locale): Translations {
  return translations[locale] || translations[defaultLocale];
}
