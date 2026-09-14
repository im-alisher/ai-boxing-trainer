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
    <main className="relative mx-auto flex min-h-full w-full max-w-6xl flex-col items-center gap-8 px-5 py-8 sm:px-8">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 right-[-10%] size-[420px] animate-float-slow rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute bottom-[-15%] left-[-8%] size-[380px] animate-float-slow rounded-full bg-sky-500/15 blur-[110px] [animation-delay:-7s]" />
        <div className="absolute right-[18%] top-[35%] size-[260px] animate-float-slow rounded-full bg-fuchsia-600/10 blur-[100px] [animation-delay:-3s]" />
      </div>

      <header className="flex flex-col items-center gap-3 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-300 backdrop-blur">
          <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
          Powered by local AI
        </span>
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
          <span className="text-gradient-shine">AI BOXING TRAINER</span>
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-zinc-400">
          Real-time computer vision coaching — punches, combos and pace, detected entirely in your
          browser.
        </p>
      </header>

      <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="relative w-full">
          <div className="stage-glow overflow-hidden rounded-3xl border border-white/10 bg-zinc-950">
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

          {poseStatus === 'error' && poseError !== null && (
            <p className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-center text-sm text-rose-200">
              Pose detection unavailable: {poseError}
            </p>
          )}
        </div>

        <div className="flex w-full flex-col gap-5">
          <WorkoutPanel
            workout={workout.workout}
            history={workout.history}
            onBegin={workout.begin}
            onPause={workout.pause}
            onResume={workout.resume}
            onFinish={workout.finish}
            onClearHistory={workout.clearHistory}
          />
          <PunchMetricsPanel metrics={metrics.metrics} punches={punches} onReset={metrics.reset} />
        </div>
      </div>

      <footer className="flex flex-col items-center gap-1 text-center text-xs text-zinc-600">
        <p>Your camera stays on your device — nothing is uploaded or stored on any server.</p>
        <p className="font-mono">100% local · MIT licensed · open source</p>
      </footer>
    </main>
  )
}

export default App
