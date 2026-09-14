import { POSE_CONNECTIONS, POSE_LANDMARK, VISIBILITY_THRESHOLD } from '@/types/pose'
import type { PoseLandmarkArray } from '@/types/pose'

export interface LandmarkMapper {
  scale: number
  toCanvasX: (frameX: number) => number
  toCanvasY: (frameY: number) => number
}

export function createCoverMapper(
  canvasWidth: number,
  canvasHeight: number,
  frameWidth: number,
  frameHeight: number,
): LandmarkMapper {
  const scale = Math.max(canvasWidth / frameWidth, canvasHeight / frameHeight)
  const offsetX = (canvasWidth - frameWidth * scale) / 2
  const offsetY = (canvasHeight - frameHeight * scale) / 2

  return {
    scale,
    toCanvasX: (frameX) => offsetX + frameX * frameWidth * scale,
    toCanvasY: (frameY) => offsetY + frameY * frameHeight * scale,
  }
}

const LEFT_JOINT_COLOR = '#ef4444'
const RIGHT_JOINT_COLOR = '#3b82f6'
const NEUTRAL_COLOR = '#a1a1aa'

const LEFT_SIDE_INDICES = new Set<number>([
  POSE_LANDMARK.LEFT_SHOULDER,
  POSE_LANDMARK.LEFT_ELBOW,
  POSE_LANDMARK.LEFT_WRIST,
  POSE_LANDMARK.LEFT_HIP,
  POSE_LANDMARK.LEFT_KNEE,
  POSE_LANDMARK.LEFT_ANKLE,
])

const RIGHT_SIDE_INDICES = new Set<number>([
  POSE_LANDMARK.RIGHT_SHOULDER,
  POSE_LANDMARK.RIGHT_ELBOW,
  POSE_LANDMARK.RIGHT_WRIST,
  POSE_LANDMARK.RIGHT_HIP,
  POSE_LANDMARK.RIGHT_KNEE,
  POSE_LANDMARK.RIGHT_ANKLE,
])

function isVisible(point: { visibility?: number }): boolean {
  return point.visibility === undefined || point.visibility >= VISIBILITY_THRESHOLD
}

function isLeftIndex(index: number): boolean {
  return LEFT_SIDE_INDICES.has(index)
}

function isRightIndex(index: number): boolean {
  return RIGHT_SIDE_INDICES.has(index)
}

function jointColor(index: number): string {
  if (isLeftIndex(index)) {
    return LEFT_JOINT_COLOR
  }
  if (isRightIndex(index)) {
    return RIGHT_JOINT_COLOR
  }
  return NEUTRAL_COLOR
}

function connectionColor(from: number, to: number): string {
  const leftFrom = isLeftIndex(from)
  const rightFrom = isRightIndex(from)
  const leftTo = isLeftIndex(to)
  const rightTo = isRightIndex(to)

  if (leftFrom && leftTo) {
    return LEFT_JOINT_COLOR
  }
  if (rightFrom && rightTo) {
    return RIGHT_JOINT_COLOR
  }
  return NEUTRAL_COLOR
}

export function drawPoseSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: PoseLandmarkArray,
  mapper: LandmarkMapper,
  mirror = false,
): void {
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const toX = (point: { x: number }) => mapper.toCanvasX(mirror ? 1 - point.x : point.x)
  const toY = (point: { y: number }) => mapper.toCanvasY(point.y)

  ctx.lineWidth = 3
  for (const [from, to] of POSE_CONNECTIONS) {
    const fromPoint = landmarks[from]
    const toPoint = landmarks[to]
    if (
      fromPoint === undefined ||
      toPoint === undefined ||
      !isVisible(fromPoint) ||
      !isVisible(toPoint)
    ) {
      continue
    }
    ctx.strokeStyle = connectionColor(from, to)
    ctx.beginPath()
    ctx.moveTo(toX(fromPoint), toY(fromPoint))
    ctx.lineTo(toX(toPoint), toY(toPoint))
    ctx.stroke()
  }

  const jointRadius = Math.max(3, mapper.scale * 0.03)
  for (let index = 0; index < landmarks.length; index += 1) {
    const point = landmarks[index]
    if (point === undefined || !isVisible(point)) {
      continue
    }
    ctx.beginPath()
    ctx.arc(toX(point), toY(point), jointRadius, 0, Math.PI * 2)
    ctx.fillStyle = jointColor(index)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.lineWidth = 1.5
    ctx.stroke()
  }

  ctx.restore()
}
