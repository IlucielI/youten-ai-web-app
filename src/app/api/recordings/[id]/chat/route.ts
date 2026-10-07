import { env, isTest } from '@/server/config';
import { RecordingChatRequestSchema } from '@/server/schemas/chat.schema';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let bodyJson: unknown;
  try {
    bodyJson = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const parsed = RecordingChatRequestSchema.safeParse(bodyJson);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: parsed.error.issues[0]?.message || 'Validation error' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const token =
    req.headers.get('x-ownership-token') ||
    new URL(req.url).searchParams.get('token') ||
    parsed.data.ownership_token ||
    undefined;

  // Upstream Core API real-time SSE streaming (when not in mock/test mode and CORE_API_URL is configured)
  if (!isTest && !env.MOCK_CORE_API && env.CORE_API_URL) {
    const upstreamUrl = `${env.CORE_API_URL.replace(/\/$/, '')}/v1/recordings/${id}/chat`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    };
    if (token) {
      headers['x-ownership-token'] = token;
    }
    const reqId = req.headers.get('x-request-id');
    if (reqId) headers['x-request-id'] = reqId;
    const authHeader = req.headers.get('authorization');
    if (authHeader) headers['authorization'] = authHeader;
    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) headers['cookie'] = cookieHeader;

    try {
      const upstreamRes = await fetch(upstreamUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: parsed.data.message,
          conversation_history: parsed.data.conversation_history,
          ownership_token: token,
        }),
        signal: req.signal,
      });

      if (!upstreamRes.ok) {
        const errorText = await upstreamRes.text().catch(() => '');
        return new Response(
          errorText || JSON.stringify({ error: 'Gagal terhubung ke layanan chat' }),
          {
            status: upstreamRes.status,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(upstreamRes.body, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upstream error';
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Simulated SSE stream for test or mock mode
  const encoder = new TextEncoder();
  const mockTokens = [
    'Berdasarkan pembahasan pada rekaman ini, ',
    'tim menyepakati beberapa poin penting.\n\n',
    'Arsitektur dan timeline telah diselaraskan dengan baik [00:15].',
  ];

  const stream = new ReadableStream({
    async start(controller) {
      for (const tokenStr of mockTokens) {
        controller.enqueue(
          encoder.encode(`event: token\ndata: ${JSON.stringify({ token: tokenStr })}\n\n`)
        );
      }

      const donePayload = {
        message_id: '00000000-0000-0000-0000-000000000001',
        content: mockTokens.join(''),
        citations: ['00:15'],
        retrieved_chunk_ids: ['chunk-1'],
      };
      controller.enqueue(
        encoder.encode(`event: done\ndata: ${JSON.stringify(donePayload)}\n\n`)
      );
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
