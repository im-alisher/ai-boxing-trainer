import { memo } from 'react'
import type { PunchEvent, PunchSide, PunchType } from '@/types/punch'
import type { PunchMetricsSnapshot } from '@/game/metricsTracker'

export interface PunchHudProps {
  metrics: PunchMetricsSnapshot
  lastPunch: PunchEvent | null
  className?: string
}

const SIDE_LABEL: Record<PunchSide, string> = {
  left: 'LEFT',
  right: 'RIGHT',
}

const TYPE_TEXT: Record<PunchType, string> = {
  jab: 'text-amber-300',
  hook: 'text-emerald-300',
  uppercut: 'text-violet-300',
}

const TYPE_GRADIENT: Record<PunchType, string> = {
  jab: 'from-amber-400/25 to-transparent',
  hook: 'from-emerald-400/25 to-transparent',
  uppercut: 'from-violet-400/25 to-transparent',
}

const TYPE_BAR: Record<PunchType, string> = {
  jab: 'from-amber-400 to-yellow-200',
  hook: 'from-emerald-400 to-teal-200',
  uppercut: 'from-violet-400 to-fuchsia-200',
}

const FLASH_RGBA: Record<PunchType, string> = {
  jab: 'rgba(251, 191, 36, 0.14)',
  hook: 'rgba(52, 211, 153, 0.14)',
  uppercut: 'rgba(167, 139, 250, 0.16)',
}

function formatSpeed(speed: number): string {
  return `${speed.toFixed(1)}×/s`
}

export const PunchHud = memo(function PunchHud({
  metrics,
  lastPunch,
  className = '',
}: PunchHudProps) {
  const punch = lastPunch
  const combo = metrics.currentCombo
  const hot = combo >= 3
  const speed = metrics.lastSpeed

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-10 select-none text-white ${className}`}
    >
      {punch !== null && (
        <div
          key={`flash-${punch.timestampMs}`}
          className="absolute inset-0 animate-hud-flash"
          style={{ backgroundColor: FLASH_RGBA[punch.type] }}
        />
      )}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 to-transparent" />

      <div className="absolute left-5 top-5 flex items-center gap-3">
        {punch !== null && (
          <div
            key={punch.timestampMs}
            className={`relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/70 px-5 py-3 backdrop-blur-md animate-hud-pop`}
          >
            <div
              className={`absolute inset-x-0 top-0 h-full bg-gradient-to-r ${TYPE_GRADIENT[punch.type]}`}
            />
            <div className="relative flex items-end gap-3">
              <span
                className={`text-2xl font-black uppercase tracking-wider ${TYPE_TEXT[punch.type]}`}
              >
                {punch.type}
              </span>
              <span className="pb-0.5 text-xs font-bold tracking-[0.2em] text-zinc-400">
                {SIDE_LABEL[punch.side]}
              </span>
            </div>
            <div className="relative mt-1 font-mono text-sm tabular-nums text-zinc-300">
              {formatSpeed(punch.speed)}
            </div>
          </div>
        )}
        {punch === null && (
          <div className="rounded-2xl border border-white/10 bg-zinc-950/60 px-4 py-2.5 text-sm font-medium text-zinc-300 backdrop-blur-md">
            Throw a punch to light it up
          </div>
        )}
      </div>

      {combo >= 2 && (
        <div
          key={`combo-${punch?.timestampMs ?? 'idle'}`}
          className={`absolute right-5 top-5 flex items-center gap-2 rounded-2xl border px-4 py-2 backdrop-blur-md animate-hud-pop ${
            hot
              ? 'animate-pulse-soft border-orange-300/40 bg-gradient-to-br from-orange-500/30 to-rose-500/30 shadow-[0_0_28px_-6px_rgba(251,146,60,0.9)]'
              : 'border-white/10 bg-zinc-950/70'
          }`}
        >
          <svg
            className={`size-5 ${hot ? 'text-orange-300' : 'text-amber-400'}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5Z" />
          </svg>
          <span
            className={`text-xl font-black tabular-nums ${hot ? 'text-orange-100' : 'text-amber-400'}`}
          >
            {combo}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            combo
          </span>
        </div>
      )}

      <div className="absolute bottom-5 left-5 flex flex-col gap-1.5">
        {punch !== null && (
          <div key={`speed-${punch.timestampMs}`} className="animate-hud-pop">
            <p className="font-mono text-3xl font-black tabular-nums text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              {formatSpeed(speed ?? 0)}
            </p>
            <div className="mt-1 h-1.5 w-36 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${speed !== null && punch !== null ? TYPE_BAR[punch.type] : 'from-white/50 to-white/20'}`}
                style={{
                  width: `${Math.min(100, ((speed ?? 0) / 12) * 100).toFixed(1)}%`,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-300 drop-shadow">
              speed
            </p>
          </div>
        )}
        {punch === null && (
          <p className="text-xs font-medium text-zinc-300 drop-shadow">waiting for first punch…</p>
        )}
      </div>

      {metrics.punchesPerMinute > 0 && (
        <div className="absolute bottom-5 right-5 rounded-2xl border border-white/10 bg-zinc-950/60 px-4 py-2 text-right backdrop-blur-md">
          <p className="font-mono text-2xl font-black tabular-nums text-sky-300">
            {metrics.punchesPerMinute}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
            pace /min
          </p>
        </div>
      )}
    </div>
  )
})
