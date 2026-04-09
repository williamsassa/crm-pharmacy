import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const segment = searchParams.get('segment');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (phone) {
      const { data: patient } = await supabase
        .from('patients')
        .select('*')
        .eq('phone', phone)
        .single();

      return NextResponse.json({ patient: patient || null });
    }

    let query = supabase
      .from('patients')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (segment) {
      query = query.eq('segment_ia', segment);
    }

    const { data: patients, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      patients: patients || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('List patients error:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
