import { describe, it, expect, beforeEach } from 'vitest';
import {
  useTokenStore,
  usePlayerStore,
  usePipelineStore,
  useChatStore,
} from './index';
import { RecordingStatus, ChatRole } from '../server/constants';
import { MeetingSourceCitationDTO } from '../server/dtos';

describe('Client State Stores (Zustand)', () => {
  beforeEach(() => {
    useTokenStore.getState().clearGuestTokens();
    useTokenStore.getState().clearAnonSession();
    usePlayerStore.getState().resetPlayer();
    usePipelineStore.getState().resetPipeline();
    useChatStore.getState().clearChat();
  });

  describe('useTokenStore (Guest Ownership Tokens & Anonymous Handshake)', () => {
    it('should add, retrieve, and remove guest ownership tokens', () => {
      const store = useTokenStore.getState();

      store.addGuestToken({
        id: 'rec-1',
        ownership_token: 'guest-tok-alpha',
        title: 'Weekly Sync',
        created_at: '2026-10-06T00:00:00Z',
      });

      expect(useTokenStore.getState().guestTokens.length).toBe(1);
      expect(useTokenStore.getState().getGuestToken('rec-1')).toBe('guest-tok-alpha');
      expect(useTokenStore.getState().getGuestToken('rec-unknown')).toBeUndefined();

      // Duplicate prevention
      useTokenStore.getState().addGuestToken({
        id: 'rec-1',
        ownership_token: 'guest-tok-alpha-v2',
        title: 'Weekly Sync Renamed',
        created_at: '2026-10-06T00:00:00Z',
      });
      expect(useTokenStore.getState().guestTokens.length).toBe(1);
      expect(useTokenStore.getState().getGuestToken('rec-1')).toBe('guest-tok-alpha-v2');

      // Remove item
      useTokenStore.getState().removeGuestToken('rec-1');
      expect(useTokenStore.getState().guestTokens.length).toBe(0);
    });

    it('should support bulk setting and clearing guest tokens', () => {
      useTokenStore.getState().setGuestTokens([
        { id: '1', ownership_token: 'tok-1', title: 'T1', created_at: '2026-10-01' },
        { id: '2', ownership_token: 'tok-2', title: 'T2', created_at: '2026-10-02' },
      ]);
      expect(useTokenStore.getState().getGuestTokens().length).toBe(2);

      useTokenStore.getState().clearGuestTokens();
      expect(useTokenStore.getState().guestTokens.length).toBe(0);
    });

    it('should set, retrieve, and clear anonymous handshake session', () => {
      const store = useTokenStore.getState();
      expect(store.getAnonToken()).toBeUndefined();

      store.setAnonSession({
        anon_token: 'anon-tok-xyz',
        session_id: 'sess-123',
        client_id: 'client-app',
        expires_at: Date.now() + 3600000,
      });

      expect(useTokenStore.getState().getAnonToken()).toBe('anon-tok-xyz');

      // Expired token check
      useTokenStore.getState().setAnonSession({
        anon_token: 'expired-token',
        session_id: 'sess-old',
        client_id: 'client-app',
        expires_at: Date.now() - 1000,
      });
      expect(useTokenStore.getState().getAnonToken()).toBeUndefined();

      useTokenStore.getState().clearAnonSession();
      expect(useTokenStore.getState().anonSession).toBeNull();
    });
  });

  describe('usePlayerStore (Audio Playback & Synchronized Karaoke)', () => {
    it('should update currentTime clamped by duration', () => {
      const store = usePlayerStore.getState();
      store.setDuration(120);

      store.setCurrentTime(45);
      expect(usePlayerStore.getState().currentTime).toBe(45);

      // Clamped above duration
      store.setCurrentTime(150);
      expect(usePlayerStore.getState().currentTime).toBe(120);

      // Clamped below zero
      store.setCurrentTime(-10);
      expect(usePlayerStore.getState().currentTime).toBe(0);
    });

    it('should toggle play/pause state and update audio url', () => {
      expect(usePlayerStore.getState().isPlaying).toBe(false);

      usePlayerStore.getState().togglePlay();
      expect(usePlayerStore.getState().isPlaying).toBe(true);

      usePlayerStore.getState().setIsPlaying(false);
      expect(usePlayerStore.getState().isPlaying).toBe(false);

      usePlayerStore.getState().setAudioUrl('https://cdn.youten.ai/audio.mp3');
      expect(usePlayerStore.getState().audioUrl).toBe('https://cdn.youten.ai/audio.mp3');
    });

    it('should handle volume and mute states', () => {
      usePlayerStore.getState().setVolume(0.8);
      expect(usePlayerStore.getState().volume).toBe(0.8);
      expect(usePlayerStore.getState().isMuted).toBe(false);

      // Setting volume to 0 automatically mutes
      usePlayerStore.getState().setVolume(0);
      expect(usePlayerStore.getState().isMuted).toBe(true);

      usePlayerStore.getState().setVolume(1.0);
      usePlayerStore.getState().toggleMute();
      expect(usePlayerStore.getState().isMuted).toBe(true);
    });

    it('should skip forward and backward with duration bounds', () => {
      usePlayerStore.getState().setDuration(60);
      usePlayerStore.getState().setCurrentTime(30);

      usePlayerStore.getState().skipForward(10);
      expect(usePlayerStore.getState().currentTime).toBe(40);

      usePlayerStore.getState().skipBackward(15);
      expect(usePlayerStore.getState().currentTime).toBe(25);

      // Skip backward past 0 clamps to 0
      usePlayerStore.getState().skipBackward(50);
      expect(usePlayerStore.getState().currentTime).toBe(0);
    });

    it('should track active transcript segment and word-level karaoke index', () => {
      usePlayerStore.getState().setActiveSegment('seg-101', 3);
      expect(usePlayerStore.getState().activeSegmentId).toBe('seg-101');
      expect(usePlayerStore.getState().activeWordIndex).toBe(3);

      usePlayerStore.getState().toggleAutoScroll();
      expect(usePlayerStore.getState().isAutoScrollEnabled).toBe(false);
    });
  });

  describe('usePipelineStore (Monotonic Progress & SSE Tracking)', () => {
    it('should initialize pipeline with PENDING status and process state', () => {
      usePipelineStore.getState().initPipeline('rec-xyz', RecordingStatus.EXTRACTING);
      const state = usePipelineStore.getState();

      expect(state.recordingId).toBe('rec-xyz');
      expect(state.status).toBe(RecordingStatus.EXTRACTING);
      expect(state.isProcessing).toBe(true);
      expect(state.isCompleted).toBe(false);
      expect(state.isFailed).toBe(false);
    });

    it('should enforce monotonic progress to prevent parallel SSE network jitter', () => {
      usePipelineStore.getState().initPipeline('rec-xyz');

      usePipelineStore.getState().updateProgress({
        status: RecordingStatus.TRANSCRIBING,
        stage: 'transcribing',
        progress: 40,
        message: 'Speech recognition in progress...',
      });
      expect(usePipelineStore.getState().progress).toBe(40);

      // Out-of-order network event with lower progress is rejected
      usePipelineStore.getState().updateProgress({
        progress: 35,
      });
      expect(usePipelineStore.getState().progress).toBe(40);

      // Valid forward progress updates
      usePipelineStore.getState().updateProgress({
        progress: 75,
      });
      expect(usePipelineStore.getState().progress).toBe(75);
    });

    it('should handle failure state with error details', () => {
      usePipelineStore.getState().initPipeline('rec-xyz');
      usePipelineStore.getState().setFailure({
        code: 'ERR_AUDIO_CORRUPT',
        message: 'Uploaded file has invalid headers',
      });

      const state = usePipelineStore.getState();
      expect(state.status).toBe(RecordingStatus.FAILED);
      expect(state.isFailed).toBe(true);
      expect(state.isProcessing).toBe(false);
      expect(state.errorCode).toBe('ERR_AUDIO_CORRUPT');
      expect(state.errorMessage).toContain('invalid headers');
    });

    it('should transition to completed with 100% progress', () => {
      usePipelineStore.getState().initPipeline('rec-xyz');
      usePipelineStore.getState().setCompleted('Meeting processed ready for review');

      const state = usePipelineStore.getState();
      expect(state.status).toBe(RecordingStatus.COMPLETED);
      expect(state.progress).toBe(100);
      expect(state.isCompleted).toBe(true);
      expect(state.isProcessing).toBe(false);
    });
  });

  describe('useChatStore (Meeting AI Chat Stream)', () => {
    it('should add user messages and clear on recording ID switch', () => {
      useChatStore.getState().setRecordingId('rec-1');
      const msgId = useChatStore.getState().addUserMessage('Who approved the budget?');

      expect(useChatStore.getState().messages.length).toBe(1);
      expect(useChatStore.getState().messages[0].id).toBe(msgId);
      expect(useChatStore.getState().messages[0].role).toBe(ChatRole.USER);
      expect(useChatStore.getState().messages[0].content).toBe('Who approved the budget?');

      // Switching recording ID clears previous conversation
      useChatStore.getState().setRecordingId('rec-2');
      expect(useChatStore.getState().messages.length).toBe(0);
      expect(useChatStore.getState().recordingId).toBe('rec-2');
    });

    it('should stream assistant tokens and append citations', () => {
      useChatStore.getState().setRecordingId('rec-1');
      const assistantId = useChatStore.getState().startAssistantStream();

      expect(useChatStore.getState().isStreaming).toBe(true);
      expect(useChatStore.getState().messages.length).toBe(1);
      expect(useChatStore.getState().messages[0].isStreaming).toBe(true);

      useChatStore.getState().appendStreamChunk('Bob approved the budget ');
      useChatStore.getState().appendStreamChunk('during the Q4 review.');

      expect(useChatStore.getState().streamingContent).toBe('Bob approved the budget during the Q4 review.');

      const citations: MeetingSourceCitationDTO[] = [
        {
          recording_id: 'rec-1',
          recording_title: 'Q4 Architectural Review',
          chunk_index: 0,
          snippet: 'Budget approved by Bob.',
          start_time: 12.0,
          end_time: 17.2,
        },
      ];
      useChatStore.getState().setStreamCitations(citations);

      useChatStore.getState().finalizeAssistantMessage(assistantId);

      const finalState = useChatStore.getState();
      expect(finalState.isStreaming).toBe(false);
      expect(finalState.streamingContent).toBe('');
      expect(finalState.messages[0].content).toBe('Bob approved the budget during the Q4 review.');
      expect(finalState.messages[0].citations?.length).toBe(1);
      expect(finalState.messages[0].isStreaming).toBe(false);
    });

    it('should record chat errors', () => {
      useChatStore.getState().setChatError('Streaming connection timed out');
      expect(useChatStore.getState().error).toBe('Streaming connection timed out');
      expect(useChatStore.getState().isStreaming).toBe(false);
    });
  });
});
