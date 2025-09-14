import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StaffUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  staff_role: string;
  assigned_area?: string;
}

interface StaffAuthContextType {
  staffUser: StaffUser | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const StaffAuthContext = createContext<StaffAuthContextType | undefined>(undefined);

export const StaffAuthProvider = ({ children }: { children: ReactNode }) => {
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if there's a stored staff session
    const storedStaff = localStorage.getItem('staff_user');
    if (storedStaff) {
      try {
        setStaffUser(JSON.parse(storedStaff));
      } catch (error) {
        localStorage.removeItem('staff_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      // 1) Verify staff record and portal password
      const { data: staffData, error } = await supabase
        .from('staff_registrations')
        .select('*')
        .eq('email', email)
        .eq('pending', 'approved')
        .single();

      if (error || !staffData) {
        return { success: false, error: 'Staff member not found or not approved' };
      }

      if (!staffData.portal_password) {
        return { success: false, error: 'No portal password assigned. Contact your administrator.' };
      }

      if (password !== staffData.portal_password) {
        return { success: false, error: 'Incorrect portal password' };
      }

      // 2) Ensure a Supabase Auth session exists for this staff
      // If already logged in with a different account, sign out first
      const { data: existingSession } = await supabase.auth.getSession();
      const existingEmail = existingSession.session?.user?.email;
      if (existingEmail && existingEmail.toLowerCase() !== email.toLowerCase()) {
        await supabase.auth.signOut();
      }

      // Try sign-in using the staff portal password
      let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // If credentials invalid, try to create the auth user
        if (signInError.message?.toLowerCase().includes('invalid')) {
          const redirectUrl = `${window.location.origin}/secretary`;
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: redirectUrl,
              data: {
                first_name: staffData.first_name,
                last_name: staffData.last_name,
                staff_role: staffData.staff_role,
              },
            },
          });

          if (signUpError) {
            return { success: false, error: `Unable to create account: ${signUpError.message}` };
          }

          // If email confirmation is required, there will be no session yet
          if (!signUpData.session) {
            return {
              success: false,
              error: 'Account created. Please confirm the email we sent, then log in again.',
            };
          }

          signInData = signUpData as any;
        } else {
          return { success: false, error: signInError.message };
        }
      }

      // 3) Link staff_registrations to this auth user (SECURITY DEFINER function)
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase.rpc('link_staff_to_user', {
          staff_email: email,
          auth_user_id: userData.user.id,
        });
      }

      // 4) Store staff context as before
      const staff: StaffUser = {
        id: staffData.id,
        email: staffData.email,
        first_name: staffData.first_name,
        last_name: staffData.last_name,
        staff_role: staffData.staff_role,
        assigned_area: staffData.assigned_area,
      };

      setStaffUser(staff);
      localStorage.setItem('staff_user', JSON.stringify(staff));

      return { success: true };
    } catch (error) {
      console.error('Staff login error:', error);
      return { success: false, error: 'An error occurred during login' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setStaffUser(null);
    localStorage.removeItem('staff_user');
    // Also clear Supabase auth session
    supabase.auth.signOut();
  };

  return (
    <StaffAuthContext.Provider value={{ staffUser, login, logout, isLoading }}>
      {children}
    </StaffAuthContext.Provider>
  );
};

export const useStaffAuth = () => {
  const context = useContext(StaffAuthContext);
  if (context === undefined) {
    throw new Error('useStaffAuth must be used within a StaffAuthProvider');
  }
  return context;
};