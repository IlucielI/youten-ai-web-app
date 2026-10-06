import { recordingService } from '@/server/services/recording.service';
import { RecordingStatus } from '@/server/constants';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(req.url);
  const isFastMode = url.searchParams.get('fast') === 'true';
  const shouldFail = url.searchParams.get('fail') === 'true';

  let initialDetail;
  try {
    const res = await recordingService.getRecordingDetail(id);
    initialDetail = res.data;
  } catch {
    // If not found, return 404
    return new Response(JSON.stringify({ error: 'Recording not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: unknown) => {
        try {
          const payload = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch {
          // Stream might be closed
        }
      };

      // If recording is already completed, emit completed event and close
      if (initialDetail?.status === RecordingStatus.COMPLETED) {
        sendEvent({
          status: RecordingStatus.COMPLETED,
          stage: 'completed',
          progress: 100,
          message: 'Pemrosesan rekaman selesai dan siap ditinjau.',
        });
        controller.close();
        return;
      }

      // If simulated failure requested or initial recording is failed
      if (shouldFail || initialDetail?.status === RecordingStatus.FAILED) {
        sendEvent({
          status: RecordingStatus.FAILED,
          stage: 'failed',
          progress: 45,
          message: initialDetail?.error_message || 'Transkripsi audio mengalami kegagalan proses.',
          errorCode: initialDetail?.error_code || 'ERR_PIPELINE_FAILED',
          errorMessage: initialDetail?.error_message || 'Format audio tidak didukung atau koneksi pipeline terputus.',
        });
        controller.close();
        return;
      }

      // Progressive stages sequence
      const stages = [
        {
          status: RecordingStatus.EXTRACTING,
          stage: 'extraction',
          progress: 30,
          message: 'Memvalidasi berkas dan mengekstrak sinyal audio...',
        },
        {
          status: RecordingStatus.TRANSCRIBING,
          stage: 'transcription',
          progress: 60,
          message: 'Mentranskripsi ujaran dan mendeteksi segmen pembicara...',
        },
        {
          status: RecordingStatus.SUMMARIZING,
          stage: 'intelligence',
          progress: 85,
          message: 'Menghasilkan ringkasan pintar, action items, dan vektor semantik...',
        },
        {
          status: RecordingStatus.COMPLETED,
          stage: 'completed',
          progress: 100,
          message: 'Seluruh tahap pemrosesan selesai. Mengalihkan ke halaman tinjauan...',
        },
      ];

      const delay = isFastMode ? 50 : 800;

      for (let i = 0; i < stages.length; i++) {
        if (req.signal.aborted) {
          break;
        }

        sendEvent(stages[i]);

        if (i < stages.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      try {
        controller.close();
      } catch {
        // Already closed
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
