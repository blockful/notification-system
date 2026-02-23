import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/flow/watch
 * Server-Sent Events endpoint for watching file changes
 * In development, this notifies the client when message files change
 */
export async function GET(request: NextRequest) {
  // Only enable in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Watch only available in development' }, { status: 403 });
  }

  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(encoder.encode('data: {"type":"connected"}\n\n'));

      // In a real implementation, we would use chokidar here
      // For now, we'll use a simple polling mechanism on the client side
      // The client will poll /api/flow/current and compare timestamps

      // Keep connection alive with heartbeat
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode('data: {"type":"heartbeat"}\n\n'));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30000);

      // Clean up on close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
