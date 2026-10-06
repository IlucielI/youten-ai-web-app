import { apiFetch } from '@/lib/api-client';
import { useTokenStore } from '@/stores/token.store';
import { ApiResponse } from '@/server/dtos/response.dto';
import { toast } from 'sonner';

export interface ClaimResult {
  claimedCount: number;
  recordingIds: string[];
}

/**
 * Automatically claims all guest tokens in localStorage to the authenticated user's account.
 * Clears claimed tokens from token store and shows a toast notification if count > 0.
 */
export async function claimGuestRecordings(): Promise<ClaimResult | null> {
  const store = useTokenStore.getState();
  const guestTokens = store.guestTokens;

  if (!guestTokens || guestTokens.length === 0) {
    return null;
  }

  const tokens = guestTokens
    .map((t) => t.ownership_token)
    .filter((token) => typeof token === 'string' && token.trim().length > 0);

  if (tokens.length === 0) {
    return null;
  }

  try {
    const res = await apiFetch<ApiResponse<{ claimed_count: number; recording_ids: string[] }>>(
      '/api/recordings/claim',
      {
        method: 'POST',
        body: JSON.stringify({ tokens }),
      }
    );

    if (res && res.status === 'success' && res.data) {
      const count = res.data.claimed_count;
      if (count > 0) {
        store.clearGuestTokens();
        toast.success(`Berhasil menyimpan ${count} rekaman tamu ke akun Anda!`);
      }
      return {
        claimedCount: count,
        recordingIds: res.data.recording_ids || [],
      };
    }
  } catch (err) {
    console.error('Failed to auto-claim guest recordings:', err);
  }

  return null;
}

/**
 * Claims a single recording to the authenticated user's account.
 */
export async function claimSingleRecording(recordingId: string, ownershipToken?: string): Promise<boolean> {
  const store = useTokenStore.getState();
  const token = ownershipToken || store.getGuestToken(recordingId);

  try {
    const res = await apiFetch<ApiResponse<{ claimed: boolean }>>(
      `/api/recordings/${recordingId}/claim`,
      {
        method: 'POST',
        body: token ? JSON.stringify({ ownership_token: token }) : undefined,
      }
    );

    if (res && res.status === 'success' && res.data?.claimed) {
      store.removeGuestToken(recordingId);
      toast.success('Rekaman berhasil diklaim ke akun Anda!');
      return true;
    }
  } catch (err) {
    console.error('Failed to claim recording:', err);
  }

  return false;
}
