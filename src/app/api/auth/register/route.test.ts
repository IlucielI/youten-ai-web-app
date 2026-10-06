import { describe, it, expect, vi } from 'vitest';
import { POST } from './route';
import { authController } from '@/server/controllers/auth.controller';
import { NextResponse } from 'next/server';

describe('POST /api/auth/register', () => {
  it('delegates to authController.register', async () => {
    const mockRes = NextResponse.json({ success: true }, { status: 201 });
    const spy = vi.spyOn(authController, 'register').mockResolvedValue(mockRes);

    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password123',
        full_name: 'Test',
      }),
    });

    const res = await POST(req);
    expect(spy).toHaveBeenCalledWith(req);
    expect(res.status).toBe(201);
  });
});
