export const WORKOUT_HISTORY_KEY = 'ai-boxing-trainer.workout-history'
export const WORKOUT_HISTORY_LIMIT = 50

export function loadWorkoutHistory<T = unknown>(): T[] {
  try {
    const raw = window.localStorage.getItem(WORKOUT_HISTORY_KEY)
    if (raw === null) {
      return []
    }
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

export function saveWorkoutHistory(entries: unknown[]): void {
  try {
    window.localStorage.setItem(
      WORKOUT_HISTORY_KEY,
      JSON.stringify(entries.slice(0, WORKOUT_HISTORY_LIMIT)),
    )
  } catch {
    // storage unavailable (e.g. private mode) — ignore
  }
}
