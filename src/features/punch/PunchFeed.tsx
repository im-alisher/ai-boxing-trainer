import type { PunchEvent, PunchSide, PunchType } from '@/types/punch'

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

const TYPE_LABEL: Record<PunchType, string> = {
  jab: 'JAB',
  hook: 'HOOK',
  uppercut: 'UPPERCUT',
}

function formatSpeed(speed: number): string {
  return `${speed.toFixed(1)}×/s`
}

interface CountCardProps {
  count: number
  label: string
  accent: string
}

function CountCard({ count, label, accent }: CountCardProps) {
  return (
    <div className="rounded-lg bg-zinc-950/60 p-2">
      <p className={`text-xl font-bold ${accent}`}>{count}</p>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  )
}

export function PunchFeed({ punches, className = '' }: PunchFeedProps) {
  const countByType = (type: PunchType) => punches.filter((punch) => punch.type === type).length

  return (
    <aside
      className={`flex w-full flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 ${className}`}
    >
      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
        Punch detection
      </h2>

      <div className="grid grid-cols-3 gap-2 text-center">
        <CountCard count={countByType('jab')} label="Jabs" accent="text-amber-400" />
        <CountCard count={countByType('hook')} label="Hooks" accent="text-emerald-400" />
        <CountCard count={countByType('uppercut')} label="Uppercuts" accent="text-purple-400" />
      </div>

      <ul className="flex flex-col gap-1.5">
        {punches.length === 0 && (
          <li className="text-center text-sm text-zinc-600">Throw a punch to see it here.</li>
        )}
        {punches.map((punch, index) => (
          <li
            key={`${punch.timestampMs}-${punch.side}-${index}`}
            className="flex items-center justify-between rounded-lg bg-zinc-950/60 px-3 py-1.5"
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <span className={`size-2 rounded-full ${SIDE_DOT[punch.side]}`} />
              <span className={SIDE_COLORS[punch.side]}>{SIDE_LABEL[punch.side]}</span>
              <span className="text-zinc-300">{TYPE_LABEL[punch.type]}</span>
            </span>
            <span className="font-mono text-xs text-zinc-400">{formatSpeed(punch.speed)}</span>
          </li>
        ))}
      </ul>
    </aside>
  )
}
