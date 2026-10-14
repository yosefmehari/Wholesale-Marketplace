import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WholesaleHub Ethiopia — B2B Wholesale Marketplace',
  description:
    'Ethiopia’s dedicated B2B wholesale marketplace connecting verified manufacturers, importers, and distributors with retail buyers and enterprises in Addis Ababa and across Ethiopia.',
  keywords: [
    'Ethiopia wholesale',
    'Addis Ababa B2B',
    'wholesale marketplace Ethiopia',
    'bulk orders Addis Ababa',
    'Ethiopian manufacturers',
    'bulk pricing ETB',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
