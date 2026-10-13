'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SearchableSelect, SearchableSelectOption } from '@/components/molecules/searchable-select';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import { ApiResponse, BaseResponse } from '@/server/dtos/response.dto';
import { UserProfileResponse } from '@/server/dtos/auth.dto';
import { RecordingListItemDTO } from '@/server/dtos/recording.dto';
import { useAuthStore } from '@/stores/auth.store';
import { RecordingStatus } from '@/server/constants/recording.constant';
import { formatTime } from '@/lib/time';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import { YoutenLogo } from '@/components/atoms/youten-logo';
import { Skeleton } from '@/components/atoms/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/atoms/table';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/atoms/alert-dialog';
import {
  RecordingCard,
  getStatusPillConfig,
  templateLabels,
} from '@/components/molecules/recording-card';
import { StatusPill } from '@/components/molecules/status-pill';
import { EmptyState } from '@/components/molecules/empty-state';
import { ShareDialog } from '@/components/molecules/share-dialog';
import { UserNavDropdown } from '@/components/molecules/user-nav-dropdown';
import { LanguageSwitcher } from '@/components/molecules/language-switcher';
import { ThemeToggle } from '@/components/molecules/theme-toggle';
import { Footer } from '@/components/organisms/footer';
import { toast } from 'sonner';
import { useTemplates } from '@/hooks';
import { useTranslation } from '@/locales';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Sparkles,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Share2,
  ExternalLink,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';

