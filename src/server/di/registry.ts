import { env } from '../config';
import { logger } from '../logger';
import { httpClient } from '../datasources/http';
import {
  authRepository,
  recordingRepository,
  summaryRepository,
  commentRepository,
  workspaceRepository,
  waitlistRepository,
  systemRepository,
  meetingBotRepository,
} from '../repositories';
import { recordingService } from '../services/recording.service';
import { authService } from '../services/auth.service';
import { workspaceService } from '../services/workspace.service';
import { waitlistService } from '../services/waitlist.service';
import { meetingBotService } from '../services/meeting-bot.service';
import { workspaceController } from '../controllers/workspace.controller';
import { waitlistController } from '../controllers/waitlist.controller';
import { meetingBotController } from '../controllers/meeting-bot.controller';

/**
 * Shared Infrastructure & Domain Singletons Registry
 * 
 * Provides mock switches, infrastructure singletons, and domain repository singletons.
 */

// 1. Cross-Cutting Infrastructure
export { logger, httpClient };

// 2. Mocking Switch Flag for feature repositories
export const useMock = env.MOCK_CORE_API || env.USE_MOCK_DATA;

// 3. Domain Repositories Singletons
export {
  authRepository,
  recordingRepository,
  summaryRepository,
  commentRepository,
  workspaceRepository,
  waitlistRepository,
  systemRepository,
  meetingBotRepository,
};

// 4. Domain Services & Controllers Singletons
export {
  recordingService,
  authService,
  workspaceService,
  waitlistService,
  meetingBotService,
  workspaceController,
  waitlistController,
  meetingBotController,
};

