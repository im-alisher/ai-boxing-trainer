import { useCallback, useEffect, useRef, useState } from 'react'
import {
  EMPTY_METRICS,
  PunchMetricsTracker,
  type PunchMetricsSnapshot,
} from '@/game/metricsTracker'
import type { PunchEvent } from '@/types/punch'

export interface UsePunchMetricsOptions {
  enabled?: boolean
}

export interface UsePunchMetricsResult {
  metrics: PunchMetricsSnapshot
  feed: (event: PunchEvent) => void
  reset: () => void
}

export function usePunchMetrics({
  enabled = true,
}: UsePunchMetricsOptions = {}): UsePunchMetricsResult {
  const trackerRef = useRef<PunchMetricsTracker | null>(null)
  const enabledRef = useRef(enabled)
  const [metrics, setMetrics] = useState<PunchMetricsSnapshot>(EMPTY_METRICS)

  useEffect(() => {
    enabledRef.current = enabled
  }, [enabled])

  const getTracker = useCallback((): PunchMetricsTracker => {
    if (trackerRef.current === null) {
      trackerRef.current = new PunchMetricsTracker()
    }
    return trackerRef.current
  }, [])

  const feed = useCallback(
    (event: PunchEvent) => {
      if (!enabledRef.current) {
        return
      }
      setMetrics(getTracker().feed(event))
    },
    [getTracker],
  )

  const reset = useCallback(() => {
    if (trackerRef.current === null) {
      return
    }
    setMetrics(trackerRef.current.reset())
  }, [])

  return { metrics, feed, reset }
}
