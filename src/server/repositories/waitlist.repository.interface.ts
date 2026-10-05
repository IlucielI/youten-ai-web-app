import { WaitlistRequest, WaitlistResponse } from '../dtos';
import { ApiResponse } from '../dtos/response.dto';

export interface IWaitlistRepository {
  joinBotWaitlist(payload: WaitlistRequest): Promise<ApiResponse<WaitlistResponse>>;
}
