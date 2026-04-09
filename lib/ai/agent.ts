import { createServiceRoleClient } from '@/lib/supabase/server';
import { callGemma } from './gemma';
import type { PatientAlerte, AgentTickResult } from '@/types';

const AGENT_SYSTEM_PROMPT = `Tu es l'assistant IA de la Pharmacie FATIMA. Tu as accès aux données patients en temps réel. Tu peux répondre à des questions sur les patients, générer des messages de relance personnalisés, identifier les patients à risque, et suggérer des actions proactives. Tu restes actif et vigilant : si tu détectes un patient chronique sans visite depuis plus de 30 jours, tu le signales spontanément. Tu réponds en français, de manière professionnelle et concise.`;

export function getChatSystemPrompt(context: string): string {
  return `${AGENT_SYSTEM_PROMPT}

Voici les données actuelles de la pharmacie :
${context}

Réponds en français de manière professionnelle. Utilise les données fournies pour répondre précisément.`;
}

export async function getDBContext(pharmacyId?: string): Promise<string> {
  const supabase = createServiceRoleClient();

  let patientsQuery = supabase.from('patients').select('*').order('created_at', { ascending: false }).limit(50);
  if (pharmacyId) {
    patientsQuery = patientsQuery.eq('pharmacy_id', pharmacyId);
  }
  const { data: patients } = await patientsQuery;

  const today = new Date().toISOString().split('T')[0];
  let visitesQuery = supabase.from('visites').select('*, patients(name, phone, segment_ia)').gte('date', `${today}T00:00:00`);
  const { data: visitesToday } = await visitesQuery;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let alertQuery = supabase
    .from('patients')
    .select('id, name, phone, segment_ia, created_at')
    .in('segment_ia', ['Chronique', 'Risque']);
  if (pharmacyId) {
    alertQuery = alertQuery.eq('pharmacy_id', pharmacyId);
  }
  const { data: risquePatients } = await alertQuery;

  const alertPatients: PatientAlerte[] = [];
  if (risquePatients) {
    for (const p of risquePatients) {
      const { data: lastVisite } = await supabase
        .from('visites')
        .select('date')
        .eq('patient_id', p.id)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (lastVisite) {
        const daysSince = Math.floor(
          (Date.now() - new Date(lastVisite.date).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSince > 30) {
          alertPatients.push({
            id: p.id,
            name: p.name,
            phone: p.phone,
            segment_ia: p.segment_ia,
            derniere_visite: lastVisite.date,
            jours_sans_visite: daysSince,
          });
        }
      }
    }
  }

  return `
--- RESUME ---
Total patients: ${patients?.length || 0}
Visites aujourd'hui: ${visitesToday?.length || 0}
Patients a relancer (>30j): ${alertPatients.length}

--- PATIENTS RECENTS (${patients?.length || 0}) ---
${patients?.map((p) => `- ${p.name || 'Sans nom'} (${p.phone}) | Segment: ${p.segment_ia || 'Non classé'} | Score: ${p.score_fidelite}`).join('\n') || 'Aucun patient'}

--- VISITES DU JOUR ---
${visitesToday?.map((v: Record<string, unknown>) => {
  const pat = v.patients as Record<string, unknown> | null;
  return `- ${pat?.name || 'Inconnu'} (${pat?.phone || ''}) : ${v.motif}`;
}).join('\n') || 'Aucune visite aujourd\'hui'}

--- ALERTES RELANCE ---
${alertPatients.map((a) => `- ${a.name || 'Sans nom'} (${a.phone}) | Segment: ${a.segment_ia} | Dernière visite il y a ${a.jours_sans_visite} jours`).join('\n') || 'Aucune alerte'}
`;
}

export async function runAgentTick(): Promise<AgentTickResult> {
  const context = await getDBContext();

  const response = await callGemma(
    AGENT_SYSTEM_PROMPT,
    [
      {
        role: 'user',
        content: `Analyse les données suivantes et identifie les actions proactives à prendre. Signale les patients chroniques ou à risque qui nécessitent une relance. Réponds en JSON valide avec le format : { "alerts": [...], "actions_taken": [...] }

${context}`,
      },
    ],
    { temperature: 0.3, jsonMode: true }
  );

  try {
    const parsed = JSON.parse(response);
    return {
      alerts: parsed.alerts || [],
      actions_taken: parsed.actions_taken || [],
      timestamp: new Date().toISOString(),
    };
  } catch {
    return {
      alerts: [],
      actions_taken: ['Tick exécuté - Aucune action requise'],
      timestamp: new Date().toISOString(),
    };
  }
}

export function buildToolContext(toolName: string, args: Record<string, unknown>): string {
  switch (toolName) {
    case 'get_patients_list':
      return `Recherche de patients avec les filtres : ${JSON.stringify(args)}`;
    case 'get_patient_detail':
      return `Détail du patient avec téléphone : ${args.phone}`;
    case 'generate_whatsapp_message':
      return `Génération de message WhatsApp pour : ${args.patient_name} de ${args.pharmacy_name}`;
    case 'get_statistics':
      return `Statistiques pour la période : ${args.period}`;
    default:
      return `Outil inconnu : ${toolName}`;
  }
}
