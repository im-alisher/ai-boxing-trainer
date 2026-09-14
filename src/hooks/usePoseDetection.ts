import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import {
  createPoseLandmarker,
  detectPose,
  disposePoseLandmarker,
} from '@/services/poseDetectorService'
import type { PoseDetectorStatus, PoseLandmarkArray } from '@/types/pose'

export interface UsePoseDetectionOptions {
  videoRef: RefObject<HTMLVideoElement | null>
  enabled?: boolean
  onFrame?: (landmarks: PoseLandmarkArray | null) => void
}

export interface UsePoseDetectionResult {
  status: PoseDetectorStatus
  isLoading: boolean
  landmarks: PoseLandmarkArray | null
  error: string | null
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unable to initialize pose detection.'
}

export function usePoseDetection({
  videoRef,
  enabled = false,
  onFrame,
}: UsePoseDetectionOptions): UsePoseDetectionResult {
  const [status, setStatus] = useState<PoseDetectorStatus>('idle')
  const [landmarks, setLandmarks] = useState<PoseLandmarkArray | null>(null)
  const [error, setError] = useState<string | null>(null)

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

    const loop = () => {
      if (cancelled) {
        return
      }
      const video = videoRef.current
      if (video && detector && video.readyState >= 2 && !video.paused && video.videoWidth > 0) {
        const nextLandmarks = detectPose(detector, video, performance.now())
        if (nextLandmarks !== null) {
          setLandmarks(nextLandmarks)
          onFrameRef.current?.(nextLandmarks)
        }
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
  }, [enabled, videoRef])

  return {
    status,
    isLoading: enabled && status === 'idle',
    landmarks,
    error,
  }
}
