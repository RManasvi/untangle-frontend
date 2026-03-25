'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Camera, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VideoCaptureProps {
  isActive: boolean
  onFrame?: (frame: string) => void
  onFps?: (fps: number) => void
}

export default function VideoCapture({ isActive, onFrame, onFps }: VideoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const lastFrameTime = useRef<number>(0)
  const frameCountRef = useRef<number>(0)
  const fpsRef = useRef<number>(0)
  const [currentFps, setCurrentFps] = useState(0)

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setIsCameraReady(false)
  }, [])

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null)
      setIsCameraReady(false)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.error("Video play failed:", e))
          setIsCameraReady(true)
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to access camera'
      setCameraError(message)
      console.error('Error accessing camera:', error)
    }
  }, [])

  useEffect(() => {
    if (isActive) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [isActive, startCamera, stopCamera])

  useEffect(() => {
    if (!isActive || !isCameraReady || !videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    if (!ctx) return

    let animationId: number

    const processLoop = () => {
      const now = Date.now()

      // Calculate FPS every second
      frameCountRef.current++
      if (now - lastFrameTime.current >= 1000) {
        fpsRef.current = frameCountRef.current
        setCurrentFps(fpsRef.current)
        if (onFps) onFps(fpsRef.current)
        frameCountRef.current = 0
        lastFrameTime.current = now
      }

      // Capture frame for analysis every 250ms (Approx 4 FPS)
      // We use a separate ref for the last capture time to avoid interfering with FPS calculation
      if (onFrame && video.readyState === video.HAVE_ENOUGH_DATA) {
        const timeSinceLastCapture = now - (window as any).__lastCaptureTime || 0
        if (timeSinceLastCapture >= 250) {
          (window as any).__lastCaptureTime = now

          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          // Explicitly draw covering the full canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

          const frameData = canvas.toDataURL('image/jpeg', 0.8)
          console.log("Frame sent")
          onFrame(frameData)
        }
      }

      animationId = requestAnimationFrame(processLoop)
    }

    animationId = requestAnimationFrame(processLoop)

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [isActive, isCameraReady, onFrame])

  return (
    <div className="relative bg-slate-900 rounded-lg overflow-hidden aspect-video border border-slate-800 shadow-2xl transition-all duration-300">
      {/* Real Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transition-opacity duration-500 ${isCameraReady ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Hidden Canvas for Processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera Ready Indicator */}
      {isCameraReady && (
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-white uppercase tracking-wider">Live</span>
          <span className="text-[10px] font-medium text-white/60 ml-1">| {currentFps} FPS</span>
        </div>
      )}

      {/* Loading State */}
      {isActive && !isCameraReady && !cameraError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
          <p className="text-slate-400 text-sm animate-pulse">Initializing camera...</p>
        </div>
      )}

      {/* Error State with Retry */}
      {cameraError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <Camera className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Camera Access Error</h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              {cameraError}. Please check your browser permissions and ensure no other app is using the camera.
            </p>
            <Button
              onClick={startCamera}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2 transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Idle State */}
      {!isActive && !cameraError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/40">
          <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 border border-slate-700 shadow-inner">
            <Camera className="w-10 h-10 text-slate-500" />
          </div>
          <div className="text-center px-6">
            <h3 className="text-slate-300 font-medium mb-1">Camera Feed Inactive</h3>
            <p className="text-slate-500 text-xs">Analysis will start once requested</p>
          </div>
        </div>
      )}

      {/* Subtle Active Glow */}
      {isCameraReady && (
        <div className="absolute inset-0 pointer-events-none border-2 border-blue-500/20 rounded-lg shadow-[inset_0_0_40px_rgba(59,130,246,0.1)]" />
      )}
    </div>
  )
}
