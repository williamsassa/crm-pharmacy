import { classifyPatient } from '@/lib/ai/classify';
import { authenticateRequest } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import type { VisiteTag } from '@/types';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const { profile } = authResult;
    if (!['admin', 'assistant', 'superadmin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
    }

    const body = await request.json();
    const { phone, is_whatsapp, name, motif, medicament, tag } = body as {
      phone: string;
      name?: string;
      motif: string;
      medicament?: string;
      is_whatsapp?: boolean;
      tag: VisiteTag;
    };

    if (!phone || !motif || !tag) {
      return NextResponse.json(
        { error: 'Champs requis manquants (phone, motif, tag)' },
        { status: 400 },
      );
    }

    const supabase = createServiceRoleClient();

    // Check if patient exists
    const { data: existingPatient } = await supabase
      .from('patients')
      .select('*')
      .eq('phone', phone)
      .single();

    let patientId: string;

    if (existingPatient) {
      patientId = existingPatient.id;
      await supabase
        .from('patients')
        .update({
          name: name || existingPatient.name,
          motif_last_visit: motif,
        })
        .eq('id', patientId);
    } else {
      const { data: newPatient, error: insertError } = await supabase
        .from('patients')
        .insert({
          phone,
          is_whatsapp,
          name: name || null,
          motif_last_visit: motif,
          pharmacy_id: profile.id,
        })
        .select()
        .single();

      if (insertError || !newPatient) {
        return NextResponse.json(
          { error: 'Erreur lors de la création du patient' },
          { status: 500 },
        );
      }
      patientId = newPatient.id;
    }

    // Create visite
    const { error: visiteError } = await supabase.from('visites').insert({
      patient_id: patientId,
      motif,
      medicament,
      tag,
      created_at_by: profile.id,
    });

    if (visiteError) {
      return NextResponse.json(
        { error: 'Erreur lors de la création de la visite' },
        { status: 500 },
      );
    }

    // Classify patient asynchronously
    classifyPatientAsync(patientId, motif, tag);

    return NextResponse.json({ success: true, patientId });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

async function classifyPatientAsync(
  patientId: string,
  motif: string,
  tag: VisiteTag,
) {
  try {
    const supabase = createServiceRoleClient();

    const { count } = await supabase
      .from('visites')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', patientId);

    const { data: lastVisites } = await supabase
      .from('visites')
      .select('motif')
      .eq('patient_id', patientId)
      .order('date', { ascending: false })
      .limit(5);

    const result = await classifyPatient({
      motif,
      tag,
      historique_visites: count || 0,
      derniers_motifs: lastVisites?.map((v) => v.motif),
    });

    await supabase
      .from('patients')
      .update({
        segment_ia: result.segment,
        score_fidelite: result.score_fidelite,
      })
      .eq('id', patientId);
  } catch (error) {
    console.error('Classification async error:', error);
  }
}
