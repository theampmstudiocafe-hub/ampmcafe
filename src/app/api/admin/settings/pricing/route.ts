import { NextResponse } from 'next/server';
import { getDynamicPricingSettings, updateDynamicPricingSettings } from '@/lib/cafe/pricing-tax-engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  const settings = getDynamicPricingSettings();
  return NextResponse.json({
    success: true,
    settings,
    notice: 'Statutory GST classification and invoice numbering format are Pending CA Confirmation.',
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { foodGstPercent, serviceChargePercent, serviceChargeEnabled } = body;

    const updated = updateDynamicPricingSettings({
      ...(typeof foodGstPercent === 'number' ? { foodGstPercent } : {}),
      ...(typeof serviceChargePercent === 'number' ? { serviceChargePercent } : {}),
      ...(typeof serviceChargeEnabled === 'boolean' ? { serviceChargeEnabled } : {}),
    });

    return NextResponse.json({
      success: true,
      message: 'Pricing, GST and Service Charge settings updated successfully.',
      settings: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update pricing settings' },
      { status: 400 }
    );
  }
}
