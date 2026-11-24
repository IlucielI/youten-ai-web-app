'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/atoms/card';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { Badge } from '@/components/atoms/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/atoms/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/atoms/dialog';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/atoms/tooltip';
import {
  Building2,
  Users,
  UserPlus,
  Mail,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  ChevronsUpDown,
  Plus,
} from 'lucide-react';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useAuthStore } from '@/stores/auth.store';
import {
  WorkspaceDTO,
  WorkspaceMemberDTO,
  WorkspaceInvitationDTO,
} from '@/server/dtos/workspace.dto';
import { apiFetch } from '@/lib/api-client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export const WorkspaceSettingsTab: React.FC = () => {
  const {
    workspaces,
    activeWorkspace,
    fetchWorkspaces,
    setActiveWorkspace,
    createWorkspace,
  } = useWorkspaceStore();

  const currentUser = useAuthStore((s) => s.user);

  // Selected workspace in this tab (defaults to activeWorkspace or first available workspace)
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceDTO | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!activeWorkspace || workspaces.length === 0) {
      Promise.resolve().then(() => {
        if (isMounted) {
          void fetchWorkspaces();
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [activeWorkspace, workspaces.length, fetchWorkspaces]);

  // Keep selectedWorkspace in sync
  useEffect(() => {
    if (!selectedWorkspace) {
      if (activeWorkspace) {
        setSelectedWorkspace(activeWorkspace);
      } else if (workspaces.length > 0) {
        setSelectedWorkspace(workspaces[0]);
      }
    } else {
      const matched = workspaces.find((w) => w.id === selectedWorkspace.id);
      if (matched && (matched.name !== selectedWorkspace.name || matched.role !== selectedWorkspace.role)) {
        setSelectedWorkspace(matched);
      }
    }
  }, [activeWorkspace, workspaces, selectedWorkspace]);

  const currentWorkspace = selectedWorkspace || activeWorkspace || (workspaces.length > 0 ? workspaces[0] : null);

  const [members, setMembers] = useState<WorkspaceMemberDTO[]>([]);
  const [invitations, setInvitations] = useState<WorkspaceInvitationDTO[]>([]);
  const [loading, setLoading] = useState(false);

  // Create Workspace modal
  const [createOpen, setCreateOpen] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Invite modal
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const [isInviting, setIsInviting] = useState(false);

  // Remove member modal
  const [memberToRemove, setMemberToRemove] = useState<WorkspaceMemberDTO | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Revoke invite modal
  const [inviteToRevoke, setInviteToRevoke] = useState<WorkspaceInvitationDTO | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  // Copied link tracker
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    try {
      const [membersRes, invitesRes] = await Promise.all([
        apiFetch<{ data: WorkspaceMemberDTO[] }>(`/api/workspaces/${currentWorkspace.id}/members`),
        apiFetch<{ data: WorkspaceInvitationDTO[] }>(`/api/workspaces/${currentWorkspace.id}/invites`),
      ]);
      setMembers(membersRes.data || []);
      setInvitations(invitesRes.data || []);
    } catch {
      toast.error('Failed to load workspace members and invitations');
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    let isMounted = true;
    if (!currentWorkspace) return;
    Promise.resolve().then(() => {
      if (isMounted) {
        void loadData();
      }
    });
    return () => {
      isMounted = false;
    };
  }, [currentWorkspace, loadData]);

  // Determine effective caller role and permissions in currentWorkspace
  const callerMember = members.find((m) => m.user_id === currentUser?.id);
  const effectiveRole = (currentWorkspace?.role || callerMember?.role || 'member').toLowerCase();
  const canManageMembers = effectiveRole === 'owner' || effectiveRole === 'admin';
  const isActiveInDashboard = activeWorkspace?.id === currentWorkspace?.id;

  const handleSetActiveWorkspace = async () => {
    if (!currentWorkspace) return;
    await setActiveWorkspace(currentWorkspace);
    toast.success(`Switched global active workspace to: ${currentWorkspace.name}`);
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) {
      toast.error('Workspace name cannot be empty');
      return;
    }
    setIsCreating(true);
    try {
      const created = await createWorkspace(newWsName.trim(), newWsDesc.trim() || undefined);
      if (created) {
        toast.success(`Workspace "${created.name}" created!`);
        setSelectedWorkspace(created);
        setNewWsName('');
        setNewWsDesc('');
        setCreateOpen(false);
      } else {
        toast.error('Failed to create workspace');
      }
    } catch {
      toast.error('An error occurred while creating workspace');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace || !inviteEmail.trim()) return;
    if (!canManageMembers) {
      toast.error('Only workspace owners and admins can invite members');
      return;
    }
    setIsInviting(true);
    try {
      await apiFetch(`/api/workspaces/${currentWorkspace.id}/invites`, {
        method: 'POST',
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      });
      toast.success(`Invitation sent to ${inviteEmail.trim()}`);
      setInviteEmail('');
      setInviteOpen(false);
      await loadData();
    } catch {
      toast.error('Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'owner' | 'admin' | 'member' | 'viewer') => {
    if (!currentWorkspace || !canManageMembers) return;
    try {
      await apiFetch(`/api/workspaces/${currentWorkspace.id}/members/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole }),
      });
      toast.success('Member role updated');
      await loadData();
    } catch {
      toast.error('Failed to update member role');
    }
  };

  const handleRemoveMember = async () => {
    if (!currentWorkspace || !memberToRemove || !canManageMembers) return;
    setIsRemoving(true);
    try {
      await apiFetch(`/api/workspaces/${currentWorkspace.id}/members/${memberToRemove.user_id}`, {
        method: 'DELETE',
      });
      toast.success(`Removed ${memberToRemove.full_name || memberToRemove.email} from workspace`);
      setMemberToRemove(null);
      await loadData();
    } catch {
      toast.error('Failed to remove member');
    } finally {
      setIsRemoving(false);
    }
  };

  const handleRevokeInvite = async () => {
    if (!currentWorkspace || !inviteToRevoke || !canManageMembers) return;
    setIsRevoking(true);
    try {
      await apiFetch(`/api/workspaces/${currentWorkspace.id}/invites/${inviteToRevoke.id}`, {
        method: 'DELETE',
      });
      toast.success(`Invitation for ${inviteToRevoke.email} revoked`);
      setInviteToRevoke(null);
      await loadData();
    } catch {
      toast.error('Failed to revoke invitation');
    } finally {
      setIsRevoking(false);
    }
  };

  const copyInviteLink = (token: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/invitations/${token}`;
    void navigator.clipboard.writeText(link);
    setCopiedToken(token);
    toast.success('Invitation link copied to clipboard!');
    setTimeout(() => setCopiedToken(null), 2500);
  };

  if (!currentWorkspace) {
    return (
      <Card className="border-border shadow-xs bg-card text-card-foreground p-8 text-center">
        <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-bold text-foreground">No Active Workspace Selected</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Select or create a workspace using the switcher in the header.
        </p>
      </Card>
    );
  }

  const roleColors: Record<string, string> = {
    owner: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    admin: 'bg-primary/10 text-primary border-primary/20',
    member: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    viewer: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  };

  return (
    <div className="space-y-6">
      {/* Workspace Overview Card with Dropdown Switcher */}
      <Card className="border-border shadow-xs bg-card text-card-foreground">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  data-testid="workspace-settings-dropdown-trigger"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl border border-border/80 bg-background/80 hover:bg-accent/80 hover:text-accent-foreground text-left transition-all cursor-pointer shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Select Workspace"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-foreground tracking-tight max-w-[180px] sm:max-w-[280px] truncate">
                        {currentWorkspace.name}
                      </span>
                      {effectiveRole && (
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase font-bold px-2 py-0 rounded-full border ${roleColors[effectiveRole] || ''}`}
                        >
                          {effectiveRole}
                        </Badge>
                      )}
                      {isActiveInDashboard && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0"
                        >
                          Active
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground truncate max-w-[240px] sm:max-w-[320px]">
                      {currentWorkspace.description || 'Collaborative team workspace'}
                    </span>
                  </div>
                  <ChevronsUpDown className="h-4 w-4 text-muted-foreground ml-1 shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72">
                <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold px-2 py-1.5">
                  Workspaces
                </DropdownMenuLabel>
                <div className="max-h-56 overflow-y-auto">
                  {(Array.isArray(workspaces) ? workspaces : []).map((ws) => {
                    const isSelected = currentWorkspace.id === ws.id;
                    const isWsActive = activeWorkspace?.id === ws.id;
                    const wsRole = (ws.role || 'member').toLowerCase();
                    return (
                      <DropdownMenuItem
                        key={ws.id}
                        data-testid={`workspace-select-item-${ws.id}`}
                        onClick={() => setSelectedWorkspace(ws)}
                        className="flex items-center justify-between text-xs py-2 cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex flex-col truncate">
                            <span className={cn('truncate font-medium', isSelected && 'font-bold text-primary')}>
                              {ws.name}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[9px] uppercase font-bold text-muted-foreground">
                                {wsRole}
                              </span>
                              {isWsActive && (
                                <span className="text-[9px] text-emerald-600 font-semibold">
                                  • Active
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                      </DropdownMenuItem>
                    );
                  })}
                </div>

                <DropdownMenuSeparator />

                {!isActiveInDashboard && (
                  <DropdownMenuItem
                    data-testid="set-as-active-workspace-btn"
                    onClick={() => void handleSetActiveWorkspace()}
                    className="flex items-center gap-2 text-xs py-2 cursor-pointer text-emerald-600 focus:text-emerald-600 font-medium"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Jadikan Workspace Aktif</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem
                  data-testid="create-workspace-menu-item"
                  onClick={() => setCreateOpen(true)}
                  className="flex items-center gap-2 text-xs py-2 cursor-pointer text-primary focus:text-primary font-medium"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create New Workspace</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="gap-1.5 text-xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>

            {canManageMembers ? (
              <Button
                type="button"
                size="sm"
                data-testid="invite-member-btn"
                onClick={() => setInviteOpen(true)}
                className="gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Invite Member</span>
              </Button>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0} className="inline-block cursor-not-allowed">
                      <Button
                        type="button"
                        size="sm"
                        data-testid="invite-member-btn"
                        disabled
                        className="gap-1.5 text-xs font-semibold opacity-60 pointer-events-none"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Invite Member</span>
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    <p>Only workspace owners and admins can invite members</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Team Members Section */}
      <Card className="border-border shadow-xs bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span>Team Members ({members.length})</span>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Members can view and collaborate on meetings scoped to {currentWorkspace.name}.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {loading && members.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
              Loading members...
            </div>
          ) : members.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No members found in this workspace.
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Name</TableHead>
                    <TableHead className="text-xs font-semibold">Email</TableHead>
                    <TableHead className="text-xs font-semibold">Role</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id} className="hover:bg-muted/30">
                      <TableCell className="text-xs font-medium text-foreground">
                        {member.full_name || '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {member.email}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${roleColors[member.role] || ''}`}
                        >
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {canManageMembers && member.role !== 'owner' ? (
                          <div className="flex items-center justify-end gap-2">
                            <select
                              value={member.role}
                              onChange={(e) =>
                                void handleUpdateRole(
                                  member.user_id,
                                  e.target.value as 'admin' | 'member' | 'viewer'
                                )
                              }
                              className="text-xs bg-background border border-border rounded px-2 py-1 text-foreground focus:outline-hidden"
                              aria-label={`Update role for ${member.full_name || member.email}`}
                            >
                              <option value="admin">Admin</option>
                              <option value="member">Member</option>
                              <option value="viewer">Viewer</option>
                            </select>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                              onClick={() => setMemberToRemove(member)}
                              aria-label={`Remove ${member.full_name || member.email}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations Section */}
      <Card className="border-border shadow-xs bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            <span>Pending Invitations ({invitations.length})</span>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Invitations that have not yet been accepted. Invitations expire in 7 days.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {loading && invitations.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
              Loading invitations...
            </div>
          ) : invitations.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No pending invitations. {canManageMembers ? 'Click "Invite Member" to invite a teammate.' : ''}
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Invited Email</TableHead>
                    <TableHead className="text-xs font-semibold">Assigned Role</TableHead>
                    <TableHead className="text-xs font-semibold">Invited By</TableHead>
                    <TableHead className="text-xs font-semibold">Expires</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((invite) => (
                    <TableRow key={invite.id} className="hover:bg-muted/30">
                      <TableCell className="text-xs font-medium text-foreground">
                        {invite.email}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${roleColors[invite.role] || ''}`}
                        >
                          {invite.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {invite.inviter_name || 'System'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(invite.expires_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1 cursor-pointer"
                            onClick={() => copyInviteLink(invite.token)}
                          >
                            {copiedToken === invite.token ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-500" />
                                <span className="text-emerald-500">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Link</span>
                              </>
                            )}
                          </Button>
                          {canManageMembers && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                              onClick={() => setInviteToRevoke(invite)}
                              aria-label={`Revoke invitation for ${invite.email}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Member Modal */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an email invitation or generate a shareable link to add a teammate to {currentWorkspace.name}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSendInvite} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="invite-email" className="text-xs font-semibold">
                Teammate Email Address
              </Label>
              <Input
                id="invite-email"
                data-testid="invite-email-input"
                type="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="invite-role" className="text-xs font-semibold">
                Assigned Role
              </Label>
              <select
                id="invite-role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member' | 'viewer')}
                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-hidden"
              >
                <option value="member">Member — Can upload, organize folders, and comment</option>
                <option value="admin">Admin — Can manage members and invitations</option>
                <option value="viewer">Viewer — Read-only access to recordings and transcripts</option>
              </select>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setInviteOpen(false)}
                disabled={isInviting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                data-testid="submit-invite-btn"
                disabled={isInviting || !inviteEmail.trim()}
              >
                {isInviting ? 'Sending...' : 'Send Invitation'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Workspace Modal */}
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
              <Label htmlFor="create-ws-name" className="text-xs font-semibold">
                Workspace Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="create-ws-name"
                data-testid="create-ws-name-input"
                placeholder="e.g. Engineering Team"
                value={newWsName}
                onChange={(e) => setNewWsName(e.target.value)}
                maxLength={100}
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-ws-desc" className="text-xs font-semibold">
                Description (Optional)
              </Label>
              <Input
                id="create-ws-desc"
                data-testid="create-ws-desc-input"
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
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                data-testid="submit-create-ws-btn"
                disabled={isCreating || !newWsName.trim()}
              >
                {isCreating ? 'Creating...' : 'Create Workspace'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Remove Member Alert Dialog */}
      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove &quot;{memberToRemove?.full_name || memberToRemove?.email}&quot; from this workspace? They will lose access to shared recordings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleRemoveMember();
              }}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? 'Removing...' : 'Remove Member'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke Invitation Alert Dialog */}
      <AlertDialog
        open={!!inviteToRevoke}
        onOpenChange={(open) => !open && setInviteToRevoke(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke the invitation for &quot;{inviteToRevoke?.email}&quot;? The invite link will become invalid immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleRevokeInvite();
              }}
              disabled={isRevoking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRevoking ? 'Revoking...' : 'Revoke Invitation'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
