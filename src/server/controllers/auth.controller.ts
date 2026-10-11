import { NextResponse } from 'next/server';
import { BaseController } from './base.controller';
import { IAuthService } from '../services/auth.service.interface';
import { authService as defaultAuthService } from '../services/auth.service';
import {
  RegisterRequestSchema,
  LoginRequestSchema,
  ForgotPasswordRequestSchema,
  ResetPasswordRequestSchema,
  UpdateProfileRequestSchema,
  ChangePasswordRequestSchema,
} from '../schemas/auth.schema';
import {
  AUTH_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  GUEST_COOKIE_NAME,
  AUTH_COOKIE_CONFIG,
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
  GUEST_TOKEN_MAX_AGE,
} from '../constants/auth.constant';

export class AuthController extends BaseController {
  constructor(
    private readonly authService: IAuthService = defaultAuthService
  ) {
    super();
  }

  async anonToken(req: Request): Promise<NextResponse> {
    const requestId = this.getRequestId(req);
    try {
      const result = await this.authService.anonToken();
      const response = this.success(result, { requestId, status: 201 });
      if (result.data) {
        response.cookies.set(GUEST_COOKIE_NAME, result.data.anon_token, {
          ...AUTH_COOKIE_CONFIG,
          maxAge: result.data.expires_in || GUEST_TOKEN_MAX_AGE,
        });
      }
      return response;
    } catch (error) {
      const action = this.resolveActionName(error, 'AuthController.anonToken');
      return this.error(error, { requestId, action });
    }
  }

  async register(req: Request): Promise<NextResponse> {
    const requestId = this.getRequestId(req);
    try {
      const body = await this.getBody(req, RegisterRequestSchema);
      const cookieHeader = req.headers.get('cookie') || '';
      const match = cookieHeader.match(new RegExp(`${GUEST_COOKIE_NAME}=([^;]+)`));
      const guestCookieToken = match ? match[1] : undefined;

      const payload = {
        ...body,
        anon_token: body.anon_token || guestCookieToken,
      };

      const result = await this.authService.register(payload);

      const response = this.success(result, { requestId, status: 201 });
      if (result.data) {
        response.cookies.set(AUTH_COOKIE_NAME, result.data.access_token, {
          ...AUTH_COOKIE_CONFIG,
          maxAge: result.data.expires_in || ACCESS_TOKEN_MAX_AGE,
        });
        response.cookies.set(REFRESH_COOKIE_NAME, result.data.refresh_token, {
          ...AUTH_COOKIE_CONFIG,
          maxAge: result.data.refresh_expires_in || REFRESH_TOKEN_MAX_AGE,
        });
        // Clear guest cookie upon successful registration/claim
        response.cookies.set(GUEST_COOKIE_NAME, '', {
          ...AUTH_COOKIE_CONFIG,
          maxAge: 0,
        });
      }
      return response;
    } catch (error) {
      const action = this.resolveActionName(error, 'AuthController.register');
      return this.error(error, { requestId, action });
    }
  }

  async login(req: Request): Promise<NextResponse> {
    const requestId = this.getRequestId(req);
    try {
      const body = await this.getBody(req, LoginRequestSchema);
      const cookieHeader = req.headers.get('cookie') || '';
      const match = cookieHeader.match(new RegExp(`${GUEST_COOKIE_NAME}=([^;]+)`));
      const guestCookieToken = match ? match[1] : undefined;

      const payload = {
        ...body,
        anon_token: body.anon_token || guestCookieToken,
      };

      const result = await this.authService.login(payload);

      const response = this.success(result, { requestId });
      if (result.data) {
        response.cookies.set(AUTH_COOKIE_NAME, result.data.access_token, {
          ...AUTH_COOKIE_CONFIG,
          maxAge: result.data.expires_in || ACCESS_TOKEN_MAX_AGE,
        });
        response.cookies.set(REFRESH_COOKIE_NAME, result.data.refresh_token, {
          ...AUTH_COOKIE_CONFIG,
          maxAge: result.data.refresh_expires_in || REFRESH_TOKEN_MAX_AGE,
        });
        // Clear guest cookie upon successful login/claim
        response.cookies.set(GUEST_COOKIE_NAME, '', {
          ...AUTH_COOKIE_CONFIG,
          maxAge: 0,
        });
      }
      return response;
    } catch (error) {
      const action = this.resolveActionName(error, 'AuthController.login');
      return this.error(error, { requestId, action });
    }
  }

  async logout(req: Request): Promise<NextResponse> {
    const requestId = this.getRequestId(req);
    try {
      let refreshToken = '';
      try {
        const body = (await req.json()) as { refresh_token?: string };
        if (body && typeof body.refresh_token === 'string') {
          refreshToken = body.refresh_token;
        }
      } catch {
        // Body may be empty if client calls POST /api/auth/logout without payload
      }

      if (!refreshToken) {
        const cookieHeader = req.headers.get('cookie') || '';
        const match = cookieHeader.match(new RegExp(`${REFRESH_COOKIE_NAME}=([^;]+)`));
        if (match) {
          refreshToken = match[1];
        }
      }

      let result;
      try {
        result = await this.authService.logout({ refresh_token: refreshToken || 'empty_token' });
      } catch {
        this.logger?.warn('Upstream logout call failed, proceeding with local cookie clearance', { requestId });
        result = {
          status: 'success',
          code: 'SUCCESS',
          message: 'Session terminated successfully',
          timestamp: new Date().toISOString(),
        };
      }

      const response = this.success(result, { requestId });
      response.cookies.set(AUTH_COOKIE_NAME, '', {
        ...AUTH_COOKIE_CONFIG,
        maxAge: 0,
      });
      response.cookies.set(REFRESH_COOKIE_NAME, '', {
        ...AUTH_COOKIE_CONFIG,
        maxAge: 0,
      });
      return response;
    } catch (error) {
      const action = this.resolveActionName(error, 'AuthController.logout');
      const response = this.error(error, { requestId, action });
      response.cookies.set(AUTH_COOKIE_NAME, '', {
        ...AUTH_COOKIE_CONFIG,
        maxAge: 0,
      });
      response.cookies.set(REFRESH_COOKIE_NAME, '', {
        ...AUTH_COOKIE_CONFIG,
        maxAge: 0,
      });
      return response;
    }
  }

  async getMe(req: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      return this.authService.getMe();
    });
  }

  async updateProfile(req: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      const body = await this.getBody(req, UpdateProfileRequestSchema);
      return this.authService.updateProfile(body);
    });
  }

  async changePassword(req: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      const body = await this.getBody(req, ChangePasswordRequestSchema);
      return this.authService.changePassword(body);
    });
  }

  async forgotPassword(req: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      const body = await this.getBody(req, ForgotPasswordRequestSchema);
      return this.authService.forgotPassword(body);
    });
  }

  async resetPassword(req: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      const body = await this.getBody(req, ResetPasswordRequestSchema);
      return this.authService.resetPassword(body);
    });
  }
}

/**
 * Colocated singleton instance for AuthController.
 */
export const authController = new AuthController();
