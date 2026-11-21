'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Folder,
  FolderOpen,
  FolderPlus,
  MoreVertical,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/atoms/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/atoms/alert-dialog';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { FolderDTO } from '@/server/dtos/workspace.dto';
import { apiFetch } from '@/lib/api-client';
import { toast } from 'sonner';

export interface FolderSidebarProps {
  className?: string;
  totalRecordingsCount?: number;
}

export const FolderSidebar: React.FC<FolderSidebarProps> = ({
  className,
  totalRecordingsCount,
}) => {
  const {
    folders,
    activeFolderId,
    setActiveFolderId,
    fetchFolders,
    createFolder,
  } = useWorkspaceStore();

  const [createOpen, setCreateOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit / Rename Folder
  const [editFolder, setEditFolder] = useState<FolderDTO | null>(null);
  const [editName, setEditName] = useState('');

  // Delete Folder
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<FolderDTO | null>(null);

  // Expanded folders set
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) {
      toast.error('Folder name cannot be empty');
      return;
    }
    setIsSubmitting(true);
    try {
      const created = await createFolder(newFolderName.trim(), parentId);
      if (created) {
        toast.success(`Folder "${created.name}" created!`);
        setNewFolderName('');
        setParentId(null);
        setCreateOpen(false);
      } else {
        toast.error('Failed to create folder');
      }
    } catch {
      toast.error('An error occurred while creating folder');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFolder || !editName.trim()) return;
    setIsSubmitting(true);
    try {
      await apiFetch(`/api/folders/${editFolder.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editName.trim() }),
      });
      toast.success('Folder renamed successfully');
      setEditFolder(null);
      await fetchFolders();
    } catch {
      toast.error('Failed to rename folder');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFolder = async () => {
    if (!deleteFolderTarget) return;
    setIsSubmitting(true);
    try {
      await apiFetch(`/api/folders/${deleteFolderTarget.id}`, {
        method: 'DELETE',
      });
      toast.success('Folder deleted');
      if (activeFolderId === deleteFolderTarget.id) {
        setActiveFolderId(null);
      }
      setDeleteFolderTarget(null);
      await fetchFolders();
    } catch {
      toast.error('Failed to delete folder');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFolderItem = (folder: FolderDTO, depth = 0) => {
    const isSelected = activeFolderId === folder.id;
    const hasChildren = folder.children && folder.children.length > 0;
    const isExpanded = expandedFolderIds.has(folder.id);

    return (
      <div key={folder.id} data-testid={`folder-item-${folder.id}`} className="space-y-0.5">
        <div
          onClick={() => setActiveFolderId(folder.id)}
          style={{ paddingLeft: `${Math.max(8, depth * 16 + 8)}px` }}
          className={cn(
            'group flex items-center justify-between pr-2 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors',
            isSelected
              ? 'bg-primary/10 text-primary font-semibold'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          <div className="flex items-center gap-1.5 truncate mr-1">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleExpand(folder.id, e)}
                className="p-0.5 hover:bg-muted rounded text-muted-foreground"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>
            ) : (
              <span className="w-3" />
            )}
            {isSelected ? (
              <FolderOpen className="h-3.5 w-3.5 shrink-0 text-primary" />
            ) : (
              <Folder className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-foreground" />
            )}
            <span className="truncate">{folder.name}</span>
          </div>

          <div
            className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36 text-xs">
                <DropdownMenuItem
                  onClick={() => {
                    setParentId(folder.id);
                    setCreateOpen(true);
                  }}
                  className="cursor-pointer"
                >
                  <FolderPlus className="h-3.5 w-3.5 mr-2" />
                  New Subfolder
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setEditFolder(folder);
                    setEditName(folder.name);
                  }}
                  className="cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeleteFolderTarget(folder)}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-0.5">
            {folder.children!.map((child) => renderFolderItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn('flex flex-col space-y-3', className)} data-testid="folder-sidebar">
      <div className="flex items-center justify-between px-2">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Folders
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          data-testid="create-folder-btn"
          onClick={() => {
            setParentId(null);
            setCreateOpen(true);
          }}
          className="h-6 w-6 p-0 hover:bg-muted text-muted-foreground hover:text-foreground"
          title="New Folder"
        >
          <FolderPlus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="space-y-0.5">
        <button
          type="button"
          data-testid="all-recordings-nav"
          onClick={() => setActiveFolderId(null)}
          className={cn(
            'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left',
            activeFolderId === null
              ? 'bg-primary/10 text-primary font-semibold'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <Layers className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">All Recordings</span>
          </div>
          {totalRecordingsCount !== undefined && (
            <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
              {totalRecordingsCount}
            </span>
          )}
        </button>

        {folders.map((folder) => renderFolderItem(folder, 0))}
      </div>

      {/* Create Folder Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm" data-testid="create-folder-dialog">
          <DialogHeader>
            <DialogTitle>{parentId ? 'New Subfolder' : 'New Folder'}</DialogTitle>
            <DialogDescription>
              Create a folder to group and organize meeting recordings in this workspace.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateFolder} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="folder-name" className="text-xs font-semibold">
                Folder Name
              </Label>
              <Input
                id="folder-name"
                data-testid="folder-name-input"
                placeholder="e.g. Sprint Reviews"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                maxLength={100}
                required
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                data-testid="submit-folder-btn"
                disabled={isSubmitting || !newFolderName.trim()}
              >
                {isSubmitting ? 'Creating...' : 'Create Folder'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit / Rename Folder Dialog */}
      <Dialog open={!!editFolder} onOpenChange={(open) => !open && setEditFolder(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateFolder} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-folder-name" className="text-xs font-semibold">
                Folder Name
              </Label>
              <Input
                id="edit-folder-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={100}
                required
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditFolder(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting || !editName.trim()}>
                {isSubmitting ? 'Saving...' : 'Rename'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Folder Alert Dialog */}
      <AlertDialog
        open={!!deleteFolderTarget}
        onOpenChange={(open) => !open && setDeleteFolderTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete folder &quot;{deleteFolderTarget?.name}&quot;? Recordings inside this folder will not be deleted; they will be moved to unorganized root.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleDeleteFolder();
              }}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? 'Deleting...' : 'Delete Folder'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

