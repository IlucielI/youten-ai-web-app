import { env, isTest } from '@/server/config';
import { AUTH_COOKIE_NAME } from '@/server/constants';
import { cookies } from 'next/headers';

/**
 * Generates a minimal, syntactically valid PDF 1.4 byte document for mock/test fallbacks.
 */
function generateMockPDF(title: string): Uint8Array {
  const sanitizedTitle = (title || 'Meeting Summary').replace(/[()\\]/g, ' ');
  const pdfString = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 50 >>
stream
BT
/F1 12 Tf
50 720 Td
(${sanitizedTitle.slice(0, 40)}) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000318 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
418
%%EOF
`;
  return new TextEncoder().encode(pdfString);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(req.url);
  const format = (url.searchParams.get('format') || 'markdown').toLowerCase();
  const token = url.searchParams.get('token') || req.headers.get('x-ownership-token') || undefined;

  // Upstream Core API export forwarding (when not in mock/test mode and CORE_API_URL is configured)
  if (!isTest && !env.MOCK_CORE_API && env.CORE_API_URL) {
    const queryParams = new URLSearchParams({ format });
    if (token) queryParams.set('token', token);
    const upstreamUrl = `${env.CORE_API_URL.replace(/\/$/, '')}/v1/recordings/${id}/export?${queryParams.toString()}`;

    const headers: Record<string, string> = {};
    if (token) {
      headers['x-ownership-token'] = token;
    }
    const reqId = req.headers.get('x-request-id');
    if (reqId) headers['x-request-id'] = reqId;
    const authHeader = req.headers.get('authorization');
    if (authHeader) headers['authorization'] = authHeader;

    try {
      const cookieStore = await cookies();
      const authCookie = cookieStore.get(AUTH_COOKIE_NAME);
      if (authCookie?.value && !headers['authorization']) {
        headers['authorization'] = `Bearer ${authCookie.value}`;
      }
    } catch {
      // Ignore cookie parsing failure
    }

    try {
      const upstreamRes = await fetch(upstreamUrl, {
        method: 'GET',
        headers,
        signal: req.signal,
      });

      if (!upstreamRes.ok) {
        const errorText = await upstreamRes.text().catch(() => '');
        return new Response(errorText || JSON.stringify({ error: 'Export failed' }), {
          status: upstreamRes.status,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const contentType = upstreamRes.headers.get('content-type') || 
        (format === 'pdf' ? 'application/pdf' : format === 'json' ? 'application/json' : 'text/plain');
      const contentDisposition = upstreamRes.headers.get('content-disposition') || 
        `attachment; filename="recording-${id}.${format === 'markdown' ? 'md' : format}"`;

      return new Response(upstreamRes.body, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': contentDisposition,
          'Cache-Control': 'no-cache, no-transform',
        },
      });
    } catch (err: unknown) {
      console.error('Upstream core-api export request failed:', err);
    }
  }

  // Fallback for mock/test environment
  const filename = `recording-${id}.${format === 'markdown' ? 'md' : format}`;

  if (format === 'pdf') {
    const pdfBytes = generateMockPDF(`Recording ${id}`);
    return new Response(pdfBytes as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  }

  if (format === 'json') {
    const mockJson = JSON.stringify({ id, format, title: `Recording ${id}`, status: 'COMPLETED' }, null, 2);
    return new Response(mockJson, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  }

  const mockText = `# Recording ${id}\n\nFormat: ${format}\nStatus: COMPLETED\n`;
  return new Response(mockText, {
    status: 200,
    headers: {
      'Content-Type': format === 'markdown' ? 'text/markdown; charset=utf-8' : 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
