/**
 * Meeting summary and versioning DTOs.
 * Codified directly from youten-ai-core-api/internal/dtos/recording.go.
 */

export interface SummaryDTO {
  id: string;
  template_category: string;
  custom_angle?: string | null;
  version: number;
  is_active: boolean;
  structured_data: Record<string, unknown>;
  markdown_content: string;
  created_at: string;
  updated_at: string;
}

export interface SummaryVersionResponse {
  id: string;
  version: number;
  template_category: string;
  custom_angle?: string | null;
  structured_data: Record<string, unknown>;
  markdown_content: string;
  is_active: boolean;
  created_at: string;
}

export interface RegenerateSummaryRequest {
  template_category?: string;
  custom_angle?: string | null;
  ownership_token?: string;
}
