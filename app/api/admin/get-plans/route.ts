import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data: plans, error } = await supabaseAdmin
      .from('plans')
      .select(`
        id,
        name,
        fuel_type,
        standing_charge_daily_rate,
        vat_rate,
        discount_pct,
        exit_fee,
        contract_length_months,
        source_url,
        active,
        providers (name),
        plan_rates (band_name, band_category, rate_cents_per_kwh, price_change_sequence)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get plans error:', error);
      return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
    }

    // Transform data to include provider_name
    const transformedPlans = (plans || []).map((plan: any) => ({
      ...plan,
      provider_name: plan.providers?.name || 'Unknown',
      plan_rates: plan.plan_rates || [],
    }));

    return NextResponse.json({ plans: transformedPlans });
  } catch (err: any) {
    console.error('Get plans error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
