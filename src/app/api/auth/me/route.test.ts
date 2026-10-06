import { describe, it, expect, vi, afterEach } from 'vitest';
import { GET, PUT } from './route';
import { authController } from '@/server/controllers/auth.controller';
import { NextResponse } from 'next/server';

describe('GET /api/auth/me', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('delegates to authController.getMe', async () => {
    const mockRes = NextResponse.json({ success: true }, { status: 200 });
    const spy = vi.spyOn(authController, 'getMe').mockResolvedValue(mockRes);

    const req = new Request('http://localhost/api/auth/me');
    const res = await GET(req);
    expect(spy).toHaveBeenCalledWith(req);
    expect(res.status).toBe(200);
  });
});

describe('PUT /api/auth/me', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('delegates to authController.updateProfile', async () => {
    const mockRes = NextResponse.json({ success: true }, { status: 200 });
    const spy = vi.spyOn(authController, 'updateProfile').mockResolvedValue(mockRes);

    const req = new Request('http://localhost/api/auth/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: 'John Doe' }),
    });
    const res = await PUT(req);
    expect(spy).toHaveBeenCalledWith(req);
    expect(res.status).toBe(200);
  });
});

