import type { NormalizedLandmark } from '@mediapipe/tasks-vision'
import type {
  PunchDetectorOptions,
  PunchEvent,
  PunchFrameData,
  PunchSide,
  PunchType,
} from '@/types/punch'
import { angleDegrees, distance3, moveTowards } from '@/utils/geometry'

export const DEFAULT_PUNCH_DETECTOR_OPTIONS: PunchDetectorOptions = {
  extensionRatioThreshold: 1.25,
  jabRadialSpeedThreshold: 1.6,
  hookLateralSpeedThreshold: 2.2,
  hookMaxVerticalSpeed: 1.5,
  uppercutVerticalSpeedThreshold: 1.8,
  maxElbowAngleDeg: 150,
  minStraightElbowDeg: 150,
  hookMaxElbowAngleDeg: 150,
  retractRatio: 1.08,
  refractoryMs: 300,
  baselineAlpha: 0.05,
  guardSpeedThreshold: 1.5,
  metricAlpha: 0.35,
  maxSaneSpeed: 15,
  triggerSpeed: 2.0,
  endSpeed: 0.9,
  windowMaxMs: 350,
  retractVelocityLimit: 1.0,
}

interface SmoothedMetrics {
  reachRatio: number
  radialVel: number
  lateralVel: number
  verticalVel: number
  totalSpeed: number
}

interface DetectionWindow {
  openedAtMs: number
  maxElbowAngle: number
  maxRadialVel: number
  maxLateralVel: number
  maxVerticalVel: number
  maxTotalSpeed: number
}

interface ArmState {
  baselineReach: number | null
  prevReach: number | null
  prevWrist: { x: number; y: number } | null
  prevTimeMs: number | null
  metrics: SmoothedMetrics | null
  window: DetectionWindow | null
  armed: boolean
  lastPunchAtMs: number | null
}

function createArmState(): ArmState {
  return {
    baselineReach: null,
    prevReach: null,
    prevWrist: null,
    prevTimeMs: null,
    metrics: null,
    window: null,
    armed: true,
    lastPunchAtMs: null,
  }
}

