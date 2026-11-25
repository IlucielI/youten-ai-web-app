import { ExportFormat } from '@/server/constants/recording.constant';
import { RecordingDetailDto } from '@/server/schemas/recording.schema';
import { SummaryData } from '@/components/organisms/summary-viewer';
import { formatTime } from '@/lib/time';

export interface ExportRecordingOptions {
  recordingId: string;
  format: ExportFormat;
  recording: RecordingDetailDto;
  activeSummaryData?: SummaryData | null;
  speakerLabels?: Record<string, string>;
  ownershipToken?: string;
  onSuccess?: (format: ExportFormat) => void;
  onError?: (error: unknown) => void;
}

/**
 * Retrieves the guest ownership token from localStorage if available.
 */
export function getStoredGuestToken(recordingId: string): string {
  if (typeof window === 'undefined') return '';
  try {
    const raw = localStorage.getItem('youten_guest_tokens');
    if (!raw) return '';
    const parsed = JSON.parse(raw);
    const tokens = parsed?.state?.guestTokens || [];
    const item = tokens.find((t: { id: string }) => t.id === recordingId);
    return item?.ownership_token || '';
  } catch {
    return '';
  }
}

/**
 * Exports recording in the specified format (DOCX, Markdown, TXT, JSON),
 * downloading the file directly via browser Blob URL.
 * Falls back to client-side generated content if the backend endpoint is unreachable.
 */
export async function exportRecordingFile({
  recordingId,
  format,
  recording,
  activeSummaryData,
  speakerLabels = {},
  ownershipToken: explicitToken,
  onSuccess,
  onError,
}: ExportRecordingOptions): Promise<void> {
  const token = explicitToken || getStoredGuestToken(recordingId);

  try {
    const params = new URLSearchParams({ format });
    if (activeSummaryData?.version !== undefined && activeSummaryData.version > 0) {
      params.set('version', String(activeSummaryData.version));
    } else if (activeSummaryData?.id) {
      params.set('version_id', activeSummaryData.id);
    }
    if (token) {
      params.set('token', token);
    }

    const headers: Record<string, string> = {};
    if (token) {
      headers['x-ownership-token'] = token;
    }

    const res = await fetch(`/api/recordings/${recordingId}/export?${params.toString()}`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      throw new Error(`Export request failed with status ${res.status}`);
    }

    const blob = await res.blob();
    const disposition = res.headers.get('content-disposition');
    let filename = `${recording.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${
      format === ExportFormat.MARKDOWN ? 'md' : format
    }`;
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) {
        filename = match[1].replace(/['"]/g, '');
      }
    }

    downloadBlob(blob, filename);
    onSuccess?.(format);
  } catch (err: unknown) {
    console.warn('Backend export failed, falling back to local exporter:', err);
    if (format === ExportFormat.DOCX || format === ExportFormat.PDF) {
      const error = new Error(`Export format ${format} requires backend processing and is unavailable offline.`);
      onError?.(error);
      throw error;
    }

    try {
      const ext = format === ExportFormat.MARKDOWN ? 'md' : format;
      const filename = `${recording.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`;
      let content = '';

      if (format === ExportFormat.TXT) {
        content =
          `# ${recording.title}\n\n${recording.active_summary?.markdown_content || ''}\n\n## Transkrip\n` +
          (recording.segments || [])
            .map(
              (s) =>
                `[${formatTime(s.start_time)}] ${
                  speakerLabels[s.speaker_label] || s.speaker_name || s.speaker_label
                }: ${s.text}`
            )
            .join('\n');
      } else if (format === ExportFormat.JSON) {
        content = JSON.stringify(recording, null, 2);
      } else {
        content =
          activeSummaryData?.markdown_content ||
          recording.active_summary?.markdown_content ||
          recording.title;
      }

      const mimeType =
        format === ExportFormat.JSON ? 'application/json' : 'text/plain;charset=utf-8';
      const blob = new Blob([content], { type: mimeType });
      downloadBlob(blob, filename);
      onSuccess?.(format);
    } catch (fallbackErr) {
      onError?.(fallbackErr);
      throw fallbackErr;
    }
  }
}

/**
 * Triggers a native browser file download for a given Blob.
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  if (typeof window !== 'undefined') {
    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  } else {
    URL.revokeObjectURL(url);
  }
}

