import { describe, it, expect, vi, afterEach } from 'vitest';
import { GET } from './route';
import { workspaceController } from '@/server/controllers/workspace.controller';
import { NextResponse } from 'next/server';

describe('GET /api/recordings/search', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('delegates to workspaceController.search', async () => {
    const mockRes = NextResponse.json({ success: true, data: { count: 0, results: [] } }, { status: 200 });
    const spy = vi.spyOn(workspaceController, 'search').mockResolvedValue(mockRes);

    const req = new Request('http://localhost/api/recordings/search?q=project', {
      method: 'GET',
    });

    const res = await GET(req);
    expect(spy).toHaveBeenCalledWith(req);
    expect(res.status).toBe(200);
  });
});
