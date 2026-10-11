import { idLanding } from '../id/landing';

export const enLanding: typeof idLanding = {
  hero: {
    badge: 'AI Voice & Conversation Intelligence',
    title: 'Youten — The Essence of Every Conversation',
    subtitle:
      'Intelligent transcription, decision synthesis, and AI-powered Q&A for your meetings, interviews, lectures, and voice memos.',
  },
  quota: {
    welcome: 'Welcome',
    remainingQuota: 'Remaining recording quota today:',
    recordingsUnit: 'recordings.',
    userBanner: 'Welcome, {name}! Remaining recording quota today: {count} recordings.',
    userCta: 'To Dashboard',
    guestBannerPrefix: '1 free upload per day',
    guestBannerSuffix: 'without logging in. Recordings are stored securely in your browser.',
    guestBanner: '1 free upload per day without logging in. Recordings are stored securely in your browser.',
    guestCta: 'Sign In',
    exhaustedTitle: 'Guest Quota Limit Reached:',
    exhaustedUsage: 'You have used your 1 free recording allocation today. Please',
    orText: 'or',
    exhaustedSuffix: 'to continue without limits.',
    exhaustedDescription:
      'You have used your 1 free recording allocation today. Please {loginLink} or {registerLink} to continue without limits.',
    loginText: 'Sign In',
    registerText: 'Register',
  },
  tabs: {
    upload: 'Upload File',
    uploadShort: 'Upload',
    url: 'Link / URL',
    urlShort: 'URL',
    record: 'Live Recording',
    recordShort: 'Record',
    bot: 'Meeting Bot',
    botShort: 'Bot',
    comingSoonBadge: 'Coming Soon',
  },
  templates: {
    title: 'Summary Templates',
    description: 'Select the synthesis format tailored to your specific workflow',
    general: 'General & Standard',
    meeting: 'Business Meetings & Minutes',
    interview: 'Interviews & Journalism',
    lecture: 'Lectures & Education',
  },
};
