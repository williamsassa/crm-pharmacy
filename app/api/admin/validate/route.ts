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

    if (authResult.profile.role !== 'superadmin') {
      return NextResponse.json({ error: 'Acces reserve au super administrateur' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, action } = body as { userId: string; action: 'approve' | 'reject' };

    if (!userId || !action) {
      return NextResponse.json({ error: 'userId et action requis' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    if (action === 'approve') {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'active' })
        .eq('id', userId)
        .eq('status', 'pending');

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'rejected', role: 'assistant' })
        .eq('id', userId)
        .eq('status', 'pending');

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, action });
  } catch (error) {
    console.error('Validate admin error:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
