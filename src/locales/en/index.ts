import { AppDictionary } from '../id';
import { enCommon } from './common';
import { enNavbar } from './navbar';
import { enFooter } from './footer';
import { enLanding } from './landing';
import { enPipeline } from './pipeline';
import { enAuth } from './auth';
import { enErrors } from './errors';
import { enNotifications } from './notifications';
import { enIngestion } from './ingestion';
import { enDashboard } from './dashboard';

export const enDictionary: AppDictionary = {
  common: enCommon,
  navbar: enNavbar,
  footer: enFooter,
  landing: enLanding,
  pipeline: enPipeline,
  auth: enAuth,
  errors: enErrors,
  notifications: enNotifications,
  ingestion: enIngestion,
  dashboard: enDashboard,
};
