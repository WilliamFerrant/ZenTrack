// Role-based permission helpers
import { useAuthStore } from '@/stores'

type Role = 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER'

const ROLE_RANK: Record<Role, number> = {
  ADMIN: 4,
  MANAGER: 3,
  MEMBER: 2,
  VIEWER: 1,
}

export function usePermissions() {
  const { user } = useAuthStore()
  const role = (user?.role ?? 'VIEWER') as Role

  const hasRole = (minimum: Role) => ROLE_RANK[role] >= ROLE_RANK[minimum]

  return {
    role,
    isAdmin:      role === 'ADMIN',
    canManage:    hasRole('MANAGER'),   // ADMIN + MANAGER
    canEdit:      hasRole('MEMBER'),    // ADMIN + MANAGER + MEMBER
    canView:      hasRole('VIEWER'),    // all roles
    // Feature-level gates
    canInviteMembers:     hasRole('MANAGER'),
    canApproveTimesheets: hasRole('MANAGER'),
    canManageClients:     hasRole('MANAGER'),
    canManageProjects:    hasRole('MEMBER'),
    canExportReports:     hasRole('MEMBER'),
    canViewTeam:          hasRole('VIEWER'),
    canViewTimesheets:    hasRole('VIEWER'),
    canViewReports:       hasRole('MEMBER'),
  }
}
