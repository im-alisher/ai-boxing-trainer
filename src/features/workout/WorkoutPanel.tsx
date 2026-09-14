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
      <span className="font-semibold tabular-nums text-zinc-200">{value}</span>
    </div>
  )
}

function WorkoutSummaryCard({ summary }: { summary: WorkoutSummary }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg bg-zinc-950/60 p-3">
      <Pop label="Session time">{formatElapsed(summary.durationMs)}</Pop>
      <div className="h-px bg-zinc-800" />
      <SummaryRow
        label="Punches"
        value={`${summary.totalPunches} (${summary.totalsBySide.left}L/${summary.totalsBySide.right}R)`}
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

function Pop({ children, label }: { children: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <p className="text-4xl font-bold tabular-nums text-white">{children}</p>
      <p className="text-[11px] uppercase tracking-wider text-zinc-500">{label}</p>
    </div>
  )
}

function HistoryList({ history, onClear }: { history: WorkoutSummary[]; onClear: () => void }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wider text-zinc-500">Previous sessions</p>
        {history.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="rounded px-2 py-0.5 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          >
            Clear
          </button>
        )}
      </div>
      {history.length === 0 && (
        <p className="text-sm text-zinc-600">No sessions yet — finish one to save it.</p>
      )}
      <ul className="flex max-h-56 flex-col gap-1.5 overflow-y-auto pr-1">
        {history.map((entry) => (
          <li key={entry.id} className="rounded-lg bg-zinc-950/60 px-3 py-2 text-sm">
            <div className="flex items-baseline justify-between">
              <span className="text-zinc-300">{formatStartedAt(entry.startedAtMs)}</span>
              <span className="font-mono text-xs tabular-nums text-zinc-500">
                {formatElapsed(entry.durationMs)}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-zinc-500">
              {entry.totalPunches} punches · {entry.totalsByType.jab}J {entry.totalsByType.hook}H{' '}
              {entry.totalsByType.uppercut}U · peak{' '}
              {entry.peakSpeed === null ? '—' : formatSpeed(entry.peakSpeed)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}

const CONTROL_STYLES = {
  primary: 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400',
  muted: 'bg-zinc-700 text-zinc-100 hover:bg-zinc-600',
  danger: 'bg-red-500/90 text-white hover:bg-red-400',
} as const

function ControlButton({
  label,
  onClick,
  variant,
  disabled,
}: {
  label: string
  onClick: () => void
  variant: keyof typeof CONTROL_STYLES
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${CONTROL_STYLES[variant]}`}
    >
      {label}
    </button>
  )
}

function isFinished(workout: WorkoutSnapshot): boolean {
  return workout.state === 'finished'
}

export function WorkoutPanel({
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
  const divider = !idle && !showSummary ? 'border-b border-zinc-800 pb-3' : ''

  return (
    <aside
      className={`flex w-full flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 ${className}`}
    >
      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
        Workout session
      </h2>

      <div className={`flex flex-col items-center gap-3 ${divider}`}>
        <Pop label={running ? 'Time' : idle ? 'Ready' : 'Elapsed'}>
          {idle ? '--:--' : formatElapsed(workout.elapsedMs)}
        </Pop>

        <div className="flex gap-2">
          {running ? (
            <ControlButton label="Pause" variant="muted" onClick={onPause} />
          ) : paused ? (
            <ControlButton label="Resume" variant="primary" onClick={onResume} />
          ) : (
            <ControlButton label="Start" variant="primary" onClick={onBegin} />
          )}
          {canFinish && (
            <ControlButton
              label="Finish"
              variant={running ? 'muted' : 'danger'}
              onClick={onFinish}
            />
          )}
        </div>
      </div>

      {running && workout.metrics.totalCount > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-zinc-950/60 px-3 py-2 text-sm">
          <span className="text-zinc-400">Session punches</span>
          <span className="font-semibold tabular-nums text-amber-400">
            {workout.metrics.totalCount}
            <span className="ml-2 text-xs font-normal text-zinc-500">
              combo {workout.metrics.currentCombo}
            </span>
          </span>
        </div>
      )}

      {showSummary && <WorkoutSummaryCard summary={workout.lastSummary as WorkoutSummary} />}

      <HistoryList history={history} onClear={onClearHistory} />
    </aside>
  )
}
