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
  stepper: {
    headlineProcessing: 'Analyzing Conversation...',
    headlineCompleted: 'Processing Completed',
    headlineFailed: 'Processing Halted',
    retryButton: 'Try Again',
    retryingButton: 'Restarting...',
    steps: {
      extraction: {
        title: 'Validation & Extraction',
        description: 'Verifying audio file, stream format & sample normalization',
      },
      transcription: {
        title: 'Multi-Speaker Transcription',
        description: 'Speech diarization, timestamps, and speaker recognition',
      },
      intelligence: {
        title: 'AI Intelligence & Indexing',
        description: 'Minutes summary synthesis, action items, and semantic vectors',
      },
      completed: {
        title: 'Ready for Review',
        description: 'All recording analytics and transcription ready to access',
      },
    },
  },
  errors: {
    defaultTitle: 'Recording Processing Issue',
    defaultDescription: 'A technical issue occurred while processing the pipeline.',
    conflictInProgress: 'Pipeline is already being reprocessed in the background.',
    conflictFailed: 'Failed to trigger retry. Please try again shortly.',
    retryButton: 'Retry from Last Stage',
    retryingButton: 'Restarting Pipeline...',
    restartingMessage: 'Restarting pipeline processing...',
    retryFailedMessage: 'Failed to restart processing.',
    haltedMessage: 'Recording processing halted.',
    defaultAudioTitle: 'Audio Recording',
    taxonomy: {
      ERR_AUDIO_CORRUPT: {
        title: 'Invalid or Corrupted Audio File',
        description: 'The audio format cannot be read or the file was truncated during upload.',
      },
      ERR_EXTRACTION_FAILED: {
        title: 'Audio Extraction Failed',
        description: 'The system failed to extract the audio stream from the uploaded media.',
      },
      ERR_TRANSCRIPTION_FAILED: {
        title: 'Speech-to-Text Transcription Issue',
        description: 'The transcription AI engine encountered an error processing speech audio.',
      },
      ERR_NO_SPEECH_DETECTED: {
        title: 'No Speech Detected',
        description: 'No human speech or conversation could be identified to transcribe.',
      },
      ERR_SUMMARIZATION_FAILED: {
        title: 'AI Summarization Issue',
        description: 'The AI model failed while extracting structured takeaways and minutes.',
      },
      ERR_INDEXING_FAILED: {
        title: 'Semantic Vector Indexing Failed',
        description: 'Failed to generate the semantic vector index for conversation search.',
      },
    },
  },
};
