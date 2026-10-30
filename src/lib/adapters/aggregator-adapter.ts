/**
 * THE AM:PM CAFE - Third-Party Online Aggregator Adapter (Zomato / Swiggy)
 * Normalizes incoming webhooks, maps item IDs, and routes tickets into the unified KOT pipeline.
 * Notice: Aggregator GST liability under Section 9(5) CGST Act marked Pending CA Confirmation.
 */

export interface AggregatorItemMapping {
  channel: 'zomato' | 'swiggy';
  externalItemId: string;
  externalItemName: string;
  internalMenuItemId: string | null; // null if unmapped
}

export const aggregatorItemMappingsStore: Map<string, AggregatorItemMapping> = new Map([
  [
    'zom_eb_001',
    {
      channel: 'zomato',
      externalItemId: 'zom_eb_001',
      externalItemName: 'AM:PM Earth Bowl',
      internalMenuItemId: '44444444-4444-4444-4444-444444444401',
    },
  ],
  [
    'swig_matcha_002',
    {
      channel: 'swiggy',
      externalItemId: 'swig_matcha_002',
      externalItemName: 'Ceremonial Uji Matcha Latte',
      internalMenuItemId: '44444444-4444-4444-4444-444444444403',
    },
  ],
]);

export interface IngestedAggregatorOrder {
  channel: 'zomato' | 'swiggy';
  externalOrderId: string;
  customerName?: string;
  customerPhoneMasked?: string;
  items: Array<{
    externalItemId: string;
    name: string;
    quantity: number;
    unitPricePaise: number;
    specialInstructions?: string;
  }>;
  totalCustomerPaidPaise: number;
  deliveryRiderName?: string;
}

export interface NormalizedAggregatorResult {
  orderNumber: string;
  channel: 'zomato' | 'swiggy';
  externalOrderId: string;
  hasUnmappedItems: boolean;
  unmappedItemNames: string[];
  itemsForKot: Array<{
    menuItemId: string;
    name: string;
    quantity: number;
    station: 'food' | 'beverage' | 'dessert';
    unitPricePaise: number;
    specialInstructions?: string;
  }>;
  aggregatorCommissionPaise: number | null; // Nullable until settlement
  aggregatorPayoutPaise: number | null;     // Nullable until settlement
}

/**
 * Normalizes external aggregator orders, resolving item mappings and flagging unmapped items.
 */
export function normalizeAggregatorOrder(payload: IngestedAggregatorOrder): NormalizedAggregatorResult {
  const unmappedItemNames: string[] = [];
  const itemsForKot: any[] = [];

  for (const item of payload.items) {
    const mapping = aggregatorItemMappingsStore.get(item.externalItemId);
    const internalId = mapping?.internalMenuItemId || null;

    if (!internalId) {
      unmappedItemNames.push(item.name);
    }

    // Determine station: if item name contains Matcha/Latte/Elixir -> beverage, Mousse/Pudding -> dessert, else food
    const lowerName = item.name.toLowerCase();
    const station = lowerName.includes('matcha') || lowerName.includes('latte') || lowerName.includes('elixir')
      ? 'beverage'
      : lowerName.includes('mousse') || lowerName.includes('pudding')
      ? 'dessert'
      : 'food';

    itemsForKot.push({
      menuItemId: internalId || `unmapped_${Date.now()}`,
      name: internalId ? item.name : `[UNMAPPED] ${item.name}`,
      quantity: item.quantity,
      station,
      unitPricePaise: item.unitPricePaise,
      specialInstructions: item.specialInstructions || (internalId ? undefined : 'UNMAPPED ITEM: Verify with Manager'),
    });
  }

  const orderNumber = `${payload.channel.toUpperCase()}-${payload.externalOrderId.slice(-6)}`;

  return {
    orderNumber,
    channel: payload.channel,
    externalOrderId: payload.externalOrderId,
    hasUnmappedItems: unmappedItemNames.length > 0,
    unmappedItemNames,
    itemsForKot,
    aggregatorCommissionPaise: null, // Strictly null until settlement reconciliation
    aggregatorPayoutPaise: null,     // Strictly null until settlement reconciliation
  };
}

/**
 * Outbound stub: Sync item availability to aggregator platforms.
 */
export async function syncAggregatorAvailability(
  channel: 'zomato' | 'swiggy',
  externalItemId: string,
  isAvailable: boolean
): Promise<{ success: boolean; channel: string; externalItemId: string; isAvailable: boolean }> {
  // Stubbed outbound sync to aggregator merchant APIs
  return {
    success: true,
    channel,
    externalItemId,
    isAvailable,
  };
}

/**
 * Outbound stub: Sync order status progression to aggregator platforms.
 */
export async function syncAggregatorOrderStatus(
  channel: 'zomato' | 'swiggy',
  externalOrderId: string,
  status: 'accepted' | 'food_ready' | 'dispatched'
): Promise<{ success: boolean; channel: string; externalOrderId: string; status: string }> {
  // Stubbed outbound status update
  return {
    success: true,
    channel,
    externalOrderId,
    status,
  };
}
