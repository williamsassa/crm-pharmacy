import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { classifyPatient } from '@/lib/ai/classify';
import type { VisiteTag } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const body = await request.json();
    const { motif, tag, historique_visites, derniers_motifs } = body as {
      motif: string;
      tag: VisiteTag;
      historique_visites: number;
      derniers_motifs?: string[];
    };

    if (!motif || !tag) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
    }

    const result = await classifyPatient({
      motif,
      tag,
      historique_visites: historique_visites || 0,
      derniers_motifs,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Classify error:', error);
    return NextResponse.json({ error: 'Erreur de classification' }, { status: 500 });
  }
}
