'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/atoms/dialog';
import { Button } from '@/components/atoms/button';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { FolderDTO } from '@/server/dtos/workspace.dto';
import { apiFetch } from '@/lib/api-client';
import { Folder, Layers, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface MoveFolderDialogProps {
  recordingId: string | null;
  currentFolderId?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMoved?: () => void;
}

export const MoveFolderDialog: React.FC<MoveFolderDialogProps> = ({
  recordingId,
  currentFolderId = null,
  open,
  onOpenChange,
  onMoved,
}) => {
  const { folders } = useWorkspaceStore();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(currentFolderId);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const flatList = flattenFolders(folders);

  const handleMove = async () => {
    if (!recordingId) return;
    setIsSubmitting(true);
    try {
      await apiFetch(`/api/recordings/${recordingId}/folder`, {
        method: 'PATCH',
        body: JSON.stringify({ folder_id: selectedFolderId }),
      });
      toast.success(
        selectedFolderId ? 'Recording moved to folder' : 'Recording moved to root'
      );
      onOpenChange(false);
      onMoved?.();
    } catch {
      toast.error('Failed to move recording');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move Recording to Folder</DialogTitle>
          <DialogDescription>
            Select a target folder to organize this recording in your workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 max-h-60 overflow-y-auto space-y-1">
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
              <span>Root (No Folder)</span>
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
          <Button type="button" size="sm" onClick={handleMove} disabled={isSubmitting}>
            {isSubmitting ? 'Moving...' : 'Move Recording'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

