import type { PunchEvent, PunchSide } from '@/types/punch'

export interface PunchFeedProps {
  punches: PunchEvent[]
  className?: string
}

const SIDE_LABEL: Record<PunchSide, string> = {
  left: 'LEFT',
  right: 'RIGHT',
}

const SIDE_COLORS: Record<PunchSide, string> = {
  left: 'text-red-400',
  right: 'text-blue-400',
}

const SIDE_DOT: Record<PunchSide, string> = {
  left: 'bg-red-400',
  right: 'bg-blue-400',
}

function formatSpeed(speed: number): string {
  return `${speed.toFixed(1)}×/s`
}

export function PunchFeed({ punches, className = '' }: PunchFeedProps) {
  const leftCount = punches.filter((punch) => punch.side === 'left').length
  const rightCount = punches.filter((punch) => punch.side === 'right').length

  return (
    <aside
      className={`flex w-full flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 ${className}`}
    >
      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
        Punch detection
      </h2>

      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-lg bg-zinc-950/60 p-2">
          <p className="text-xl font-bold text-red-400">{leftCount}</p>
          <p className="text-xs text-zinc-500">Left jabs</p>
        </div>
        <div className="rounded-lg bg-zinc-950/60 p-2">
          <p className="text-xl font-bold text-blue-400">{rightCount}</p>
          <p className="text-xs text-zinc-500">Right jabs</p>
        </div>
      </div>

      <ul className="flex flex-col gap-1.5">
        {punches.length === 0 && (
          <li className="text-center text-sm text-zinc-600">Throw a jab to see it here.</li>
        )}
        {punches.map((punch, index) => (
          <li
            key={`${punch.timestampMs}-${punch.side}-${index}`}
            className="flex items-center justify-between rounded-lg bg-zinc-950/60 px-3 py-1.5"
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <span className={`size-2 rounded-full ${SIDE_DOT[punch.side]}`} />
              <span className={SIDE_COLORS[punch.side]}>{SIDE_LABEL[punch.side]}</span>
              <span className="text-zinc-300">JAB</span>
            </span>
            <span className="font-mono text-xs text-zinc-400">{formatSpeed(punch.speed)}</span>
          </li>
        ))}
      </ul>
    </aside>
  )
}
