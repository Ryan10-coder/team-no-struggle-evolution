# Role-Based Access Control Implementation Guide

## Overview
This guide documents the comprehensive role-based authentication system implemented to ensure each staff member can only log into their designated portals. The system prevents unauthorized access by implementing strict role verification and automatic redirections.

## Key Components

### 1. Role Guard Hook (`useRoleGuard.tsx`)
A comprehensive authentication middleware that:
- **Portal-specific access control**: Maps roles to allowed portals
- **Super admin bypass**: Allows `brianokutu@gmail.com` access to all portals
- **Automatic redirections**: Routes users to appropriate portals based on their roles
- **Loading states**: Provides smooth user experience during authentication checks
- **Error handling**: Shows clear access denied messages with role requirements

### 2. Portal Role Definitions
```typescript
const PORTAL_ROLES = {
  admin: ['Admin', 'Treasurer'], // Admin portal allows Admin and Treasurer roles
  secretary: ['Secretary'],
  coordinator: ['Area Coordinator', 'General Coordinator'],
  auditor: ['Auditor'],
}
```

### 3. Updated Portal Components
All portal components now use the `useRoleGuard` hook:
- **AdminPortal**: Accessible by Admin and Treasurer roles
- **SecretaryPortal**: Restricted to Secretary role only
- **CoordinatorPortal**: Limited to Area/General Coordinators
- **AuditorPortal**: Exclusive to Auditor role

### 4. Enhanced Portal Login
- **Role-aware login**: Automatically redirects to appropriate portal
- **Portal selection**: Optional manual portal selection
- **Visual feedback**: Shows accessible/restricted portals
- **Error handling**: Clear messages for access violations

### 5. Portal Navigation Component
A reusable component that:
- Shows only accessible portals based on user role
- Visual indicators for restricted access
- Required role badges for transparency
- Responsive design for different layouts

## Access Control Matrix

| Role | Admin Portal | Secretary Portal | Coordinator Portal | Auditor Portal |
|------|-------------|-----------------|-------------------|----------------|
| **Admin** | ✅ Full Access | ❌ Restricted | ❌ Restricted | ❌ Restricted |
| **Treasurer** | ✅ Full Access | ❌ Restricted | ❌ Restricted | ❌ Restricted |
| **Secretary** | ❌ Restricted | ✅ Full Access | ❌ Restricted | ❌ Restricted |
| **Area Coordinator** | ❌ Restricted | ❌ Restricted | ✅ Full Access | ❌ Restricted |
| **General Coordinator** | ❌ Restricted | ❌ Restricted | ✅ Full Access | ❌ Restricted |
| **Auditor** | ❌ Restricted | ❌ Restricted | ❌ Restricted | ✅ Full Access |
| **Super Admin** | ✅ Full Access | ✅ Full Access | ✅ Full Access | ✅ Full Access |

## Implementation Features

### Security Enhancements
1. **Role Verification on Mount**: Every portal checks user role before rendering
2. **Route Protection**: Unauthorized users are redirected automatically
3. **Session Validation**: Continuous authentication state monitoring
4. **Error Boundaries**: Graceful handling of authentication failures

### User Experience
1. **Loading States**: Smooth transitions during role verification
2. **Clear Messaging**: Informative access denied screens
3. **Automatic Redirects**: Users sent to their authorized portals
4. **Portal Selection**: Optional manual portal choice during login

### Developer Experience
1. **Reusable Components**: `useRoleGuard` hook for any component
2. **Type Safety**: TypeScript interfaces for all role definitions
3. **Utility Functions**: Helper functions for role checking
4. **Comprehensive Documentation**: Clear code comments and examples

## Testing Scenarios

### Test Case 1: Role Restriction
1. **Login as Secretary**: Should only access Secretary Portal
2. **Navigate to /admin**: Should be redirected to /secretary
3. **Manual URL entry**: Direct navigation should be blocked

### Test Case 2: Multi-Role Access
1. **Login as Admin**: Should access Admin Portal by default
2. **Navigate to /auditor**: Should be blocked with access denied message
3. **Role verification**: Confirm only Admin/Treasurer roles work

