import { idNotifications } from '../id/notifications';

export const enNotifications: typeof idNotifications = {
  success: {
    uploadComplete: 'File uploaded successfully! Starting pipeline processing...',
    urlImportStarted: 'URL import started. Downloading media...',
    recordingSaved: 'Voice recording saved successfully.',
    copiedToClipboard: 'Text copied to clipboard!',
    settingsSaved: 'Settings updated successfully.',
    retryScheduled: 'Recording retry has been scheduled.',
    logoutSuccess: 'You have been signed out.',
  },
  info: {
    browserRecordingReady: 'Recording complete. Ready to process.',
    quotaReminder: 'You have recording quota remaining for today.',
  },
  warning: {
    recordingDiscardPrompt: 'Recording is not saved. Are you sure you want to leave?',
    quotaAlmostExhausted: 'Your daily recording quota is nearly depleted.',
  },
  error: {
    uploadFailed: 'Failed to upload file. Please check your connection and try again.',
    urlImportFailed: 'Failed to import from URL. Please ensure the link is publicly accessible.',
    processingFailed: 'Recording processing failed.',
  },
};
