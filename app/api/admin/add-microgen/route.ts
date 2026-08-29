import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      provider_name,
      export_rate_cents_per_kwh,
      plan_name,
      minimum_contract_months,
      requires_smart_meter,
      additional_requirements,
      source_url,
      valid_from,
      valid_until,
      active,
    } = body;

    // Validate required fields
    if (!provider_name || !export_rate_cents_per_kwh || !source_url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Get or create provider
    let { data: existingProvider } = await supabaseAdmin
      .from('providers')
      .select('id')
      .eq('name', provider_name)
      .single();

    let providerId: string;

    if (!existingProvider) {
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

    // 2. Insert microgen rate
    const { data: newRate, error: rateError } = await supabaseAdmin
      .from('microgen_export_rates')
      .insert({
        provider_id: providerId,
        export_rate_cents_per_kwh,
        plan_name,
        minimum_contract_months,
        requires_smart_meter: requires_smart_meter ?? true,
        additional_requirements,
        source_url,
        valid_from,
        valid_until,
        active: active ?? true,
      })
      .select('id')
      .single();

    if (rateError || !newRate) {
      console.error('Microgen rate insert error:', rateError);
      return NextResponse.json({ error: 'Failed to insert microgen rate' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      id: newRate.id,
      provider_id: providerId,
      message: `Microgen rate for ${provider_name} added successfully`,
    });
  } catch (err: any) {
    console.error('Add microgen error:', err);
    return NextResponse.json({ error: err.message || 'Unexpected error' }, { status: 500 });
  }
}
