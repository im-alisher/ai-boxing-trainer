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
    <main className="training-app">
      <header className="app-header">
        <a className="brand" href="#" aria-label="Boxing Trainer home">
          <span className="brand-mark" aria-hidden="true">
            B<span>.</span>
          </span>
          <span>
            BOXING<span className="brand-light"> / TRAINER</span>
          </span>
        </a>
        <span className="header-label">THE EVERYDAY FIGHT CLUB</span>
        <span className="privacy-badge">
          <span /> Private by design
        </span>
      </header>

      <div className="dashboard">
        <div className="page-heading">
          <div>
            <p className="eyebrow">NO OPPONENT. NO EXCUSES.</p>
            <h1>
              OWN YOUR<span> CORNER.</span>
            </h1>
            <p>A little space. A little sweat. A better you.</p>
          </div>
          <div className="mode-badge">
            <span className="mode-icon" aria-hidden="true">
              ↗
            </span>
            <div>
              <strong>Freestyle training</strong>
              <span>Real-time movement tracking</span>
            </div>
          </div>
        </div>
        <div className="dashboard-grid">
          <div className="training-column">
            <section className="camera-panel" aria-label="Training camera">
              <div className="camera-heading">
                <div>
                  <span className={`status-dot ${isReady ? 'is-live' : ''}`} />
                  01 / THE RING
                </div>
                <span>{isReady ? 'Camera connected' : 'Camera offline'}</span>
              </div>
              <div className="camera-stage">
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
                {isReady && <PerfOverlay perf={perf} className="!top-auto bottom-4" />}
              </div>
              <div className="camera-caption">
                <span>
                  <span className="small-cross" aria-hidden="true">
                    +
                  </span>{' '}
                  Keep your upper body in frame
                </span>
                <span>Video stays on your device</span>
              </div>
            </section>
            {poseStatus === 'error' && poseError !== null && (
              <p
                role="alert"
                className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-200"
              >
                Pose detection unavailable: {poseError}
              </p>
            )}
            <section className="setup-guide" aria-labelledby="setup-title">
              <div className="guide-heading">
                <h2 id="setup-title">THE PRE-FIGHT CHECK.</h2>
                <span>THREE STEPS. THEN GO.</span>
              </div>
              <div className="guide-steps">
                <div>
                  <span className="step-number">01</span>
                  <h3>Set your space</h3>
                  <p>Step back and give your arms room to move.</p>
                </div>
                <div>
                  <span className="step-number">02</span>
                  <h3>Get in position</h3>
                  <p>Face the camera in a well-lit space, hands up.</p>
                </div>
                <div>
                  <span className="step-number">03</span>
                  <h3>Make it count</h3>
                  <p>Start a session, then build your jab, hook and uppercut.</p>
                </div>
              </div>
            </section>
          </div>
          <aside className="stats-column" aria-label="Workout and performance">
            <WorkoutPanel
              workout={workout.workout}
              history={workout.history}
              onBegin={workout.begin}
              onPause={workout.pause}
              onResume={workout.resume}
              onFinish={workout.finish}
              onClearHistory={workout.clearHistory}
              className="workout-panel"
            />
            <PunchMetricsPanel
              metrics={metrics.metrics}
              punches={punches}
              onReset={metrics.reset}
              className="metrics-panel"
            />
          </aside>
        </div>
        <footer className="app-footer">
          <span>SHOW UP. HANDS UP. LEVEL UP.</span>
          <span>
            On-device AI <span aria-hidden="true">/</span> No video uploads{' '}
            <span aria-hidden="true">/</span> Open source
          </span>
        </footer>
      </div>
    </main>
  )
}

export default App
