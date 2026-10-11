import { idErrors } from '../id/errors';

export const enErrors: typeof idErrors = {
  ERR_EXTRACTION_FAILED: 'Failed to extract audio or video from the source file or link.',
  ERR_IMPORT_FETCH_FAILED: 'Failed to download media file from the provided external URL.',
  ERR_UNAUTHORIZED: 'Your session has expired or is invalid. Please sign in again.',
  ERR_FORBIDDEN: 'You do not have permission to perform this action.',
  ERR_NOT_FOUND: 'The requested data or file could not be found.',
  ERR_RATE_LIMIT_EXCEEDED: 'Daily limit reached. Please try again tomorrow or upgrade your account.',
  ERR_FILE_TOO_LARGE: 'The file size exceeds the maximum allowed limit (up to 500MB).',
  ERR_UNSUPPORTED_MEDIA_TYPE: 'Unsupported media format. Please use MP3, M4A, WAV, MP4, or WEBM.',
  ERR_PIPELINE_FAILED: 'Internal processing failure while analyzing the recording.',
  ERR_NETWORK_ERROR: 'Network connection error. Please check your internet connection.',
  ERR_TIMEOUT: 'The request took too long to complete. Please try again later.',
  ERR_GUEST_QUOTA_EXHAUSTED: 'Guest limit reached (1 free recording/day). Please sign in or register.',
  GENERIC_ERROR: 'An unexpected system error occurred. Please try again in a few moments.',
  validation: {
    required: 'This field is required.',
    invalidEmail: 'Invalid email address format.',
    passwordLength: 'Password must be at least 8 characters long.',
    passwordMismatch: 'Passwords do not match.',
    urlInvalid: 'Invalid URL format. Make sure it starts with http:// or https://.',
  },
};