### Test Case 3: Super Admin Access
1. **Login as brianokutu@gmail.com**: Should access all portals
2. **Portal selection**: Should work for any portal selection
3. **No restrictions**: All navigation should be permitted

### Test Case 4: Invalid Access Attempts
1. **Unauthenticated users**: Should redirect to login
2. **Invalid role**: Should show access denied with role requirements
3. **Session expiry**: Should handle authentication state changes

## Usage Examples

### Basic Role Guard Usage
```typescript
import { useRoleGuard } from '@/hooks/useRoleGuard';

const MyPortal = () => {
  const { isAuthorized, isLoading } = useRoleGuard({ 
    portal: 'admin' 
  });
  
  if (isLoading) return <LoadingScreen />;
  if (!isAuthorized) return <AccessDeniedScreen />;
  
  return <PortalContent />;
};
```

### Checking Portal Access
```typescript
import { hasPortalAccess } from '@/hooks/useRoleGuard';

const canAccessAdmin = hasPortalAccess(
  userRole, 
  userEmail, 
  'admin'
);
```

### Getting Accessible Portals
```typescript
import { getAccessiblePortals } from '@/hooks/useRoleGuard';

const accessiblePortals = getAccessiblePortals(
  userRole, 
  userEmail
);
```

## Configuration

### Adding New Roles
To add a new staff role:

1. **Update PORTAL_ROLES**: Add role to appropriate portal array
```typescript
const PORTAL_ROLES = {
  admin: ['Admin', 'Treasurer', 'NewRole'],
  // ... other portals
}
```

2. **Update Type Definitions**: Add to StaffRole type
```typescript
export type StaffRole = 'Admin' | 'Secretary' | 'NewRole' | ...;
```

3. **Update Portal Path Mapping**: Add to getAuthorizedPortalPath
```typescript
switch (role) {
  case 'NewRole':
    return '/new-portal';
  // ... other cases
}
```

### Adding New Portals
To add a new portal:

1. **Define Portal Role**: Add to PORTAL_ROLES object
2. **Create Portal Component**: Use `useRoleGuard` hook
3. **Update Navigation**: Add to PortalNavigation component
4. **Add Route**: Include in routing configuration

## Troubleshooting

### Common Issues

#### Issue: User can access restricted portal
**Solution**: Verify role guard is properly implemented in portal component

#### Issue: Infinite redirect loop
**Solution**: Check if user role matches any portal roles, ensure fallback route

#### Issue: Super admin restrictions
**Solution**: Verify email address matches exactly: `brianokutu@gmail.com`

#### Issue: Portal not showing in navigation
**Solution**: Confirm role is included in PORTAL_ROLES for that portal

### Debug Tools

#### Check User Role
```typescript
console.log('User Role:', staffUser?.staff_role);
console.log('User Email:', staffUser?.email);
```

#### Verify Portal Access
```typescript
const hasAccess = hasPortalAccess(role, email, 'admin');
console.log('Has Admin Access:', hasAccess);
```

#### List Accessible Portals
```typescript
const portals = getAccessiblePortals(role, email);
console.log('Accessible Portals:', portals);
```

## Security Considerations

### Best Practices
1. **Server-side Validation**: Always verify roles on the backend
2. **Session Management**: Implement proper session timeouts
3. **Audit Logging**: Log all access attempts and violations
4. **Regular Reviews**: Periodically review role assignments

### Known Limitations
1. **Client-side Only**: This implementation is frontend-focused
2. **Role Changes**: Require logout/login to reflect role updates
3. **Browser Storage**: Relies on localStorage for session persistence

## Conclusion

This role-based access control system provides:
- **Secure Access**: Prevents unauthorized portal access
- **User-Friendly Experience**: Clear messaging and smooth navigation
- **Maintainable Code**: Reusable components and utilities
- **Scalable Architecture**: Easy to extend with new roles/portals

The system ensures that each staff member can only access their designated portals while providing a seamless user experience and robust security controls.