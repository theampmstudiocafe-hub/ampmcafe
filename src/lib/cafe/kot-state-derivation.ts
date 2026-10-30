/**
 * THE AM:PM CAFE - Derived Order & KOT State Engine
 * Order status is an authoritative derived aggregate of station KOT statuses.
 */

export type KotStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'served' | 'rejected';

export interface KotRecord {
  id: string;
  orderId: string;
  kotNumber: string;
  station: 'food' | 'beverage' | 'dessert';
  status: KotStatus;
  rejectionReason?: string;
  items: Array<{
    menuItemId: string;
    name: string;
    quantity: number;
    unitPricePaise: number;
    specialInstructions?: string;
  }>;
}

export interface DerivedOrderState {
  orderStatus: 'payment_pending' | 'paid' | 'accepted' | 'preparing' | 'ready' | 'served' | 'rejected' | 'payment_failed' | 'expired' | 'cancelled';
  allNonRejectedServed: boolean;
  hasPartialRejection: boolean;
  rejectedKots: KotRecord[];
  activeKots: KotRecord[];
}

/**
 * Derives overall order status from station KOTs.
 * Rules:
 * 1. If base order is in payment_pending, payment_failed, expired, or cancelled, return base status.
 * 2. If all KOTs are rejected -> 'rejected'
 * 3. If all non-rejected KOTs are served -> 'served'
 * 4. If all non-rejected KOTs are ready/served -> 'ready'
 * 5. If any non-rejected KOT is preparing (or ready) -> 'preparing'
 * 6. If any non-rejected KOT is accepted -> 'accepted'
 * 7. Else -> 'paid' (awaiting kitchen acceptance)
 */
export function deriveOrderStatus(
  baseOrderStatus: string,
  kots: KotRecord[]
): DerivedOrderState {
  if (['payment_pending', 'payment_failed', 'expired', 'cancelled'].includes(baseOrderStatus)) {
    return {
      orderStatus: baseOrderStatus as any,
      allNonRejectedServed: false,
      hasPartialRejection: false,
      rejectedKots: [],
      activeKots: kots,
    };
  }

  if (!kots || kots.length === 0) {
    return {
      orderStatus: (baseOrderStatus as any) || 'paid',
      allNonRejectedServed: false,
      hasPartialRejection: false,
      rejectedKots: [],
      activeKots: [],
    };
  }

  const rejectedKots = kots.filter((k) => k.status === 'rejected');
  const activeKots = kots.filter((k) => k.status !== 'rejected');
  const hasPartialRejection = rejectedKots.length > 0 && activeKots.length > 0;

  if (activeKots.length === 0 && rejectedKots.length > 0) {
    return {
      orderStatus: 'rejected',
      allNonRejectedServed: false,
      hasPartialRejection: false,
      rejectedKots,
      activeKots: [],
    };
  }

  const allServed = activeKots.every((k) => k.status === 'served');
  if (allServed) {
    return {
      orderStatus: 'served',
      allNonRejectedServed: true,
      hasPartialRejection,
      rejectedKots,
      activeKots,
    };
  }

  const allReadyOrServed = activeKots.every((k) => ['ready', 'served'].includes(k.status));
  if (allReadyOrServed) {
    return {
      orderStatus: 'ready',
      allNonRejectedServed: false,
      hasPartialRejection,
      rejectedKots,
      activeKots,
    };
  }

  const anyPrepOrReady = activeKots.some((k) => ['preparing', 'ready', 'served'].includes(k.status));
  if (anyPrepOrReady) {
    return {
      orderStatus: 'preparing',
      allNonRejectedServed: false,
      hasPartialRejection,
      rejectedKots,
      activeKots,
    };
  }

  const anyAccepted = activeKots.some((k) => k.status === 'accepted');
  if (anyAccepted) {
    return {
      orderStatus: 'accepted',
      allNonRejectedServed: false,
      hasPartialRejection,
      rejectedKots,
      activeKots,
    };
  }

  return {
    orderStatus: 'paid',
    allNonRejectedServed: false,
    hasPartialRejection,
    rejectedKots,
    activeKots,
  };
}
