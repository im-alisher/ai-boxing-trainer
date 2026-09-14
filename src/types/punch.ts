import type { NormalizedLandmark } from '@mediapipe/tasks-vision'

export type PunchSide = 'left' | 'right'

export type PunchType = 'jab'

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
  radialSpeedThreshold: number
  retractRatio: number
  refractoryMs: number
  baselineAlpha: number
  guardSpeedThreshold: number
}
