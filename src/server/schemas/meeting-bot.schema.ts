import { z } from 'zod';
import { BotProvider, BotSessionStatus } from '../constants/recording.constant';

/**
 * Zod schema for dispatching a voice bot to an external meeting.
 */
export const DispatchMeetingBotRequestSchema = z
  .object({
    provider: z.enum(
      [
        BotProvider.DISCORD,
        BotProvider.GOOGLE_MEET,
        BotProvider.MS_TEAMS,
        BotProvider.ZOOM,
      ],
      { message: 'Provider meeting bot tidak valid' }
    ),
    meeting_url: z.string().trim().url('URL rapat harus berupa tautan valid').optional(),
    guild_id: z.string().trim().min(1, 'Guild ID tidak boleh kosong').optional(),
    channel_id: z.string().trim().min(1, 'Channel ID tidak boleh kosong').optional(),
    title: z.string().trim().max(255, 'Judul maksimal 255 karakter').optional(),
    template: z.string().trim().max(100).optional(),
    language: z.string().trim().max(50).optional(),
  })
  .superRefine((data, ctx) => {
    let hostname = '';
    if (data.meeting_url) {
      try {
        hostname = new URL(data.meeting_url).hostname.toLowerCase();
      } catch {
        // Zod url() validator handles malformed URLs
      }
    }

    if (data.provider === BotProvider.GOOGLE_MEET) {
      if (!data.meeting_url) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Tautan Google Meet (meet.google.com) wajib diisi',
          path: ['meeting_url'],
        });
      } else if (hostname !== 'meet.google.com') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Format tautan Google Meet tidak valid (harus berupa meet.google.com)',
          path: ['meeting_url'],
        });
      }
    } else if (data.provider === BotProvider.ZOOM) {
      if (!data.meeting_url) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Tautan Zoom Meetings (zoom.us) wajib diisi',
          path: ['meeting_url'],
        });
      } else if (
        hostname !== 'zoom.us' &&
        hostname !== 'zoom.com' &&
        !hostname.endsWith('.zoom.us') &&
        !hostname.endsWith('.zoom.com')
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Format tautan Zoom tidak valid (harus berupa domain zoom.us)',
          path: ['meeting_url'],
        });
      }
    } else if (data.provider === BotProvider.MS_TEAMS) {
      if (!data.meeting_url) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Tautan Microsoft Teams wajib diisi',
          path: ['meeting_url'],
        });
      } else if (
        hostname !== 'teams.microsoft.com' &&
        hostname !== 'teams.live.com' &&
        !hostname.endsWith('.teams.microsoft.com') &&
        !hostname.endsWith('.teams.live.com')
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Format tautan Microsoft Teams tidak valid',
          path: ['meeting_url'],
        });
      }
    } else if (data.provider === BotProvider.DISCORD) {
      if (!data.guild_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Server ID / Guild ID Discord wajib diisi',
          path: ['guild_id'],
        });
      }
      if (!data.channel_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Voice Channel ID Discord wajib diisi',
          path: ['channel_id'],
        });
      }
    }
  });

export type DispatchMeetingBotRequestInput = z.infer<typeof DispatchMeetingBotRequestSchema>;

export const DispatchMeetingBotResponseSchema = z.object({
  recording_id: z.string().uuid(),
  session_id: z.string().uuid(),
  provider: z.string(),
  status: z.string(),
  meeting_url: z.string().optional(),
  message: z.string(),
});
export type DispatchMeetingBotResponseDto = z.infer<typeof DispatchMeetingBotResponseSchema>;

export const MeetingBotSessionStatusResponseSchema = z.object({
  session_id: z.string().uuid(),
  recording_id: z.string().uuid(),
  provider: z.string(),
  status: z.enum([
    BotSessionStatus.DISPATCHED,
    BotSessionStatus.WAITING_ADMIT,
    BotSessionStatus.JOINED,
    BotSessionStatus.RECORDING,
    BotSessionStatus.COMPLETED,
    BotSessionStatus.FAILED,
    BotSessionStatus.CANCELLED,
  ]).or(z.string()),
  meeting_url: z.string().optional(),
  started_at: z.string().nullable().optional(),
  ended_at: z.string().nullable().optional(),
  error_message: z.string().nullable().optional(),
});
export type MeetingBotSessionStatusResponseDto = z.infer<typeof MeetingBotSessionStatusResponseSchema>;

export const StopMeetingBotSessionResponseSchema = z.object({
  session_id: z.string().uuid(),
  recording_id: z.string().uuid(),
  status: z.string(),
  message: z.string(),
});
export type StopMeetingBotSessionResponseDto = z.infer<typeof StopMeetingBotSessionResponseSchema>;

export const CapabilitiesResponseSchema = z.object({
  meeting_bot: z.object({
    discord: z.string(),
    google_meet: z.string(),
    ms_teams: z.string(),
    zoom: z.string(),
  }),
});
export type CapabilitiesResponseDto = z.infer<typeof CapabilitiesResponseSchema>;
