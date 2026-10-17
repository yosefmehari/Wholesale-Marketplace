'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Locale, getTranslations } from '@/lib/i18n';
import { cartService, CartData } from '@/services/cart.service';
import { addressService, Address } from '@/services/address.service';
import { orderService, Order } from '@/services/order.service';
import { useAuth } from '@/context/auth-context';
import {
  ShieldCheck,
  Building2,
  MapPin,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  Loader2,
  PackageCheck,
  AlertCircle,
  Truck,
  Plus,
} from 'lucide-react';

const ADDIS_SUB_CITIES = [
  'Addis Ketema',
  'Akaky Kaliti',
  'Arada',
  'Bole',
  'Gullele',
  'Kirkos',
  'Kolfe Keranio',
  'Lideta',
  'Nifas Silk-Lafto',
  'Yeka',
  'Lemi Kura',
];

export default function CheckoutPage() {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>('en');
  const t = getTranslations(locale);
  const { user, isLoading: authLoading } = useAuth();

  const [cart, setCart] = useState<CartData | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  // New address form state
  const [recipientName, setRecipientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [subCity, setSubCity] = useState(ADDIS_SUB_CITIES[0]);
  const [woreda, setWoreda] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [landmark, setLandmark] = useState('');

  // Payment method & notes
  const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSFER' | 'TELEBIRR' | 'CBE_BIRR' | 'CASH_ON_DELIVERY'>('BANK_TRANSFER');
  const [notes, setNotes] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedOrders, setCompletedOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [cartRes, addrRes] = await Promise.all([
          cartService.getCart(),
          addressService.getAddresses(),
        ]);

        if (cartRes.success && cartRes.data) {
          setCart(cartRes.data);
        }

        if (addrRes.success && addrRes.data) {
          setAddresses(addrRes.data);
          const defaultAddr = addrRes.data.find((a) => a.isDefault) || addrRes.data[0];
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
          } else {
            setIsAddingAddress(true);
          }
        }
      } catch (err) {
        console.error('Failed to load checkout data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading) {
      if (user) {
        loadData();
      } else {
        setIsLoading(false);
      }
    }
  }, [user, authLoading]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart || cart.items.length === 0) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      let finalAddressId = selectedAddressId;

      // If user filled in a new address form
      if (isAddingAddress) {
        if (!recipientName || !phoneNumber || !subCity) {
          setErrorMessage('Please provide recipient contact name, phone number, and sub-city.');
          setIsSubmitting(false);
          return;
        }

        const newAddrRes = await addressService.createAddress({
          recipientName,
          phoneNumber,
          city: 'Addis Ababa',
          subCity,
          woreda,
          houseNumber,
          landmark,
          isDefault: true,
        });

        if (newAddrRes.success && newAddrRes.data) {
          finalAddressId = newAddrRes.data.id;
        } else {
          setErrorMessage(newAddrRes.error?.message || 'Failed to save delivery address');
          setIsSubmitting(false);
          return;
        }
      }

      if (!finalAddressId) {
        setErrorMessage('A delivery address is required to place wholesale orders.');
        setIsSubmitting(false);
        return;
      }

      const checkoutRes = await orderService.checkout({
        shippingAddressId: finalAddressId,
        paymentMethod,
        notes: notes.trim() || undefined,
      });

      if (checkoutRes.success && checkoutRes.data) {
        setCompletedOrders(checkoutRes.data);
      } else {
        setErrorMessage(checkoutRes.error?.message || 'Checkout failed. Please verify stock availability.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during checkout.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If order was successfully placed, render Order Confirmation
  if (completedOrders) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Header locale={locale} onLocaleChange={setLocale} t={t} />

        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-12">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-700">
              <PackageCheck className="w-9 h-9" />
            </div>

            <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest bg-emerald-100 px-3 py-1 rounded-full">
              Order Confirmed
            </span>

            <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Commercial Wholesale Order(s) Placed!
            </h1>

            <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
              Your order has been partitioned into{' '}
              <strong className="text-slate-800">{completedOrders.length} independent supplier shipment(s)</strong>.
              Each supplier will verify stock and confirm order fulfillment.
            </p>

            <div className="mt-8 space-y-4 text-left max-w-xl mx-auto">
              {completedOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-extrabold text-slate-900">
                        {ord.orderNumber}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        {ord.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{ord.supplierBusiness?.name || 'Verified Supplier'}</span>
                    </div>

                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {ord.items?.length || 0} product line(s) • Total: {ord.totalAmount.toLocaleString()} ETB
                    </div>
                  </div>

                  <Link
                    href={`/orders/${ord.id}`}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-700 text-white font-bold text-xs rounded-xl hover:bg-emerald-800 transition shrink-0"
                  >
                    <span>View Order Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/orders"
                className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
              >
                Go to My Orders
              </Link>
              <Link
                href="/products"
                className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Continue Purchasing
              </Link>
            </div>
          </div>
        </main>

        <Footer t={t} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header locale={locale} onLocaleChange={setLocale} t={t} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          Multi-Supplier Checkout
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mb-8">
          Review commercial delivery terms and confirm independent supplier order fulfillment
        </p>

        {isLoading && (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
          </div>
        )}

        {!isLoading && (!cart || cart.items.length === 0) && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto my-12">
            <PackageCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h2 className="text-base font-bold text-slate-900">Your wholesale cart is empty</h2>
            <Link
              href="/products"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold"
            >
              <span>Browse Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {!isLoading && cart && cart.items.length > 0 && (
          <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Delivery, Payment, and Multi-Supplier Split Details */}
            <div className="lg:col-span-8 space-y-6">
              {/* Section 1: Delivery Address */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-700" />
                    <span>1. Commercial Delivery Address</span>
                  </h2>

                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsAddingAddress(!isAddingAddress)}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAddingAddress ? 'Select Saved Address' : 'Add New Address'}</span>
                    </button>
                  )}
                </div>

                {!isAddingAddress && addresses.length > 0 ? (
                  <div className="space-y-3">
                    {addresses.map((addr) => (
                      <label
                        key={addr.id}
                        className={`block p-4 rounded-xl border cursor-pointer transition ${
                          selectedAddressId === addr.id
                            ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="address"
                            value={addr.id}
                            checked={selectedAddressId === addr.id}
                            onChange={() => setSelectedAddressId(addr.id)}
                            className="mt-1 text-emerald-700 focus:ring-emerald-600"
                          />
                          <div className="text-xs flex-1">
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span>{addr.recipientName}</span>
                              <span className="text-slate-400 font-normal">({addr.phoneNumber})</span>
                              {addr.isDefault && (
                                <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                  Default
                                </span>
                              )}
                            </div>
                            <div className="text-slate-600 mt-1">
                              {addr.subCity}, {addr.city}
                              {addr.woreda && ` • Woreda ${addr.woreda}`}
                              {addr.houseNumber && ` • House #${addr.houseNumber}`}
                            </div>
                            {addr.landmark && (
                              <div className="text-slate-400 text-[11px] mt-0.5">
                                Landmark: {addr.landmark}
                              </div>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Recipient Name / Business Contact *
                      </label>
                      <input
                        type="text"
                        required
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="e.g. Abebe Balcha (Receiving Manager)"
                        className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Contact Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+251 911 234567"
                        className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Addis Ababa Sub-City *
                      </label>
                      <select
                        value={subCity}
                        onChange={(e) => setSubCity(e.target.value)}
                        className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
                      >
                        {ADDIS_SUB_CITIES.map((sc) => (
                          <option key={sc} value={sc}>
                            {sc}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Woreda / Kebele
                      </label>
                      <input
                        type="text"
                        value={woreda}
                        onChange={(e) => setWoreda(e.target.value)}
                        placeholder="e.g. Woreda 03"
                        className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        House / Warehouse Number
                      </label>
                      <input
                        type="text"
                        value={houseNumber}
                        onChange={(e) => setHouseNumber(e.target.value)}
                        placeholder="e.g. Warehouse 14B"
                        className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Landmark / Nearest Location
                      </label>
                      <input
                        type="text"
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        placeholder="e.g. Near Meskel Flower"
                        className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Section 2: Payment Method */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-700" />
                    <span>2. Commercial Payment Terms</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      id: 'BANK_TRANSFER',
                      label: 'Direct Bank Wire / Pro-forma',
                      desc: 'CBE, Awash, Dashen, Bank of Abyssinia commercial transfer',
                    },
                    {
                      id: 'TELEBIRR',
                      label: 'telebirr SuperApp',
                      desc: 'Instant Ethio Telecom merchant account settlement',
                    },
                    {
                      id: 'CBE_BIRR',
                      label: 'CBE Birr',
                      desc: 'Commercial Bank of Ethiopia mobile merchant transfer',
                    },
                    {
                      id: 'CASH_ON_DELIVERY',
                      label: 'Warehouse Collection Settlement',
                      desc: 'Payment upon verification at supplier depot',
                    },
                  ].map((pm) => (
                    <label
                      key={pm.id}
                      className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                        paymentMethod === pm.id
                          ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={pm.id}
                        checked={paymentMethod === pm.id}
                        onChange={() => setPaymentMethod(pm.id as any)}
                        className="mt-1 text-emerald-700 focus:ring-emerald-600"
                      />
                      <div>
                        <span className="font-bold text-xs text-slate-900 block">{pm.label}</span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">{pm.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Section 3: Multi-Supplier Shipments Preview */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-700" />
                    <span>3. Multi-Supplier Shipments ({cart.supplierGroups.length})</span>
                  </h2>
                  <span className="text-xs text-slate-500 font-medium">Independent Supplier Orders</span>
                </div>

                <div className="space-y-4">
                  {cart.supplierGroups.map((group, idx) => (
                    <div key={group.supplier.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between mb-3 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Shipment {idx + 1}: {group.supplier.name}</span>
                          {group.supplier.isVerified && (
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                          )}
                        </div>
                        <span className="font-mono font-bold text-emerald-800">
                          {group.subtotal.toLocaleString()} ETB
                        </span>
                      </div>

                      <div className="divide-y divide-slate-200/60 text-xs">
                        {group.items.map((item) => (
                          <div key={item.id} className="py-2 flex items-center justify-between">
                            <span className="text-slate-700 truncate max-w-xs">
                              {item.product.name} × {item.quantity} {item.wholesaleUnit.toLowerCase()}s
                            </span>
                            <span className="font-mono text-slate-900 font-semibold">
                              {item.totalPrice.toLocaleString()} ETB
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: Delivery Instructions & Notes */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  Delivery Instructions / Warehouse Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Please arrange afternoon delivery, forklifts available at gate 2."
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>

            {/* Right Column: Order Summary & Place Order */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs sticky top-24 space-y-4">
              <h2 className="font-extrabold text-base text-slate-900 pb-3 border-b border-slate-100">
                Payment Summary
              </h2>

              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Product Subtotal</span>
                  <span className="font-bold text-slate-800">{cart.subtotal.toLocaleString()} ETB</span>
                </div>
                <div className="flex justify-between">
                  <span>Independent Orders</span>
                  <span className="font-bold text-slate-800">{cart.supplierGroups.length} supplier(s)</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Commission</span>
                  <span className="font-bold text-emerald-700">0.00 ETB (Waived)</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Total Due</span>
                  <span className="text-2xl font-black text-emerald-800 font-mono">
                    {cart.subtotal.toLocaleString()} ETB
                  </span>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || cart.hasValidationErrors}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 disabled:text-slate-500 text-white flex items-center justify-center gap-2 shadow-sm transition"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Orders...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Place {cart.supplierGroups.length} Order(s)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-[11px] text-slate-400 space-y-1.5 leading-relaxed pt-2">
                <p className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Buyer Protection & Escrow Terms</span>
                </p>
                <p>
                  Wholesale inventory is reserved atomically in our database. Suppliers review and confirm fulfillment within 24 hours.
                </p>
              </div>
            </div>
          </form>
        )}
      </main>

      <Footer t={t} />
    </div>
  );
}
