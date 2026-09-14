import type { DetectionPerf } from '@/hooks/usePoseDetection'

export interface PerfOverlayProps {
  perf: DetectionPerf
  className?: string
}

export function PerfOverlay({ perf, className = '' }: PerfOverlayProps) {
  return (
    <div
      className={`pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-lg bg-zinc-950/70 px-2.5 py-1 font-mono text-[11px] tabular-nums text-zinc-400 backdrop-blur-sm ${className}`}
    >
      <span>{perf.fps > 0 ? `${perf.fps} fps` : '-- fps'}</span>
      <span className="mx-1.5 text-zinc-600">·</span>
      <span>{perf.detectMs > 0 ? `${perf.detectMs} ms` : '-- ms'}</span>
    </div>
  )
}
