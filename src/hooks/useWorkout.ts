import { useCallback, useEffect, useRef, useState } from 'react'
import { WorkoutManager, type WorkoutSnapshot, type WorkoutSummary } from '@/game/workoutSession'
import { EMPTY_METRICS } from '@/game/metricsTracker'
import type { PunchEvent } from '@/types/punch'
import { loadWorkoutHistory, saveWorkoutHistory, WORKOUT_HISTORY_LIMIT } from '@/utils/storage'

export interface UseWorkoutResult {
  workout: WorkoutSnapshot
  history: WorkoutSummary[]
  begin: () => void
  pause: () => void
  resume: () => void
  finish: () => void
  feed: (event: PunchEvent) => void
  clearHistory: () => void
}

function createInitialWorkoutSnapshot(): WorkoutSnapshot {
  return {
    state: 'idle',
    startedAtMs: null,
    elapsedMs: 0,
    metrics: EMPTY_METRICS,
    lastSummary: null,
  }
}

export function useWorkout(): UseWorkoutResult {
  const managerRef = useRef<WorkoutManager | null>(null)
  const [workout, setWorkout] = useState<WorkoutSnapshot>(createInitialWorkoutSnapshot)
  const [history, setHistory] = useState<WorkoutSummary[]>(() =>
    loadWorkoutHistory<WorkoutSummary>(),
  )

  const getManager = useCallback((): WorkoutManager => {
    if (managerRef.current === null) {
      managerRef.current = new WorkoutManager()
    }
    return managerRef.current
  }, [])

  const refresh = useCallback(() => {
    const manager = getManager()
    setWorkout(manager.getState(manager.getMetricsSnapshot()))
  }, [getManager])

  const mode = workout.state

  useEffect(() => {
    if (mode !== 'running') {
      return
    }
    const intervalId = window.setInterval(refresh, 250)
    return () => window.clearInterval(intervalId)
  }, [mode, refresh])

  useEffect(() => {
    saveWorkoutHistory(history)
  }, [history])

  const begin = useCallback(() => {
    getManager().begin()
    refresh()
  }, [getManager, refresh])

  const pause = useCallback(() => {
    getManager().pause()
    refresh()
  }, [getManager, refresh])

  const resume = useCallback(() => {
    getManager().resume()
    refresh()
  }, [getManager, refresh])

  const finish = useCallback(() => {
    const summary = getManager().finish()
    if (summary === null) {
      return
    }
    setHistory((current) =>
      current.some((entry) => entry.id === summary.id)
        ? current
        : [summary, ...current].slice(0, WORKOUT_HISTORY_LIMIT),
    )
    refresh()
  }, [getManager, refresh])

  const feed = useCallback(
    (event: PunchEvent) => {
      getManager().feed(event)
    },
    [getManager],
  )

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  return {
    workout,
    history,
    begin,
    pause,
    resume,
    finish,
    feed,
    clearHistory,
  }
}
