import type { WebcamError, WebcamErrorCode } from '@/types/webcam'

export const DEFAULT_VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  width: { ideal: 1280 },
  height: { ideal: 720 },
  frameRate: { ideal: 30 },
}

const DEFAULT_CONSTRAINTS: MediaStreamConstraints = {
  video: DEFAULT_VIDEO_CONSTRAINTS,
  audio: false,
}

export function isWebcamSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'mediaDevices' in navigator &&
    typeof navigator.mediaDevices.getUserMedia === 'function'
  )
}

export function getWebcamErrorCode(error: unknown): WebcamErrorCode {
  if (typeof error !== 'object' || error === null) {
    return 'UNKNOWN'
  }

  const name = (error as { name?: string }).name

  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
    case 'PermissionDeniedError':
      return 'NOT_ALLOWED'
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'NOT_FOUND'
    case 'NotReadableError':
    case 'TrackStartError':
    case 'AbortError':
      return 'NOT_READABLE'
    case 'OverconstrainedError':
      return 'OVERCONSTRAINED'
    case 'TypeError':
    case 'NotSupportedError':
      return 'NOT_SUPPORTED'
    default:
      return 'UNKNOWN'
  }
}

export function createWebcamError(error: unknown): WebcamError {
  const code = getWebcamErrorCode(error)

  switch (code) {
    case 'NOT_SUPPORTED':
      return {
        code,
        message: 'This browser does not support camera access.',
      }
    case 'NOT_ALLOWED':
      return {
        code,
        message: 'Camera access was denied. Allow access in your browser and try again.',
      }
    case 'NOT_FOUND':
      return {
        code,
        message: 'No camera was found on this device.',
      }
    case 'NOT_READABLE':
      return {
        code,
        message: 'The camera is currently in use by another application or cannot be read.',
      }
    case 'OVERCONSTRAINED':
      return {
        code,
        message: 'The camera could not satisfy the requested video settings.',
      }
    default:
      return {
        code,
        message: 'Something went wrong while accessing the camera.',
      }
  }
}

export async function requestWebcamStream(
  constraints: MediaStreamConstraints = DEFAULT_CONSTRAINTS,
): Promise<MediaStream> {
  if (!isWebcamSupported()) {
    throw createWebcamError(new DOMException('', 'NotSupportedError'))
  }

  try {
    return await navigator.mediaDevices.getUserMedia(constraints)
  } catch (error) {
    throw createWebcamError(error)
  }
}

export function stopWebcamStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track: MediaStreamTrack) => track.stop())
}
