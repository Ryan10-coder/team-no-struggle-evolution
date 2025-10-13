import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaffAuth } from './useStaffAuth';
import { toast } from 'sonner';

// Define allowed roles for each portal
export const PORTAL_ROLES = {
  admin: ['Admin', 'Treasurer'], // Admin portal allows Admin and Treasurer roles
  secretary: ['Secretary'],
  coordinator: ['Area Coordinator', 'General Coordinator'],
  auditor: ['Auditor'],
} as const;

// Define the super admin email who has access to all portals
const SUPER_ADMIN_EMAIL = 'brianokutu@gmail.com';

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
  const navigate = useNavigate();
  const [state, setState] = useState<RoleGuardState>({
    isAuthorized: false,
    isLoading: true,
    userRole: null,
    isAuthenticated: false
  });

  useEffect(() => {
    const checkAccess = () => {
      // Still loading authentication
      if (authLoading) {
        setState(prev => ({ ...prev, isLoading: true }));
        return;
      }

      // User not authenticated
      if (!staffUser) {
        setState({
          isAuthorized: false,
          isLoading: false,
          userRole: null,
          isAuthenticated: false
        });
        navigate(redirectTo);
        return;
      }

      const userRole = staffUser.staff_role;
      const userEmail = staffUser.email;
      const allowedRoles = PORTAL_ROLES[portal];
      
      // Check if user is super admin (has access to all portals)
      const isSuperAdmin = userEmail === SUPER_ADMIN_EMAIL;
      
      // Check if user role is allowed for this portal
      const isRoleAuthorized = allowedRoles.includes(userRole as any);
      
      const isAuthorized = isSuperAdmin || isRoleAuthorized;

      setState({
        isAuthorized,
        isLoading: false,
        userRole,
        isAuthenticated: true
      });

      // Handle unauthorized access
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
        
        // Redirect based on user's actual role
        const redirectPath = getAuthorizedPortalPath(userRole, userEmail);
        navigate(redirectPath);
      }
    };

    checkAccess();
  }, [staffUser, authLoading, portal, navigate, redirectTo, showAccessDeniedToast]);

  return state;
};

/**
 * Get the authorized portal path for a given role
 */
export const getAuthorizedPortalPath = (role: string, email?: string): string => {
  // Super admin can go to any portal, default to admin
  if (email === SUPER_ADMIN_EMAIL) {
    return '/admin';
  }

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
  const isSuperAdmin = userEmail === SUPER_ADMIN_EMAIL;
  const allowedRoles = PORTAL_ROLES[portal];
  return isSuperAdmin || allowedRoles.includes(userRole as any);
};

/**
 * Get all accessible portals for a user
 */
export const getAccessiblePortals = (userRole: string, userEmail: string): PortalType[] => {
  if (userEmail === SUPER_ADMIN_EMAIL) {
    return Object.keys(PORTAL_ROLES) as PortalType[];
  }

  return (Object.keys(PORTAL_ROLES) as PortalType[]).filter(portal => 
    PORTAL_ROLES[portal].includes(userRole as any)
  );
};