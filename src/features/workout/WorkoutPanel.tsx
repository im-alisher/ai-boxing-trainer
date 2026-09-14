import { memo } from 'react'
import type { PunchType } from '@/types/punch'
import type { WorkoutSnapshot, WorkoutSummary } from '@/game/workoutSession'

export interface WorkoutPanelProps {
  workout: WorkoutSnapshot
  history: WorkoutSummary[]
  onBegin: () => void
  onPause: () => void
  onResume: () => void
  onFinish: () => void
  onClearHistory: () => void
  className?: string
}

const TYPE_LABEL: Record<PunchType, string> = {
  jab: 'Jab',
  hook: 'Hook',
  uppercut: 'Uppercut',
}

const TYPE_DOT: Record<PunchType, string> = {
  jab: 'bg-amber-400',
  hook: 'bg-emerald-400',
  uppercut: 'bg-violet-400',
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function formatStartedAt(ms: number): string {
  return new Date(ms).toLocaleString()
}

function formatSpeed(speed: number): string {
  return `${speed.toFixed(1)}×/s`
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-zinc-400">{label}</span>
      <span className="font-semibold tabular-nums text-zinc-100">{value}</span>
    </div>
  )
}

function WorkoutSummaryCard({ summary }: { summary: WorkoutSummary }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex flex-col items-center gap-1">
        <p className="text-3xl font-black tabular-nums text-gradient-shine">
          {formatElapsed(summary.durationMs)}
        </p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Session complete
        </p>
      </div>
      <div className="h-px bg-white/5" />
      <SummaryRow
        label="Punches"
        value={`${summary.totalPunches} (${summary.totalsBySide.left}L / ${summary.totalsBySide.right}R)`}
      />
      {(['jab', 'hook', 'uppercut'] as const).map((type) => (
        <SummaryRow
          key={type}
          label={TYPE_LABEL[type]}
          value={summary.totalsByType[type].toString()}
        />
      ))}
      <SummaryRow
        label="Avg speed"
        value={summary.avgSpeed === null ? '—' : formatSpeed(summary.avgSpeed)}
      />
      <SummaryRow
        label="Peak speed"
        value={summary.peakSpeed === null ? '—' : formatSpeed(summary.peakSpeed)}
      />
      <SummaryRow label="Longest combo" value={summary.longestCombo.toString()} />
    </div>
  )
}

