'use client';

import OrderDetailsPage from '@/app/orders/[id]/page';

export default function BuyerOrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  return <OrderDetailsPage params={params} />;
}
