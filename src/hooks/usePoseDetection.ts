import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import {
  createPoseLandmarker,
  detectPose,
  disposePoseLandmarker,
} from '@/services/poseDetectorService'
import type { PoseDetectorStatus, PoseLandmarkArray } from '@/types/pose'

export interface DetectionPerf {
  fps: number
  detectMs: number
}

export interface UsePoseDetectionOptions {
  videoRef: RefObject<HTMLVideoElement | null>
  enabled?: boolean
  maxFps?: number
  onFrame?: (landmarks: PoseLandmarkArray | null) => void
}

export interface UsePoseDetectionResult {
  status: PoseDetectorStatus
  isLoading: boolean
  landmarks: PoseLandmarkArray | null
  error: string | null
  perf: DetectionPerf
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unable to initialize pose detection.'
}

export function usePoseDetection({
  videoRef,
  enabled = false,
  maxFps = 30,
  onFrame,
}: UsePoseDetectionOptions): UsePoseDetectionResult {
  const [status, setStatus] = useState<PoseDetectorStatus>('idle')
  const [landmarks, setLandmarks] = useState<PoseLandmarkArray | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [perf, setPerf] = useState<DetectionPerf>({ fps: 0, detectMs: 0 })

  const onFrameRef = useRef(onFrame)

  useEffect(() => {
    onFrameRef.current = onFrame
  }, [onFrame])

  useEffect(() => {
    if (!enabled) {
      return
    }

    let cancelled = false
    let detector: Awaited<ReturnType<typeof createPoseLandmarker>> | null = null
    let rafId = 0
    let lastRunAtMs = 0
    let sampleStartMs = performance.now()
    let samplesInWindow = 0
    let emaDetectMs = 0
    let emaFps = 0
    const minIntervalMs = 1000 / Math.max(1, maxFps)

    const reportPerf = (now: number) => {
      const elapsed = now - sampleStartMs
      if (elapsed < 500) {
        return
      }
      const instantFps = (samplesInWindow * 1000) / elapsed
      emaFps = emaFps === 0 ? instantFps : emaFps * 0.9 + instantFps * 0.1
      samplesInWindow = 0
      sampleStartMs = now
      setPerf({ fps: Math.round(emaFps), detectMs: Math.round(emaDetectMs) })
    }

    const loop = () => {
      if (cancelled) {
        return
      }
      const video = videoRef.current
      const now = performance.now()

      if (now - lastRunAtMs >= minIntervalMs) {
        lastRunAtMs = now
        if (video && detector && video.readyState >= 2 && !video.paused && video.videoWidth > 0) {
          const startedAt = performance.now()
          const nextLandmarks = detectPose(detector, video, now)
          emaDetectMs =
            emaDetectMs === 0
              ? performance.now() - startedAt
              : emaDetectMs * 0.85 + (performance.now() - startedAt) * 0.15
          if (nextLandmarks !== null) {
            samplesInWindow += 1
            setLandmarks(nextLandmarks)
            onFrameRef.current?.(nextLandmarks)
          }
        }
        reportPerf(now)
      }
      rafId = requestAnimationFrame(loop)
    }

    void createPoseLandmarker()
      .then((next) => {
        if (cancelled) {
          disposePoseLandmarker(next)
          return
        }
        detector = next
        setStatus('ready')
        rafId = requestAnimationFrame(loop)
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(toMessage(caught))
          setStatus('error')
        }
      })

    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
      disposePoseLandmarker(detector)
      setLandmarks(null)
      setStatus('idle')
      setError(null)
    }
  }, [enabled, maxFps, videoRef])

  return {
    status,
    isLoading: enabled && status === 'idle',
    landmarks,
    error,
    perf,
  }
}
