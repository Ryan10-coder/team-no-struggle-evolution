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
  const { data: roles, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);
  
  if (error || !roles || roles.length === 0) {
    return false;
  }
  
  return roles.some((r: any) => allowedRoles.includes(r.role));
}
