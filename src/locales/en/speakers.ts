import { idSpeakers } from '../id/speakers';

export const enSpeakers: typeof idSpeakers = {
  header: {
    badge: 'Workspace Intelligence',
    title: 'Speaker Directory',
    subtitle: 'Monitor participation, talk time duration, and interaction history of every speaker across meetings in your workspace.',
    loadingSession: 'Verifying user session...',
    refresh: 'Refresh Data',
  },
  stats: {
    totalSpeakers: 'Total Unique Speakers',
    totalTalkTime: 'Total Talk Time',
    totalMeetings: 'Total Attendance Sessions',
  },
  filters: {
    searchPlaceholder: 'Search speaker name...',
    sortBy: 'Sort by',
    sortTalkTime: 'Most Talk Time',
    sortMeetings: 'Most Meetings',
    sortRecent: 'Recently Active',
    sortName: 'Name (A - Z)',
  },
  card: {
    lastActive: 'Last active: {date}',
    meetingsCount: '{count} Meetings',
    talkTime: 'Talk Time',
    attendance: 'Attendance',
    attendanceMeetings: '{count} Sessions',
    searchQuotes: 'Search Quotes',
  },
  empty: {
    title: 'No Speakers Found',
    descSearch: 'No speakers match the keyword "{query}". Try another search term.',
    clearSearch: 'Reset Search',
    noSpeakersIndexed: 'No Speakers Indexed Yet',
    descEmpty: 'When meeting recordings are uploaded and transcribed, speaker profiles will be automatically analyzed and summarized here.',
    openDashboard: 'Open Recording Dashboard',
  },
};
