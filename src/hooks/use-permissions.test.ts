import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePermissions } from './use-permissions';
import { CustomerUserRole, CustomerUserPermission } from '@/server/constants/auth.constant';

describe('usePermissions hook', () => {
  it('defaults to Free tier when no user provided', () => {
    const { result } = renderHook(() => usePermissions(null));
    expect(result.current.roleCode).toBe(CustomerUserRole.FREE);
    expect(result.current.isFree).toBe(true);
    expect(result.current.isPro).toBe(false);
    expect(result.current.canExportPdf).toBe(false);
    expect(result.current.canExportMarkdown).toBe(true);
  });

  it('correctly identifies Pro subscriber permissions', () => {
    const { result } = renderHook(() =>
      usePermissions({
        role_code: CustomerUserRole.PRO,
        role_name: 'Pro Member',
        permissions: [CustomerUserPermission.EXPORT_PDF, CustomerUserPermission.CHAT_QUERY],
      })
    );

    expect(result.current.roleCode).toBe(CustomerUserRole.PRO);
    expect(result.current.isPro).toBe(true);
    expect(result.current.isFree).toBe(false);
    expect(result.current.canExportPdf).toBe(true);
    expect(result.current.hasPermission(CustomerUserPermission.CHAT_QUERY)).toBe(true);
    expect(result.current.hasPermission('admin:write')).toBe(false);
  });

  it('grants all permissions when wildcard present', () => {
    const { result } = renderHook(() =>
      usePermissions({
        role_code: CustomerUserRole.ENTERPRISE,
        permissions: ['recordings:*'],
      })
    );

    expect(result.current.isEnterprise).toBe(true);
    expect(result.current.isPro).toBe(true);
    expect(result.current.hasPermission('any:custom:perm')).toBe(true);
  });
});
