import { useEffect } from 'react'
import { useWebcam } from '@/hooks/useWebcam'

export interface WebcamViewProps {
  className?: string
  mirror?: boolean
}

interface StateCardProps {
  title: string
  description: string
  actionLabel: string
  onAction: () => void
  disabled?: boolean
  busy?: boolean
}

function StateCard({
  title,
  description,
  actionLabel,
  onAction,
  disabled = false,
  busy = false,
}: StateCardProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950/80 p-6 text-center backdrop-blur-sm">
      {busy ? (
        <div className="size-10 animate-spin rounded-full border-2 border-zinc-600 border-t-red-500" />
      ) : (
        <div className="flex size-10 items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
          <svg
            className="size-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>
      )}
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="max-w-sm text-sm text-zinc-400">{description}</p>
      </div>
      <button
        type="button"
        onClick={onAction}
        disabled={disabled}
        className="mt-1 rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {actionLabel}
      </button>
    </div>
  )
}

export function WebcamView({ className = '', mirror = true }: WebcamViewProps) {
  const { videoRef, stream, status, error, start, stop } = useWebcam()

  useEffect(() => {
    const video = videoRef.current
    if (!video || !stream) {
      return
    }
    video.srcObject = stream
    video.play().catch(() => {})
    return () => {
      video.srcObject = null
    }
  }, [stream, videoRef])

  const isReady = status === 'ready'
  const isRequesting = status === 'requesting'

  return (
    <div
      className={`relative aspect-video w-full overflow-hidden rounded-2xl bg-zinc-950 ${className}`}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={`h-full w-full object-cover ${mirror ? '-scale-x-100' : ''}`}
      />

      {isReady && (
        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-zinc-900/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          <span className="size-2 animate-pulse rounded-full bg-red-500" />
          LIVE
        </div>
      )}

      {!isReady && status === 'idle' && (
        <StateCard
          title="Camera off"
          description="Start the webcam to begin your boxing workout."
          actionLabel="Start camera"
          onAction={() => void start()}
        />
      )}

      {!isReady && status === 'stopped' && (
        <StateCard
          title="Camera stopped"
          description="Your session is paused. Start the camera to resume."
          actionLabel="Restart camera"
          onAction={() => void start()}
        />
      )}

      {!isReady && status === 'requesting' && (
        <StateCard
          title="Requesting camera access…"
          description="Allow camera access in your browser when prompted."
          actionLabel="Starting"
          onAction={() => void start()}
          disabled
          busy
        />
      )}

      {!isReady && (status === 'denied' || status === 'error') && (
        <StateCard
          title={status === 'denied' ? 'Camera access denied' : 'Camera unavailable'}
          description={error?.message ?? 'Unable to access the camera.'}
          actionLabel="Try again"
          onAction={() => void start()}
          disabled={isRequesting}
        />
      )}

      {isReady && (
        <button
          type="button"
          onClick={stop}
          className="absolute right-4 top-4 rounded-lg bg-zinc-900/80 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-zinc-800"
        >
          Stop camera
        </button>
      )}
    </div>
  )
}
