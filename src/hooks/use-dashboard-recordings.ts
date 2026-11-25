import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import { ApiResponse, BaseResponse } from '@/server/dtos/response.dto';
import { UserProfileResponse } from '@/server/dtos/auth.dto';
import { RecordingListItemDTO } from '@/server/dtos/recording.dto';
import { useAuthStore } from '@/stores/auth.store';
import { RecordingStatus } from '@/server/constants/recording.constant';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useTemplates } from '@/hooks';
import { useTranslation } from '@/locales';
import { toast } from 'sonner';
import { SearchableSelectOption } from '@/components/molecules/searchable-select';

export interface RecordingsApiResponse {
  status: string;
  code?: string;
  data?:
    | {
        items?: RecordingListItemDTO[];
        pagination?: {
          current_page?: number;
          page_size?: number;
          total_items?: number;
          total_pages?: number;
        };
      }
    | RecordingListItemDTO[];
  pagination?: {
    totalItems?: number;
    totalPages?: number;
  };
}

export function useDashboardRecordings() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { templates, getTemplateLabel } = useTemplates();

  const statusSelectOptions: SearchableSelectOption[] = useMemo(
    () => [
      { value: '', label: t('dashboard.filters.allStatuses') },
      { value: RecordingStatus.COMPLETED, label: t('dashboard.statusLabels.completed'), badge: '100%' },
      { value: RecordingStatus.QUEUED, label: t('dashboard.statusLabels.queued') },
      { value: 'TRANSCRIBING', label: t('dashboard.statusLabels.processing') },
      { value: RecordingStatus.PENDING, label: t('dashboard.statusLabels.pending') },
      { value: RecordingStatus.FAILED, label: t('dashboard.statusLabels.failed') },
    ],
    [t]
  );

  const templateSelectOptions: SearchableSelectOption[] = useMemo(
    () => [
      { value: '', label: t('dashboard.filters.allTemplates') },
      ...templates.map((tmpl) => ({
        value: tmpl.key,
        label: tmpl.label,
        description: tmpl.description,
        icon: tmpl.icon,
      })),
    ],
    [templates, t]
  );

  // Auth User State
  const [user, setUser] = useState<UserProfileResponse | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Data & Query State
  const [recordings, setRecordings] = useState<RecordingListItemDTO[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // Filters & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal States
  const [recordingToDelete, setRecordingToDelete] = useState<RecordingListItemDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [shareRecording, setShareRecording] = useState<RecordingListItemDTO | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);

  // Workspace & Folder State
  const { activeWorkspace, activeFolderId, folders } = useWorkspaceStore();
  const [recordingToMove, setRecordingToMove] = useState<RecordingListItemDTO | null>(null);
  const [workspaceTotalRecordings, setWorkspaceTotalRecordings] = useState<number | undefined>(undefined);

  // Active folder lookup for clear visual filter indicator
  const activeFolder = useMemo(() => {
    if (!activeFolderId) return null;
    const findFolder = (list: typeof folders): (typeof folders)[0] | null => {
      for (const f of list) {
        if (f.id === activeFolderId) return f;
        if (f.children?.length) {
          const found = findFolder(f.children);
          if (found) return found;
        }
      }
      return null;
    };
    return findFolder(folders);
  }, [activeFolderId, folders]);

  // Reset page when folder or workspace changes
  useEffect(() => {
    setPage(1);
  }, [activeFolderId]);

  useEffect(() => {
    setWorkspaceTotalRecordings(undefined);
    setPage(1);
  }, [activeWorkspace?.id]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch authenticated user profile
  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        const res = await apiFetch<ApiResponse<UserProfileResponse>>('/api/auth/me');
        if (mounted && res && res.status === 'success' && res.data) {
          setUser(res.data);
          useAuthStore.getState().setUser(res.data);
          setAuthLoading(false);
        } else if (mounted) {
          useAuthStore.getState().setUser(null);
          router.push('/login?redirect=/dashboard');
        }
      } catch {
        if (mounted) {
          useAuthStore.getState().setUser(null);
          router.push('/login?redirect=/dashboard');
        }
      }
    }

    checkAuth();
    return () => {
      mounted = false;
    };
  }, [router]);

  const [refreshKey, setRefreshKey] = useState(0);

  const refreshRecordings = useCallback(() => {
    setDataLoading(true);
    setRefreshKey((k) => k + 1);
  }, []);

  // Fetch recordings from BFF
  useEffect(() => {
    if (authLoading || !user) return;
    let isMounted = true;

    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', pageSize.toString());
    params.set('sort_by', 'created_at');
    params.set('sort_order', 'desc');

    if (debouncedSearch.trim()) {
      params.set('search', debouncedSearch.trim());
    }
    if (selectedStatus) {
      params.set('status', selectedStatus);
    }
    if (selectedTemplate) {
      params.set('template', selectedTemplate);
    }
    if (activeWorkspace?.id) {
      params.set('workspace_id', activeWorkspace.id);
    }
    if (activeFolderId) {
      params.set('folder_id', activeFolderId);
    }

    apiFetch<RecordingsApiResponse>(`/api/recordings?${params.toString()}`)
      .then((res) => {
        if (!isMounted) return;
        if (res && (res.status === 'success' || res.status === 'SUCCESS') && res.data) {
          setDataError(null);
          const rawItems: RecordingListItemDTO[] = Array.isArray(res.data)
            ? res.data
            : Array.isArray(res.data?.items)
            ? (res.data.items as RecordingListItemDTO[])
            : [];
          setRecordings(rawItems);

          const pag = !Array.isArray(res.data) ? res.data?.pagination : undefined;
          const currentTotal = pag?.total_items ?? res.pagination?.totalItems ?? rawItems.length;

          if (!activeFolderId && !debouncedSearch.trim() && !selectedStatus && !selectedTemplate) {
            setWorkspaceTotalRecordings(currentTotal);
          }

          if (pag) {
            setTotalItems(pag.total_items ?? rawItems.length);
            setTotalPages(pag.total_pages ?? 1);
          } else if (res.pagination) {
            setTotalItems(res.pagination.totalItems ?? rawItems.length);
            setTotalPages(res.pagination.totalPages ?? 1);
          } else {
            setTotalItems(rawItems.length);
            setTotalPages(1);
          }
        } else {
          setDataError(t('dashboard.error.fetchFailed'));
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        if (err instanceof ApiClientError) {
          setDataError(err.message);
        } else {
          setDataError(t('dashboard.error.defaultMessage'));
        }
      })
      .finally(() => {
        if (isMounted) {
          setDataLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [
    authLoading,
    user,
    page,
    pageSize,
    debouncedSearch,
    selectedStatus,
    selectedTemplate,
    refreshKey,
    t,
    activeWorkspace?.id,
    activeFolderId,
  ]);

  // Handle Delete
  const handleDeleteConfirm = useCallback(async () => {
    if (!recordingToDelete) return;
    setIsDeleting(true);

    try {
      await apiFetch<BaseResponse>(`/api/recordings/${recordingToDelete.id}`, {
        method: 'DELETE',
      });
      toast.success(t('notifications.success.recordingDeleted', { title: recordingToDelete.title }));
      setRecordingToDelete(null);
      refreshRecordings();
    } catch {
      toast.error(t('notifications.error.deleteFailed'));
    } finally {
      setIsDeleting(false);
    }
  }, [recordingToDelete, refreshRecordings, t]);

  // Handle Logout
  const handleLogout = useCallback(async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
      useAuthStore.getState().reset();
      setUser(null);
      router.push('/login');
    } catch {
      toast.error(t('notifications.error.logoutFailed'));
    }
  }, [router, t]);

  // Share handling
  const handleOpenShare = useCallback((rec: RecordingListItemDTO) => {
    setShareRecording(rec);
    setShareToken(null);
  }, []);

  const handleToggleShare = useCallback(
    async (enable: boolean) => {
      if (!shareRecording) return;
      try {
        const res = await apiFetch<ApiResponse<{ is_share_enabled: boolean; share_token?: string }>>(
          `/api/recordings/${shareRecording.id}/share`,
          {
            method: 'PATCH',
            body: JSON.stringify({ is_share_enabled: enable }),
          }
        );
        if (res?.data) {
          const updatedToken = res.data.share_token || null;
          setShareToken(updatedToken);
          toast.success(enable ? t('notifications.success.shareEnabled') : t('notifications.success.shareDisabled'));
        }
      } catch {
        toast.error(t('notifications.error.shareFailed'));
      }
    },
    [shareRecording, t]
  );

  const quotaRemaining = user?.quota_remaining ?? 0;
  const quotaTotal = user?.daily_quota ?? 5;
  const startIndex = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalItems);
  const safeRecordings = useMemo(() => (Array.isArray(recordings) ? recordings : []), [recordings]);

  return {
    user,
    authLoading,
    handleLogout,
    dataLoading,
    dataError,
    refreshRecordings,
    recordings: safeRecordings,
    searchQuery,
    setSearchQuery,
    debouncedSearch,
    selectedStatus,
    setSelectedStatus,
    selectedTemplate,
    setSelectedTemplate,
    page,
    setPage,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    viewMode,
    setViewMode,
    statusSelectOptions,
    templateSelectOptions,
    recordingToDelete,
    setRecordingToDelete,
    isDeleting,
    handleDeleteConfirm,
    shareRecording,
    setShareRecording,
    shareToken,
    handleOpenShare,
    handleToggleShare,
    recordingToMove,
    setRecordingToMove,
    activeWorkspace,
    activeFolderId,
    activeFolder,
    folders,
    workspaceTotalRecordings,
    quotaRemaining,
    quotaTotal,
    getTemplateLabel,
    t,
    locale,
  };
}

