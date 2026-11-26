import { env, isTest } from '@/server/config';
import { StreamWorkspaceChatSchema } from '@/server/schemas/workspace-chat.schema';
import { resolveBffStreamAuth, unauthorizedRefreshResponse } from '@/server/utils/stream-auth';

export async function POST(req: Request) {
  let bodyJson: unknown;
  try {
    bodyJson = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const parsed = StreamWorkspaceChatSchema.safeParse(bodyJson);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: parsed.error.issues[0]?.message || 'Validation error' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Upstream Core API real-time SSE streaming (when not in mock/test mode and CORE_API_URL is configured)
  if (!isTest && !env.MOCK_CORE_API && env.CORE_API_URL) {
    const upstreamUrl = `${env.CORE_API_URL.replace(/\/$/, '')}/v1/chat/stream`;

    const { headers: authHeaders, requiresRefresh } = await resolveBffStreamAuth({
      req,
      allowAnon: true,
    });
    if (requiresRefresh) {
      return unauthorizedRefreshResponse();
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...authHeaders,
    };

    try {
      const upstreamRes = await fetch(upstreamUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          question: parsed.data.query,
          query: parsed.data.query,
          session_id: parsed.data.session_id,
          folder_id: parsed.data.folder_id,
        }),
        signal: req.signal,
      });

      if (!upstreamRes.ok) {
        const errorText = await upstreamRes.text().catch(() => '');
        console.error('[Stream Chat Upstream Error]', upstreamRes.status, errorText);
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
    'Berdasarkan penelusuran lintas rekaman pada workspace Anda, ',
    'teridentifikasi beberapa poin kesepakatan dan tindakan lanjutan. ',
    'Tim sepakat melanjutkan fase migrasi ke arsitektur modular.',
  ];

  const stream = new ReadableStream({
    async start(controller) {
      // Emit simulated citations
      const mockCitations = [
        {
          recording_id: '11111111-1111-1111-1111-111111111111',
          recording_title: 'Sprint Retrospective & Roadmap',
          chunk_index: 0,
          snippet: 'Tim sepakat melanjutkan fase migrasi ke arsitektur modular.',
          start_time: 15.0,
          end_time: 45.0,
        },
      ];
      controller.enqueue(
        encoder.encode(`event: citations\ndata: ${JSON.stringify(mockCitations)}\n\n`)
      );

      for (const token of mockTokens) {
        controller.enqueue(
          encoder.encode(`event: token\ndata: ${JSON.stringify({ token })}\n\n`)
        );
      }

      controller.enqueue(
        encoder.encode(`event: done\ndata: {"status":"completed"}\n\n`)
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
    },
  });
}

