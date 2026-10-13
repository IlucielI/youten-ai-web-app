import { env, isTest } from '@/server/config';
import { RecordingChatRequestSchema } from '@/server/schemas/chat.schema';
import { AUTH_COOKIE_NAME, GUEST_COOKIE_NAME } from '@/server/constants';
import { authRepository } from '@/server/repositories';
import { cookies } from 'next/headers';

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

  const shareToken =
    req.headers.get('x-share-token') ||
    new URL(req.url).searchParams.get('share_token') ||
    parsed.data.share_token ||
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
    if (shareToken) {
      headers['x-share-token'] = shareToken;
    }
    const reqId = req.headers.get('x-request-id');
    if (reqId) headers['x-request-id'] = reqId;
    const authHeader = req.headers.get('authorization');
    if (authHeader) headers['authorization'] = authHeader;
    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) headers['cookie'] = cookieHeader;

    try {
      const cookieStore = await cookies();
      const authCookie = cookieStore.get(AUTH_COOKIE_NAME);
      if (authCookie?.value && !headers['authorization']) {
        headers['authorization'] = `Bearer ${authCookie.value}`;
      } else {
        const guestCookie = cookieStore.get(GUEST_COOKIE_NAME);
        if (guestCookie?.value && !headers['authorization']) {
          headers['authorization'] = `Bearer ${guestCookie.value}`;
        }
      }
    } catch {
      // Ignore cookie parsing error outside request context
    }

    // Attach gateway anonymous token if still missing authorization header
    if (!headers['authorization']) {
      try {
        const anonToken = await authRepository.getGatewayAnonToken();
        if (anonToken) {
          headers['authorization'] = `Bearer ${anonToken}`;
        }
      } catch {
        // Ignore fallback error
      }
    }

    try {
      const upstreamRes = await fetch(upstreamUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: parsed.data.message,
          conversation_history: parsed.data.conversation_history,
          ownership_token: token,
          session_id: parsed.data.session_id,
          share_token: shareToken,
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
      const sessionId = parsed.data.session_id || '00000000-0000-0000-0000-000000000001';
      controller.enqueue(
        encoder.encode(`event: session\ndata: ${JSON.stringify({ session_id: sessionId })}\n\n`)
      );

      for (const tokenStr of mockTokens) {
        controller.enqueue(
          encoder.encode(`event: token\ndata: ${JSON.stringify({ token: tokenStr })}\n\n`)
        );
      }

      const donePayload = {
        message_id: '00000000-0000-0000-0000-000000000001',
        session_id: sessionId,
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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(req.url);
  const sessionId = url.searchParams.get('session_id');

  if (!sessionId) {
    return new Response(
      JSON.stringify({ error: 'Parameter session_id wajib disertakan' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const token =
    req.headers.get('x-ownership-token') ||
    url.searchParams.get('token') ||
    url.searchParams.get('ownership_token') ||
    undefined;

  const shareToken =
    req.headers.get('x-share-token') ||
    url.searchParams.get('share_token') ||
    undefined;

  if (!isTest && !env.MOCK_CORE_API && env.CORE_API_URL) {
    const upstreamUrl = new URL(
      `${env.CORE_API_URL.replace(/\/$/, '')}/v1/recordings/${id}/chat`
    );
    upstreamUrl.searchParams.set('session_id', sessionId);
    if (shareToken) {
      upstreamUrl.searchParams.set('share_token', shareToken);
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (token) headers['x-ownership-token'] = token;
    if (shareToken) headers['x-share-token'] = shareToken;
    const reqId = req.headers.get('x-request-id');
    if (reqId) headers['x-request-id'] = reqId;
    const authHeader = req.headers.get('authorization');
    if (authHeader) headers['authorization'] = authHeader;
    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) headers['cookie'] = cookieHeader;

    try {
      const cookieStore = await cookies();
      const authCookie = cookieStore.get(AUTH_COOKIE_NAME);
      if (authCookie?.value && !headers['authorization']) {
        headers['authorization'] = `Bearer ${authCookie.value}`;
      } else {
        const guestCookie = cookieStore.get(GUEST_COOKIE_NAME);
        if (guestCookie?.value && !headers['authorization']) {
          headers['authorization'] = `Bearer ${guestCookie.value}`;
        }
      }
    } catch {
      // Ignore cookie parsing error outside request context
    }

    if (!headers['authorization']) {
      try {
        const anonToken = await authRepository.getGatewayAnonToken();
        if (anonToken) {
          headers['authorization'] = `Bearer ${anonToken}`;
        }
      } catch {
        // Ignore fallback error
      }
    }

    try {
      const upstreamRes = await fetch(upstreamUrl.toString(), {
        method: 'GET',
        headers,
        signal: req.signal,
      });

      const bodyText = await upstreamRes.text();
      return new Response(bodyText, {
        status: upstreamRes.status,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upstream error';
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Simulated mock response for test/mock mode
  return new Response(
    JSON.stringify({
      status: 'success',
      code: 'SUCCESS',
      message: 'chat history retrieved successfully',
      data: [],
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
