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
import { useCallback, useEffect, useRef } from 'react'
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
    <main className="mx-auto flex min-h-full max-w-3xl flex-col items-center gap-6 p-6">
      <header className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-white">AI Boxing Trainer</h1>
        <p className="text-sm text-zinc-400">
          Real-time computer vision boxing coach — powered entirely by local AI.
        </p>
      </header>

      <div className="grid w-full gap-6 lg:grid-cols-[1fr_300px]">
        <div className="relative w-full shadow-2xl shadow-black/50">
          <WebcamView webcam={webcam} />
          {isReady && (
            <PoseOverlay
              landmarks={landmarks}
              videoRef={videoRef}
              className="absolute inset-0 rounded-2xl"
            />
          )}
          {isReady && (
            <PunchEffectsOverlay
              impacts={punchEffects.impacts}
              videoRef={videoRef}
              className="absolute inset-0 rounded-2xl"
            />
          )}
          {isReady && (
            <PunchHud
              metrics={metrics.metrics}
              lastPunch={punches[0] ?? null}
              className="rounded-2xl"
            />
          )}
          <PerfOverlay perf={perf} className="rounded-lg" />
        </div>

        <div className="flex w-full flex-col gap-6">
          {poseStatus === 'error' && poseError !== null && (
            <p className="max-w-md text-center text-sm text-amber-400">
              Pose detection unavailable: {poseError}
            </p>
          )}
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
    </main>
  )
}

export default App
