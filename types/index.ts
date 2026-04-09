export type UserRole = 'superadmin' | 'admin' | 'assistant';
export type UserStatus = 'active' | 'pending' | 'rejected';
export type PatientSegment = 'Chronique' | 'Risque' | 'Suivi régulier' | 'Occasionnel';
export type VisiteTag = 'Chronique' | 'Aigu' | 'Suivi';

export interface Profile {
  id: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  pharmacy_name: string | null;
  created_at: string;
}

export interface Patient {
  id: string;
  phone: string;
  name: string | null;
  segment_ia: PatientSegment | null;
  motif_last_visit: string | null;
  score_fidelite: number;
  created_at: string;
  pharmacy_id: string;
}

export interface Visite {
  id: string;
  patient_id: string;
  date: string;
  motif: string;
  type_achat: string | null;
  tag: VisiteTag | null;
  created_at_by: string;
}

export interface VisiteWithPatient extends Visite {
  patients: Pick<Patient, 'name' | 'phone' | 'segment_ia'>;
}

export interface ClassificationResult {
  segment: PatientSegment;
  score_fidelite: number;
  justification: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface KPIData {
  total_patients: number;
  patients_chroniques: number;
  visites_jour: number;
  taux_retour: number;
}

export interface VisiteChartData {
  date: string;
  visites: number;
}

export interface PatientAlerte {
  id: string;
  name: string | null;
  phone: string;
  segment_ia: PatientSegment | null;
  derniere_visite: string;
  jours_sans_visite: number;
}

export interface PendingAdmin {
  id: string;
  email: string | null;
  phone: string | null;
  pharmacy_name: string | null;
  created_at: string;
}

export interface PharmacyStats {
  pharmacy_id: string;
  pharmacy_name: string | null;
  total_patients: number;
  total_admins: number;
  total_assistants: number;
}

export interface RegisterPatientPayload {
  phone: string;
  name?: string;
  motif: string;
  tag: VisiteTag;
}

export interface AIToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface AgentTickResult {
  alerts: PatientAlerte[];
  actions_taken: string[];
  timestamp: string;
}
