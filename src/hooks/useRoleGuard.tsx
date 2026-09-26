import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaffAuth } from './useStaffAuth';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Define allowed roles for each portal
export const PORTAL_ROLES = {
  admin: ['Admin', 'Treasurer'], // Admin portal allows Admin and Treasurer roles
  secretary: ['Secretary'],
  coordinator: ['Area Coordinator', 'General Coordinator'],
  auditor: ['Auditor'],
} as const;

// Super admin access should be managed through proper role-based system
// DO NOT use hardcoded emails for authorization - security vulnerability
// const SUPER_ADMIN_EMAIL = 'brianokutu@gmail.com'; // REMOVED for security

export type PortalType = keyof typeof PORTAL_ROLES;
export type StaffRole = 'Admin' | 'Secretary' | 'Area Coordinator' | 'General Coordinator' | 'Auditor' | 'Treasurer';

interface UseRoleGuardOptions {
  portal: PortalType;
  redirectTo?: string;
  showAccessDeniedToast?: boolean;
}

interface RoleGuardState {
  isAuthorized: boolean;
  isLoading: boolean;
  userRole: string | null;
  isAuthenticated: boolean;
}

export const useRoleGuard = ({ 
  portal, 
  redirectTo = '/portal-login',
  showAccessDeniedToast = true 
}: UseRoleGuardOptions): RoleGuardState => {
  const { staffUser, isLoading: authLoading } = useStaffAuth();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<RoleGuardState>({
    isAuthorized: false,
    isLoading: true,
    userRole: null,
    isAuthenticated: false
  });

  useEffect(() => {
    const checkAccess = async () => {
      // Still loading authentication
      if (authLoading) {
        setState(prev => ({ ...prev, isLoading: true }));
        return;
      }

      const allowedRoles = PORTAL_ROLES[portal];

      // Primary path: use staff portal auth
      if (staffUser) {
        const userRole = staffUser.staff_role;
        const userEmail = staffUser.email;

        // Check only role-based authorization - no hardcoded super admin
        const isRoleAuthorized = (allowedRoles as readonly string[]).includes(userRole);
        const isAuthorized = isRoleAuthorized;

        setState({
          isAuthorized,
          isLoading: false,
          userRole,
          isAuthenticated: true
        });

        if (!isAuthorized) {
          if (showAccessDeniedToast) {
            toast.error(
              `Access denied. This portal requires ${allowedRoles.join(' or ')} role.`,
              {
                description: `Your current role: ${userRole}`,
                duration: 5000,
              }
            );
          }
          const redirectPath = getAuthorizedPortalPath(userRole, userEmail);
          navigate(redirectPath);
        }
        return;
      }

      // Fallback path: derive staff role from authenticated Supabase user
      if (authUser?.email) {
        try {
          const { data: staffData, error } = await supabase
            .from('staff_registrations')
            .select('id, email, first_name, last_name, staff_role, assigned_area, pending')
            .eq('email', authUser.email)
            .eq('pending', 'approved')
            .single();

          if (!error && staffData) {
            const userRole = staffData.staff_role as string;
            const userEmail = staffData.email as string;
            // Check only role-based authorization - no hardcoded super admin
            const isRoleAuthorized = (allowedRoles as readonly string[]).includes(userRole);
            const isAuthorized = isRoleAuthorized;

            // Hydrate localStorage so future sessions pick it up via StaffAuthProvider
            try {
              const hydrated = {
                id: staffData.id,
                email: staffData.email,
                first_name: staffData.first_name,
                last_name: staffData.last_name,
                staff_role: staffData.staff_role,
                assigned_area: staffData.assigned_area,
              };
              localStorage.setItem('staff_user', JSON.stringify(hydrated));
            } catch (_) {}

            setState({
              isAuthorized,
              isLoading: false,
              userRole,
              isAuthenticated: true
            });

            if (!isAuthorized) {
              if (showAccessDeniedToast) {
                toast.error(
                  `Access denied. This portal requires ${allowedRoles.join(' or ')} role.`,
                  {
                    description: `Your current role: ${userRole}`,
                    duration: 5000,
                  }
                );
              }
              const redirectPath = getAuthorizedPortalPath(userRole, userEmail);
              navigate(redirectPath);
            }
            return;
          }
        } catch (e) {
          // ignore fallback errors and proceed to redirect
        }
      }

      // No staff access determined
      setState({
        isAuthorized: false,
        isLoading: false,
        userRole: null,
        isAuthenticated: false
      });
      navigate(redirectTo);
    };

    checkAccess();
  }, [staffUser, authLoading, portal, navigate, redirectTo, showAccessDeniedToast, authUser?.email]);

  return state;
};

/**
 * Get the authorized portal path for a given role
 */
export const getAuthorizedPortalPath = (role: string, email?: string): string => {
  // Route based on role only - no hardcoded super admin bypass
  switch (role) {
    case 'Admin':
    case 'Treasurer':
      return '/admin';
    case 'Secretary':
      return '/secretary';
    case 'Area Coordinator':
    case 'General Coordinator':
      return '/coordinator';
    case 'Auditor':
      return '/auditor';
    default:
      return '/portal-login';
  }
};

/**
 * Check if a user has access to a specific portal
 */
export const hasPortalAccess = (
  userRole: string, 
  userEmail: string, 
  portal: PortalType
): boolean => {
  // Check only role-based access - no hardcoded super admin
  const allowedRoles = PORTAL_ROLES[portal];
  return (allowedRoles as readonly string[]).includes(userRole);
};

/**
 * Get all accessible portals for a user
 */
export const getAccessiblePortals = (userRole: string, userEmail: string): PortalType[] => {
  // Return portals based on role only - no hardcoded super admin
  return (Object.keys(PORTAL_ROLES) as PortalType[]).filter(portal => 
    (PORTAL_ROLES[portal] as readonly string[]).includes(userRole)
  );
};