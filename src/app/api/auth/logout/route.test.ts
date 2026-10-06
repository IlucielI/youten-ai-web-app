import { describe, it, expect, vi } from 'vitest';
import { POST } from './route';
import { authController } from '@/server/controllers/auth.controller';
import { NextResponse } from 'next/server';

describe('POST /api/auth/logout', () => {
  it('delegates to authController.logout', async () => {
    const mockRes = NextResponse.json({ success: true }, { status: 200 });
    const spy = vi.spyOn(authController, 'logout').mockResolvedValue(mockRes);

    const req = new Request('http://localhost/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: 'tok-123' }),
    });

    const res = await POST(req);
    expect(spy).toHaveBeenCalledWith(req);
    expect(res.status).toBe(200);
  });
});
