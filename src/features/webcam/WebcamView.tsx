import { useEffect } from 'react'
import { useWebcam } from '@/hooks/useWebcam'
import type { UseWebcamResult } from '@/hooks/useWebcam'

export interface WebcamViewProps {
  className?: string
  mirror?: boolean
  webcam?: UseWebcamResult
}

interface StateCardProps {
  title: string
  description: string
  actionLabel: string
  onAction: () => void
  disabled?: boolean
  busy?: boolean
}

function CameraIcon() {
  return (
    <svg
      className="size-7"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.5 9.5A2.5 2.5 0 0 1 5 7h7a2.5 2.5 0 0 1 2.5 2.5v5A2.5 2.5 0 0 1 12 17H5a2.5 2.5 0 0 1-2.5-2.5v-5Z" />
      <path d="m14.5 9.8 4.2-2.1a1 1 0 0 1 1.45.9v6.8a1 1 0 0 1-1.45.9l-4.2-2.1" />
    </svg>
  )
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
    <div className="camera-state absolute inset-0 flex flex-col items-center justify-center gap-5 p-6 text-center">
      <div className="ring-art" aria-hidden="true">
        <span className="ring-word">
          ROUND
          <br />
          ONE.
        </span>
        <svg viewBox="0 0 460 350" fill="none">
          <defs>
            <linearGradient
              id="ring-floor"
              x1="80"
              y1="150"
              x2="360"
              y2="330"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#fa713c" />
              <stop offset="1" stopColor="#94361d" />
            </linearGradient>
          </defs>
          <path d="M40 218 231 125 426 215 234 321Z" fill="url(#ring-floor)" />
          <path d="M40 218v18l194 96 192-98v-19L234 311Z" fill="#602c20" />
          <path d="m58 216 175-81 173 80-173 85Z" stroke="#ffc7a3" strokeOpacity=".5" />
          <g stroke="#f3e9d2" strokeWidth="3" strokeLinejoin="round">
            <path d="M44 149 231 61 422 150 234 244Z" />
            <path d="M44 171 231 83 422 172 234 266Z" />
            <path d="M44 194 231 106 422 195 234 289Z" />
          </g>
          <g strokeWidth="10" strokeLinecap="round">
            <path d="M44 140v80M231 50v78" stroke="#acafa5" />
            <path d="M422 142v78M234 235v82" stroke="#ff7845" />
          </g>
          <path d="m189 205 41-20 44 20-42 21Z" fill="#f5e8cd" fillOpacity=".85" />
          <path d="m218 203 13-6 14 6-13 7Z" fill="#be502b" />
        </svg>
        <span className="ring-note">YOUR SPACE IS YOUR ARENA</span>
      </div>
      <div className="camera-state-content">
        <span className="camera-kicker">WELCOME TO YOUR CORNER</span>
        {busy ? (
          <div className="relative size-16">
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-white/10 border-t-sky-400" />
            <div className="absolute inset-2 rounded-full bg-sky-400/10" />
          </div>
        ) : (
          <div className="camera-icon">
            <CameraIcon />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <p className="max-w-sm text-sm text-zinc-400">{description}</p>
        </div>
        <button type="button" onClick={onAction} disabled={disabled} className="camera-action">
          {actionLabel}
          <span aria-hidden="true"> &#8599;</span>
        </button>
      </div>
    </div>
  )
}

export function WebcamView({ className = '', mirror = true, webcam }: WebcamViewProps) {
  const ownWebcam = useWebcam()
  const { videoRef, stream, status, error, start, stop } = webcam ?? ownWebcam

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
    <div className={`relative h-full w-full overflow-hidden bg-zinc-950 ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={`h-full w-full object-cover ${mirror ? '-scale-x-100' : ''}`}
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/40 via-transparent to-zinc-950/20" />

      {isReady && (
        <>
          <div className="absolute left-5 top-5 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-zinc-950/70 px-3.5 py-1.5 text-xs font-bold tracking-wider text-white backdrop-blur-md">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-red-500" />
            </span>
            LIVE
          </div>
          <button
            type="button"
            onClick={stop}
            className="absolute right-5 top-5 z-20 rounded-full border border-white/10 bg-zinc-950/70 px-4 py-1.5 text-xs font-semibold text-zinc-200 backdrop-blur-md transition-all hover:border-rose-400/40 hover:text-rose-200"
          >
            Stop camera
          </button>
        </>
      )}

      {!isReady && status === 'idle' && (
        <StateCard
          title="Ready to throw?"
          description="Camera on. Hands up. Let your next round begin."
          actionLabel="Start camera"
          onAction={() => void start()}
        />
      )}

      {!isReady && status === 'stopped' && (
        <StateCard
          title="Camera stopped"
          description="Your camera is off. Restart it when you are ready."
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
    </div>
  )
}
