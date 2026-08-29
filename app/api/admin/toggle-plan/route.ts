import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { plan_id, active } = await req.json();

    if (!plan_id) {
      return NextResponse.json({ error: 'plan_id is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('plans')
      .update({ active })
      .eq('id', plan_id);

    if (error) {
      console.error('Toggle plan error:', error);
      return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Toggle plan error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
