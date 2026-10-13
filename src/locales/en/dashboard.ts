import { idDashboard } from '../id/dashboard';

export const enDashboard: typeof idDashboard = {
  welcome: {
    title: 'Hello, {name} 👋',
    defaultName: 'User',
    subtitle:
      'Welcome to your smart recordings library. Access transcripts, automatic meeting notes, and AI summaries anytime.',
    quotaTitle: 'Daily Transcript Quota',
    quotaRemaining: '{remaining} of {total} recordings remaining',
    quotaRemainingSuffix: 'of {total} recordings remaining',
    newRecording: 'New Recording',
  },
  search: {
    placeholder: 'Search by title or file name...',
  },
  filters: {
    allStatuses: 'All Statuses',
    allTemplates: 'All Templates',
    gridView: 'Grid View',
    tableView: 'Table View',
    refresh: 'Refresh data',
    reset: 'Reset Filters',
  },
  statusLabels: {
    completed: 'Completed',
    queued: 'Queued',
    processing: 'Processing',
    pending: 'Pending',
    failed: 'Failed',
  },
  table: {
    titleHeader: 'Recording Title',
    templateHeader: 'Template',
    statusHeader: 'Status',
    durationHeader: 'Duration',
    dateHeader: 'Date',
    actionsHeader: 'Actions',
    viewDetail: 'View details',
    share: 'Share',
    delete: 'Delete recording',
  },
  pagination: {
    showing: 'Showing {start} - {end} of {total} recordings',
    prev: 'Previous',
    next: 'Next',
    pageOf: 'Page {page} of {total}',
  },
  empty: {
    title: 'No Recordings Yet',
    description:
      'Start uploading an audio file or record your first meeting to get an automatic transcript.',
    action: 'Create New Recording',
    searchTitle: 'No matching results',
    searchDescription:
      'Try adjusting your search keywords or filters to find your recordings.',
  },
  error: {
    title: 'Failed to Load Data',
    defaultMessage: 'An error occurred while loading recordings.',
    fetchFailed: 'Failed to load recordings list.',
    retry: 'Try Again',
  },
  deleteDialog: {
    title: 'Delete Recording?',
    description:
      'Are you sure you want to delete recording "{title}"? All transcripts, summaries, and comments will be permanently deleted.',
    cancel: 'Cancel',
    deleting: 'Deleting...',
    confirm: 'Yes, Delete',
  },
  loading: {
    verifyingSession: 'Verifying account session...',
  },
};
