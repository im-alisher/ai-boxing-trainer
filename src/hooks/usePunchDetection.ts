import { useCallback, useEffect, useRef, useState } from 'react'
import { PunchEngine } from '@/game/punchEngine'
import type { PoseLandmarkArray } from '@/types/pose'
import type { PunchEvent } from '@/types/punch'

export interface UsePunchDetectionOptions {
  enabled?: boolean
  maxHistory?: number
  onPunch?: (event: PunchEvent) => void
}

export interface UsePunchDetectionResult {
  punches: PunchEvent[]
  lastPunch: PunchEvent | null
  registerFrame: (landmarks: PoseLandmarkArray | null, timestampMs: number) => void
  reset: () => void
}

export function usePunchDetection({
  enabled = false,
  maxHistory = 12,
  onPunch,
}: UsePunchDetectionOptions = {}): UsePunchDetectionResult {
  const engineRef = useRef<PunchEngine | null>(null)
  const enabledRef = useRef(enabled)
  const onPunchRef = useRef(onPunch)

  const [punches, setPunches] = useState<PunchEvent[]>([])

  useEffect(() => {
    enabledRef.current = enabled
  }, [enabled])

  useEffect(() => {
    onPunchRef.current = onPunch
  }, [onPunch])

  const getEngine = useCallback((): PunchEngine => {
    if (engineRef.current === null) {
      engineRef.current = new PunchEngine()
    }
    return engineRef.current
  }, [])

  useEffect(() => {
    if (enabled) {
      getEngine().reset()
    }
  }, [enabled, getEngine])

  const registerFrame = useCallback(
    (landmarks: PoseLandmarkArray | null, timestampMs: number) => {
      if (!enabledRef.current || landmarks === null) {
        return
      }
      const events = getEngine().process(landmarks, timestampMs)
      if (events.length === 0) {
        return
      }
      setPunches((current) => {
        const entries = [...current]
        for (const event of events) {
          entries.unshift(event)
        }
        return entries.slice(0, maxHistory)
      })
      for (const event of events) {
        onPunchRef.current?.(event)
      }
    },
    [getEngine, maxHistory],
  )

  const reset = useCallback(() => {
    getEngine().reset()
    setPunches([])
  }, [getEngine])

  return {
    punches,
    lastPunch: punches[0] ?? null,
    registerFrame,
    reset,
  }
}