interface FrameSide {
  shoulder: NormalizedLandmark
  elbow: NormalizedLandmark
  wrist: NormalizedLandmark
}

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

    const sides: Record<PunchSide, { state: ArmState; data: FrameSide }> = {
      left: {
        state: this.left,
        data: {
          shoulder: frame.leftShoulder,
          elbow: frame.leftElbow,
          wrist: frame.leftWrist,
        },
      },
      right: {
        state: this.right,
        data: {
          shoulder: frame.rightShoulder,
          elbow: frame.rightElbow,
          wrist: frame.rightWrist,
        },
      },
    }

    for (const side of ['left', 'right'] as const) {
      const { state, data } = sides[side]
      const event = this.updateArm(state, data, frame.shoulderWidth, frame.timestampMs, side)
      if (event !== null) {
        events.push(event)
      }
    }

    return events
  }

  private updateArm(
    state: ArmState,
    data: FrameSide,
    shoulderWidth: number,
    timestampMs: number,
    side: PunchSide,
  ): PunchEvent | null {
    const reach = distance3(data.wrist, data.shoulder)
    const elbowAngle = angleDegrees(data.wrist, data.elbow, data.shoulder)

    if (state.prevTimeMs === null || state.prevReach === null || state.prevWrist === null) {
      state.baselineReach = reach
      state.prevReach = reach
      state.prevWrist = { x: data.wrist.x, y: data.wrist.y }
      state.prevTimeMs = timestampMs
      state.metrics = this.initialMetrics()
      return null
    }

    if (timestampMs <= state.prevTimeMs) {
      return null
    }

    const dtSec = (timestampMs - state.prevTimeMs) / 1000

    const velX = (data.wrist.x - state.prevWrist.x) / shoulderWidth / dtSec
    const velY = (data.wrist.y - state.prevWrist.y) / shoulderWidth / dtSec
    const radialVel = (reach - state.prevReach) / shoulderWidth / dtSec
    const lateralVel = Math.abs(velX)
    const verticalVel = -velY
    const totalSpeed = Math.sqrt(velX * velX + velY * velY)

    if (totalSpeed > this.options.maxSaneSpeed) {
      state.prevReach = reach
      state.prevWrist = { x: data.wrist.x, y: data.wrist.y }
      state.prevTimeMs = timestampMs
      return null
    }

    const baseline = state.baselineReach ?? reach
    const reachRatio = baseline > 0 ? reach / baseline : 1

    const previous = state.metrics ?? this.initialMetrics()
    const alpha = this.options.metricAlpha
    const metrics: SmoothedMetrics = {
      reachRatio: previous.reachRatio + (reachRatio - previous.reachRatio) * alpha,
      radialVel: previous.radialVel + (radialVel - previous.radialVel) * alpha,
      lateralVel: previous.lateralVel + (lateralVel - previous.lateralVel) * alpha,
      verticalVel: previous.verticalVel + (verticalVel - previous.verticalVel) * alpha,
      totalSpeed: previous.totalSpeed + (totalSpeed - previous.totalSpeed) * alpha,
    }

    const extended = metrics.reachRatio > this.options.extensionRatioThreshold

    if (totalSpeed < this.options.guardSpeedThreshold && !extended) {
      state.baselineReach = moveTowards(baseline, reach, this.options.baselineAlpha)
    }

    let emitted: PunchEvent | null = null

    if (state.window === null) {
      if (!state.armed && state.lastPunchAtMs !== null) {
        const cooledDown = timestampMs - state.lastPunchAtMs >= this.options.refractoryMs
        if (
          cooledDown &&
          metrics.reachRatio < this.options.retractRatio &&
          metrics.totalSpeed < this.options.triggerSpeed
        ) {
          state.armed = true
        }
      }

      if (
        state.armed &&
        metrics.totalSpeed > this.options.triggerSpeed &&
        radialVel > -this.options.retractVelocityLimit
      ) {
        state.window = this.openWindow(timestampMs, metrics, elbowAngle)
      }
    } else {
      const window = state.window
      window.maxElbowAngle = Math.max(window.maxElbowAngle, elbowAngle)
      window.maxRadialVel = Math.max(window.maxRadialVel, metrics.radialVel)
      window.maxLateralVel = Math.max(window.maxLateralVel, metrics.lateralVel)
      window.maxVerticalVel = Math.max(window.maxVerticalVel, metrics.verticalVel)
      window.maxTotalSpeed = Math.max(window.maxTotalSpeed, metrics.totalSpeed)

      const endReached =
        metrics.totalSpeed < this.options.endSpeed ||
        timestampMs - window.openedAtMs >= this.options.windowMaxMs

      if (endReached) {
        state.window = null
        const event = this.classifyWindow(window, timestampMs, side)
        if (event !== null) {
          emitted = event
          state.armed = false
          state.lastPunchAtMs = timestampMs
        }
      }
    }

    state.metrics = metrics
    state.prevReach = reach
    state.prevWrist = { x: data.wrist.x, y: data.wrist.y }
    state.prevTimeMs = timestampMs

    return emitted
  }

  private openWindow(
    openedAtMs: number,
    metrics: SmoothedMetrics,
    elbowAngle: number,
  ): DetectionWindow {
    return {
      openedAtMs,
      maxElbowAngle: elbowAngle,
      maxRadialVel: metrics.radialVel,
      maxLateralVel: metrics.lateralVel,
      maxVerticalVel: metrics.verticalVel,
      maxTotalSpeed: metrics.totalSpeed,
    }
  }

  private classifyWindow(
    window: DetectionWindow,
    timestampMs: number,
    side: PunchSide,
  ): PunchEvent | null {
    const { maxElbowAngle, maxRadialVel, maxLateralVel, maxVerticalVel } = window

    if (
      maxElbowAngle >= this.options.minStraightElbowDeg &&
      maxRadialVel > this.options.jabRadialSpeedThreshold
    ) {
      return this.emit('jab', window.maxTotalSpeed, timestampMs, side)
    }

    if (
      maxVerticalVel > this.options.uppercutVerticalSpeedThreshold &&
      maxVerticalVel > maxLateralVel * 1.1 &&
      maxElbowAngle < this.options.maxElbowAngleDeg
    ) {
      return this.emit('uppercut', window.maxTotalSpeed, timestampMs, side)
    }

    if (
      maxLateralVel > this.options.hookLateralSpeedThreshold &&
      maxLateralVel > maxRadialVel * 1.2 &&
      maxLateralVel > maxVerticalVel * 1.3 &&
      maxVerticalVel < this.options.hookMaxVerticalSpeed &&
      maxElbowAngle < this.options.hookMaxElbowAngleDeg
    ) {
      return this.emit('hook', window.maxTotalSpeed, timestampMs, side)
    }

    return null
  }

  private emit(type: PunchType, speed: number, timestampMs: number, side: PunchSide): PunchEvent {
    return { type, side, speed, timestampMs }
  }

  private initialMetrics(): SmoothedMetrics {
    return {
      reachRatio: 1,
      radialVel: 0,
      lateralVel: 0,
      verticalVel: 0,
      totalSpeed: 0,
    }
  }

  reset(): void {
    Object.assign(this.left, createArmState())
    Object.assign(this.right, createArmState())
  }
}
