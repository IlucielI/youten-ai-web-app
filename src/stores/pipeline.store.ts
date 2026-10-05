import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { RecordingStatus } from '../server/constants';

export interface PipelineProgressPayload {
  status?: RecordingStatus;
  stage?: string;
  progress?: number;
  message?: string;
}

export interface PipelineState {
  recordingId: string | null;
  status: RecordingStatus;
  stage: string;
  progress: number;
  message: string;
  errorCode: string | null;
  errorMessage: string | null;
  isProcessing: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  lastUpdated: string | null;
}

export interface PipelineActions {
  initPipeline: (recordingId: string, initialStatus?: RecordingStatus) => void;
  updateProgress: (payload: PipelineProgressPayload) => void;
  setFailure: (error: { code?: string; message: string }) => void;
  setCompleted: (message?: string) => void;
  resetPipeline: () => void;
}

export type PipelineStore = PipelineState & PipelineActions;

const initialPipelineState: PipelineState = {
  recordingId: null,
  status: RecordingStatus.PENDING,
  stage: 'pending',
  progress: 0,
  message: 'Initializing recording pipeline...',
  errorCode: null,
  errorMessage: null,
  isProcessing: false,
  isCompleted: false,
  isFailed: false,
  lastUpdated: null,
};

export const usePipelineStore = create<PipelineStore>()(
  devtools(
    (set, get) => ({
      ...initialPipelineState,

      initPipeline: (recordingId: string, initialStatus: RecordingStatus = RecordingStatus.PENDING) => {
        set(
          {
            ...initialPipelineState,
            recordingId,
            status: initialStatus,
            isProcessing: true,
            lastUpdated: new Date().toISOString(),
          },
          false,
          'pipeline/initPipeline'
        );
      },

      updateProgress: (payload: PipelineProgressPayload) => {
        const { status, stage, progress, message } = payload;
        const currentProgress = get().progress;
        
        // Monotonic progression invariant: progress only moves forward to prevent jitter
        const nextProgress = progress !== undefined ? Math.max(currentProgress, Math.min(100, progress)) : currentProgress;
        const nextStatus = status ?? get().status;

        const isCompleted = nextStatus === RecordingStatus.COMPLETED;
        const isFailed = nextStatus === RecordingStatus.FAILED;
        const isProcessing = !isCompleted && !isFailed;

        set(
          {
            status: nextStatus,
            stage: stage ?? get().stage,
            progress: isCompleted ? 100 : nextProgress,
            message: message ?? get().message,
            isProcessing,
            isCompleted,
            isFailed,
            lastUpdated: new Date().toISOString(),
          },
          false,
          'pipeline/updateProgress'
        );
      },

      setFailure: (error: { code?: string; message: string }) => {
        set(
          {
            status: RecordingStatus.FAILED,
            stage: 'failed',
            errorCode: error.code ?? 'ERR_PIPELINE_FAILED',
            errorMessage: error.message,
            message: error.message,
            isProcessing: false,
            isCompleted: false,
            isFailed: true,
            lastUpdated: new Date().toISOString(),
          },
          false,
          'pipeline/setFailure'
        );
      },

      setCompleted: (message: string = 'Pipeline completed successfully') => {
        set(
          {
            status: RecordingStatus.COMPLETED,
            stage: 'completed',
            progress: 100,
            message,
            isProcessing: false,
            isCompleted: true,
            isFailed: false,
            lastUpdated: new Date().toISOString(),
          },
          false,
          'pipeline/setCompleted'
        );
      },

      resetPipeline: () => {
        set(initialPipelineState, false, 'pipeline/resetPipeline');
      },
    }),
    { name: 'PipelineStore' }
  )
);
