/**
 * Meeting voice bot waitlist DTOs.
 * Codified directly from youten-ai-core-api/internal/dtos/waitlist.go.
 */

export interface WaitlistRequest {
  email: string;
  platform?: string;
  company_size?: string;
}

export interface WaitlistResponse {
  email: string;
  platform: string;
  company_size: string;
  status: string;
  message: string;
}
