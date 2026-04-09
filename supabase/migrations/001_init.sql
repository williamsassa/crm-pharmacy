-- ============================================
-- CRM Intelligent Pharmacie - Migration initiale
-- Firebase Auth + Supabase Database
-- ============================================

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table profiles (standalone, Firebase UID as PK)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,  -- Firebase UID (string)
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'assistant' CHECK (role IN ('superadmin', 'admin', 'assistant')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'rejected')),
  pharmacy_name TEXT DEFAULT 'Pharmacie FATIMA',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Table patients
-- ============================================
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT UNIQUE NOT NULL,
  name TEXT,
  segment_ia TEXT,
  motif_last_visit TEXT,
  score_fidelite INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pharmacy_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- ============================================
-- Table visites
-- ============================================
CREATE TABLE IF NOT EXISTS public.visites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  motif TEXT NOT NULL,
  type_achat TEXT,
  tag TEXT CHECK (tag IN ('Chronique', 'Aigu', 'Suivi')),
  created_at_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- ============================================
-- Index pour les performances
-- ============================================
CREATE INDEX IF NOT EXISTS idx_patients_pharmacy ON public.patients(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON public.patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_segment ON public.patients(segment_ia);
CREATE INDEX IF NOT EXISTS idx_visites_patient ON public.visites(patient_id);
CREATE INDEX IF NOT EXISTS idx_visites_date ON public.visites(date);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ============================================
-- Disable RLS (auth handled by Firebase on API side)
-- Access control is enforced in Next.js API routes
-- ============================================
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.visites DISABLE ROW LEVEL SECURITY;

-- ============================================
-- Seed: create superadmin profile
-- The superadmin will be auto-created on first login via
-- the API, but we can also pre-seed with a known Firebase UID.
-- If you know the Firebase UID, replace 'FIREBASE_UID_HERE'.
-- Otherwise, the API will create it on first Google login.
-- ============================================
-- INSERT INTO public.profiles (id, email, role, status, pharmacy_name)
-- VALUES ('FIREBASE_UID_HERE', 'andersonassa09@gmail.com', 'superadmin', 'active', 'Pharmacie FATIMA')
-- ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Function: request_admin_role
-- Called from API after Firebase auth verification
-- ============================================
CREATE OR REPLACE FUNCTION public.request_admin_role(user_id TEXT, pharmacy TEXT DEFAULT 'Pharmacie FATIMA')
RETURNS TEXT AS $$
DECLARE
  admin_count INT;
  current_role TEXT;
BEGIN
  SELECT role INTO current_role FROM public.profiles WHERE id = user_id;

  IF current_role = 'superadmin' THEN
    RETURN 'already_superadmin';
  END IF;

  IF current_role = 'admin' THEN
    RETURN 'already_admin';
  END IF;

  -- Count active admins for this pharmacy
  SELECT COUNT(*) INTO admin_count
  FROM public.profiles
  WHERE role = 'admin' AND status = 'active' AND pharmacy_name = pharmacy;

  IF admin_count < 3 THEN
    -- First 3 admins are auto-approved
    UPDATE public.profiles
    SET role = 'admin', status = 'active', pharmacy_name = pharmacy
    WHERE id = user_id;
    RETURN 'approved';
  ELSE
    -- 4th+ go to pending
    UPDATE public.profiles
    SET role = 'admin', status = 'pending', pharmacy_name = pharmacy
    WHERE id = user_id;
    RETURN 'pending';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
