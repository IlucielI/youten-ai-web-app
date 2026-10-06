import { IAuthService } from './auth.service.interface';
import { IAuthRepository } from '../repositories/auth.repository.interface';
import { authRepository as defaultAuthRepository } from '../repositories/auth.repository';
import {
  RegisterRequest,
  LoginRequest,
  RefreshTokenRequest,
  LogoutRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AuthResponse,
  UserProfileResponse,
} from '../dtos';
import { ApiResponse, BaseResponse } from '../dtos/response.dto';

export class AuthService implements IAuthService {
  constructor(
    private readonly authRepo: IAuthRepository = defaultAuthRepository
  ) {}

  async register(payload: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    return this.authRepo.register(payload);
  }

  async login(payload: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    return this.authRepo.login(payload);
  }

  async refreshToken(payload: RefreshTokenRequest): Promise<ApiResponse<AuthResponse>> {
    return this.authRepo.refreshToken(payload);
  }

  async logout(payload: LogoutRequest): Promise<BaseResponse> {
    return this.authRepo.logout(payload);
  }

  async forgotPassword(payload: ForgotPasswordRequest): Promise<BaseResponse> {
    return this.authRepo.forgotPassword(payload);
  }

  async resetPassword(payload: ResetPasswordRequest): Promise<BaseResponse> {
    return this.authRepo.resetPassword(payload);
  }

  async getMe(): Promise<ApiResponse<UserProfileResponse>> {
    return this.authRepo.getMe();
  }
}

/**
 * Colocated singleton instance for AuthService.
 */
export const authService: IAuthService = new AuthService();
