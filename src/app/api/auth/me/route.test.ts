import { describe, it, expect, vi } from 'vitest';
import { GET } from './route';
import { authController } from '@/server/controllers/auth.controller';
import { NextResponse } from 'next/server';

describe('GET /api/auth/me', () => {
  it('delegates to authController.getMe', async () => {
    const mockRes = NextResponse.json({ success: true }, { status: 200 });
    const spy = vi.spyOn(authController, 'getMe').mockResolvedValue(mockRes);

    const req = new Request('http://localhost/api/auth/me');
    const res = await GET(req);
    expect(spy).toHaveBeenCalledWith(req);
    expect(res.status).toBe(200);
  });
});
