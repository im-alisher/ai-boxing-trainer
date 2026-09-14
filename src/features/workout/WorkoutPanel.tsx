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
  const d = new Date(ms)
  return d.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatSpeed(speed: number): string {
  return `${speed.toFixed(1)}×/s`
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.03] px-1.5 py-1 text-center">
      <p className="text-sm font-black tabular-nums text-zinc-100">{value}</p>
      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
    </div>
  )
}

function WorkoutSummaryCard({ summary }: { summary: WorkoutSummary }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-emerald-300">Session complete</p>
        <p className="font-mono text-base font-black tabular-nums text-gradient-shine">
          {formatElapsed(summary.durationMs)}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        <MiniStat label="Punches" value={summary.totalPunches.toString()} />
        <MiniStat
          label="L / R"
          value={`${summary.totalsBySide.left} / ${summary.totalsBySide.right}`}
        />
        <MiniStat label="Combo" value={summary.longestCombo.toString()} />
        <MiniStat
          label="Avg"
          value={summary.avgSpeed === null ? '—' : formatSpeed(summary.avgSpeed)}
        />
        <MiniStat
          label="Peak"
          value={summary.peakSpeed === null ? '—' : formatSpeed(summary.peakSpeed)}
        />
        <MiniStat
          label="Jab/Hook/Up"
          value={`${summary.totalsByType.jab}/${summary.totalsByType.hook}/${summary.totalsByType.uppercut}`}
        />
      </div>
    </div>
  )
}

function HistoryList({ history, onClear }: { history: WorkoutSummary[]; onClear: () => void }) {
  const recent = history.slice(0, 2)
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">
          Recent sessions
        </p>
        {history.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-zinc-500 transition-colors hover:text-zinc-300"
          >
            Clear
          </button>
        )}
      </div>
      {recent.length === 0 && (
        <p className="rounded-lg border border-dashed border-white/10 px-2 py-2 text-center text-xs text-zinc-500">
          No sessions yet — finish one to save it here.
        </p>
      )}
      {recent.map((entry) => (
        <div
          key={entry.id}
          className="flex items-center justify-between rounded-lg border border-white/5 border-l-2 border-l-emerald-400 bg-white/[0.03] px-2.5 py-1 text-xs"
        >
          <div className="flex items-center gap-2">
            <span className="text-zinc-300">{formatStartedAt(entry.startedAtMs)}</span>
            <span className="flex items-center gap-1.5">
              {(['jab', 'hook', 'uppercut'] as const).map((type) => (
                <span
                  key={type}
                  className="flex items-center gap-0.5 font-semibold text-zinc-400"
                  title={TYPE_LABEL[type]}
                >
                  <span className={`size-1.5 rounded-full ${TYPE_DOT[type]}`} />
                  {entry.totalsByType[type]}
                </span>
              ))}
            </span>
          </div>
          <span className="font-mono tabular-nums text-zinc-500">
            {formatElapsed(entry.durationMs)}
          </span>
        </div>
      ))}
    </div>
  )
}

const CONTROL_STYLES = {
  primary:
    'from-emerald-400 to-teal-500 text-emerald-950 shadow-[0_10px_26px_-12px_rgba(52,211,153,0.9)]',
  muted:
    'from-amber-400 to-orange-400 text-amber-950 shadow-[0_10px_26px_-12px_rgba(251,146,60,0.9)]',
  danger: 'from-rose-500 to-red-500 text-white shadow-[0_10px_26px_-12px_rgba(244,63,94,0.9)]',
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
      className={`inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r px-4 py-2 text-xs font-bold transition-all hover:brightness-110 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:brightness-100 ${CONTROL_STYLES[variant]}`}
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
    <section className={`glass flex min-h-0 w-full flex-col rounded-3xl p-4 ${className}`}>
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span className="flex size-5 items-center justify-center rounded-md bg-gradient-to-br from-emerald-400 to-teal-500 shadow-[0_0_14px_-2px_rgba(52,211,153,0.8)]">
            <svg
              viewBox="0 0 24 24"
              className="size-3 text-zinc-950"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="13" r="8" />
              <path d="M12 9v4l2.5 2.5M9 2h6" />
            </svg>
          </span>
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-200">
            Workout session
          </h2>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
          {running ? '● Running' : paused ? 'Paused' : finished ? 'Done' : 'Idle'}
        </span>
      </div>

      <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 px-4 py-3 shadow-[inset_0_1px_0_rgba(52,211,153,0.1)]">
          <div className="flex flex-col">
            <p
              className={`font-mono text-3xl font-black tabular-nums leading-none tracking-tight ${
                running ? 'text-gradient-shine' : 'text-zinc-200'
              }`}
            >
              {idle ? '--:--' : formatElapsed(workout.elapsedMs)}
            </p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-zinc-500">
              {running ? 'Round in progress' : idle ? 'Ready when you are' : 'Elapsed time'}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1.5">
              {running ? (
                <ControlButton label="Pause" icon="pause" variant="muted" onClick={onPause} />
              ) : paused ? (
                <ControlButton label="Resume" icon="play" variant="primary" onClick={onResume} />
              ) : (
                <ControlButton label="Start" icon="play" variant="primary" onClick={onBegin} />
              )}
              {canFinish && (
                <ControlButton label="Finish" icon="stop" variant="danger" onClick={onFinish} />
              )}
            </div>
            {running && workout.metrics.totalCount > 0 && (
              <p className="font-mono text-[11px] tabular-nums text-zinc-400">
                <span className="font-bold text-amber-300">{workout.metrics.totalCount}</span>{' '}
                punches
                {workout.metrics.currentCombo > 1 && (
                  <>
                    {' · '}combo{' '}
                    <span className="font-bold text-orange-300">
                      {workout.metrics.currentCombo}
                    </span>
                  </>
                )}
                {workout.metrics.punchesPerMinute > 0 && (
                  <>
                    {' · '}pace{' '}
                    <span className="font-bold text-emerald-300">
                      {workout.metrics.punchesPerMinute}/m
                    </span>
                  </>
                )}
              </p>
            )}
          </div>
        </div>

        {showSummary && <WorkoutSummaryCard summary={workout.lastSummary as WorkoutSummary} />}

        <div className="flex min-h-0 flex-1 flex-col justify-end gap-1.5">
          <HistoryList history={history} onClear={onClearHistory} />
        </div>
      </div>
    </section>
  )
})
