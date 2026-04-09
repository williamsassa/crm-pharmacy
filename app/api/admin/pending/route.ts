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

    if (authResult.profile.role !== 'superadmin') {
      return NextResponse.json({ error: 'Acces reserve au super administrateur' }, { status: 403 });
    }

    const supabase = createServiceRoleClient();

    const { data: admins, error } = await supabase
      .from('profiles')
      .select('id, email, phone, pharmacy_name, created_at')
      .eq('role', 'admin')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ admins: admins || [] });
  } catch (error) {
    console.error('Pending admins error:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
