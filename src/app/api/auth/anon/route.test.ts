import { describe, it, expect, vi, afterEach } from 'vitest';
import { POST } from './route';
import { authController } from '@/server/controllers/auth.controller';
import { NextResponse } from 'next/server';

describe('POST /api/auth/anon', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('delegates to authController.anonToken', async () => {
    const mockRes = NextResponse.json({ success: true }, { status: 201 });
    const spy = vi.spyOn(authController, 'anonToken').mockResolvedValue(mockRes);

    const req = new Request('http://localhost/api/auth/anon', {
      method: 'POST',
    });

    const res = await POST(req);
    expect(spy).toHaveBeenCalledWith(req);
    expect(res.status).toBe(201);
  });
});
