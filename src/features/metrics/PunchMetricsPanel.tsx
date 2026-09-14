import { memo } from 'react'
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

const SIDE_GRADIENT: Record<PunchSide, string> = {
  left: 'from-rose-400 to-red-500',
  right: 'from-sky-400 to-blue-500',
}

const SIDE_TEXT: Record<PunchSide, string> = {
  left: 'text-rose-300',
  right: 'text-sky-300',
}

const SIDE_DOT: Record<PunchSide, string> = {
  left: 'bg-rose-400',
  right: 'bg-sky-400',
}

const TYPE_LABEL: Record<PunchType, string> = {
  jab: 'Jab',
  hook: 'Hook',
  uppercut: 'Uppercut',
}

const TYPE_GRADIENT: Record<PunchType, string> = {
  jab: 'from-amber-400 to-orange-400',
  hook: 'from-emerald-400 to-teal-400',
  uppercut: 'from-violet-400 to-fuchsia-400',
}

const TYPE_TEXT: Record<PunchType, string> = {
  jab: 'text-amber-300',
  hook: 'text-emerald-300',
  uppercut: 'text-violet-300',
}

function formatSpeed(speed: number): string {
  return `${speed.toFixed(1)}×/s`
}

function StatCard({
  label,
  value,
  unit,
  gradient,
}: {
  label: string
  value: number | string
  unit?: string
  gradient: string
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center">
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${gradient}`} />
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
      <p className="mt-1 text-3xl font-black tabular-nums text-white">
        {value}
        {unit && <span className="ml-0.5 text-sm font-bold text-zinc-400">{unit}</span>}
      </p>
    </div>
  )
}

type Totals = PunchMetricsSnapshot['totalsByType']

function countToPercent(count: number, total: number): string {
  if (total === 0) {
    return '0%'
  }
  return `${Math.round((count / total) * 100)}%`
}

export const PunchMetricsPanel = memo(function PunchMetricsPanel({
  metrics,
  punches,
  onReset,
  className = '',
}: PunchMetricsPanelProps) {
  const totals = metrics.totalsByType as Totals
  const total = metrics.totalCount
  const leftTotal = metrics.totalsBySide.left
  const rightTotal = metrics.totalsBySide.right
  const dominantSide = leftTotal >= rightTotal ? 'left' : 'right'
  const maxSide = Math.max(leftTotal, rightTotal, 1)
  const last =
    metrics.lastPunchType !== null && metrics.lastPunchSide !== null ? metrics.lastPunchSide : null

  return (
    <section className={`glass flex w-full flex-col gap-4 rounded-3xl p-4 ${className}`}>
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-gradient-to-br from-sky-400 to-violet-500 shadow-[0_0_10px_rgba(56,189,248,0.8)]" />
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
            Live metrics
          </h2>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-white/10 px-2.5 py-1 text-xs font-semibold text-zinc-400 transition-colors hover:border-white/25 hover:text-zinc-100"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Punches" value={total} gradient="from-sky-400 to-violet-500" />
        <StatCard
          label="Combo"
          value={metrics.currentCombo}
          gradient="from-orange-400 to-rose-500"
        />
        <StatCard
          label="Pace"
          value={metrics.punchesPerMinute}
          unit="/m"
          gradient="from-emerald-400 to-teal-500"
        />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Punch types
        </p>
        <div className="flex flex-col gap-2.5">
          {(['jab', 'hook', 'uppercut'] as const).map((type) => (
            <div key={type}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className={`font-semibold ${TYPE_TEXT[type]}`}>{TYPE_LABEL[type]}</span>
                <span className="font-mono tabular-nums text-zinc-400">
                  {totals[type]} · {countToPercent(totals[type], total)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/5">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${TYPE_GRADIENT[type]} transition-all duration-500`}
                  style={{ width: countToPercent(totals[type], Math.max(total, 1)) }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {(['left', 'right'] as PunchSide[]).map((side) => {
          const count = side === 'left' ? leftTotal : rightTotal
          const isDominant = dominantSide === side && count > 0
          return (
            <div key={side} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${SIDE_TEXT[side]}`}>{SIDE_LABEL[side]}</span>
                <span className="font-mono text-sm font-bold tabular-nums text-zinc-200">
                  {count}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${SIDE_GRADIENT[side]} transition-all duration-500 ${isDominant ? 'shadow-[0_0_10px_rgba(255,255,255,0.35)]' : ''}`}
                  style={{ width: `${(count / maxSide) * 100}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            Last punch
          </p>
          <p className="mt-1 flex items-center gap-2 text-sm font-bold text-zinc-200">
            <span
              className={`size-2 rounded-full ${last !== null ? SIDE_DOT[last] : 'bg-zinc-600'}`}
            />
            {metrics.lastPunchType !== null
              ? `${TYPE_LABEL[metrics.lastPunchType]} · ${SIDE_LABEL[metrics.lastPunchSide ?? 'left']}`
              : '—'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            Peak speed
          </p>
          <p className="mt-1 font-mono text-sm font-bold tabular-nums text-zinc-200">
            {metrics.peakSpeed === null ? '—' : formatSpeed(metrics.peakSpeed)}
          </p>
        </div>
      </div>

      <ul className="flex max-h-44 flex-col gap-1.5 overflow-y-auto pr-1">
        {punches.length === 0 && (
          <li className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-center text-sm text-zinc-500">
            Throw a punch to see it here.
          </li>
        )}
        {punches.map((punch, index) => (
          <li
            key={`${punch.timestampMs}-${punch.side}-${index}`}
            className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2"
          >
            <span className="flex items-center gap-2.5 text-sm font-bold">
              <span
                className={`size-2 rounded-full ${SIDE_DOT[punch.side]} shadow-[0_0_8px_1px_rgba(255,255,255,0.15)]`}
              />
              <span className={SIDE_TEXT[punch.side]}>{SIDE_LABEL[punch.side].toUpperCase()}</span>
              <span className="text-zinc-300">{TYPE_LABEL[punch.type]}</span>
            </span>
            <span className="font-mono text-xs tabular-nums text-zinc-400">
              {formatSpeed(punch.speed)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
})
