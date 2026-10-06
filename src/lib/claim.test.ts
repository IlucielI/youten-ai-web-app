import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { claimGuestRecordings, claimSingleRecording } from './claim';
import { useTokenStore } from '@/stores/token.store';
import * as apiClient from '@/lib/api-client';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('claim helper', () => {
  beforeEach(() => {
    useTokenStore.setState({
      guestTokens: [
        {
          id: 'rec-1',
          ownership_token: 'tok-guest-1',
          title: 'Guest Meeting 1',
          created_at: new Date().toISOString(),
        },
        {
          id: 'rec-2',
          ownership_token: 'tok-guest-2',
          title: 'Guest Meeting 2',
          created_at: new Date().toISOString(),
        },
      ],
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('claimGuestRecordings', () => {
    it('returns null if guest tokens list is empty', async () => {
      useTokenStore.setState({ guestTokens: [] });
      const result = await claimGuestRecordings();
      expect(result).toBeNull();
    });

    it('successfully calls bulk claim, clears guest tokens, and triggers toast', async () => {
      vi.spyOn(apiClient, 'apiFetch').mockResolvedValue({
        status: 'success',
        code: 'SUCCESS',
        message: 'Bulk recordings claimed successfully',
        data: {
          claimed_count: 2,
          recording_ids: ['rec-1', 'rec-2'],
        },
        timestamp: new Date().toISOString(),
      });

      const result = await claimGuestRecordings();

      expect(result).toEqual({
        claimedCount: 2,
        recordingIds: ['rec-1', 'rec-2'],
      });
      expect(useTokenStore.getState().guestTokens).toHaveLength(0);
      expect(toast.success).toHaveBeenCalledWith('Berhasil menyimpan 2 rekaman tamu ke akun Anda!');
    });

    it('does not clear guest tokens if claimed_count is 0', async () => {
      vi.spyOn(apiClient, 'apiFetch').mockResolvedValue({
        status: 'success',
        code: 'SUCCESS',
        message: 'No recordings claimed',
        data: {
          claimed_count: 0,
          recording_ids: [],
        },
        timestamp: new Date().toISOString(),
      });

      const result = await claimGuestRecordings();

      expect(result).toEqual({
        claimedCount: 0,
        recordingIds: [],
      });
      expect(useTokenStore.getState().guestTokens).toHaveLength(2);
      expect(toast.success).not.toHaveBeenCalled();
    });

    it('removes only claimed tokens and preserves remaining on partial claim', async () => {
      vi.spyOn(apiClient, 'apiFetch').mockResolvedValue({
        status: 'success',
        code: 'SUCCESS',
        message: 'Partial recordings claimed',
        data: {
          claimed_count: 1,
          recording_ids: ['rec-1'],
        },
        timestamp: new Date().toISOString(),
      });

      const result = await claimGuestRecordings();

      expect(result).toEqual({
        claimedCount: 1,
        recordingIds: ['rec-1'],
      });
      const remaining = useTokenStore.getState().guestTokens;
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe('rec-2');
      expect(toast.success).toHaveBeenCalledWith('Berhasil menyimpan 1 rekaman tamu ke akun Anda!');
    });

    it('returns null and does not throw on api failure', async () => {
      vi.spyOn(apiClient, 'apiFetch').mockRejectedValue(new Error('Network error'));

      const result = await claimGuestRecordings();
      expect(result).toBeNull();
      expect(useTokenStore.getState().guestTokens).toHaveLength(2);
    });
  });

  describe('claimSingleRecording', () => {
    it('successfully claims single recording and removes token', async () => {
      vi.spyOn(apiClient, 'apiFetch').mockResolvedValue({
        status: 'success',
        code: 'SUCCESS',
        message: 'Claimed',
        data: { claimed: true },
        timestamp: new Date().toISOString(),
      });

      const success = await claimSingleRecording('rec-1');
      expect(success).toBe(true);
      expect(useTokenStore.getState().guestTokens).toHaveLength(1);
      expect(useTokenStore.getState().guestTokens[0].id).toBe('rec-2');
      expect(toast.success).toHaveBeenCalledWith('Rekaman berhasil diklaim ke akun Anda!');
    });

    it('returns false on single claim failure', async () => {
      vi.spyOn(apiClient, 'apiFetch').mockRejectedValue(new Error('Claim failed'));

      const success = await claimSingleRecording('rec-1');
      expect(success).toBe(false);
      expect(useTokenStore.getState().guestTokens).toHaveLength(2);
    });
  });
});
