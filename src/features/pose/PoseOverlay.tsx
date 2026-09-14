import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { createCoverMapper, drawPoseSkeleton } from '@/features/pose/drawPose'
import type { PoseLandmarkArray } from '@/types/pose'

export interface PoseOverlayProps {
  landmarks: PoseLandmarkArray | null
  videoRef: RefObject<HTMLVideoElement | null>
  mirror?: boolean
  className?: string
}

interface CanvasSize {
  width: number
  height: number
}

export function PoseOverlay({
  landmarks,
  videoRef,
  mirror = true,
  className = '',
}: PoseOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [size, setSize] = useState<CanvasSize>({ width: 0, height: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    const updateSize = () => {
      setSize({
        width: canvas.clientWidth,
        height: canvas.clientHeight,
      })
    }
    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || size.width === 0 || size.height === 0) {
      return
    }

    canvas.width = size.width
    canvas.height = size.height
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const video = videoRef.current
    if (!landmarks || !video || video.videoWidth === 0 || video.videoHeight === 0) {
      return
    }

    const mapper = createCoverMapper(size.width, size.height, video.videoWidth, video.videoHeight)
    drawPoseSkeleton(ctx, landmarks, mapper, mirror)
  }, [landmarks, mirror, size, videoRef])

  return <canvas ref={canvasRef} className={`pointer-events-none ${className}`} />
}
