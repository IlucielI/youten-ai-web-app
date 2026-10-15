import { IFeedbackService } from './feedback.service.interface';
import {
  IFeedbackRepository,
  feedbackRepository as defaultFeedbackRepo,
} from '../repositories';
import { FeedbackRequest, FeedbackResponse } from '../dtos/feedback.dto';
import { ApiResponse } from '../dtos/response.dto';

export class FeedbackService implements IFeedbackService {
  private readonly feedbackRepo: IFeedbackRepository;

  constructor(feedbackRepo: IFeedbackRepository = defaultFeedbackRepo) {
    this.feedbackRepo = feedbackRepo;
  }

  async submitFeedback(payload: FeedbackRequest): Promise<ApiResponse<FeedbackResponse>> {
    return this.feedbackRepo.submitFeedback(payload);
  }
}

/**
 * Colocated singleton instance for FeedbackService.
 */
export const feedbackService: IFeedbackService = new FeedbackService();
