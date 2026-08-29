import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      provider_name,
      name,
      fuel_type,
      standing_charge_daily_rate,
      vat_rate,
      discount_pct,
      exit_fee,
      contract_length_months,
      source_url,
      active,
      plan_rates,
    } = body;

    // Validate required fields
    if (!provider_name || !name || !fuel_type || !source_url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!plan_rates || plan_rates.length === 0) {
      return NextResponse.json({ error: 'At least one plan rate is required' }, { status: 400 });
    }

    // 1. Check if provider exists, if not create it
    let { data: existingProvider } = await supabaseAdmin
      .from('providers')
      .select('id')
      .eq('name', provider_name)
      .single();

    let providerId: string;

    if (!existingProvider) {
      // Create new provider
      const { data: newProvider, error: providerError } = await supabaseAdmin
        .from('providers')
        .insert({ name: provider_name, active: true })
        .select('id')
        .single();

      if (providerError || !newProvider) {
        console.error('Provider insert error:', providerError);
        return NextResponse.json({ error: 'Failed to create provider' }, { status: 500 });
      }

      providerId = newProvider.id;
    } else {
      providerId = existingProvider.id;
    }

    // 2. Insert plan
    const { data: newPlan, error: planError } = await supabaseAdmin
      .from('plans')
      .insert({
        provider_id: providerId,
        name,
        fuel_type,
        standing_charge_daily_rate,
        vat_rate,
        discount_pct,
        exit_fee,
        contract_length_months,
        source_url,
        active: active ?? true,
      })
      .select('id')
      .single();

    if (planError || !newPlan) {
      console.error('Plan insert error:', planError);
      return NextResponse.json({ error: 'Failed to insert plan' }, { status: 500 });
    }

    const planId = newPlan.id;

    // 3. Insert plan rates
    const rateRows = plan_rates.map((rate: any) => ({
      plan_id: planId,
      band_name: rate.band_name,
      band_category: rate.band_category,
      rate_cents_per_kwh: rate.rate_cents_per_kwh,
      price_change_sequence: rate.price_change_sequence,
    }));

    const { error: ratesError } = await supabaseAdmin.from('plan_rates').insert(rateRows);

    if (ratesError) {
      console.error('Plan rates insert error:', ratesError);
      // Delete the plan if rates failed to insert (cleanup)
      await supabaseAdmin.from('plans').delete().eq('id', planId);
      return NextResponse.json({ error: 'Failed to insert plan rates' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      plan_id: planId,
      provider_id: providerId,
      message: `Plan "${name}" added successfully`,
    });
  } catch (err: any) {
    console.error('Add plan error:', err);
    return NextResponse.json({ error: err.message || 'Unexpected error' }, { status: 500 });
  }
}
