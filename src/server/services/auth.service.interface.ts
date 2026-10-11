import {
  RegisterRequest,
  LoginRequest,
  RefreshTokenRequest,
  LogoutRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  ResendVerificationRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  AuthResponse,
  UserProfileResponse,
  UserResponse,
  AnonTokenResponse,
} from '../dtos';
import { ApiResponse, BaseResponse } from '../dtos/response.dto';

export interface IAuthService {
  anonToken(): Promise<ApiResponse<AnonTokenResponse>>;
  register(payload: RegisterRequest): Promise<ApiResponse<AuthResponse>>;
  login(payload: LoginRequest): Promise<ApiResponse<AuthResponse>>;
  refreshToken(payload: RefreshTokenRequest): Promise<ApiResponse<AuthResponse>>;
  logout(payload: LogoutRequest): Promise<BaseResponse>;
  forgotPassword(payload: ForgotPasswordRequest): Promise<BaseResponse>;
  resetPassword(payload: ResetPasswordRequest): Promise<BaseResponse>;
  verifyEmail(payload: VerifyEmailRequest): Promise<ApiResponse<AuthResponse>>;
  resendVerification(payload: ResendVerificationRequest): Promise<BaseResponse>;
  getMe(): Promise<ApiResponse<UserProfileResponse>>;
  updateProfile(payload: UpdateProfileRequest): Promise<ApiResponse<UserResponse>>;
  changePassword(payload: ChangePasswordRequest): Promise<BaseResponse>;
}
