import { verifyFirebaseToken } from '@/lib/firebase/admin';
import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Profile } from '@/types';

interface AuthResult {
  uid: string;
  email: string | null;
  phone: string | null;
  profile: Profile;
}

export async function authenticateRequest(
  request: Request,
): Promise<AuthResult | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  const decoded = await verifyFirebaseToken(token);
  if (!decoded) {
    return null;
  }

  const supabase = createServiceRoleClient();

  // Check if profile exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', decoded.uid)
    .single();

  if (profile) {
    return {
      uid: decoded.uid,
      email: decoded.email || null,
      phone: decoded.phone_number || null,
      profile,
    };
  }

  // Auto-create profile on first login
  const email = decoded.email || null;
  const phone = decoded.phone_number || null;
  const isSuperAdmin = email === process.env.SUPERADMIN_EMAIL;

  const newProfile: Profile = {
    id: decoded.uid,
    email,
    phone,
    role: isSuperAdmin ? 'superadmin' : 'assistant',
    status: 'active',
    pharmacy_name: 'Pharmacie FATIMA',
    created_at: new Date().toISOString(),
  };

  const { data: upsertedProfile, error } = await supabase
    .from('profiles')
    .upsert(newProfile, { onConflict: 'id' })
    .select()
    .single();
  if (error) {
    console.error('Error creating profile:', error);
    // Try to fetch existing profile as fallback
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', decoded.uid)
      .single();
    if (existingProfile) {
      return {
        uid: decoded.uid,
        email,
        phone,
        profile: existingProfile,
      };
    }
    return null;
  }

  return {
    uid: decoded.uid,
    email,
    phone,
    profile: upsertedProfile || newProfile,
  };
}