interface RecordingsApiResponse {
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

export default function DashboardPage() {
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

  // 1. Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to page 1 on new search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 2. Fetch authenticated user profile
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

  // 3. Fetch recordings from BFF
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
  }, [authLoading, user, page, pageSize, debouncedSearch, selectedStatus, selectedTemplate, refreshKey, t]);

  // 4. Handle Delete
  const handleDeleteConfirm = async () => {
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
  };

  // 5. Handle Logout
  const handleLogout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
      useAuthStore.getState().reset();
      setUser(null);
      router.push('/login');
    } catch {
      toast.error(t('notifications.error.logoutFailed'));
    }
  };

  // 6. Share handling
  const handleOpenShare = (rec: RecordingListItemDTO) => {
    setShareRecording(rec);
    setShareToken(null);
  };

  const handleToggleShare = async (enable: boolean) => {
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
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="space-y-4 text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-500">{t('dashboard.loading.verifyingSession')}</p>
        </div>
      </div>
    );
  }

  const quotaRemaining = user?.quota_remaining ?? 0;
  const quotaTotal = user?.daily_quota ?? 5;
  const startIndex = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalItems);
  const safeRecordings = Array.isArray(recordings) ? recordings : [];

  return (
    <div data-testid="dashboard-page" className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <YoutenLogo size="sm" className="group-hover:scale-105 transition-transform" />
            <span className="font-extrabold text-base tracking-tight text-foreground group-hover:text-primary transition-colors">
              Youten AI
            </span>
          </Link>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LanguageSwitcher />
            <UserNavDropdown user={user} onLogout={handleLogout} />
          </div>
        </div>
      </header>

      {/* Main Workspace Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Welcome & Quota Header */}
        <section className="bg-card text-card-foreground rounded-3xl border border-border p-6 sm:p-8 shadow-xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {t('dashboard.welcome.title', { name: user?.full_name || t('dashboard.welcome.defaultName') })}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('dashboard.welcome.subtitle')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* Daily Quota Widget */}
            <div className="px-4 py-3 rounded-2xl bg-primary/10 border border-primary/20 flex items-center gap-3">
              <div className="p-2 bg-primary text-primary-foreground rounded-xl shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-foreground tracking-tight">{t('dashboard.welcome.quotaTitle')}</p>
                <p className="text-xs font-medium text-muted-foreground">
                  <strong className="font-extrabold text-primary">{quotaRemaining}</strong>{' '}
                  {t('dashboard.welcome.quotaRemainingSuffix', { total: quotaTotal })}
                </p>
              </div>
            </div>

            {/* New Recording Primary CTA */}
            <Button asChild size="lg" className="rounded-xl shadow-sm shadow-primary/20 font-bold gap-2">
              <Link href="/">
                <Plus className="w-4 h-4" />
                <span>{t('dashboard.welcome.newRecording')}</span>
              </Link>
            </Button>
          </div>
        </section>

        {/* Search, Filter Toolbar & View Mode Switcher */}
        <section className="bg-card text-card-foreground rounded-2xl border border-border p-4 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                data-testid="dashboard-search-input"
                type="text"
                placeholder={t('dashboard.search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-background border border-border rounded-xl placeholder:text-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>

            {/* Filters & View Switcher */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Status Filter */}
              <div className="w-36 sm:w-44">
                <SearchableSelect
                  data-testid="status-filter-select"
                  value={selectedStatus}
                  onValueChange={(val) => {
                    setSelectedStatus(val);
                    setPage(1);
                  }}
                  options={statusSelectOptions}
                  placeholder={t('dashboard.filters.allStatuses')}
                  searchPlaceholder={`${t('common.actions.search')}...`}
                  triggerClassName="h-9 text-xs rounded-xl border-border bg-background font-medium text-foreground"
                />
              </div>

              {/* Template Filter */}
              <div className="w-40 sm:w-48">
                <SearchableSelect
                  data-testid="template-filter-select"
                  value={selectedTemplate}
                  onValueChange={(val) => {
                    setSelectedTemplate(val);
                    setPage(1);
                  }}
                  options={templateSelectOptions}
                  placeholder={t('dashboard.filters.allTemplates')}
                  searchPlaceholder="Cari template..."
                  triggerClassName="h-9 text-xs rounded-xl border-border bg-background font-medium text-foreground"
                />
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-muted p-0.5 rounded-xl border border-border">
                <button
                  type="button"
                  data-testid="grid-view-btn"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-background text-primary shadow-xs font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  aria-label={t('dashboard.filters.gridView')}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  data-testid="list-view-btn"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-background text-primary shadow-xs font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  aria-label={t('dashboard.filters.tableView')}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Refresh Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshRecordings}
                className="p-2 text-muted-foreground hover:text-foreground rounded-xl cursor-pointer"
                aria-label={t('dashboard.filters.refresh')}
              >
                <RefreshCw className={`w-4 h-4 ${dataLoading ? 'animate-spin text-primary' : ''}`} />
              </Button>
            </div>
          </div>
        </section>

        {/* Content Section */}
        {dataLoading ? (
          /* Skeletons */
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-5 bg-card rounded-2xl border border-border space-y-4">
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-24 rounded-full" />
                    <Skeleton className="h-5 w-6 rounded-md" />
                  </div>
                  <Skeleton className="h-6 w-3/4 rounded-md" />
                  <Skeleton className="h-4 w-1/2 rounded-md" />
                  <div className="pt-3 border-t border-border/60 flex justify-between">
                    <Skeleton className="h-4 w-28 rounded-md" />
                    <Skeleton className="h-4 w-16 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          )
        ) : dataError ? (
          /* Error State */
          <div className="p-8 text-center bg-card rounded-2xl border border-destructive/30 space-y-4">
            <AlertTriangle className="w-10 h-10 text-destructive mx-auto" />
            <div className="space-y-1">
              <h3 className="font-bold text-foreground">{t('dashboard.error.title')}</h3>
              <p className="text-xs text-muted-foreground">{dataError}</p>
            </div>
            <Button onClick={refreshRecordings} size="sm" variant="outline">
              {t('dashboard.error.retry')}
            </Button>
          </div>
        ) : safeRecordings.length === 0 ? (
          /* Empty State */
          <EmptyState
            title={debouncedSearch || selectedStatus || selectedTemplate ? t('dashboard.empty.searchTitle') : t('dashboard.empty.title')}
            description={
              debouncedSearch || selectedStatus || selectedTemplate
                ? t('dashboard.empty.searchDescription')
                : t('dashboard.empty.description')
            }
            icon={<FolderOpen className="w-8 h-8 text-primary" />}
            action={
              debouncedSearch || selectedStatus || selectedTemplate ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedStatus('');
                    setSelectedTemplate('');
                  }}
                >
                  {t('dashboard.filters.reset')}
                </Button>
              ) : (
                <Button asChild size="sm" className="font-bold gap-2">
                  <Link href="/">
                    <Plus className="w-4 h-4" />
                    <span>{t('dashboard.empty.action')}</span>
                  </Link>
                </Button>
              )
            }
          />
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {safeRecordings.map((recording) => (
              <RecordingCard
                key={recording.id}
                recording={recording}
                onShare={handleOpenShare}
                onDelete={(rec) => setRecordingToDelete(rec)}
              />
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 border-b border-border">
                  <TableHead className="font-bold text-muted-foreground">{t('dashboard.table.titleHeader')}</TableHead>
                  <TableHead className="font-bold text-muted-foreground">{t('dashboard.table.templateHeader')}</TableHead>
                  <TableHead className="font-bold text-muted-foreground">{t('dashboard.table.statusHeader')}</TableHead>
                  <TableHead className="font-bold text-muted-foreground">{t('dashboard.table.durationHeader')}</TableHead>
                  <TableHead className="font-bold text-muted-foreground">{t('dashboard.table.dateHeader')}</TableHead>
                  <TableHead className="text-right font-bold text-muted-foreground">{t('dashboard.table.actionsHeader')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeRecordings.map((recording) => {
                  const pillConfig = getStatusPillConfig(recording.status);
                  const templateName =
                    getTemplateLabel(recording.selected_template) ||
                    templateLabels[recording.selected_template] ||
                    recording.selected_template;
                  const formattedDate = new Date(recording.created_at).toLocaleDateString(
                    locale === 'en' ? 'en-US' : 'id-ID',
                    {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    }
                  );

                  return (
                    <TableRow key={recording.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-semibold text-foreground">
                        <Link
                          href={`/recordings/${recording.id}`}
                          className="hover:text-primary transition-colors line-clamp-1"
                        >
                          {recording.title || recording.original_filename}
                        </Link>
                        <p className="text-[11px] text-muted-foreground font-normal truncate">
                          {recording.original_filename}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="text-[11px] font-medium bg-primary/10 text-primary border border-primary/20"
                        >
                          {templateName}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <StatusPill label={pillConfig.label} status={pillConfig.status} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-medium">
                        {formatTime(recording.duration_seconds)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formattedDate}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                            <Link href={`/recordings/${recording.id}`} aria-label={t('dashboard.table.viewDetail')}>
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenShare(recording)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                            aria-label={t('dashboard.table.share')}
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRecordingToDelete(recording)}
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                            aria-label={t('dashboard.table.delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination Controls */}
        {!dataLoading && safeRecordings.length > 0 && (
          <footer className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/70 text-xs text-muted-foreground">
            <div>
              {t('dashboard.pagination.showing', {
                start: startIndex,
                end: endIndex,
                total: totalItems,
              })}
            </div>

            <div className="flex items-center gap-2">
              <Button
                data-testid="pagination-prev-btn"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="gap-1 text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>{t('dashboard.pagination.prev')}</span>
              </Button>

              <span className="px-2 font-medium">
                {t('dashboard.pagination.pageOf', { page, total: totalPages })}
              </span>

              <Button
                data-testid="pagination-next-btn"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="gap-1 text-xs"
              >
                <span>{t('dashboard.pagination.next')}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </footer>
        )}
      </main>

      {/* Global Application Footer */}
      <Footer className="mt-auto" />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={Boolean(recordingToDelete)}
        onOpenChange={(open) => !open && setRecordingToDelete(null)}
      >
        <AlertDialogContent data-testid="delete-confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dashboard.deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dashboard.deleteDialog.description', {
                title: recordingToDelete?.title || recordingToDelete?.original_filename || '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="delete-cancel-btn" disabled={isDeleting}>
              {t('dashboard.deleteDialog.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="delete-confirm-btn"
              disabled={isDeleting}
              onClick={handleDeleteConfirm}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              {isDeleting ? t('dashboard.deleteDialog.deleting') : t('dashboard.deleteDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Share Dialog */}
      <ShareDialog
        isOpen={Boolean(shareRecording)}
        onClose={() => setShareRecording(null)}
        isShared={Boolean(shareToken)}
        shareToken={shareToken}
        onToggleShare={handleToggleShare}
      />
    </div>
  );
}
