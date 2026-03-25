import { NextRequest } from 'next/server'
import { generateDemoData } from '@/lib/demo-data'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const mode = params.get('mode') || 'sse'

  if (mode === 'polling') {
    // Try to get actual data from Python backend
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:5005'
    try {
      const response = await fetch(`${pythonBackendUrl}/analyze`, {
        signal: AbortSignal.timeout(1000)
      })
      if (response.ok) {
        return Response.json(await response.json())
      }
    } catch (e) {
      // console.log('[v0] Failed to fetch live status, falling back to demo')
    }
    const demoData = generateDemoData()
    return Response.json(demoData)
  }

  // Server-Sent Events (SSE) mode
  return handleSSE(request)
}

export async function POST(request: NextRequest) {
  // Handle frame analysis requests
  try {
    const { frame } = await request.json()

    if (!frame) {
      return Response.json(
        { error: 'No frame data provided' },
        { status: 400 }
      )
    }

    // Try to forward to Python backend
    const pythonBackendUrl =
      process.env.PYTHON_BACKEND_URL || 'http://localhost:5005'

    try {
      const response = await fetch(`${pythonBackendUrl}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frame }),
        signal: AbortSignal.timeout(5000), // 5 second timeout
      })

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`)
      }

      const data = await response.json()
      return Response.json(data)
    } catch (backendError) {
      // Backend not available, use demo data
      console.log(
        '[v0] Python backend unavailable, using demo data:',
        backendError
      )
      const demoData = generateDemoData()
      return Response.json(demoData)
    }
  } catch (error) {
    console.error('[v0] Error processing frame:', error)
    const demoData = generateDemoData()
    return Response.json(demoData)
  }
}

/**
 * Server-Sent Events (SSE) handler for real-time stress data
 */
function handleSSE(request: NextRequest) {
  const encoder = new TextEncoder()
  let isClosed = false

  const stream = new ReadableStream({
    start(controller) {
      // Send initial comment to keep connection alive
      controller.enqueue(encoder.encode(': connected\n\n'))

      // Send data every 100ms
      const interval = setInterval(() => {
        if (isClosed) return

        try {
          const data = generateDemoData()
          const message = `data: ${JSON.stringify(data)}\n\n`
          controller.enqueue(encoder.encode(message))
        } catch (e) {
          console.error('[v0] Error in SSE stream:', e)
        }
      }, 100)

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        isClosed = true
        clearInterval(interval)
        controller.close()
      })

      // Auto-close after 5 minutes
      setTimeout(() => {
        isClosed = true
        clearInterval(interval)
        controller.close()
      }, 300000)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream;charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
