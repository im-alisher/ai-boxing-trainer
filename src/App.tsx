import { PoseOverlay } from '@/features/pose/PoseOverlay'
import { PunchFeed } from '@/features/punch/PunchFeed'
import { WebcamView } from '@/features/webcam/WebcamView'
import { usePoseDetection } from '@/hooks/usePoseDetection'
import { usePunchDetection } from '@/hooks/usePunchDetection'
import { useWebcam } from '@/hooks/useWebcam'

function App() {
  const webcam = useWebcam()
  const { videoRef } = webcam

  const isReady = webcam.status === 'ready'

  const { registerFrame, punches } = usePunchDetection({
    enabled: isReady,
  })

  const {
    landmarks,
    status: poseStatus,
    error: poseError,
  } = usePoseDetection({
    videoRef,
    enabled: isReady,
    onFrame: (next) => {
      registerFrame(next, performance.now())
    },
  })

  return (
    <main className="mx-auto flex min-h-full max-w-3xl flex-col items-center gap-6 p-6">
      <header className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-white">AI Boxing Trainer</h1>
        <p className="text-sm text-zinc-400">
          Real-time computer vision boxing coach — powered entirely by local AI.
        </p>
      </header>

      <div className="relative w-full shadow-2xl shadow-black/50">
        <WebcamView webcam={webcam} />
        {isReady && (
          <PoseOverlay
            landmarks={landmarks}
            videoRef={videoRef}
            className="absolute inset-0 rounded-2xl"
          />
        )}
      </div>

      {poseStatus === 'error' && poseError !== null && (
        <p className="max-w-md text-center text-sm text-amber-400">
          Pose detection unavailable: {poseError}
        </p>
      )}

      <PunchFeed punches={punches} />
    </main>
  )
}

export default App
