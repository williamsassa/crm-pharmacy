import type { ClassificationResult, PatientSegment, VisiteTag } from '@/types';
import { callGemma } from './gemma';

const CLASSIFICATION_SYSTEM_PROMPT = `Tu es un assistant pharmacien expert. Analyse le motif de visite et le tag fournis. Classe le patient dans l'un des segments suivants :
- Chronique (traitement de fond, renouvellement régulier)
- Suivi régulier (contrôle périodique)
- Risque (signaux d'alerte : non-observance, poly-médication)
- Occasionnel (visite ponctuelle)

Réponds uniquement en JSON valide avec ce format exact :
{
  "segment": "Chronique" | "Suivi régulier" | "Risque" | "Occasionnel",
  "score_fidelite": 0-100,
  "justification": "explication courte"
}`;

export async function classifyPatient(input: {
  motif: string;
  tag: VisiteTag;
  historique_visites: number;
  derniers_motifs?: string[];
}): Promise<ClassificationResult> {
  const userMessage = `Motif de visite: ${input.motif}
Tag: ${input.tag}
Nombre de visites passées: ${input.historique_visites}
${input.derniers_motifs ? `Derniers motifs: ${input.derniers_motifs.join(', ')}` : ''}`;

  try {
    const response = await callGemma(
      CLASSIFICATION_SYSTEM_PROMPT,
      [{ role: 'user', content: userMessage }],
      { temperature: 0.3, jsonMode: true, maxTokens: 512 },
    );

    const parsed = JSON.parse(response);

    const validSegments: PatientSegment[] = [
      'Chronique',
      'Risque',
      'Suivi régulier',
      'Occasionnel',
    ];
    const segment = validSegments.includes(parsed.segment)
      ? parsed.segment
      : 'Occasionnel';
    const score = Math.max(
      0,
      Math.min(100, parseInt(parsed.score_fidelite) || 50),
    );

    return {
      segment,
      score_fidelite: score,
      justification: parsed.justification || 'Classification automatique',
    };
  } catch (error) {
    console.error('Classification error:', error);
    return {
      segment: 'Occasionnel',
      score_fidelite: 50,
      justification: 'Classification par défaut (erreur IA)',
    };
  }
}
