import { idCommon } from './common';
import { idNavbar } from './navbar';
import { idFooter } from './footer';
import { idLanding } from './landing';
import { idPipeline } from './pipeline';
import { idAuth } from './auth';
import { idErrors } from './errors';
import { idNotifications } from './notifications';

export const idDictionary = {
  common: idCommon,
  navbar: idNavbar,
  footer: idFooter,
  landing: idLanding,
  pipeline: idPipeline,
  auth: idAuth,
  errors: idErrors,
  notifications: idNotifications,
};

export type AppDictionary = typeof idDictionary;
