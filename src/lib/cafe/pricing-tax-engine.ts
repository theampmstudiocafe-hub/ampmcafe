/**
 * THE AM:PM CAFE - Pricing, Tax & Currency Engine
 * All calculations execute in integer paise (1 INR = 100 paise) with half-up rounding.
 * Marked: Pending CA Confirmation.
 */

export interface LineItemInput {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPricePaise: number;
  station: 'food' | 'beverage' | 'dessert';
  specialInstructions?: string;
  modifiers?: Array<{
    name: string;
    pricePaise: number;
  }>;
}

export interface PricingSettings {
  foodGstPercent: number;          // Default 5.0 (2.5% CGST + 2.5% SGST)
  serviceChargePercent: number;    // Default 0.0 (optional)
  serviceChargeEnabled: boolean;   // Default false
}

export interface CalculatedBill {
  subtotalPaise: number;
  serviceChargePaise: number;
  taxableBasePaise: number;
  cgstPaise: number;
  sgstPaise: number;
  totalGstPaise: number;
  totalGrossPaise: number;
  lineItems: Array<LineItemInput & {
    lineSubtotalPaise: number;
  }>;
}

export const DEFAULT_PRICING_SETTINGS: PricingSettings = {
  foodGstPercent: 5.0,
  serviceChargePercent: 0.0,
  serviceChargeEnabled: false,
};

/**
 * Calculates itemized line totals, taxes, and grand totals in integer paise.
 * Documented Rounding Rule: Math.round() half-up to nearest integer paise.
 */
export function calculateOrderBill(
  items: LineItemInput[],
  settings: PricingSettings = DEFAULT_PRICING_SETTINGS
): CalculatedBill {
  let subtotalPaise = 0;

  const processedItems = items.map((item) => {
    const modifierTotal = (item.modifiers || []).reduce((sum, m) => sum + m.pricePaise, 0);
    const effectiveUnitPrice = item.unitPricePaise + modifierTotal;
    const lineSubtotalPaise = item.quantity * effectiveUnitPrice;
    subtotalPaise += lineSubtotalPaise;

    return {
      ...item,
      lineSubtotalPaise,
    };
  });

  const serviceChargePaise = settings.serviceChargeEnabled && settings.serviceChargePercent > 0
    ? Math.round((subtotalPaise * settings.serviceChargePercent) / 100)
    : 0;

  const taxableBasePaise = subtotalPaise + serviceChargePaise;

  // Split into equal CGST and SGST with half-up rounding
  const halfGstRate = settings.foodGstPercent / 2;
  const cgstPaise = Math.round((taxableBasePaise * halfGstRate) / 100);
  const sgstPaise = Math.round((taxableBasePaise * halfGstRate) / 100);
  const totalGstPaise = cgstPaise + sgstPaise;

  const totalGrossPaise = taxableBasePaise + totalGstPaise;

  return {
    subtotalPaise,
    serviceChargePaise,
    taxableBasePaise,
    cgstPaise,
    sgstPaise,
    totalGstPaise,
    totalGrossPaise,
    lineItems: processedItems,
  };
}

/**
 * Formats paise to display INR string without Unicode symbol for ESC/POS safety.
 * E.g. 38000 -> "Rs. 380.00"
 */
export function formatPaiseAscii(paise: number): string {
  const inr = (paise / 100).toFixed(2);
  return `Rs. ${inr}`;
}
