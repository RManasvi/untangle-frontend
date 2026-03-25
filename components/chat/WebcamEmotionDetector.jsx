'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, Camera, CameraOff } from 'lucide-react';

const EMOTIONS = {
  neutral: { color: 'text-slate-500', bg: 'bg-slate-100' },
  happy: { color: 'text-green-600', bg: 'bg-green-100' },
  sad: { color: 'text-blue-600', bg: 'bg-blue-100' },
  angry: { color: 'text-red-600', bg: 'bg-red-100' },
  fearful: { color: 'text-orange-600', bg: 'bg-orange-100' },
  disgusted: { color: 'text-purple-600', bg: 'bg-purple-100' },
  surprised: { color: 'text-yellow-600', bg: 'bg-yellow-100' },
};

export default function WebcamEmotionDetector({ onStableEmotion, isOpen }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [detectedEmotion, setDetectedEmotion] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const streamRef = useRef(null);

  // Emotion stabilization state
  const lastEmotionRef = useRef(null);
  const stableStartTimeRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const triggeredEmotionsRef = useRef(new Set());

  useEffect(() => {
    if (isOpen && isActive) {
      startWebcam();
    }
    return () => {
      stopWebcam();
    };
  }, [isOpen, isActive]);

  const startWebcam = async () => {
    try {
      setLoading(true);
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          startEmotionDetection();
        };
      }
    } catch (err) {
      setError('Unable to access webcam. Please check permissions.');
      console.error('[v0] Webcam error:', err);
      setIsActive(false);
    } finally {
      setLoading(false);
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setDetectedEmotion(null);
    setConfidence(0);
    lastEmotionRef.current = null;
    stableStartTimeRef.current = null;
    triggeredEmotionsRef.current.clear();
  };

  const startEmotionDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    // Detect emotion every 500ms
    detectionIntervalRef.current = setInterval(() => {
      if (!isActive || !videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Set canvas size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Simulate emotion detection (in production, use TensorFlow.js or face-api.js)
      detectEmotionFromFrame(canvas);
    }, 500);
  };

  const detectEmotionFromFrame = async (canvas) => {
    try {
      const imageData = canvas.toDataURL('image/jpeg');

      // Call backend to detect emotion
      const response = await fetch('/api/detect-emotion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData }),
      });

      if (!response.ok) {
        throw new Error('Emotion detection failed');
      }

      const data = await response.json();
      const currentEmotion = data.emotion;
      const currentConfidence = data.confidence;

      setDetectedEmotion(currentEmotion);
      setConfidence(currentConfidence);

      // Emotion Stabilization Logic
      handleEmotionStabilization(currentEmotion, currentConfidence);
    } catch (err) {
      console.error('[v0] Detection error:', err);
    }
  };

  const handleEmotionStabilization = (currentEmotion, currentConfidence) => {
    // Only process if confidence is >= 70%
    if (currentConfidence < 70) {
      lastEmotionRef.current = null;
      stableStartTimeRef.current = null;
      return;
    }

    // Check if emotion has changed
    if (currentEmotion === lastEmotionRef.current) {
      // Same emotion - check if stable for 5 seconds
      const elapsedTime = Date.now() - stableStartTimeRef.current;

      if (elapsedTime >= 5000) {
        // Emotion is stable - trigger callback if not already triggered
        const emotionKey = `${currentEmotion}_${stableStartTimeRef.current}`;
        if (!triggeredEmotionsRef.current.has(emotionKey)) {
          console.log(`[v0] Stable emotion detected: ${currentEmotion} (${currentConfidence}%)`);

          // Trigger auto-messages based on emotion
          if (onStableEmotion) {
            onStableEmotion(currentEmotion);
          }

          // Mark as triggered to prevent duplicate triggers
          triggeredEmotionsRef.current.add(emotionKey);

          // Reset start time to prevent immediate re-triggers
          stableStartTimeRef.current = Date.now() + 999999;
        }
      }
    } else {
      // Emotion changed - reset timer
      lastEmotionRef.current = currentEmotion;
      stableStartTimeRef.current = Date.now();
      triggeredEmotionsRef.current.clear();
    }
  };

  return (
    <div className={`transition-all duration-300 ${isOpen ? 'mb-4' : ''}`}>
      {isOpen && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 p-4">
          <div className="space-y-4">
            {/* Camera Controls */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Emotion Detection</h3>
              <Button
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsActive(!isActive)}
                className={
                  isActive
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'border-blue-300 text-slate-700'
                }
                disabled={loading}
              >
                {loading ? (
                  <span className="animate-spin">⏳</span>
                ) : isActive ? (
                  <>
                    <CameraOff className="h-4 w-4 mr-2" />
                    Stop Camera
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Start Camera
                  </>
                )}
              </Button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-100 border border-red-300 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Video & Canvas */}
            <div className="relative bg-slate-200 rounded-lg overflow-hidden aspect-video">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                playsInline
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Emotion Display Overlay */}
              {detectedEmotion && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Detected Emotion</p>
                      <p className="text-xl font-bold capitalize">{detectedEmotion}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">Confidence</p>
                      <p className={`text-2xl font-bold ${confidence >= 70 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {Math.round(confidence)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Emotion Status */}
            {detectedEmotion && (
              <div
                className={`p-3 rounded-lg ${EMOTIONS[detectedEmotion]?.bg || 'bg-slate-100'}`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`h-3 w-3 rounded-full ${EMOTIONS[detectedEmotion]?.color || 'bg-slate-500'}`}
                  />
                  <p className={`text-sm font-medium ${EMOTIONS[detectedEmotion]?.color || 'text-slate-700'}`}>
                    {confidence >= 70
                      ? `Stable emotion: ${detectedEmotion}`
                      : `Detecting: ${detectedEmotion} (building confidence...)`}
                  </p>
                </div>
              </div>
            )}

            <p className="text-xs text-slate-600 text-center">
              📷 Hold your expression for 5 seconds to trigger AI response
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
