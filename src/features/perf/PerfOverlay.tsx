import type { DetectionPerf } from '@/hooks/usePoseDetection'

export interface PerfOverlayProps {
  perf: DetectionPerf
  className?: string
}

export function PerfOverlay({ perf, className = '' }: PerfOverlayProps) {
  return (
    <div
      className={`pointer-events-none absolute left-1/2 top-5 z-30 -translate-x-1/2 rounded-full border border-white/10 bg-zinc-950/60 px-3 py-1 font-mono text-[10px] tabular-nums text-zinc-400 backdrop-blur-md ${className}`}
    >
      <span>{perf.fps > 0 ? `${perf.fps} fps` : '-- fps'}</span>
      <span className="mx-1.5 text-zinc-600">·</span>
      <span>{perf.detectMs > 0 ? `${perf.detectMs} ms` : '-- ms'}</span>
    </div>
  )
}
