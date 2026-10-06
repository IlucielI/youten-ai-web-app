import { describe, it, expect, vi, afterEach } from 'vitest';
import { POST } from './route';
import { authController } from '@/server/controllers/auth.controller';
import { NextResponse } from 'next/server';

describe('POST /api/auth/reset-password', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('delegates to authController.resetPassword', async () => {
    const mockRes = NextResponse.json({ success: true }, { status: 200 });
    const spy = vi.spyOn(authController, 'resetPassword').mockResolvedValue(mockRes);

    const req = new Request('http://localhost/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: 'tok-123', new_password: 'Password123' }),
    });

    const res = await POST(req);
    expect(spy).toHaveBeenCalledWith(req);
    expect(res.status).toBe(200);
  });
});
