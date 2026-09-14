import type { PunchDetectorOptions, PunchEvent, PunchFrameData, PunchSide } from '@/types/punch'
import { distance, moveTowards } from '@/utils/geometry'

export const DEFAULT_PUNCH_DETECTOR_OPTIONS: PunchDetectorOptions = {
  extensionRatioThreshold: 1.3,
  radialSpeedThreshold: 2.0,
  retractRatio: 1.08,
  refractoryMs: 300,
  baselineAlpha: 0.05,
  guardSpeedThreshold: 1.5,
}

interface ArmState {
  baselineReach: number | null
  prevReach: number | null
  prevWrist: { x: number; y: number } | null
  prevTimeMs: number | null
  armed: boolean
  lastPunchAtMs: number | null
}

function createArmState(): ArmState {
  return {
    baselineReach: null,
    prevReach: null,
    prevWrist: null,
    prevTimeMs: null,
    armed: true,
    lastPunchAtMs: null,
  }
}

interface SideData {
  shoulder: PunchFrameData['leftShoulder']
  wrist: PunchFrameData['leftWrist']
}

type SideKey = 'left' | 'right'

export class PunchDetector {
  private readonly options: PunchDetectorOptions
  private readonly left: ArmState
  private readonly right: ArmState

  constructor(options?: Partial<PunchDetectorOptions>) {
    this.options = { ...DEFAULT_PUNCH_DETECTOR_OPTIONS, ...options }
    this.left = createArmState()
    this.right = createArmState()
  }

  update(frame: PunchFrameData): PunchEvent[] {
    const events: PunchEvent[] = []

    const sides: Record<SideKey, SideData> = {
      left: { shoulder: frame.leftShoulder, wrist: frame.leftWrist },
      right: { shoulder: frame.rightShoulder, wrist: frame.rightWrist },
    }

    for (const side of ['left', 'right'] as const) {
      const data = sides[side]
      const state = side === 'left' ? this.left : this.right
      const event = this.updateArm(
        state,
        data.wrist,
        data.shoulder,
        frame.shoulderWidth,
        frame.timestampMs,
        side,
      )
      if (event !== null) {
        events.push(event)
      }
    }

    return events
  }

  private updateArm(
    state: ArmState,
    wrist: { x: number; y: number },
    shoulder: { x: number; y: number },
    shoulderWidth: number,
    timestampMs: number,
    side: PunchSide,
  ): PunchEvent | null {
    const reach = distance(wrist, shoulder)

    if (state.prevTimeMs === null || state.prevReach === null) {
      state.baselineReach = reach
      state.prevReach = reach
      state.prevWrist = { x: wrist.x, y: wrist.y }
      state.prevTimeMs = timestampMs
      return null
    }

    if (timestampMs <= state.prevTimeMs) {
      return null
    }

    const dtSec = (timestampMs - state.prevTimeMs) / 1000
    const radialSpeed = (reach - state.prevReach) / shoulderWidth / dtSec

    const wristSpeed =
      state.prevWrist === null ? 0 : distance(wrist, state.prevWrist) / shoulderWidth / dtSec

    const baseline = state.baselineReach ?? reach

    const extensionRatio = baseline > 0 ? reach / baseline : 1

    const extended = extensionRatio > this.options.extensionRatioThreshold

    if (wristSpeed < this.options.guardSpeedThreshold && !extended) {
      state.baselineReach = moveTowards(baseline, reach, this.options.baselineAlpha)
    }

    let emitted: PunchEvent | null = null

    if (state.armed && extended && radialSpeed > this.options.radialSpeedThreshold) {
      emitted = {
        type: 'jab',
        side,
        speed: radialSpeed,
        timestampMs,
      }
      state.armed = false
      state.lastPunchAtMs = timestampMs
    } else if (!state.armed && state.lastPunchAtMs !== null) {
      const cooledDown = timestampMs - state.lastPunchAtMs >= this.options.refractoryMs
      if (cooledDown && extensionRatio < this.options.retractRatio) {
        state.armed = true
      }
    }

    state.prevReach = reach
    state.prevWrist = { x: wrist.x, y: wrist.y }
    state.prevTimeMs = timestampMs

    return emitted
  }

  reset(): void {
    Object.assign(this.left, createArmState())
    Object.assign(this.right, createArmState())
  }
}
