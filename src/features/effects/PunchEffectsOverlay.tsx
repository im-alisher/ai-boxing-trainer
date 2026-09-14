import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { IMPACT_LIFETIME_MS } from '@/features/effects/usePunchEffects'
import type { ImpactSeed } from '@/features/effects/usePunchEffects'
import { createCoverMapper } from '@/features/pose/drawPose'
import type { PunchType } from '@/types/punch'

export interface PunchEffectsOverlayProps {
  impacts: ImpactSeed[]
  videoRef: RefObject<HTMLVideoElement | null>
  mirror?: boolean
  className?: string
}

const TYPE_COLOR: Record<PunchType, string> = {
  jab: '#fbbf24',
  hook: '#34d399',
  uppercut: '#a78bfa',
}

interface CanvasSize {
  width: number
  height: number
}

export function PunchEffectsOverlay({
  impacts,
  videoRef,
  mirror = true,
  className = '',
}: PunchEffectsOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const impactsRef = useRef(impacts)
  const [size, setSize] = useState<CanvasSize>({ width: 0, height: 0 })

  useEffect(() => {
    impactsRef.current = impacts
  }, [impacts])

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
    if (!canvas || size.width === 0 || size.height === 0) {
      return
    }
    canvas.width = size.width
    canvas.height = size.height
  }, [size])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) {
      return
    }

    let animationFrameId = 0

    const render = () => {
      animationFrameId = requestAnimationFrame(render)
      const width = canvas.width
      const height = canvas.height
      ctx.clearRect(0, 0, width, height)

      const video = videoRef.current
      if (
        width === 0 ||
        height === 0 ||
        impactsRef.current.length === 0 ||
        !video ||
        video.videoWidth === 0 ||
        video.videoHeight === 0
      ) {
        return
      }

      const mapper = createCoverMapper(width, height, video.videoWidth, video.videoHeight)
      const now = performance.now()

      for (const seed of impactsRef.current) {
        const age = now - seed.id
        if (age < 0 || age > IMPACT_LIFETIME_MS) {
          continue
        }
        const progress = age / IMPACT_LIFETIME_MS
        const centerX = mapper.toCanvasX(mirror ? 1 - seed.frameX : seed.frameX)
        const centerY = mapper.toCanvasY(seed.frameY)
        const baseRadius = Math.max(6, mapper.scale * 0.05)
        const ringRadius = baseRadius + progress * 110

        ctx.save()
        ctx.globalAlpha = 1 - progress

        ctx.strokeStyle = TYPE_COLOR[seed.type]
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2)
        ctx.stroke()

        ctx.fillStyle = TYPE_COLOR[seed.type]
        ctx.globalAlpha = (1 - progress) * 0.18
        ctx.beginPath()
        ctx.arc(centerX, centerY, ringRadius * 0.7, 0, Math.PI * 2)
        ctx.fill()

        ctx.globalAlpha = (1 - progress) * 0.9
        ctx.strokeStyle = TYPE_COLOR[seed.type]
        ctx.lineWidth = 2.5
        for (let i = 0; i < 10; i += 1) {
          const angle = (Math.PI * 2 * i) / 10 + progress * 0.6
          const inner = ringRadius * 0.35 + progress * 30
          const outer = inner + 26
          ctx.beginPath()
          ctx.moveTo(centerX + Math.cos(angle) * inner, centerY + Math.sin(angle) * inner)
          ctx.lineTo(centerX + Math.cos(angle) * outer, centerY + Math.sin(angle) * outer)
          ctx.stroke()
        }

        ctx.restore()
      }
    }

    animationFrameId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animationFrameId)
  }, [videoRef])

  return <canvas ref={canvasRef} className={`pointer-events-none ${className}`} />
}
