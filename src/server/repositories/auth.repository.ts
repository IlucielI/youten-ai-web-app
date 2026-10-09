import { IAuthRepository } from './auth.repository.interface';
import { IHttpClient, httpClient as defaultHttpClient } from '../datasources/http';
import { MockDataService, mockDataService as defaultMockDataService } from '../datasources/mock';
import { env } from '../config';
import {
  RegisterRequest,
  LoginRequest,
  RefreshTokenRequest,
  LogoutRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  AuthResponse,
  UserProfileResponse,
  UserResponse,
  AnonTokenResponse,
} from '../dtos';
import { ApiResponse, BaseResponse } from '../dtos/response.dto';
import { ResponseStatus, ResponseCode } from '../constants';

export class AuthRepository implements IAuthRepository {
  private readonly http: IHttpClient;
  private readonly mock: MockDataService;
  private readonly useMock: boolean;

  constructor(
    http: IHttpClient = defaultHttpClient,
    mock: MockDataService = defaultMockDataService,
    useMock: boolean = env.MOCK_CORE_API || env.USE_MOCK_DATA
  ) {
    this.http = http;
    this.mock = mock;
    this.useMock = useMock;
  }

  async anonToken(): Promise<ApiResponse<AnonTokenResponse>> {
    if (this.useMock) {
      const data = this.mock.anonToken();
      return this.successResponse(data, 'Anonymous session created successfully');
    }
    const credentials = Buffer.from(`${env.CLIENT_APP_ID}:${env.CLIENT_APP_SECRET}`).toString('base64');
    return this.http.post<ApiResponse<AnonTokenResponse>>('/v1/auth/anon', undefined, {
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    });
  }

  async register(payload: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    if (this.useMock) {
      const data = this.mock.register(payload);
      return this.successResponse(data, 'User registered successfully');
    }
    return this.http.post<ApiResponse<AuthResponse>>('/v1/auth/register', payload);
  }

  async login(payload: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    if (this.useMock) {
      const data = this.mock.login(payload);
      return this.successResponse(data, 'User logged in successfully');
    }
    return this.http.post<ApiResponse<AuthResponse>>('/v1/auth/login', payload);
  }

  async refreshToken(payload: RefreshTokenRequest): Promise<ApiResponse<AuthResponse>> {
    if (this.useMock) {
      const data = this.mock.refreshToken(payload);
      return this.successResponse(data, 'Token rotated successfully');
    }
    return this.http.post<ApiResponse<AuthResponse>>('/v1/auth/refresh', payload);
  }

  async logout(payload: LogoutRequest): Promise<BaseResponse> {
    if (this.useMock) {
      return this.baseSuccessResponse('Session terminated successfully');
    }
    return this.http.post<BaseResponse>('/v1/auth/logout', payload);
  }

  async forgotPassword(payload: ForgotPasswordRequest): Promise<BaseResponse> {
    if (this.useMock) {
      return this.baseSuccessResponse('Password reset instructions sent');
    }
    return this.http.post<BaseResponse>('/v1/auth/forgot-password', payload);
  }

  async resetPassword(payload: ResetPasswordRequest): Promise<BaseResponse> {
    if (this.useMock) {
      return this.baseSuccessResponse('Password reset successfully');
    }
    return this.http.post<BaseResponse>('/v1/auth/reset-password', payload);
  }

  async getMe(): Promise<ApiResponse<UserProfileResponse>> {
    if (this.useMock) {
      const data = this.mock.getMe();
      return this.successResponse(data, 'Profile retrieved successfully');
    }
    return this.http.get<ApiResponse<UserProfileResponse>>('/v1/auth/me');
  }

  async updateProfile(payload: UpdateProfileRequest): Promise<ApiResponse<UserResponse>> {
    if (this.useMock) {
      const data = this.mock.updateProfile(payload);
      return this.successResponse(data, 'Profile updated successfully');
    }
    return this.http.put<ApiResponse<UserResponse>>('/v1/auth/me', payload);
  }

  async changePassword(payload: ChangePasswordRequest): Promise<BaseResponse> {
    if (this.useMock) {
      this.mock.changePassword(payload);
      return this.baseSuccessResponse('Password changed successfully');
    }
    return this.http.put<BaseResponse>('/v1/auth/change-password', payload);
  }

  private successResponse<T>(data: T, message: string): ApiResponse<T> {
    return {
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  private baseSuccessResponse(message: string): BaseResponse {
    return {
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Colocated singleton instance for AuthRepository.
 */
export const authRepository: IAuthRepository = new AuthRepository();
