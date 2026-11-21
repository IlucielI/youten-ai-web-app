'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/atoms/dialog';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { Building2, Check, ChevronsUpDown, Plus, Users } from 'lucide-react';
import { toast } from 'sonner';

export interface WorkspaceSwitcherProps {
  className?: string;
}

export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({ className }) => {
  const {
    workspaces,
    activeWorkspace,
    isInitialized,
    fetchWorkspaces,
    setActiveWorkspace,
    createWorkspace,
  } = useWorkspaceStore();

  const [createOpen, setCreateOpen] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      void fetchWorkspaces();
    }
  }, [isInitialized, fetchWorkspaces]);

  const handleSelectWorkspace = async (ws: typeof workspaces[0]) => {
    if (activeWorkspace?.id === ws.id) return;
    await setActiveWorkspace(ws);
    toast.success(`Switched to workspace: ${ws.name}`);
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) {
      toast.error('Workspace name cannot be empty');
      return;
    }
    setIsSubmitting(true);
    try {
      const created = await createWorkspace(newWsName.trim(), newWsDesc.trim() || undefined);
      if (created) {
        toast.success(`Workspace "${created.name}" created!`);
        setNewWsName('');
        setNewWsDesc('');
        setCreateOpen(false);
      } else {
        toast.error('Failed to create workspace');
      }
    } catch {
      toast.error('An error occurred while creating workspace');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeName = activeWorkspace?.name || 'Personal Workspace';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/80 bg-background/80 hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-all shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring',
              className
            )}
            aria-label="Switch Workspace"
          >
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
              <Building2 className="h-3.5 w-3.5" />
            </div>
            <span className="truncate max-w-[120px] sm:max-w-[150px] text-foreground text-xs font-semibold">
              {activeName}
            </span>
            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-60">
          <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold px-2 py-1.5">
            Workspaces
          </DropdownMenuLabel>
          <div className="max-h-56 overflow-y-auto">
            {workspaces.map((ws) => {
              const isSelected = activeWorkspace?.id === ws.id;
              return (
                <DropdownMenuItem
                  key={ws.id}
                  onClick={() => handleSelectWorkspace(ws)}
                  className="flex items-center justify-between text-xs py-2 cursor-pointer"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className={cn('truncate', isSelected && 'font-bold text-primary')}>
                      {ws.name}
                    </span>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                </DropdownMenuItem>
              );
            })}
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 text-xs py-2 cursor-pointer text-primary focus:text-primary"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create New Workspace</span>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="flex items-center gap-2 text-xs py-2 cursor-pointer">
            <Link href="/settings?tab=workspaces">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Workspace Members & Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Workspace</DialogTitle>
            <DialogDescription>
              Workspaces allow you to collaborate with your team, share meeting recordings, organize folders, and mention teammates.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateWorkspace} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="ws-name" className="text-xs font-semibold">
                Workspace Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ws-name"
                placeholder="e.g. Engineering Team"
                value={newWsName}
                onChange={(e) => setNewWsName(e.target.value)}
                maxLength={100}
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ws-desc" className="text-xs font-semibold">
                Description (Optional)
              </Label>
              <Input
                id="ws-desc"
                placeholder="Brief purpose of this workspace"
                value={newWsDesc}
                onChange={(e) => setNewWsDesc(e.target.value)}
                maxLength={500}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting || !newWsName.trim()}>
                {isSubmitting ? 'Creating...' : 'Create Workspace'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
