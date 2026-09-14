import { useCallback, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { createWebcamError, requestWebcamStream, stopWebcamStream } from '@/services/webcamService'
import type { WebcamError, WebcamStatus } from '@/types/webcam'

function getStatusForError(error: WebcamError): WebcamStatus {
  return error.code === 'NOT_ALLOWED' ? 'denied' : 'error'
}

export interface UseWebcamResult {
  videoRef: RefObject<HTMLVideoElement | null>
  status: WebcamStatus
  error: WebcamError | null
  stream: MediaStream | null
  start: () => Promise<void>
  stop: () => void
}

export function useWebcam(): UseWebcamResult {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const requestIdRef = useRef(0)

  const [status, setStatus] = useState<WebcamStatus>('idle')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<WebcamError | null>(null)

  const start = useCallback(async () => {
    const requestId = ++requestIdRef.current
    setError(null)
    setStatus('requesting')

    try {
      const nextStream = await requestWebcamStream()
      if (requestId !== requestIdRef.current) {
        stopWebcamStream(nextStream)
        return
      }
      stopWebcamStream(streamRef.current)
      streamRef.current = nextStream
      setStream(nextStream)
      setStatus('ready')
    } catch (caught) {
      if (requestId !== requestIdRef.current) {
        return
      }
      const webcamError = createWebcamError(caught)
      setStream(null)
      setError(webcamError)
      setStatus(getStatusForError(webcamError))
    }
  }, [])

  const stop = useCallback(() => {
    requestIdRef.current += 1
    stopWebcamStream(streamRef.current)
    streamRef.current = null
    setStream(null)
    setError(null)
    setStatus((current) => (current === 'ready' ? 'stopped' : current))
  }, [])

  return { videoRef, status, error, stream, start, stop }
}
