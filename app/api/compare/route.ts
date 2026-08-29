import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface BillRate {
  band_category: string;
  usage_kwh: number;
  rate_cents_per_kwh: number;
}

interface PlanRate {
  band_category: string;
  rate_cents_per_kwh: number;
}

interface Plan {
  id: string;
  name: string;
  provider_id: string;
  fuel_type: string;
  standing_charge_daily_rate: number;
  vat_rate: number;
  discount_pct: number | null;
  exit_fee: number;
  contract_length_months: number | null;
  source_url: string | null;
  providers: { name: string };
  plan_rates: PlanRate[];
}

export async function GET(req: NextRequest) {
  try {
    const billUploadId = req.nextUrl.searchParams.get('bill_upload_id');
    if (!billUploadId) {
      return NextResponse.json({ error: 'bill_upload_id is required' }, { status: 400 });
    }

    // 1. Fetch the bill
    const { data: bill, error: billError } = await supabaseAdmin
      .from('bill_uploads')
      .select('*, bill_rates(*)')
      .eq('id', billUploadId)
      .single();

    if (billError || !bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }
    if (bill.processing_status !== 'processed') {
      return NextResponse.json({ error: 'Bill has not finished processing' }, { status: 409 });
    }
    if (!bill.fuel_type) {
      return NextResponse.json({ error: 'Could not determine fuel type for this bill' }, { status: 422 });
    }

    const billRates: BillRate[] = bill.bill_rates ?? [];

    // 2. Prefer the bill's stated annual consumption; fall back to annualizing
    //    the billing-period usage if the bill didn't state it explicitly.
    let annualUsageKwh: number;
    if (bill.stated_annual_consumption_kwh) {
      annualUsageKwh = bill.stated_annual_consumption_kwh;
    } else if (bill.billing_period_start && bill.billing_period_end && bill.total_usage_kwh) {
      const start = new Date(bill.billing_period_start);
      const end = new Date(bill.billing_period_end);
      const days = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      annualUsageKwh = (bill.total_usage_kwh / days) * 365;
    } else {
      annualUsageKwh = bill.total_usage_kwh ?? 0;
    }

    // Proportion of usage in each band category (so we can apply it to plans
    // with a different band structure, matched by category)
    const totalBillUsage = billRates.reduce((s, r) => s + Math.max(0, r.usage_kwh), 0) || 1;
    const bandProportions: Record<string, number> = {};
    for (const r of billRates) {
      const cat = r.band_category || 'other';
      bandProportions[cat] = (bandProportions[cat] || 0) + Math.max(0, r.usage_kwh) / totalBillUsage;
    }

    // 3. Fetch active plans matching fuel type, excluding the user's current provider
    const fuelFilter = bill.fuel_type === 'dual_fuel' ? ['electricity', 'gas'] : [bill.fuel_type];

    const { data: plans, error: plansError } = await supabaseAdmin
      .from('plans')
      .select('*, providers(name), plan_rates(*)')
      .eq('active', true)
      .in('fuel_type', fuelFilter);

    if (plansError) {
      console.error('Plans fetch error:', plansError);
      return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
    }

    // Show ALL plans including current provider (they might have better rates!)
    const candidatePlans = plans as unknown as Plan[];

    // 4. Compute estimated annual cost for each plan
    const results = candidatePlans.map((plan) => {
      // Usage-weighted unit cost: distribute annual usage across this plan's
      // bands using the bill's band proportions, matched by band_category.
      let usageCost = 0;
      const planBandCats = new Set(plan.plan_rates.map((r) => r.band_category));

      if (planBandCats.size === 1) {
        // Simple case: plan has one band (usually 24hr) — apply full usage to it
        const rate = plan.plan_rates[0]?.rate_cents_per_kwh ?? 0;
        usageCost = (annualUsageKwh * rate) / 100;
      } else {
        // Multi-band plan: match by category where possible, otherwise spread
        // proportionally across the plan's own bands
        for (const planRate of plan.plan_rates) {
          const proportion = bandProportions[planRate.band_category] ?? 0;
          usageCost += (annualUsageKwh * proportion * planRate.rate_cents_per_kwh) / 100;
        }
        // If none of the bill's bands matched this plan's categories (proportion
        // summed to 0), fall back to splitting usage evenly across plan bands
        if (usageCost === 0 && plan.plan_rates.length > 0) {
          const evenShare = annualUsageKwh / plan.plan_rates.length;
          usageCost = plan.plan_rates.reduce(
            (s, r) => s + (evenShare * r.rate_cents_per_kwh) / 100,
            0
          );
        }
      }

      const discountMultiplier = plan.discount_pct ? 1 - plan.discount_pct / 100 : 1;
      // Note: seeded plan_rates already store post-discount rates where sourced
      // that way (see seed file comments) — discountMultiplier defaults to 1
      // unless you're storing pre-discount rates. Adjust if your data differs.

      const standingChargeAnnual = (plan.standing_charge_daily_rate || 0) * 365;
      const subtotalExVat = usageCost + standingChargeAnnual;
      const vatMultiplier = 1 + (plan.vat_rate ?? 9) / 100;
      const estimatedAnnualCost = Math.round(subtotalExVat * vatMultiplier * 100) / 100;

      return {
        plan_id: plan.id,
        plan_name: plan.name,
        provider_name: plan.providers?.name ?? 'Unknown',
        fuel_type: plan.fuel_type,
        estimated_annual_cost: estimatedAnnualCost,
        exit_fee: plan.exit_fee ?? 0,
        contract_length_months: plan.contract_length_months,
        source_url: plan.source_url,
      };
    });

    // 5. Determine the user's current estimated annual cost using UNIT RATES from bill
    // This approach avoids issues with solar credits, refunds, or other bill adjustments
    let currentAnnualCost: number | null = null;
    if (billRates.length > 0 && annualUsageKwh > 0) {
      // Calculate usage cost based on the rates extracted from the bill
      let currentUsageCost = 0;
      for (const rate of billRates) {
        // Use the proportion of this band's usage to project annual cost
        const proportion = Math.max(0, rate.usage_kwh) / Math.max(1, totalBillUsage);
        currentUsageCost += (annualUsageKwh * proportion * rate.rate_cents_per_kwh) / 100;
      }

      // Add standing charge if available
      const standingChargeAnnual = bill.standing_charge_daily_rate
        ? (bill.standing_charge_daily_rate * 365)
        : 0;

      const subtotalExVat = currentUsageCost + standingChargeAnnual;
      const vatMultiplier = 1 + (bill.vat_rate ?? 9) / 100;
      currentAnnualCost = Math.round(subtotalExVat * vatMultiplier * 100) / 100;
    }

    // 6. Sort ascending by cost, attach savings + exit-fee-adjusted flag
    const ranked = results
      .sort((a, b) => a.estimated_annual_cost - b.estimated_annual_cost)
      .map((r, idx) => {
        const savings = currentAnnualCost !== null ? currentAnnualCost - r.estimated_annual_cost : null;
        const meetsExitThreshold =
          bill.contract_status === 'in_contract' && savings !== null
            ? savings > r.exit_fee
            : true;
        return { ...r, rank: idx + 1, estimated_annual_savings: savings, meets_contract_exit_threshold: meetsExitThreshold };
      });

    // 7. Cache results
    if (ranked.length > 0) {
      const cacheRows = ranked.map((r) => ({
        bill_upload_id: billUploadId,
        plan_id: r.plan_id,
        estimated_annual_cost: r.estimated_annual_cost,
        estimated_annual_savings: r.estimated_annual_savings,
        meets_contract_exit_threshold: r.meets_contract_exit_threshold,
        rank: r.rank,
      }));
      await supabaseAdmin.from('comparison_results').insert(cacheRows);
    }

    return NextResponse.json({
      current_annual_cost: currentAnnualCost,
      current_provider: bill.provider_name,
      contract_status: bill.contract_status,
      results: ranked,
    });
  } catch (err) {
    console.error('Compare route error:', err);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}
