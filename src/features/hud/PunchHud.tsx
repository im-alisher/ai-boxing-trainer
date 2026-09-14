import { memo } from 'react'
import type { PunchEvent, PunchSide, PunchType } from '@/types/punch'
import type { PunchMetricsSnapshot } from '@/game/metricsTracker'

export interface PunchHudProps {
  metrics: PunchMetricsSnapshot
  lastPunch: PunchEvent | null
  className?: string
}

const TYPE_LABEL: Record<PunchType, string> = {
  jab: 'Jab',
  hook: 'Hook',
  uppercut: 'Uppercut',
}

const SIDE_LABEL: Record<PunchSide, string> = {
  left: 'LEFT',
  right: 'RIGHT',
}

const TYPE_TEXT: Record<PunchType, string> = {
  jab: 'text-amber-400',
  hook: 'text-emerald-400',
  uppercut: 'text-purple-400',
}

const TYPE_RING: Record<PunchType, string> = {
  jab: 'ring-amber-400/70',
  hook: 'ring-emerald-400/70',
  uppercut: 'ring-purple-400/70',
}

const FLASH_RGBA: Record<PunchType, string> = {
  jab: 'rgba(251, 191, 36, 0.16)',
  hook: 'rgba(52, 211, 153, 0.16)',
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

  return (
    <div className={`pointer-events-none absolute inset-0 select-none text-white ${className}`}>
      {punch !== null && (
        <div
          key={`flash-${punch.timestampMs}`}
          className="absolute inset-0 animate-hud-flash"
          style={{ backgroundColor: FLASH_RGBA[punch.type] }}
        />
      )}
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/50 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />

      <div className="absolute left-4 top-4 flex items-center gap-3">
        {punch !== null && (
          <div
            key={punch.timestampMs}
            className={`flex items-center gap-2.5 rounded-xl bg-zinc-950/80 px-4 py-2 ring-2 backdrop-blur-sm animate-hud-pop ${TYPE_RING[punch.type]}`}
          >
            <span className={`text-lg font-bold uppercase tracking-wider ${TYPE_TEXT[punch.type]}`}>
              {SIDE_LABEL[punch.side]} {TYPE_LABEL[punch.type]}
            </span>
            <span className="font-mono text-sm text-zinc-300">{formatSpeed(punch.speed)}</span>
          </div>
        )}
        {punch === null && (
          <div className="rounded-xl bg-zinc-950/60 px-4 py-2 text-sm text-zinc-400 backdrop-blur-sm">
            Throw a punch — callout appears here
          </div>
        )}
      </div>

      {combo >= 2 && (
        <div
          key={`combo-${punch?.timestampMs ?? 'idle'}`}
          className={`absolute right-4 top-4 flex items-center gap-1.5 rounded-xl px-4 py-2 text-lg font-bold backdrop-blur-sm animate-hud-pop ${
            hot
              ? 'bg-orange-500/90 text-orange-950 ring-2 ring-orange-300/50'
              : 'bg-zinc-950/80 ring-2 ring-zinc-600/60 text-zinc-100'
          }`}
        >
          <span className="text-sm font-semibold uppercase tracking-widest">Combo</span>
          <span className={`tabular-nums ${hot ? 'text-orange-950' : 'text-amber-400'}`}>
            ×{combo}
          </span>
        </div>
      )}

      <div className="absolute bottom-4 left-4 flex items-end gap-2">
        {metrics.lastSpeed !== null && (
          <div key={`speed-${punch?.timestampMs ?? 'idle'}`} className="animate-hud-pop">
            <p className="font-mono text-3xl font-bold tabular-nums drop-shadow">
              {formatSpeed(metrics.lastSpeed)}
            </p>
            <p className="text-[11px] uppercase tracking-wider text-zinc-300 drop-shadow">
              last speed
            </p>
          </div>
        )}
        {metrics.lastSpeed === null && (
          <p className="text-xs text-zinc-400 drop-shadow">waiting for first punch…</p>
        )}
      </div>

      {metrics.punchesPerMinute > 0 && (
        <div className="absolute bottom-4 right-4 rounded-lg bg-zinc-950/60 px-3 py-1.5 text-right backdrop-blur-sm">
          <p className="font-mono text-sm font-semibold tabular-nums text-sky-300">
            {metrics.punchesPerMinute}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-zinc-400">pace /min</p>
        </div>
      )}
    </div>
  )
})
