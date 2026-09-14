import { PunchMetricsTracker, type PunchMetricsSnapshot } from '@/game/metricsTracker'
import type { PunchCounts, PunchTypeTotals } from '@/game/metricsTracker'
import type { PunchEvent } from '@/types/punch'

export type WorkoutState = 'idle' | 'running' | 'paused' | 'finished'

export interface WorkoutSummary {
  id: string
  startedAtMs: number
  durationMs: number
  totalPunches: number
  totalsByType: PunchTypeTotals
  totalsBySide: PunchCounts
  avgSpeed: number | null
  peakSpeed: number | null
  longestCombo: number
}

export interface WorkoutSnapshot {
  state: WorkoutState
  startedAtMs: number | null
  elapsedMs: number
  metrics: PunchMetricsSnapshot
  lastSummary: WorkoutSummary | null
}

export function createWorkoutId(nowMs: number): string {
  return `${nowMs.toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export class WorkoutManager {
  private state: WorkoutState = 'idle'
  private startedAtMs: number | null = null
  private accumulatedMs = 0
  private lastResumedAtMs: number | null = null
  private tracker = new PunchMetricsTracker()
  private lastSummary: WorkoutSummary | null = null

  getState(snapshot: PunchMetricsSnapshot): WorkoutSnapshot {
    return {
      state: this.state,
      startedAtMs: this.startedAtMs,
      elapsedMs: this.effectiveElapsed(),
      metrics: snapshot,
      lastSummary: this.lastSummary,
    }
  }

  getMetricsSnapshot(): PunchMetricsSnapshot {
    return this.tracker.snapshot()
  }

  private effectiveElapsed(): number {
    if (this.state === 'running' && this.lastResumedAtMs !== null && this.startedAtMs !== null) {
      return this.accumulatedMs + (this.getNow() - this.lastResumedAtMs)
    }
    return this.accumulatedMs
  }

  begin(): void {
    this.resetSession()
    this.state = 'running'
    this.startedAtMs = this.getNow()
    this.lastResumedAtMs = this.startedAtMs
    this.tracker = new PunchMetricsTracker()
  }

  pause(): void {
    if (this.state !== 'running') {
      return
    }
    this.accumulatedMs = this.effectiveElapsed()
    this.state = 'paused'
    this.lastResumedAtMs = null
  }

  resume(): void {
    if (this.state !== 'paused') {
      return
    }
    this.lastResumedAtMs = this.getNow()
    this.state = 'running'
  }

  finish(): WorkoutSummary | null {
    if (this.state === 'idle' || this.state === 'finished') {
      return null
    }
    if (this.state === 'running') {
      this.pause()
    }
    const metrics = this.tracker.snapshot()
    const summary: WorkoutSummary = {
      id: createWorkoutId(this.startedAtMs ?? 0),
      startedAtMs: this.startedAtMs ?? 0,
      durationMs: this.accumulatedMs,
      totalPunches: metrics.totalCount,
      totalsByType: metrics.totalsByType,
      totalsBySide: metrics.totalsBySide,
      avgSpeed: metrics.avgSpeed,
      peakSpeed: metrics.peakSpeed,
      longestCombo: metrics.longestCombo,
    }
    this.state = 'finished'
    this.lastSummary = summary
    return summary
  }

  feed(event: PunchEvent): void {
    if (this.state !== 'running') {
      return
    }
    this.tracker.feed(event)
  }

  private resetSession(): void {
    this.state = 'idle'
    this.startedAtMs = null
    this.accumulatedMs = 0
    this.lastResumedAtMs = null
    this.tracker = new PunchMetricsTracker()
    this.lastSummary = null
  }

  private getNow(): number {
    return globalThis.performance?.now() ?? Date.now()
  }
}
