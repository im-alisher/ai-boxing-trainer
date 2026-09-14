import { useCallback, useEffect, useRef } from 'react'
import { PunchEffectsOverlay } from '@/features/effects/PunchEffectsOverlay'
import { usePunchEffects } from '@/features/effects/usePunchEffects'
import { PunchHud } from '@/features/hud/PunchHud'
import { PunchMetricsPanel } from '@/features/metrics/PunchMetricsPanel'
import { PerfOverlay } from '@/features/perf/PerfOverlay'
import { PoseOverlay } from '@/features/pose/PoseOverlay'
import { WebcamView } from '@/features/webcam/WebcamView'
import { WorkoutPanel } from '@/features/workout/WorkoutPanel'
import { usePoseDetection } from '@/hooks/usePoseDetection'
import { usePunchDetection } from '@/hooks/usePunchDetection'
import { usePunchMetrics } from '@/hooks/usePunchMetrics'
import { useWebcam } from '@/hooks/useWebcam'
import { useWorkout } from '@/hooks/useWorkout'
import type { PoseLandmarkArray } from '@/types/pose'
import type { PunchEvent } from '@/types/punch'

function App() {
  const webcam = useWebcam()
  const { videoRef } = webcam

  const isReady = webcam.status === 'ready'

  const metrics = usePunchMetrics({ enabled: isReady })
  const workout = useWorkout()
  const punchEffects = usePunchEffects()

  const landmarksRef = useRef<PoseLandmarkArray | null>(null)

  const handlePunch = useCallback(
    (event: PunchEvent) => {
      metrics.feed(event)
      workout.feed(event)
      punchEffects.register(event.side, event.type, landmarksRef.current)
    },
    [metrics, punchEffects, workout],
  )

  const { registerFrame, punches } = usePunchDetection({
    enabled: isReady,
    onPunch: handlePunch,
  })

  const {
    landmarks,
    status: poseStatus,
    error: poseError,
    perf,
  } = usePoseDetection({
    videoRef,
    enabled: isReady,
    maxFps: 30,
    onFrame: (next) => {
      registerFrame(next, performance.now())
    },
  })

  useEffect(() => {
    landmarksRef.current = landmarks
  }, [landmarks])

  return (
    <main className="relative flex min-h-screen flex-col overflow-y-auto lg:h-screen lg:overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-50 h-1 bg-gradient-to-r from-amber-400 via-rose-500 via-50% to-sky-400" />
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 right-[-10%] size-[420px] animate-float-slow rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute bottom-[-15%] left-[-8%] size-[380px] animate-float-slow rounded-full bg-sky-500/15 blur-[110px] [animation-delay:-7s]" />
        <div className="absolute right-[18%] top-[35%] size-[260px] animate-float-slow rounded-full bg-fuchsia-600/10 blur-[100px] [animation-delay:-3s]" />
      </div>

      <header className="flex shrink-0 items-center justify-between gap-4 px-5 pb-2 pt-3 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-violet-600 shadow-[0_8px_24px_-8px_rgba(56,189,248,0.8)]">
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9.5 11.5a3.5 3.5 0 0 0 3.5 3.5c.83 0 1.5.67 1.5 1.5v1.7a2 2 0 0 1-2 2h-.6a2 2 0 0 1-1.94-1.48 3.02 3.02 0 0 0-5.9.4V19a2 2 0 0 1-2-2v-1.2a2 2 0 0 1 2-2h1.5c.83 0 1.5-.67 1.5-1.5a3.5 3.5 0 0 0 3.5-3.5c0-.83.67-1.5 1.5-1.5h1.35a2 2 0 0 1 1.72.99l.38.66a2 2 0 0 0 2.9.74l.28-.2a2 2 0 0 1 2.44 0l.28.2a2 2 0 0 0 2.9-.74l.38-.66a2 2 0 0 1 1.72-.99H23" />
            </svg>
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-black uppercase leading-none tracking-tight sm:text-xl">
              <span className="text-gradient-shine">Boxing Trainer</span>
            </h1>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
              Local AI · Real-time coaching
            </p>
          </div>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-emerald-300 backdrop-blur">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
            </span>
            All punches run on-device
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-zinc-300 backdrop-blur">
            100% private
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 px-5 pb-4 sm:px-8 lg:flex-row">
        <div className="flex min-h-0 flex-1 flex-col lg:items-center lg:justify-center">
          <div className="relative w-full lg:h-full">
            <div className="relative mx-auto aspect-video w-full max-h-full max-w-full overflow-hidden rounded-[1.6rem] p-[3px] lg:h-auto lg:w-auto lg:max-h-[72%]">
              <div className="absolute left-1/2 top-1/2 aspect-square w-[170%] -translate-x-1/2 -translate-y-1/2">
                <div className="h-full w-full animate-spin-slower rounded-full bg-[conic-gradient(#fbbf24,#f43f5e,#8b5cf6,#38bdf8,#34d399,#fbbf24)] opacity-90" />
              </div>
              <div className="stage-glow relative h-full w-full overflow-hidden rounded-[calc(1.6rem-3px)] bg-zinc-950">
                <div className="pointer-events-none absolute inset-0 hud-grid" />
                <div className="pointer-events-none absolute inset-0 scan-line opacity-60" />
                <WebcamView webcam={webcam} className="rounded-none" />
                {isReady && (
                  <PoseOverlay
                    landmarks={landmarks}
                    videoRef={videoRef}
                    className="absolute inset-0 z-10"
                  />
                )}
                {isReady && (
                  <PunchEffectsOverlay
                    impacts={punchEffects.impacts}
                    videoRef={videoRef}
                    className="absolute inset-0 z-10"
                  />
                )}
                {isReady && <PunchHud metrics={metrics.metrics} lastPunch={punches[0] ?? null} />}
                <PerfOverlay perf={perf} />
              </div>
            </div>
          </div>

          {poseStatus === 'error' && poseError !== null && (
            <p className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-center text-sm text-rose-200">
              Pose detection unavailable: {poseError}
            </p>
          )}
        </div>

        <aside className="flex min-h-0 w-full shrink-0 flex-col gap-4 lg:h-full lg:w-[460px]">
          <WorkoutPanel
            workout={workout.workout}
            history={workout.history}
            onBegin={workout.begin}
            onPause={workout.pause}
            onResume={workout.resume}
            onFinish={workout.finish}
            onClearHistory={workout.clearHistory}
            className="lg:min-h-0 lg:flex-1"
          />
          <PunchMetricsPanel
            metrics={metrics.metrics}
            punches={punches}
            onReset={metrics.reset}
            className="lg:min-h-0 lg:flex-1"
          />
        </aside>
      </div>

      <footer className="pointer-events-none absolute inset-x-0 bottom-2 hidden shrink-0 justify-center lg:flex">
        <p className="font-mono text-[11px] text-zinc-600">
          Camera stays on your device — nothing is uploaded · 100% local · MIT licensed · open
          source
        </p>
      </footer>
      <p className="pb-4 text-center font-mono text-[11px] text-zinc-600 lg:hidden">
        Camera stays on your device — nothing is uploaded · 100% local · open source
      </p>
    </main>
  )
}

export default App
