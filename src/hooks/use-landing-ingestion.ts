import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TemplateKey, DefaultTemplateKey } from '@/server/constants/template.constant';
import { useTokenStore } from '@/stores/token.store';
import { useAuthStore } from '@/stores/auth.store';
import { useMeetingBotStore } from '@/stores/meeting-bot.store';
import { apiFetch, ApiClientError, uploadToStorageWithProgress } from '@/lib';
import { useTranslation } from '@/locales';
import { ApiResponse } from '@/server/dtos/response.dto';
import {
  PresignUploadResponseDto,
  RecordingUploadResponseDto,
} from '@/server/schemas/recording.schema';

export type IngestionTabKey = 'upload' | 'url' | 'record' | 'bot';

export function useLandingIngestion() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [activeTab, setActiveTab] = useState<IngestionTabKey>('upload');
  const [isUrlImporting, setIsUrlImporting] = useState(false);
  const [quotaExhausted, setQuotaExhausted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentUser = useAuthStore((state) => state.user);

  const addGuestToken = useTokenStore((state) => state.addGuestToken);
  const ensureAnonSession = useTokenStore((state) => state.ensureAnonSession);
  const activeBotSession = useMeetingBotStore((state) => state.activeSession);

  /**
   * Complete 3-step file upload flow (Presign -> Direct PUT -> Confirm Upload).
   */
  const handleUploadFile = useCallback(
    async (
      file: File,
      options: {
        title: string;
        templateCategory: TemplateKey;
        onProgress?: (percent: number) => void;
      }
    ): Promise<{ id: string; ownershipToken?: string }> => {
      setErrorMessage(null);
      setQuotaExhausted(false);

      try {
        // Step 0: Ensure anonymous handshake session
        await ensureAnonSession();
        options.onProgress?.(10);

        // Step 1: Request presigned upload URL from BFF
        const presignRes = await apiFetch<ApiResponse<PresignUploadResponseDto>>(
          '/api/recordings/presign',
          {
            method: 'POST',
            body: JSON.stringify({
              filename: file.name,
              content_type: file.type || 'audio/mpeg',
            }),
          }
        );

        if (!presignRes.data) {
          throw new Error(
            locale === 'en'
              ? 'Failed to obtain file upload URL.'
              : 'Gagal mendapatkan URL unggahan berkas.'
          );
        }

        const { upload_url, object_key } = presignRes.data;

        // Step 2: Upload binary file directly to S3 with real-time progress & timeout
        await uploadToStorageWithProgress(upload_url, file, {
          contentType: file.type || 'audio/mpeg',
          proxyUrl: '/api/recordings/proxy-upload',
          onProgress: (pct) => {
            options.onProgress?.(Math.round(15 + pct * 0.75));
          },
        });

        options.onProgress?.(95);

        // Step 3: Confirm upload with BFF
        const uploadRes = await apiFetch<ApiResponse<RecordingUploadResponseDto>>(
          '/api/recordings/upload',
          {
            method: 'POST',
            body: JSON.stringify({
              filename: file.name,
              object_key,
              title: options.title || file.name.replace(/\.[^/.]+$/, ''),
              template: options.templateCategory || DefaultTemplateKey,
              file_size_bytes: file.size,
            }),
          }
        );

        if (!uploadRes.data) {
          throw new Error(
            locale === 'en'
              ? 'Failed to create recording record.'
              : 'Gagal membuat data rekaman.'
          );
        }

        const recording = uploadRes.data;

        // Store guest ownership token in Zustand store if present
        if (recording.ownership_token) {
          addGuestToken({
            id: recording.id,
            ownership_token: recording.ownership_token,
            title: recording.title,
            created_at: recording.created_at,
          });
        }

        return {
          id: recording.id,
          ownershipToken: recording.ownership_token ?? undefined,
        };
      } catch (err: unknown) {
        if (err instanceof ApiClientError && err.status === 429) {
          setQuotaExhausted(true);
          setErrorMessage(
            locale === 'en'
              ? 'Daily quota limit reached. Please sign in or register for unlimited quota.'
              : 'Batas kuota harian tercapai. Silakan masuk atau daftar untuk kuota tanpa batas.'
          );
        } else {
          const msg =
            err instanceof Error
              ? err.message
              : locale === 'en'
              ? 'Failed to process file upload.'
              : 'Gagal memproses unggahan berkas.';
          setErrorMessage(msg);
        }
        throw err;
      }
    },
    [addGuestToken, ensureAnonSession, locale]
  );

  /**
   * Navigate to pipeline progress page upon successful upload.
   */
  const handleUploadComplete = useCallback(
    (recordingId: string) => {
      router.push(`/recordings/${recordingId}/processing`);
    },
    [router]
  );

  /**
   * Handle direct media URL import.
   */
  const handleUrlImport = useCallback(
    async (values: {
      url: string;
      title?: string;
      templateCategory: TemplateKey;
      language?: string;
    }) => {
      setErrorMessage(null);
      setQuotaExhausted(false);
      setIsUrlImporting(true);

      try {
        // Step 0: Ensure anonymous handshake session
        await ensureAnonSession();

        const res = await apiFetch<ApiResponse<RecordingUploadResponseDto>>(
          '/api/recordings/import-url',
          {
            method: 'POST',
            body: JSON.stringify({
              url: values.url,
              title: values.title,
              template: values.templateCategory,
              language: values.language,
            }),
          }
        );

        if (!res.data) {
          throw new Error(
            locale === 'en'
              ? 'Failed to import recording from URL.'
              : 'Gagal mengimpor data rekaman dari URL.'
          );
        }

        const recording = res.data;

        if (recording.ownership_token) {
          addGuestToken({
            id: recording.id,
            ownership_token: recording.ownership_token,
            title: recording.title,
            created_at: recording.created_at,
          });
        }

        router.push(`/recordings/${recording.id}/processing`);
      } catch (err: unknown) {
        if (err instanceof ApiClientError && err.status === 429) {
          setQuotaExhausted(true);
          setErrorMessage(
            locale === 'en'
              ? 'Daily quota limit reached. Please sign in or register for unlimited quota.'
              : 'Batas kuota harian tercapai. Silakan masuk atau daftar untuk kuota tanpa batas.'
          );
        } else {
          const msg =
            err instanceof Error
              ? err.message
              : locale === 'en'
              ? 'Failed to import audio from URL.'
              : 'Gagal mengimpor audio dari URL.';
          setErrorMessage(msg);
        }
      } finally {
        setIsUrlImporting(false);
      }
    },
    [addGuestToken, ensureAnonSession, locale, router]
  );

  /**
   * Handle browser live recording processing.
   */
  const handleProcessLiveRecording = useCallback(
    async (
      audioBlob: Blob,
      _durationSeconds?: number,
      options?: { title?: string; templateCategory?: TemplateKey }
    ) => {
      const prefix = locale === 'en' ? 'voice-recording' : 'rekaman-suara';
      const file = new File(
        [audioBlob],
        `${prefix}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.webm`,
        { type: audioBlob.type || 'audio/webm' }
      );

      const result = await handleUploadFile(file, {
        title: options?.title || t('landing.tabs.record'),
        templateCategory: options?.templateCategory || DefaultTemplateKey,
      });

      handleUploadComplete(result.id);
    },
    [handleUploadComplete, handleUploadFile, locale, t]
  );

  return {
    t,
    locale,
    activeTab,
    setActiveTab,
    isUrlImporting,
    quotaExhausted,
    errorMessage,
    currentUser,
    activeBotSession,
    handleUploadFile,
    handleUploadComplete,
    handleUrlImport,
    handleProcessLiveRecording,
  };
}

