import { describe, it, expect, vi, afterEach } from 'vitest';
import { POST } from './route';
import { authController } from '@/server/controllers/auth.controller';
import { NextResponse } from 'next/server';

describe('POST /api/auth/login', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('delegates to authController.login', async () => {
    const mockRes = NextResponse.json({ success: true }, { status: 200 });
    const spy = vi.spyOn(authController, 'login').mockResolvedValue(mockRes);

    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password123',
      }),
    });

    const res = await POST(req);
    expect(spy).toHaveBeenCalledWith(req);
    expect(res.status).toBe(200);
  });
});
