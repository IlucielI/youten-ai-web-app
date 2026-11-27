import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import { ApiResponse } from '@/server/dtos/response.dto';
import { WorkspaceInvitationDTO, WorkspaceMemberDTO } from '@/server/dtos/workspace.dto';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { toast } from 'sonner';

export function useWorkspaceInvitation() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [invitation, setInvitation] = useState<WorkspaceInvitationDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('Invitation token is missing.');
      return;
    }

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

  const handleAccept = useCallback(async () => {
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
        await useWorkspaceStore.getState().fetchWorkspaces();
        setTimeout(() => {
          router.push('/dashboard');
        }, 1200);
      } else {
        toast.error('Failed to accept invitation.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to accept invitation.';
      const isUnauthorized =
        (err instanceof ApiClientError && err.status === 401) ||
        msg.toLowerCase().includes('unauthorized') ||
        msg.includes('401');
      if (isUnauthorized) {
        toast.error('Please log in first to accept this invitation.');
        router.push(`/login?redirect=/invitations/${token}`);
      } else {
        toast.error(msg);
      }
    } finally {
      setAccepting(false);
    }
  }, [token, router]);

  return {
    router,
    token,
    invitation,
    loading,
    accepting,
    error,
    accepted,
    handleAccept,
  };
}
