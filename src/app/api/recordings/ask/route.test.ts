import { describe, it, expect, vi, afterEach } from 'vitest';
import { POST } from './route';
import { workspaceController } from '@/server/controllers/workspace.controller';
import { NextResponse } from 'next/server';

describe('POST /api/recordings/ask', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('delegates to workspaceController.ask', async () => {
    const mockRes = NextResponse.json({ success: true, data: { answer: 'Answer', sources: [] } }, { status: 200 });
    const spy = vi.spyOn(workspaceController, 'ask').mockResolvedValue(mockRes);

    const req = new Request('http://localhost/api/recordings/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'Summary of sprint?' }),
    });

    const res = await POST(req);
    expect(spy).toHaveBeenCalledWith(req);
    expect(res.status).toBe(200);
  });
});
