import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

export interface AuthResult {
  user: any;
  supabase: any;
}

export async function verifyAuth(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    throw new Error('Missing authorization header');
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    throw new Error('Invalid or expired token');
  }
  
  return { user, supabase };
}

export async function verifyRole(supabase: any, userId: string, allowedRoles: string[]): Promise<boolean> {
  // First, check roles assigned in the user_roles table (canonical RBAC source)
  const { data: roles, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);
  
  if (!error && roles && roles.length > 0) {
    return roles.some((r: any) => allowedRoles.includes(r.role));
  }

  // Fallback: check staff_registrations for legacy/staff-based roles
  const { data: staff, error: staffError } = await supabase
    .from('staff_registrations')
    .select('staff_role, pending')
    .eq('user_id', userId)
    .eq('pending', 'approved');

  if (staffError || !staff || staff.length === 0) {
    return false;
  }

  return staff.some((s: any) => {
    if (!s.staff_role) return false;
    const normalizedRole = String(s.staff_role).trim().toLowerCase().replace(/\s+/g, '_');
    return allowedRoles.includes(normalizedRole);
  });
}
