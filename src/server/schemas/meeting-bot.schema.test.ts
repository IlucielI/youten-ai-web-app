import { describe, it, expect } from 'vitest';
import {
  DispatchMeetingBotRequestSchema,
  MeetingBotSessionStatusResponseSchema,
  CapabilitiesResponseSchema,
} from './meeting-bot.schema';
import { BotProvider, BotSessionStatus } from '../constants/recording.constant';

describe('meeting-bot.schema', () => {
  describe('DispatchMeetingBotRequestSchema', () => {
    it('validates a valid Google Meet dispatch request', () => {
      const parsed = DispatchMeetingBotRequestSchema.safeParse({
        provider: BotProvider.GOOGLE_MEET,
        meeting_url: 'https://meet.google.com/abc-defg-hij',
        title: 'Standup Sprint 42',
        language: 'id',
      });

      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.provider).toBe('google_meet');
        expect(parsed.data.meeting_url).toBe('https://meet.google.com/abc-defg-hij');
      }
    });

    it('rejects Google Meet without meeting_url', () => {
      const parsed = DispatchMeetingBotRequestSchema.safeParse({
        provider: BotProvider.GOOGLE_MEET,
      });

      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0]?.message).toContain('meet.google.com');
      }
    });

    it('rejects Google Meet with non-meet URL', () => {
      const parsed = DispatchMeetingBotRequestSchema.safeParse({
        provider: BotProvider.GOOGLE_MEET,
        meeting_url: 'https://example.com/not-meet',
      });

      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0]?.message).toContain('meet.google.com');
      }
    });

    it('validates a valid Zoom dispatch request', () => {
      const parsed = DispatchMeetingBotRequestSchema.safeParse({
        provider: BotProvider.ZOOM,
        meeting_url: 'https://zoom.us/j/123456789?pwd=abc',
      });

      expect(parsed.success).toBe(true);
    });

    it('rejects Zoom with non-zoom URL', () => {
      const parsed = DispatchMeetingBotRequestSchema.safeParse({
        provider: BotProvider.ZOOM,
        meeting_url: 'https://teams.microsoft.com/l/meetup-join/123',
      });

      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0]?.message).toContain('zoom.us');
      }
    });

    it('validates a valid MS Teams dispatch request', () => {
      const parsed = DispatchMeetingBotRequestSchema.safeParse({
        provider: BotProvider.MS_TEAMS,
        meeting_url: 'https://teams.microsoft.com/l/meetup-join/12345',
      });

      expect(parsed.success).toBe(true);
    });

    it('validates a valid Discord dispatch request', () => {
      const parsed = DispatchMeetingBotRequestSchema.safeParse({
        provider: BotProvider.DISCORD,
        guild_id: '123456789012345678',
        channel_id: '987654321098765432',
      });

      expect(parsed.success).toBe(true);
    });

    it('rejects Discord missing guild_id or channel_id', () => {
      const parsed = DispatchMeetingBotRequestSchema.safeParse({
        provider: BotProvider.DISCORD,
        guild_id: '123456789012345678',
      });

      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues.some((e) => e.path.includes('channel_id'))).toBe(true);
      }
    });

    it('rejects invalid bot provider', () => {
      const parsed = DispatchMeetingBotRequestSchema.safeParse({
        provider: 'slack_huddle',
      });

      expect(parsed.success).toBe(false);
    });
  });

  describe('MeetingBotSessionStatusResponseSchema', () => {
    it('validates a valid bot session status object', () => {
      const parsed = MeetingBotSessionStatusResponseSchema.safeParse({
        session_id: '123e4567-e89b-12d3-a456-426614174000',
        recording_id: '123e4567-e89b-12d3-a456-426614174001',
        provider: 'google_meet',
        status: BotSessionStatus.RECORDING,
        meeting_url: 'https://meet.google.com/abc-defg-hij',
        started_at: '2026-10-10T04:00:00Z',
      });

      expect(parsed.success).toBe(true);
    });
  });

  describe('CapabilitiesResponseSchema', () => {
    it('validates capabilities object', () => {
      const parsed = CapabilitiesResponseSchema.safeParse({
        meeting_bot: {
          discord: 'available',
          google_meet: 'available',
          ms_teams: 'available',
          zoom: 'available',
        },
      });

      expect(parsed.success).toBe(true);
    });
  });
});
