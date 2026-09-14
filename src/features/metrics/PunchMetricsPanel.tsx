import type { PunchEvent, PunchSide, PunchType } from '@/types/punch'
import type { PunchMetricsSnapshot } from '@/game/metricsTracker'

export interface PunchMetricsPanelProps {
  metrics: PunchMetricsSnapshot
  punches: PunchEvent[]
  onReset?: () => void
  className?: string
}

const SIDE_LABEL: Record<PunchSide, string> = {
  left: 'Left',
  right: 'Right',
}

const SIDE_TEXT: Record<PunchSide, string> = {
  left: 'text-red-400',
  right: 'text-blue-400',
}

const SIDE_DOT: Record<PunchSide, string> = {
  left: 'bg-red-400',
  right: 'bg-blue-400',
}

const TYPE_LABEL: Record<PunchType, string> = {
  jab: 'Jabs',
  hook: 'Hooks',
  uppercut: 'Uppercuts',
}

const TYPE_ACCENT: Record<PunchType, string> = {
  jab: 'text-amber-400',
  hook: 'text-emerald-400',
  uppercut: 'text-purple-400',
}

function formatSpeed(speed: number): string {
  return `${speed.toFixed(1)}×/s`
}

interface StatProps {
  label: string
  value: string
  accent?: string
  sub?: string
}

function Stat({ label, value, accent = 'text-white', sub }: StatProps) {
  return (
    <div className="flex flex-col items-center rounded-lg bg-zinc-950/60 px-2 py-2">
      <span className={`text-2xl font-bold tabular-nums ${accent}`}>{value}</span>
      <span className="text-[11px] uppercase tracking-wider text-zinc-500">{label}</span>
      {sub !== undefined && <span className="text-[11px] tabular-nums text-zinc-400">{sub}</span>}
    </div>
  )
}

interface SideTallyProps {
  totals: PunchMetricsSnapshot['totalsBySide']
}

function SideTally({ totals }: SideTallyProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {(Object.keys(totals) as PunchSide[]).map((side) => (
        <div
          key={side}
          className="flex items-center justify-between rounded-lg bg-zinc-950/60 px-3 py-1.5"
        >
          <span className="flex items-center gap-2 text-sm">
            <span className={`size-2 rounded-full ${SIDE_DOT[side]}`} />
            <span className={SIDE_TEXT[side]}>{SIDE_LABEL[side]}</span>
          </span>
          <span className="text-sm font-semibold tabular-nums text-zinc-200">{totals[side]}</span>
        </div>
      ))}
    </div>
  )
}

export function PunchMetricsPanel({
  metrics,
  punches,
  onReset,
  className = '',
}: PunchMetricsPanelProps) {
  const last =
    metrics.lastPunchType !== null && metrics.lastPunchSide !== null
      ? `${SIDE_LABEL[metrics.lastPunchSide]} ${TYPE_LABEL[metrics.lastPunchType]}`
      : '—'

  return (
    <aside
      className={`flex w-full flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 ${className}`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Live metrics
        </h2>
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-zinc-700 px-2 py-1 text-xs text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Punches" value={metrics.totalCount.toString()} accent="text-amber-400" />
        <Stat label="Combo" value={metrics.currentCombo.toString()} accent="text-emerald-400" />
        <Stat
          label="Pace"
          value={metrics.punchesPerMinute.toString()}
          accent="text-sky-400"
          sub="/min"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1.5 rounded-lg bg-zinc-950/40 p-3">
          <p className="text-[11px] uppercase tracking-wider text-zinc-500">By type</p>
          <div className="grid grid-cols-1 gap-1">
            {(['jab', 'hook', 'uppercut'] as const).map((type) => (
              <div key={type} className="flex items-center justify-between text-sm">
                <span className="text-zinc-300">{TYPE_LABEL[type]}</span>
                <span className={`font-semibold tabular-nums ${TYPE_ACCENT[type]}`}>
                  {metrics.totalsByType[type]}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5 rounded-lg bg-zinc-950/40 p-3">
          <p className="text-[11px] uppercase tracking-wider text-zinc-500">By hand</p>
          <SideTally totals={metrics.totalsBySide} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-lg bg-zinc-950/40 p-3">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-zinc-500">Last punch</p>
          <p className="mt-0.5 text-sm font-semibold text-zinc-200">{last}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wider text-zinc-500">Speed</p>
          <p className="mt-0.5 font-mono text-sm text-zinc-200">
            {metrics.lastSpeed === null ? '—' : formatSpeed(metrics.lastSpeed)}
            <span className="ml-2 text-xs text-zinc-500">
              peak {metrics.peakSpeed === null ? '—' : formatSpeed(metrics.peakSpeed)}
            </span>
          </p>
        </div>
      </div>

      <ul className="flex flex-col gap-1.5">
        {punches.length === 0 && (
          <li className="rounded-lg bg-zinc-950/60 px-3 py-3 text-center text-sm text-zinc-600">
            Throw a punch to see it here.
          </li>
        )}
        {punches.map((punch, index) => (
          <li
            key={`${punch.timestampMs}-${punch.side}-${index}`}
            className="flex items-center justify-between rounded-lg bg-zinc-950/60 px-3 py-1.5"
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <span className={`size-2 rounded-full ${SIDE_DOT[punch.side]}`} />
              <span className={SIDE_TEXT[punch.side]}>{SIDE_LABEL[punch.side].toUpperCase()}</span>
              <span className="text-zinc-300">{TYPE_LABEL[punch.type]}</span>
            </span>
            <span className="font-mono text-xs text-zinc-400">{formatSpeed(punch.speed)}</span>
          </li>
        ))}
      </ul>
    </aside>
  )
}
