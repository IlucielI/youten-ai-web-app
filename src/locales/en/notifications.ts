import { idNotifications } from '../id/notifications';

export const enNotifications: typeof idNotifications = {
  success: {
    uploadComplete: 'File uploaded successfully! Starting pipeline processing...',
    urlImportStarted: 'URL import started. Downloading media...',
    recordingSaved: 'Voice recording saved successfully.',
    recordingDeleted: 'Recording "{title}" deleted successfully.',
    recordingClaimed: 'Recording successfully claimed to your account!',
    guestRecordingsClaimed: 'Successfully saved {count} guest recording(s) to your account!',
    transcriptUpdated: 'Transcript updated successfully.',
    versionActivated: 'Summary version successfully set as active!',
    versionRegenerated: 'New summary version generated successfully!',
    copiedToClipboard: 'Text copied to clipboard!',
    settingsSaved: 'Settings updated successfully.',
    profileUpdated: 'Profile updated successfully!',
    passwordUpdated: 'Password updated successfully!',
    emailVerified: 'Email verified successfully!',
    verificationCodeSent: 'A new verification code has been sent to your email.',
    registrationSuccess: 'Registration successful! Verification code has been sent to your email.',
    shareEnabled: 'Public share link enabled.',
    shareDisabled: 'Public share link disabled.',
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
    deleteFailed: 'Failed to delete recording. Please try again.',
    shareFailed: 'Failed to update share link settings.',
    profileUpdateFailed: 'Failed to update profile.',
    passwordUpdateFailed: 'Failed to update password.',
    logoutFailed: 'Failed to sign out. Please try again.',
  },
};
