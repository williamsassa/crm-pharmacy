import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.rpc('request_admin_role', {
      user_id: authResult.uid,
      pharmacy: authResult.profile.pharmacy_name || 'Pharmacie FATIMA',
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ result: data });
  } catch (error) {
    console.error('Request admin error:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
