import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const { profile } = authResult;

    let redirect = '/dashboard/comptoir';

    if (profile.role === 'superadmin') {
      redirect = '/dashboard/superadmin';
    } else if (profile.role === 'admin' && profile.status === 'active') {
      redirect = '/dashboard/admin';
    } else if (profile.role === 'admin' && profile.status === 'pending') {
      redirect = '/pending';
    }

    return NextResponse.json({
      redirect,
      profile: {
        id: profile.id,
        email: profile.email,
        phone: profile.phone,
        role: profile.role,
        status: profile.status,
        pharmacy_name: profile.pharmacy_name,
      },
    });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