function HistoryList({ history, onClear }: { history: WorkoutSummary[]; onClear: () => void }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Previous sessions
        </p>
        {history.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="rounded px-2 py-0.5 text-xs font-semibold text-zinc-500 transition-colors hover:text-zinc-300"
          >
            Clear
          </button>
        )}
      </div>
      {history.length === 0 && (
        <p className="rounded-xl border border-dashed border-white/10 px-3 py-3 text-center text-sm text-zinc-500">
          No sessions yet — finish one to save it.
        </p>
      )}
      <ul className="flex max-h-52 flex-col gap-1.5 overflow-y-auto pr-1">
        {history.map((entry) => (
          <li key={entry.id} className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-zinc-300">{formatStartedAt(entry.startedAtMs)}</span>
              <span className="font-mono text-xs tabular-nums text-zinc-500">
                {formatElapsed(entry.durationMs)}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {(['jab', 'hook', 'uppercut'] as const).map((type) => (
                  <span
                    key={type}
                    className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400"
                    title={TYPE_LABEL[type]}
                  >
                    <span className={`size-1.5 rounded-full ${TYPE_DOT[type]}`} />
                    {entry.totalsByType[type]}
                  </span>
                ))}
              </div>
              <span className="font-mono text-[11px] tabular-nums text-zinc-500">
                {entry.totalPunches} total
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

const CONTROL_STYLES = {
  primary:
    'from-emerald-400 to-teal-500 text-emerald-950 shadow-[0_12px_30px_-12px_rgba(52,211,153,0.9)]',
  muted: 'bg-zinc-800/80 text-zinc-100 hover:bg-zinc-700/80',
  danger: 'from-rose-500 to-red-500 text-white shadow-[0_12px_30px_-12px_rgba(244,63,94,0.9)]',
} as const

function ControlButton({
  label,
  icon,
  onClick,
  variant,
  disabled,
}: {
  label: string
  icon?: 'play' | 'pause' | 'stop'
  onClick: () => void
  variant: keyof typeof CONTROL_STYLES
  disabled?: boolean
}) {
  const icons = {
    play: (
      <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M7 4.5v15a.75.75 0 0 0 1.14.64l12-7.5a.75.75 0 0 0 0-1.28l-12-7.5A.75.75 0 0 0 7 4.5Z" />
      </svg>
    ),
    pause: (
      <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M7 5.5a1.5 1.5 0 0 1 3 0v13a1.5 1.5 0 0 1-3 0v-13Zm7 0a1.5 1.5 0 0 1 3 0v13a1.5 1.5 0 0 1-3 0v-13Z" />
      </svg>
    ),
    stop: (
      <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <rect x="6" y="6" width="12" height="12" rx="2" />
      </svg>
    ),
  } as const

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition-all hover:brightness-110 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none bg-gradient-to-r ${CONTROL_STYLES[variant]}`}
    >
      {icon && icons[icon]}
      {label}
    </button>
  )
}

function isFinished(workout: WorkoutSnapshot): boolean {
  return workout.state === 'finished'
}

export const WorkoutPanel = memo(function WorkoutPanel({
  workout,
  history,
  onBegin,
  onPause,
  onResume,
  onFinish,
  onClearHistory,
  className = '',
}: WorkoutPanelProps) {
  const running = workout.state === 'running'
  const paused = workout.state === 'paused'
  const finished = isFinished(workout)
  const idle = workout.state === 'idle'
  const canFinish = running || paused

  const showSummary = finished && workout.lastSummary !== null

  return (
    <section className={`glass w-full rounded-3xl p-4 ${className}`}>
      <div className="flex items-center gap-2 px-1">
        <span className="size-2 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
        <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
          Workout session
        </h2>
      </div>

      <div className="mt-3 flex flex-col items-center gap-3 rounded-2xl border border-white/5 bg-zinc-950/40 px-3 py-4">
        <div className="flex flex-col items-center">
          <p
            className={`font-mono text-5xl font-black tabular-nums tracking-tight ${
              running ? 'text-gradient-shine' : 'text-zinc-200'
            }`}
          >
            {idle ? '--:--' : formatElapsed(workout.elapsedMs)}
          </p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            {running ? 'Round in progress' : idle ? 'Ready when you are' : 'Elapsed time'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {running ? (
            <ControlButton label="Pause" icon="pause" variant="muted" onClick={onPause} />
          ) : paused ? (
            <ControlButton label="Resume" icon="play" variant="primary" onClick={onResume} />
          ) : (
            <ControlButton label="Start round" icon="play" variant="primary" onClick={onBegin} />
          )}
          {canFinish && (
            <ControlButton label="Finish" icon="stop" variant="danger" onClick={onFinish} />
          )}
        </div>
      </div>

      {running && workout.metrics.totalCount > 0 && (
        <div className="mt-2 flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 text-sm">
          <span className="text-zinc-400">Session punches</span>
          <span className="font-mono font-bold tabular-nums text-amber-300">
            {workout.metrics.totalCount}
            <span className="ml-2 text-xs font-semibold text-zinc-500">
              combo {workout.metrics.currentCombo}
            </span>
          </span>
        </div>
      )}

      {showSummary && <WorkoutSummaryCard summary={workout.lastSummary as WorkoutSummary} />}

      <div className="mt-3">
        <HistoryList history={history} onClear={onClearHistory} />
      </div>
    </section>
  )
})
