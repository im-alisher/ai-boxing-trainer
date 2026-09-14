import { PunchDetector } from '@/game/punchDetector'
import { POSE_LANDMARK, VISIBILITY_THRESHOLD } from '@/types/pose'
import type { PoseLandmarkArray } from '@/types/pose'
import type { PunchEvent, PunchFrameData } from '@/types/punch'
import { distance } from '@/utils/geometry'

function isVisible(point: { visibility?: number }): boolean {
  return point.visibility === undefined || point.visibility >= VISIBILITY_THRESHOLD
}

export function extractPunchFrame(
  landmarks: PoseLandmarkArray,
  timestampMs: number,
): PunchFrameData | null {
  const leftShoulder = landmarks[POSE_LANDMARK.LEFT_SHOULDER]
  const rightShoulder = landmarks[POSE_LANDMARK.RIGHT_SHOULDER]
  const leftElbow = landmarks[POSE_LANDMARK.LEFT_ELBOW]
  const rightElbow = landmarks[POSE_LANDMARK.RIGHT_ELBOW]
  const leftWrist = landmarks[POSE_LANDMARK.LEFT_WRIST]
  const rightWrist = landmarks[POSE_LANDMARK.RIGHT_WRIST]

  if (
    leftShoulder === undefined ||
    rightShoulder === undefined ||
    leftElbow === undefined ||
    rightElbow === undefined ||
    leftWrist === undefined ||
    rightWrist === undefined
  ) {
    return null
  }

  if (
    !isVisible(leftWrist) ||
    !isVisible(rightWrist) ||
    !isVisible(leftShoulder) ||
    !isVisible(rightShoulder) ||
    !isVisible(leftElbow) ||
    !isVisible(rightElbow)
  ) {
    return null
  }

  const shoulderWidth = distance(leftShoulder, rightShoulder)
  if (shoulderWidth <= 0) {
    return null
  }

  return {
    timestampMs,
    shoulderWidth,
    leftShoulder,
    leftElbow,
    leftWrist,
    rightShoulder,
    rightElbow,
    rightWrist,
  }
}

export class PunchEngine {
  private readonly detector = new PunchDetector()

  process(landmarks: PoseLandmarkArray, timestampMs: number): PunchEvent[] {
    const frame = extractPunchFrame(landmarks, timestampMs)
    if (frame === null) {
      return []
    }
    return this.detector.update(frame)
  }

  reset(): void {
    this.detector.reset()
  }
}
