import { WebcamView } from '@/features/webcam/WebcamView'

function App() {
  return (
    <main className="mx-auto flex min-h-full max-w-3xl flex-col items-center justify-center gap-6 p-6">
      <header className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-white">AI Boxing Trainer</h1>
        <p className="text-sm text-zinc-400">
          Real-time computer vision boxing coach — powered entirely by local AI.
        </p>
      </header>

      <WebcamView className="w-full shadow-2xl shadow-black/50" />
    </main>
  )
}

export default App
