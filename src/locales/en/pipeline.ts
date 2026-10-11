import { idPipeline } from '../id/pipeline';

export const enPipeline: typeof idPipeline = {
  header: {
    loadingTitle: 'Loading Recording...',
    backToDashboard: 'Back to Dashboard',
    backToHome: 'Back to Home',
  },
  stages: {
    uploading: {
      name: 'Upload File',
      description: 'Saving media file to secure cloud storage',
    },
    extracting: {
      name: 'Audio Extraction',
      description: 'Extracting and normalizing audio tracks',
    },
    transcribing: {
      name: 'AI Transcription',
      description: 'Converting speech into text with accurate timestamps',
    },
    diarizing: {
      name: 'Speaker Diarization',
      description: 'Distinguishing and labelling individual speakers',
    },
    synthesizing: {
      name: 'Summary Synthesis',
      description: 'Generating key decisions, action items, and takeaways',
    },
    completed: {
      name: 'Completed',
      description: 'Transcription and analysis ready for review',
    },
    failed: {
      name: 'Failed',
      description: 'Recording processing halted due to an issue',
    },
  },
  status: {
    processingTitle: 'Processing Recording',
    processingSubtitle: 'Please wait while our AI analyzes your conversation audio.',
    completedTitle: 'Processing Completed Successfully!',
    completedSubtitle: 'Your recording has been processed. Opening workspace...',
    failedTitle: 'Processing Failed',
    failedSubtitle: 'An issue occurred while analyzing the recording.',
    viewResult: 'View Transcription Results',
    retryProcess: 'Retry Processing',
    elapsedTime: 'Elapsed Time',
    estimatedRemaining: 'Estimated Remaining',
  },
};
