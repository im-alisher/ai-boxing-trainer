import type { PunchEvent, PunchSide, PunchType } from '@/types/punch'

export interface PunchCounts {
  left: number
  right: number
}

export interface PunchTypeTotals {
  jab: number
  hook: number
  uppercut: number
}

export interface PunchMetricsSnapshot {
  totalCount: number
  totalsBySide: PunchCounts
  totalsByType: PunchTypeTotals
  lastPunchType: PunchType | null
  lastPunchSide: PunchSide | null
  lastSpeed: number | null
  peakSpeed: number | null
  currentCombo: number
  longestCombo: number
  punchesPerMinute: number
}

export const PUNCHES_PER_MINUTE_WINDOW_MS = 60_000
export const COMBO_GAP_MS = 2_000

export const EMPTY_METRICS: PunchMetricsSnapshot = {
  totalCount: 0,
  totalsBySide: { left: 0, right: 0 },
  totalsByType: { jab: 0, hook: 0, uppercut: 0 },
  lastPunchType: null,
  lastPunchSide: null,
  lastSpeed: null,
  peakSpeed: null,
  currentCombo: 0,
  longestCombo: 0,
  punchesPerMinute: 0,
}

export interface PunchMetricsTrackerOptions {
  windowMs?: number
  comboGapMs?: number
}

export class PunchMetricsTracker {
  private readonly windowMs: number
  private readonly comboGapMs: number

  private totalCount = 0
  private readonly totalsBySide: PunchCounts = { left: 0, right: 0 }
  private readonly totalsByType: PunchTypeTotals = { jab: 0, hook: 0, uppercut: 0 }
  private lastPunchType: PunchType | null = null
  private lastPunchSide: PunchSide | null = null
  private lastSpeed: number | null = null
  private peakSpeed: number | null = null
  private currentCombo = 0
  private longestCombo = 0
  private lastPunchAtMs: number | null = null
  private recentTimestamps: number[] = []

  constructor(options: PunchMetricsTrackerOptions = {}) {
    this.windowMs = options.windowMs ?? PUNCHES_PER_MINUTE_WINDOW_MS
    this.comboGapMs = options.comboGapMs ?? COMBO_GAP_MS
  }

  feed(event: PunchEvent): PunchMetricsSnapshot {
    this.totalCount += 1
    this.totalsBySide[event.side] += 1
    this.totalsByType[event.type] += 1
    this.lastPunchType = event.type
    this.lastPunchSide = event.side
    this.lastSpeed = event.speed
    this.peakSpeed = this.peakSpeed === null ? event.speed : Math.max(this.peakSpeed, event.speed)

    const gap =
      this.lastPunchAtMs === null ? this.comboGapMs + 1 : event.timestampMs - this.lastPunchAtMs
    this.lastPunchAtMs = event.timestampMs
    this.currentCombo = gap <= this.comboGapMs ? this.currentCombo + 1 : 1
    if (this.currentCombo > this.longestCombo) {
      this.longestCombo = this.currentCombo
    }

    this.recentTimestamps.push(event.timestampMs)
    const cutoff = event.timestampMs - this.windowMs
    this.recentTimestamps = this.recentTimestamps.filter((t) => t > cutoff)
    this.punchesPerMinute = this.ratePerMinute(event.timestampMs)

    return this.snapshot()
  }

  private ratePerMinute(nowMs: number): number {
    const count = this.recentTimestamps.length
    if (count === 0) {
      return 0
    }
    const oldest = this.recentTimestamps[0] ?? nowMs
    const spanMs = Math.max(nowMs - oldest, 1_000)
    return Math.round((count / spanMs) * 60_000)
  }

  private punchesPerMinute = 0

  snapshot(): PunchMetricsSnapshot {
    return {
      totalCount: this.totalCount,
      totalsBySide: { ...this.totalsBySide },
      totalsByType: { ...this.totalsByType },
      lastPunchType: this.lastPunchType,
      lastPunchSide: this.lastPunchSide,
      lastSpeed: this.lastSpeed,
      peakSpeed: this.peakSpeed,
      currentCombo: this.currentCombo,
      longestCombo: this.longestCombo,
      punchesPerMinute: this.punchesPerMinute,
    }
  }

  reset(): PunchMetricsSnapshot {
    this.totalCount = 0
    this.totalsBySide.left = 0
    this.totalsBySide.right = 0
    this.totalsByType.jab = 0
    this.totalsByType.hook = 0
    this.totalsByType.uppercut = 0
    this.lastPunchType = null
    this.lastPunchSide = null
    this.lastSpeed = null
    this.peakSpeed = null
    this.currentCombo = 0
    this.longestCombo = 0
    this.lastPunchAtMs = null
    this.recentTimestamps = []
    this.punchesPerMinute = 0
    return this.snapshot()
  }
}
