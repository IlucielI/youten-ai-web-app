'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/atoms/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/atoms/select';
import { Button } from '@/components/atoms/button';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { FolderDTO } from '@/server/dtos/workspace.dto';
import { ApiResponse } from '@/server/dtos/response.dto';
import { apiFetch } from '@/lib/api-client';
import { Folder, Layers, Check, AlertTriangle, Building2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface MoveFolderDialogProps {
  recordingId: string | null;
  currentFolderId?: string | null;
  currentWorkspaceId?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMoved?: () => void;
}

export const MoveFolderDialog: React.FC<MoveFolderDialogProps> = ({
  recordingId,
  currentFolderId = null,
  currentWorkspaceId = null,
  open,
  onOpenChange,
  onMoved,
}) => {
  const { workspaces, activeWorkspace, folders: defaultFolders } = useWorkspaceStore();
  const originWsId = currentWorkspaceId || activeWorkspace?.id || '';
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>(originWsId);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(currentFolderId);
  const [displayedFolders, setDisplayedFolders] = useState<FolderDTO[]>(defaultFolders);
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when dialog opens or inputs change
  useEffect(() => {
    if (open) {
      const initialWs = currentWorkspaceId || activeWorkspace?.id || '';
      setSelectedWorkspaceId(initialWs);
      setSelectedFolderId(currentFolderId ?? null);

      if (initialWs === activeWorkspace?.id) {
        setDisplayedFolders(defaultFolders);
      } else if (initialWs) {
        fetchWorkspaceFolders(initialWs);
      }
    }
  }, [open, currentFolderId, currentWorkspaceId, activeWorkspace?.id, defaultFolders]);

  const fetchWorkspaceFolders = async (wsId: string) => {
    setIsLoadingFolders(true);
    try {
      const res = await apiFetch<ApiResponse<FolderDTO[]>>(`/api/folders?workspace_id=${wsId}`);
      if (res && res.data) {
        setDisplayedFolders(res.data);
      } else {
        setDisplayedFolders([]);
      }
    } catch {
      setDisplayedFolders([]);
    } finally {
      setIsLoadingFolders(false);
    }
  };

  const handleWorkspaceChange = (newWsId: string) => {
    setSelectedWorkspaceId(newWsId);
    setSelectedFolderId(null);
    if (newWsId === activeWorkspace?.id) {
      setDisplayedFolders(defaultFolders);
    } else {
      fetchWorkspaceFolders(newWsId);
    }
  };

  // Flatten folders tree for simple selection list with indentation
  const flattenFolders = (items: FolderDTO[], depth = 0): { folder: FolderDTO; depth: number }[] => {
    let result: { folder: FolderDTO; depth: number }[] = [];
    for (const item of items) {
      result.push({ folder: item, depth });
      if (item.children && item.children.length > 0) {
        result = result.concat(flattenFolders(item.children, depth + 1));
      }
    }
    return result;
  };

  const flatList = flattenFolders(displayedFolders);
  const isCrossWorkspace = Boolean(
    selectedWorkspaceId && originWsId && selectedWorkspaceId !== originWsId
  );

  const handleMove = async () => {
    if (!recordingId) return;
    setIsSubmitting(true);
    try {
      await apiFetch(`/api/recordings/${recordingId}/folder`, {
        method: 'PATCH',
        body: JSON.stringify({
          folder_id: selectedFolderId,
          workspace_id: selectedWorkspaceId || undefined,
        }),
      });

      if (isCrossWorkspace) {
        const targetWs = workspaces.find((w) => w.id === selectedWorkspaceId);
        toast.success(
          `Rekaman berhasil dipindahkan ke workspace "${targetWs?.name || 'tujuan'}"`
        );
      } else {
        toast.success(
          selectedFolderId ? 'Recording moved to folder' : 'Recording moved to root'
        );
      }
      onOpenChange(false);
      onMoved?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to move recording';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move Recording</DialogTitle>
          <DialogDescription>
            Pindahkan rekaman ke folder lain atau ke workspace lain.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Target Workspace Selector */}
          {workspaces.length > 1 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                Target Workspace
              </label>
              <Select
                value={selectedWorkspaceId}
                onValueChange={handleWorkspaceChange}
                disabled={isSubmitting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Workspace" />
                </SelectTrigger>
                <SelectContent>
                  {workspaces.map((ws) => (
                    <SelectItem key={ws.id} value={ws.id}>
                      {ws.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Cross Workspace Warning Banner */}
          {isCrossWorkspace && (
            <div className="flex items-start gap-2.5 p-3 text-xs bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
              <div>
                <p className="font-semibold">Perhatian: Memindahkan ke Workspace Lain</p>
                <p className="mt-0.5 text-muted-foreground">
                  Akses member di workspace saat ini akan dicabut dan share link publik akan otomatis dinonaktifkan demi privasi data.
                </p>
              </div>
            </div>
          )}

          {/* Folder Selection List */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Folder className="h-3.5 w-3.5" />
              Target Folder
            </label>

            {isLoadingFolders ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-xs">Memuat daftar folder...</span>
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-1 rounded-md border p-1">
                {/* Root Option */}
                <button
                  type="button"
                  onClick={() => setSelectedFolderId(null)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors text-left',
                    selectedFolderId === null
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'hover:bg-accent text-foreground'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    <span>Root (Tanpa Folder)</span>
                  </div>
                  {selectedFolderId === null && <Check className="h-4 w-4 text-primary" />}
                </button>

                {/* Folder Options */}
                {flatList.map(({ folder, depth }) => {
                  const isSelected = selectedFolderId === folder.id;
                  return (
                    <button
                      key={folder.id}
                      type="button"
                      onClick={() => setSelectedFolderId(folder.id)}
                      style={{ paddingLeft: `${depth * 16 + 12}px` }}
                      className={cn(
                        'w-full flex items-center justify-between pr-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors text-left',
                        isSelected
                          ? 'bg-primary/10 text-primary font-bold'
                          : 'hover:bg-accent text-foreground'
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{folder.name}</span>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={handleMove} disabled={isSubmitting || isLoadingFolders}>
            {isSubmitting ? 'Memindahkan...' : isCrossWorkspace ? 'Pindahkan ke Workspace' : 'Pindahkan Rekaman'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
