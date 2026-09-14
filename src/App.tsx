import { PoseOverlay } from '@/features/pose/PoseOverlay'
import { WebcamView } from '@/features/webcam/WebcamView'
import { usePoseDetection } from '@/hooks/usePoseDetection'
import { useWebcam } from '@/hooks/useWebcam'

function App() {
  const webcam = useWebcam()
  const { videoRef } = webcam

  const {
    landmarks,
    status: poseStatus,
    error: poseError,
  } = usePoseDetection({
    videoRef,
    enabled: webcam.status === 'ready',
  })

  return (
    <main className="mx-auto flex min-h-full max-w-3xl flex-col items-center justify-center gap-6 p-6">
      <header className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-white">AI Boxing Trainer</h1>
        <p className="text-sm text-zinc-400">
          Real-time computer vision boxing coach — powered entirely by local AI.
        </p>
      </header>

      <div className="relative w-full shadow-2xl shadow-black/50">
        <WebcamView webcam={webcam} />
        {webcam.status === 'ready' && (
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
    </main>
  )
}

export default App
