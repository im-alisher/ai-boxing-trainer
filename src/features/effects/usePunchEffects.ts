import { useCallback, useState } from 'react'
import { POSE_LANDMARK } from '@/types/pose'
import type { PoseLandmarkArray } from '@/types/pose'
import type { PunchSide, PunchType } from '@/types/punch'

export interface ImpactSeed {
  id: number
  type: PunchType
  side: PunchSide
  frameX: number
  frameY: number
}

export const IMPACT_LIFETIME_MS = 600
export const MAX_IMPACTS = 8

export interface UsePunchEffectsResult {
  impacts: ImpactSeed[]
  register: (side: PunchSide, type: PunchType, landmarks: PoseLandmarkArray | null) => void
  clear: () => void
}

export function usePunchEffects(): UsePunchEffectsResult {
  const [impacts, setImpacts] = useState<ImpactSeed[]>([])

  const register = useCallback(
    (side: PunchSide, type: PunchType, landmarks: PoseLandmarkArray | null) => {
      const now = performance.now()
      let frameX = 0.5
      let frameY = 0.5
      const wrist =
        landmarks !== null
          ? landmarks[side === 'left' ? POSE_LANDMARK.LEFT_WRIST : POSE_LANDMARK.RIGHT_WRIST]
          : undefined
      if (wrist !== undefined) {
        frameX = wrist.x
        frameY = wrist.y
      }

      setImpacts((current) => {
        const cutoff = now - IMPACT_LIFETIME_MS
        const live = current.filter((seed) => seed.id >= cutoff)
        return [...live, { id: now, type, side, frameX, frameY }].slice(-MAX_IMPACTS)
      })
    },
    [],
  )

  const clear = useCallback(() => {
    setImpacts([])
  }, [])

  return { impacts, register, clear }
}
