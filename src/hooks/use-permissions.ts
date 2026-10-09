import { useMemo } from 'react';
import { CustomerUserRole, CustomerUserPermission } from '@/server/constants/auth.constant';
import type { UserProfileResponse, UserResponse } from '@/server/dtos/auth.dto';

export type UserLike = Partial<UserProfileResponse> | Partial<UserResponse> | null;

export interface UsePermissionsReturn {
  roleCode: string;
  roleName: string;
  permissions: string[];
  isPro: boolean;
  isFree: boolean;
  isEnterprise: boolean;
  hasPermission: (permission: string) => boolean;
  canExportPdf: boolean;
  canExportMarkdown: boolean;
  canExportJson: boolean;
}

/**
 * Hook to inspect customer user tier, RBAC roles, and operational capabilities.
 */
export function usePermissions(user?: UserLike): UsePermissionsReturn {
  return useMemo(() => {
    const roleCode = user?.role_code || CustomerUserRole.FREE;
    const roleName = user?.role_name || (roleCode === CustomerUserRole.PRO ? 'Pro Member' : 'Free Member');
    const permissions = user?.permissions || [];

    const isEnterprise = roleCode === CustomerUserRole.ENTERPRISE;
    const isPro = roleCode === CustomerUserRole.PRO || isEnterprise;
    const isFree = roleCode === CustomerUserRole.FREE;

    const hasPermission = (perm: string): boolean => {
      if (permissions.includes('*') || permissions.includes('recordings:*')) {
        return true;
      }
      return permissions.includes(perm);
    };

    // PDF export is reserved for Pro and Enterprise subscribers
    const canExportPdf = isPro || hasPermission(CustomerUserPermission.EXPORT_PDF);
    const canExportMarkdown = hasPermission(CustomerUserPermission.EXPORT_MARKDOWN) || isPro || isFree;
    const canExportJson = hasPermission(CustomerUserPermission.EXPORT_JSON) || isPro;

    return {
      roleCode,
      roleName,
      permissions,
      isPro,
      isFree,
      isEnterprise,
      hasPermission,
      canExportPdf,
      canExportMarkdown,
      canExportJson,
    };
  }, [user]);
}
