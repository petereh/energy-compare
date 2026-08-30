import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabase';
import { EXTRACTION_SYSTEM_PROMPT } from '@/lib/extraction-prompt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  try {
    console.log('[Upload] Starting upload processing...');
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const contractStatus = formData.get('contract_status') as string | null;
    const contractEndDate = formData.get('contract_end_date') as string | null;
    console.log(`[Upload] File: ${file?.name}, Status: ${contractStatus}`);

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    if (!contractStatus || !['in_contract', 'out_of_contract', 'not_sure'].includes(contractStatus)) {
      return NextResponse.json({ error: 'Invalid contract_status' }, { status: 400 });
    }

    // 1. Extract raw text from the PDF
    // Use pdf-parse-fork which is serverless-compatible (no DOMMatrix issues)
    const pdfParse = require('pdf-parse-fork');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const pdfData = await pdfParse(buffer);
    const rawText = pdfData.text;

    if (!rawText || rawText.trim().length < 50) {
      return NextResponse.json(
        { error: 'Could not extract readable text from this PDF. It may be a scanned image.' },
        { status: 422 }
      );
    }

    // 2. Create a pending row first so we always have a record, even if extraction fails
    const { data: pendingRow, error: insertError } = await supabaseAdmin
      .from('bill_uploads')
      .insert({
        contract_status: contractStatus,
        contract_end_date: contractEndDate || null,
        original_filename: file.name,
        raw_extracted_text: rawText,
        processing_status: 'pending',
      })
      .select('id')
      .single();

    if (insertError || !pendingRow) {
      console.error('Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save upload' }, { status: 500 });
    }

    const billUploadId = pendingRow.id;

    // 3. Call Claude to extract structured data
    let extracted;
    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        system: EXTRACTION_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Extract the structured data from this Irish energy bill:\n\n---\n${rawText}\n---`,
          },
        ],
      });

      const textBlock = message.content.find((b) => b.type === 'text');
      const rawJson = textBlock && 'text' in textBlock ? textBlock.text : '';

      // Aggressive cleaning: strip everything before first { and after last }
      let cleaned = rawJson.trim();
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');

      if (firstBrace === -1 || lastBrace === -1) {
        console.error('No JSON object found in Claude response:', rawJson.substring(0, 200));
        throw new Error('Claude did not return valid JSON');
      }

      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      console.log('[Upload] Extracted JSON length:', cleaned.length);
      extracted = JSON.parse(cleaned);
    } catch (err) {
      console.error('Extraction error:', err);
      await supabaseAdmin
        .from('bill_uploads')
        .update({ processing_status: 'failed', error_message: 'Extraction failed' })
        .eq('id', billUploadId);
      return NextResponse.json({ error: 'Failed to extract bill data' }, { status: 500 });
    }

    // 4. Compute total_usage_kwh by summing bill_rates (net of any negative/credit entries)
    const billRates = Array.isArray(extracted.bill_rates) ? extracted.bill_rates : [];
    const totalUsageKwh = billRates.reduce(
      (sum: number, r: any) => sum + (typeof r.usage_kwh === 'number' ? r.usage_kwh : 0),
      0
    );

    // 5. Update bill_uploads with extracted fields
    const { error: updateError } = await supabaseAdmin
      .from('bill_uploads')
      .update({
        provider_name: extracted.provider_name,
        tariff_name: extracted.tariff_name,
        fuel_type: extracted.fuel_type,
        invoice_number: extracted.invoice_number,
        billing_period_start: extracted.billing_period_start,
        billing_period_end: extracted.billing_period_end,
        total_usage_kwh: totalUsageKwh,
        stated_annual_consumption_kwh: extracted.stated_annual_consumption_kwh,
        total_cost_ex_vat: extracted.total_cost_ex_vat,
        vat_rate: extracted.vat_rate ?? 9,
        source_amounts_were_vat_inclusive: extracted.source_amounts_were_vat_inclusive ?? false,
        standing_charge_daily_rate: extracted.standing_charge_daily_rate,
        standing_charge_days: extracted.standing_charge_days,
        additional_charges: extracted.additional_charges ?? [],
        raw_llm_response: extracted,
        extraction_confidence: extracted.extraction_confidence ?? 'medium',
        processing_status: 'processed',
      })
      .eq('id', billUploadId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to save extracted data' }, { status: 500 });
    }

    // 6. Insert bill_rates rows
    if (billRates.length > 0) {
      const rateRows = billRates.map((r: any, idx: number) => ({
        bill_upload_id: billUploadId,
        band_name: r.band_name ?? 'Unknown',
        band_category: r.band_category ?? 'other',
        usage_kwh: r.usage_kwh ?? 0,
        rate_cents_per_kwh: r.rate_cents_per_kwh ?? 0,
        price_change_sequence: idx + 1,
      }));

      const { error: ratesError } = await supabaseAdmin.from('bill_rates').insert(rateRows);
      if (ratesError) {
        console.error('bill_rates insert error:', ratesError);
        // Non-fatal: bill_uploads row still exists, just log and continue
      }
    }

    console.log(`[Upload] Success! Bill ID: ${billUploadId}`);
    return NextResponse.json({ id: billUploadId, extraction_confidence: extracted.extraction_confidence });
  } catch (err) {
    console.error('[Upload] Error:', err);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}
