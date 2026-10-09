import { BotProvider, BotSessionStatus } from '../constants/recording.constant';

/**
 * Request payload to dispatch a voice bot to an external meeting or voice channel.
 */
export interface DispatchMeetingBotRequest {
  provider: BotProvider;
  meeting_url?: string;
  guild_id?: string;
  channel_id?: string;
  title?: string;
  template?: string;
  language?: string;
}

/**
 * Response returned after a meeting bot session has been dispatched.
 */
export interface DispatchMeetingBotResponse {
  recording_id: string;
  session_id: string;
  provider: string;
  status: string;
  meeting_url?: string;
  message: string;
}

/**
 * Real-time status response for an active or past bot session.
 */
export interface MeetingBotSessionStatusResponse {
  session_id: string;
  recording_id: string;
  provider: string;
  status: BotSessionStatus | string;
  meeting_url?: string;
  started_at?: string | null;
  ended_at?: string | null;
  error_message?: string | null;
}

/**
 * Response returned after instructing a bot to leave the meeting.
 */
export interface StopMeetingBotSessionResponse {
  session_id: string;
  recording_id: string;
  status: string;
  message: string;
}

/**
 * Meeting bot capability availability states per provider.
 */
export interface MeetingBotCapabilities {
  discord: string;
  google_meet: string;
  ms_teams: string;
  zoom: string;
}

/**
 * Global system capabilities contract.
 */
export interface CapabilitiesResponse {
  meeting_bot: MeetingBotCapabilities;
}
