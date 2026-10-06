import { describe, it, expect, vi, afterEach } from 'vitest';
import { PUT } from './route';
import { authController } from '@/server/controllers/auth.controller';
import { NextResponse } from 'next/server';

describe('PUT /api/auth/change-password', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('delegates to authController.changePassword', async () => {
    const mockRes = NextResponse.json({ success: true }, { status: 200 });
    const spy = vi.spyOn(authController, 'changePassword').mockResolvedValue(mockRes);

    const req = new Request('http://localhost/api/auth/change-password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        old_password: 'OldPassword123',
        new_password: 'NewPassword456',
      }),
    });
    const res = await PUT(req);
    expect(spy).toHaveBeenCalledWith(req);
    expect(res.status).toBe(200);
  });
});
