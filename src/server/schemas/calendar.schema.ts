import { z } from 'zod';

export const GoogleCalendarCallbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().min(1, 'State parameter is required'),
});

export const UpdateCalendarSettingsSchema = z.object({
  is_auto_record_enabled: z.boolean().optional(),
  lead_time_minutes: z.number().int().min(0).max(15).optional(),
});

export const ToggleEventAutoRecordSchema = z.object({
  auto_record_enabled: z.boolean(),
});

export const ListCalendarEventsQuerySchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  platform: z.enum(['google_meet', 'zoom', 'ms_teams', 'none']).optional(),
  dispatch_status: z.enum(['PENDING', 'DISPATCHING', 'DISPATCHED', 'SKIPPED_MANUAL', 'SKIPPED_QUOTA', 'FAILED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

