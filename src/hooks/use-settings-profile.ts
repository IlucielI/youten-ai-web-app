import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { ApiResponse, BaseResponse } from '@/server/dtos/response.dto';
import { UserProfileResponse, UserResponse } from '@/server/dtos/auth.dto';
import { useAuthStore } from '@/stores/auth.store';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useTranslation } from '@/locales';
import { toast } from 'sonner';

export type SettingsTabKey = 'profile' | 'security' | 'workspaces';

export function useSettingsProfile() {
  const router = useRouter();
  const { t, locale } = useTranslation();

  // Auth & Profile State
  const [user, setUser] = useState<UserProfileResponse | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Tab State
  const [activeTab, setActiveTab] = useState<SettingsTabKey>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'workspaces' || tabParam === 'security') {
        return tabParam;
      }
    }
    return 'profile';
  });

  // Profile Form State
  const [fullName, setFullName] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Security / Password Form State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Session verification on mount
  useEffect(() => {
    void useWorkspaceStore.getState().fetchWorkspaces();
    let isMounted = true;
    apiFetch<ApiResponse<UserProfileResponse>>('/api/auth/me')
      .then((res) => {
        if (!isMounted) return;
        if (res && res.data) {
          setUser(res.data);
          useAuthStore.getState().setUser(res.data);
          setFullName(res.data.full_name || '');
          setAuthLoading(false);
        } else {
          useAuthStore.getState().setUser(null);
          router.push('/login?redirect=/settings');
        }
      })
      .catch(() => {
        if (isMounted) {
          useAuthStore.getState().setUser(null);
          router.push('/login?redirect=/settings');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  // Handle Logout
  const handleLogout = useCallback(async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
      useAuthStore.getState().reset();
      setUser(null);
      router.push('/login');
    } catch {
      toast.error(t('settings.profile.logoutFailed'));
    }
  }, [router, t]);

  // Handle Profile Update
  const handleUpdateProfile = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = fullName.trim();
      if (trimmed.length < 2) {
        toast.error(t('settings.validation.nameMin'));
        return;
      }
      if (trimmed.length > 100) {
        toast.error(t('settings.validation.nameMax'));
        return;
      }

      setIsUpdatingProfile(true);
      try {
        const res = await apiFetch<ApiResponse<UserResponse>>('/api/auth/me', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ full_name: trimmed }),
        });

        if (res && res.data) {
          const updated = res.data;
          setUser((prev) => (prev ? Object.assign({}, prev, { full_name: updated.full_name }) : prev));
          toast.success(t('settings.profile.success'));
        } else {
          toast.error(t('settings.profile.failed'));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : t('settings.profile.failed');
        toast.error(message);
      } finally {
        setIsUpdatingProfile(false);
      }
    },
    [fullName, t]
  );

  // Handle Password Change
  const handleChangePassword = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!oldPassword) {
        toast.error(t('settings.validation.currentPasswordRequired'));
        return;
      }

      if (newPassword.length < 8 || newPassword.length > 72) {
        toast.error(t('settings.validation.newPasswordLength'));
        return;
      }

      if (!/[0-9]/.test(newPassword)) {
        toast.error(t('settings.validation.newPasswordNumber'));
        return;
      }

      if (newPassword === oldPassword) {
        toast.error(t('settings.validation.passwordSame'));
        return;
      }

      if (newPassword !== confirmPassword) {
        toast.error(t('settings.validation.passwordMismatch'));
        return;
      }

      setIsChangingPassword(true);
      try {
        const res = await apiFetch<BaseResponse>('/api/auth/change-password', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            old_password: oldPassword,
            new_password: newPassword,
          }),
        });

        if (res) {
          toast.success(t('settings.security.success'));
          setOldPassword('');
          setNewPassword('');
          setConfirmPassword('');
        } else {
          toast.error(t('settings.security.failed'));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : t('settings.security.failed');
        toast.error(message);
      } finally {
        setIsChangingPassword(false);
      }
    },
    [oldPassword, newPassword, confirmPassword, t]
  );

  // Quota Metrics
  const quotaTotal = user?.daily_quota ?? 5;
  const quotaUsed = user?.quota_used_today ?? 0;
  const quotaRemaining = user?.quota_remaining ?? 0;
  const rawPercent = (quotaUsed / (quotaTotal || 1)) * 100;
  const quotaDisplayPercent = useMemo(
    () =>
      quotaUsed > 0 && rawPercent < 1
        ? '< 1'
        : Math.min(100, Math.round(rawPercent)).toString(),
    [quotaUsed, rawPercent]
  );
  const quotaProgressValue = useMemo(
    () => (quotaUsed > 0 ? Math.max(1, Math.min(100, Math.round(rawPercent))) : 0),
    [quotaUsed, rawPercent]
  );

  return {
    user,
    authLoading,
    activeTab,
    setActiveTab,
    fullName,
    setFullName,
    isUpdatingProfile,
    handleUpdateProfile,
    oldPassword,
    setOldPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showOldPassword,
    setShowOldPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    isChangingPassword,
    handleChangePassword,
    handleLogout,
    quotaTotal,
    quotaUsed,
    quotaRemaining,
    quotaDisplayPercent,
    quotaProgressValue,
    t,
    locale,
  };
}

