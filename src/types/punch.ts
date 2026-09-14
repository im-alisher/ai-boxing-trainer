import type { NormalizedLandmark } from '@mediapipe/tasks-vision'

export type PunchSide = 'left' | 'right'

export type PunchType = 'jab' | 'hook' | 'uppercut'

export const PUNCH_TYPES: readonly PunchType[] = ['jab', 'hook', 'uppercut']

export interface PunchEvent {
  type: PunchType
  side: PunchSide
  speed: number
  timestampMs: number
}

export interface PunchFrameData {
  timestampMs: number
  shoulderWidth: number
  leftShoulder: NormalizedLandmark
  leftElbow: NormalizedLandmark
  leftWrist: NormalizedLandmark
  rightShoulder: NormalizedLandmark
  rightElbow: NormalizedLandmark
  rightWrist: NormalizedLandmark
}

export interface PunchDetectorOptions {
  extensionRatioThreshold: number
  jabRadialSpeedThreshold: number
  hookLateralSpeedThreshold: number
  hookMaxVerticalSpeed: number
  uppercutVerticalSpeedThreshold: number
  maxElbowAngleDeg: number
  minStraightElbowDeg: number
  hookMaxElbowAngleDeg: number
  retractRatio: number
  refractoryMs: number
  baselineAlpha: number
  guardSpeedThreshold: number
  metricAlpha: number
  maxSaneSpeed: number
  triggerSpeed: number
  endSpeed: number
  windowMaxMs: number
  retractVelocityLimit: number
}
