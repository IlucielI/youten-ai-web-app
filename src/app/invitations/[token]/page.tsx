'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, CheckCircle2, AlertCircle, ArrowRight, Loader2, Building2 } from 'lucide-react';
import { Button } from '@/components/atoms/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/atoms/card';
import { YoutenLogo } from '@/components/atoms/youten-logo';
import { ThemeToggle } from '@/components/molecules/theme-toggle';
import { LanguageSwitcher } from '@/components/molecules/language-switcher';
import { Footer } from '@/components/organisms/footer';
import { apiFetch } from '@/lib/api-client';
import { ApiResponse } from '@/server/dtos/response.dto';
import { WorkspaceInvitationDTO, WorkspaceMemberDTO } from '@/server/dtos/workspace.dto';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { toast } from 'sonner';

export default function AcceptInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [invitation, setInvitation] = useState<WorkspaceInvitationDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    apiFetch<ApiResponse<WorkspaceInvitationDTO>>(`/api/workspaces/invitations/${token}`)
      .then((res) => {
        if (!isMounted) return;
        if (res && res.data) {
          setInvitation(res.data);
          if (res.data.accepted_at) {
            setAccepted(true);
          }
        } else {
          setError('Invitation not found or has expired.');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load invitation');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setAccepting(true);
    try {
      const res = await apiFetch<ApiResponse<WorkspaceMemberDTO>>(
        `/api/workspaces/invitations/${token}/accept`,
        { method: 'POST' }
      );
      if (res && res.data) {
        toast.success('Successfully joined workspace!');
        setAccepted(true);
        // Refresh workspaces in store
        await useWorkspaceStore.getState().fetchWorkspaces();
        setTimeout(() => {
          router.push('/dashboard');
        }, 1200);
      } else {
        toast.error('Failed to accept invitation.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to accept invitation.';
      if (msg.includes('Unauthorized') || msg.includes('401')) {
        toast.error('Please log in first to accept this invitation.');
        router.push(`/login?redirect=/invitations/${token}`);
      } else {
        toast.error(msg);
      }
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Header */}
      <header className="h-16 border-b border-border/80 bg-background/95 backdrop-blur-md px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <YoutenLogo size="sm" />
          <span className="font-extrabold text-base tracking-tight text-foreground">
            Youten AI
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/80 shadow-lg bg-card text-card-foreground">
          <CardHeader className="text-center space-y-3 pb-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Workspace Invitation</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                You have been invited to collaborate with your team on Youten AI.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Verifying invitation token...</p>
              </div>
            ) : error ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
                <Button
                  onClick={() => router.push('/dashboard')}
                  className="w-full text-xs font-semibold"
                >
                  Go to Dashboard
                </Button>
              </div>
            ) : accepted ? (
              <div className="space-y-4 text-center">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>You are a member of this workspace!</span>
                </div>
                <Button
                  onClick={() => router.push('/dashboard')}
                  className="w-full text-xs font-semibold gap-1.5"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : invitation ? (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-secondary/30 border border-border/80 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-foreground truncate">
                        {invitation.workspace_name || 'Workspace'}
                      </h4>
                      <p className="text-[11px] text-muted-foreground truncate">
                        Role:{' '}
                        <span className="font-semibold text-primary capitalize">
                          {invitation.role.replace('workspace_', '')}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
                    <span>Invited Email:</span>
                    <span className="font-medium text-foreground">{invitation.email}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={handleAccept}
                    disabled={accepting}
                    className="w-full text-xs font-semibold gap-2 py-5"
                    data-testid="btn-accept-invitation"
                  >
                    {accepting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>{accepting ? 'Joining Workspace...' : 'Accept & Join Workspace'}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => router.push('/dashboard')}
                    className="w-full text-xs text-muted-foreground"
                  >
                    Decline or go back
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
