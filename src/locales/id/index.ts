import { idCommon } from './common';
import { idNavbar } from './navbar';
import { idFooter } from './footer';
import { idLanding } from './landing';
import { idPipeline } from './pipeline';
import { idAuth } from './auth';
import { idErrors } from './errors';
import { idNotifications } from './notifications';
import { idIngestion } from './ingestion';
import { idDashboard } from './dashboard';
import { idRecording } from './recording';
import { idSettings } from './settings';
import { idSpeakers } from './speakers';
import { idShare } from './share';
import { idFeedback } from './feedback';

export const idDictionary = {
  common: idCommon,
  navbar: idNavbar,
  footer: idFooter,
  landing: idLanding,
  pipeline: idPipeline,
  auth: idAuth,
  errors: idErrors,
  notifications: idNotifications,
  ingestion: idIngestion,
  dashboard: idDashboard,
  recording: idRecording,
  settings: idSettings,
  speakers: idSpeakers,
  share: idShare,
  feedback: idFeedback,
};

export type AppDictionary = typeof idDictionary;
