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
  Building2,
  Users,
  UserPlus,
  Mail,
  Trash2,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import { useWorkspaceStore } from '@/stores/workspace.store';
import {
  WorkspaceMemberDTO,
  WorkspaceInvitationDTO,
} from '@/server/dtos/workspace.dto';
import { apiFetch } from '@/lib/api-client';
import { toast } from 'sonner';

export const WorkspaceSettingsTab: React.FC = () => {
  const { activeWorkspace, fetchWorkspaces } = useWorkspaceStore();

  useEffect(() => {
    let isMounted = true;
    if (!activeWorkspace) {
      Promise.resolve().then(() => {
        if (isMounted) {
          void fetchWorkspaces();
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [activeWorkspace, fetchWorkspaces]);

  const [members, setMembers] = useState<WorkspaceMemberDTO[]>([]);
  const [invitations, setInvitations] = useState<WorkspaceInvitationDTO[]>([]);
  const [loading, setLoading] = useState(false);

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
    if (!activeWorkspace) return;
    setLoading(true);
    try {
      const [membersRes, invitesRes] = await Promise.all([
        apiFetch<{ data: WorkspaceMemberDTO[] }>(`/api/workspaces/${activeWorkspace.id}/members`),
        apiFetch<{ data: WorkspaceInvitationDTO[] }>(`/api/workspaces/${activeWorkspace.id}/invites`),
      ]);
      setMembers(membersRes.data || []);
      setInvitations(invitesRes.data || []);
    } catch {
      toast.error('Failed to load workspace members and invitations');
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace]);

  useEffect(() => {
    let isMounted = true;
    if (!activeWorkspace) return;
    Promise.resolve().then(() => {
      if (isMounted) {
        void loadData();
      }
    });
    return () => {
      isMounted = false;
    };
  }, [activeWorkspace, loadData]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace || !inviteEmail.trim()) return;
    setIsInviting(true);
    try {
      await apiFetch(`/api/workspaces/${activeWorkspace.id}/invites`, {
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
    if (!activeWorkspace) return;
    try {
      await apiFetch(`/api/workspaces/${activeWorkspace.id}/members/${userId}`, {
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
    if (!activeWorkspace || !memberToRemove) return;
    setIsRemoving(true);
    try {
      await apiFetch(`/api/workspaces/${activeWorkspace.id}/members/${memberToRemove.user_id}`, {
        method: 'DELETE',
      });
      toast.success('Member removed from workspace');
      setMemberToRemove(null);
      await loadData();
    } catch {
      toast.error('Failed to remove member');
    } finally {
      setIsRemoving(false);
    }
  };

  const handleRevokeInvite = async () => {
    if (!activeWorkspace || !inviteToRevoke) return;
    setIsRevoking(true);
    try {
      await apiFetch(`/api/workspaces/${activeWorkspace.id}/invites/${inviteToRevoke.id}`, {
        method: 'DELETE',
      });
      toast.success('Invitation revoked');
      setInviteToRevoke(null);
      await loadData();
    } catch {
      toast.error('Failed to revoke invitation');
    } finally {
      setIsRevoking(false);
    }
  };

  const handleCopyLink = (token: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://youten.bayuanugerah.my.id';
    const link = `${origin}/invitations/${token}`;
    void navigator.clipboard.writeText(link);
    setCopiedToken(token);
    toast.success('Invitation link copied to clipboard!');
    setTimeout(() => setCopiedToken(null), 2500);
  };

  if (!activeWorkspace) {
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
      {/* Workspace Overview Card */}
      <Card className="border-border shadow-xs bg-card text-card-foreground">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              <span>{activeWorkspace.name}</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              {activeWorkspace.description || 'Collaborative team workspace'}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
            <Button
              type="button"
              size="sm"
              data-testid="invite-member-btn"
              onClick={() => setInviteOpen(true)}
              className="gap-1.5 text-xs font-semibold"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite Member</span>
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Members Section */}
      <Card data-testid="members-card" className="border-border shadow-xs bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span>Team Members ({members.length})</span>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Members can view and collaborate on meetings scoped to this workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table data-testid="members-table">
            <TableHeader>
              <TableRow className="border-b border-border bg-muted/40">
                <TableHead className="font-bold text-muted-foreground text-xs">Name</TableHead>
                <TableHead className="font-bold text-muted-foreground text-xs">Email</TableHead>
                <TableHead className="font-bold text-muted-foreground text-xs">Role</TableHead>
                <TableHead className="text-right font-bold text-muted-foreground text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium text-foreground text-xs">
                    {member.full_name || 'Member'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
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
                    {member.role !== 'owner' && (
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={member.role}
                          onChange={(e) =>
                            void handleUpdateRole(
                              member.user_id,
                              e.target.value as 'admin' | 'member' | 'viewer'
                            )
                          }
                          className="text-xs bg-background border border-border rounded-md px-2 py-1 text-foreground focus:outline-hidden"
                        >
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                          <option value="viewer">Viewer</option>
                        </select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setMemberToRemove(member)}
                          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                          title="Remove Member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pending Invitations Section */}
      <Card className="border-border shadow-xs bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            <span>Pending Invitations ({invitations.length})</span>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Invitations that have not yet been accepted. Invitations expire in 7 days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No pending invitations. Click &quot;Invite Member&quot; to invite a teammate.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/40">
                  <TableHead className="font-bold text-muted-foreground text-xs">Email</TableHead>
                  <TableHead className="font-bold text-muted-foreground text-xs">Role</TableHead>
                  <TableHead className="font-bold text-muted-foreground text-xs">Expires</TableHead>
                  <TableHead className="text-right font-bold text-muted-foreground text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invite) => (
                  <TableRow key={invite.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium text-foreground text-xs">
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
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(invite.expires_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyLink(invite.token)}
                          className="h-7 text-xs gap-1 px-2"
                        >
                          {copiedToken === invite.token ? (
                            <>
                              <Check className="w-3 h-3 text-primary" />
                              <span className="text-primary font-bold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Link</span>
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setInviteToRevoke(invite)}
                          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                          title="Revoke Invitation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Invite Member Modal */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an email invitation or generate a shareable link to add a teammate to {activeWorkspace.name}.
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
