import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'
import type { NormalizedLandmark } from '@mediapipe/tasks-vision'

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'

const POSE_LANDMARKER_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.float16.task'

const POSE_LANDMARKER_OPTIONS = {
  baseOptions: {
    modelAssetPath: POSE_LANDMARKER_MODEL_URL,
  },
  runningMode: 'VIDEO' as const,
  numPoses: 1,
  minPoseDetectionConfidence: 0.5,
  minPosePresenceConfidence: 0.5,
  minTrackingConfidence: 0.5,
}

async function createWithDelegate(delegate: 'GPU' | 'CPU'): Promise<PoseLandmarker> {
  const fileset = await FilesetResolver.forVisionTasks(WASM_URL)
  return PoseLandmarker.createFromOptions(fileset, {
    ...POSE_LANDMARKER_OPTIONS,
    baseOptions: {
      ...POSE_LANDMARKER_OPTIONS.baseOptions,
      delegate,
    },
  })
}

export async function createPoseLandmarker(): Promise<PoseLandmarker> {
  try {
    return await createWithDelegate('GPU')
  } catch {
    return createWithDelegate('CPU')
  }
}

export function detectPose(
  detector: PoseLandmarker,
  video: HTMLVideoElement,
  timestamp: number,
): NormalizedLandmark[] | null {
  const result = detector.detectForVideo(video, timestamp)
  return result.landmarks[0] ?? null
}

export function disposePoseLandmarker(detector: PoseLandmarker | null): void {
  detector?.close()
}
