'use client';

import React from 'react';
import Link from 'next/link';
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
  Folder,
} from 'lucide-react';
import { SearchableSelect } from '@/components/molecules/searchable-select';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
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
import { FolderSidebar } from '@/components/molecules/folder-sidebar';
import { MoveFolderDialog } from '@/components/molecules/move-folder-dialog';
import { WorkspaceChatDrawer } from '@/components/organisms/workspace-chat-drawer';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useWorkspaceChatStore } from '@/stores/workspace-chat.store';
import { Navbar } from '@/components/organisms/navbar';
import { Footer } from '@/components/organisms/footer';
import { formatTime } from '@/lib/time';
import { useDashboardRecordings } from '@/hooks/use-dashboard-recordings';

export const DashboardTemplate: React.FC = () => {
  const {
    user,
    authLoading,
    handleLogout,
    dataLoading,
    dataError,
    refreshRecordings,
    recordings,
    searchQuery,
    setSearchQuery,
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
    debouncedSearch,
    t,
    locale,
  } = useDashboardRecordings();

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

  return (
    <div data-testid="dashboard-page" className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      {/* Global Application Navbar */}
      <Navbar
        user={user ? { name: user.full_name || user.email, email: user.email } : null}
        onLogout={handleLogout}
        currentPath="/dashboard"
      />

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

            {/* Ask AI & New Recording Primary CTAs */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              data-testid="ask-workspace-ai-btn"
              onClick={() => {
                useWorkspaceChatStore.getState().openDrawer({ type: 'workspace' });
              }}
              className="rounded-xl font-bold gap-2 border-primary/30 text-primary hover:bg-primary/10 shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Ask AI</span>
            </Button>
            <Button asChild size="lg" className="rounded-xl shadow-sm shadow-primary/20 font-bold gap-2">
              <Link href="/">
                <Plus className="w-4 h-4" />
                <span>{t('dashboard.welcome.newRecording')}</span>
              </Link>
            </Button>
          </div>
        </section>

        {/* Folders & Recordings Section */}
        <div className="flex flex-col lg:flex-row items-start gap-6">
          {/* Left Folder Sidebar */}
          <aside className="w-full lg:w-60 shrink-0 bg-card border border-border rounded-2xl p-4 shadow-xs">
            <FolderSidebar totalRecordingsCount={workspaceTotalRecordings ?? (!activeFolderId ? totalItems : undefined)} />
          </aside>

          {/* Right Main Column */}
          <div className="flex-1 w-full space-y-6">
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

              {/* Active Folder Filter Indicator */}
              {activeFolder && (
                <div className="flex items-center gap-2 pt-2 border-t border-border/60">
                  <span className="text-xs text-muted-foreground font-medium">Filter Folder:</span>
                  <Badge
                    variant="secondary"
                    data-testid="active-folder-badge"
                    className="gap-1.5 py-1 px-2.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20 flex items-center"
                  >
                    <FolderOpen className="w-3.5 h-3.5 shrink-0 text-primary" />
                    <span>{activeFolder.name}</span>
                    <button
                      type="button"
                      data-testid="clear-folder-filter-btn"
                      onClick={() => useWorkspaceStore.getState().setActiveFolderId(null)}
                      className="ml-1 text-primary hover:text-foreground cursor-pointer rounded-full p-0.5 transition-colors"
                      title="Tampilkan semua rekaman"
                      aria-label="Clear folder filter"
                    >
                      ✕
                    </button>
                  </Badge>
                </div>
              )}
            </section>

            {/* Content Section */}
            {dataLoading ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
            ) : recordings.length === 0 ? (
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {recordings.map((recording) => (
                  <RecordingCard
                    key={recording.id}
                    recording={recording}
                    onShare={handleOpenShare}
                    onDelete={(rec) => setRecordingToDelete(rec)}
                    onMoveFolder={(rec) => setRecordingToMove(rec)}
                  />
                ))}
              </div>
            ) : (
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
                    {recordings.map((recording) => {
                      const pillConfig = getStatusPillConfig(recording.status);
                      const recFolderName =
                        recording.folder_name ||
                        (() => {
                          if (!recording.folder_id || !Array.isArray(folders)) return null;
                          const findInTree = (list: typeof folders): string | null => {
                            for (const f of list) {
                              if (f.id === recording.folder_id) return f.name;
                              if (f.children && f.children.length > 0) {
                                const found = findInTree(f.children);
                                if (found) return found;
                              }
                            }
                            return null;
                          };
                          return findInTree(folders);
                        })();
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
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge
                                variant="secondary"
                                className="text-[11px] font-medium bg-primary/10 text-primary border border-primary/20"
                              >
                                {templateName}
                              </Badge>
                              {recFolderName && (
                                <Badge
                                  variant="outline"
                                  data-testid={`table-recording-folder-badge-${recording.id}`}
                                  className="text-[10px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 flex items-center gap-1"
                                >
                                  <Folder className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                                  <span className="truncate max-w-[100px]">{recFolderName}</span>
                                </Badge>
                              )}
                            </div>
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
                                onClick={() => setRecordingToMove(recording)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                aria-label="Move to Folder"
                              >
                                <Folder className="w-4 h-4" />
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
            {!dataLoading && recordings.length > 0 && (
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
          </div>
        </div>
      </main>

      {/* Global Application Footer */}
      <Footer className="mt-auto" />

      {/* Move Folder Dialog */}
      <MoveFolderDialog
        recordingId={recordingToMove?.id ?? null}
        currentFolderId={recordingToMove?.folder_id}
        currentWorkspaceId={recordingToMove?.workspace_id ?? activeWorkspace?.id ?? null}
        open={Boolean(recordingToMove)}
        onOpenChange={(open) => !open && setRecordingToMove(null)}
        onMoved={refreshRecordings}
      />

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

      {/* Multi-Meeting Ask AI Drawer */}
      <WorkspaceChatDrawer />
    </div>
  );
};

