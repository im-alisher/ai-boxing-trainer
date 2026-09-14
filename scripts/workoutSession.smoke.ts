import { WorkoutManager } from '../src/game/workoutSession'
import type { PunchEvent } from '../src/types/punch'

let failures = 0

function check(label: string, condition: boolean, detail: string): void {
  if (condition) {
    console.log(`  [PASS] ${label} -> ${detail}`)
  } else {
    failures += 1
    console.log(`  [FAIL] ${label} -> ${detail}`)
  }
}

const punch = (
  type: PunchEvent['type'],
  side: PunchEvent['side'],
  speed: number,
  timestampMs: number,
): PunchEvent => ({ type, side, speed, timestampMs })

const manager = new WorkoutManager()

let snap = manager.getState(manager.getMetricsSnapshot())
check('starts idle', snap.state === 'idle', snap.state)

manager.begin()
snap = manager.getState(manager.getMetricsSnapshot())
check('begins running', snap.state === 'running' && snap.startedAtMs !== null, snap.state)

manager.feed(punch('jab', 'left', 6.5, 1_000))
manager.feed(punch('hook', 'left', 5.0, 2_000))
manager.feed(punch('uppercut', 'right', 7.2, 3_000))
snap = manager.getState(manager.getMetricsSnapshot())
check('feeds only during running', snap.metrics.totalCount === 3, `${snap.metrics.totalCount}`)

manager.pause()
snap = manager.getState(manager.getMetricsSnapshot())
check('pauses session', snap.state === 'paused', snap.state)

manager.feed(punch('jab', 'left', 4.0, 4_000))
snap = manager.getState(manager.getMetricsSnapshot())
check('ignores punches while paused', snap.metrics.totalCount === 3, `${snap.metrics.totalCount}`)

const elapsedBeforeResume = snap.elapsedMs
manager.resume()
snap = manager.getState(manager.getMetricsSnapshot())
check('resumes session', snap.state === 'running', snap.state)
check(
  'elapsed continues from accumulated time',
  snap.elapsedMs >= elapsedBeforeResume,
  `${elapsedBeforeResume} -> ${snap.elapsedMs}`,
)

manager.feed(punch('jab', 'right', 8.0, 5_000))
const summary = manager.finish()
snap = manager.getState(manager.getMetricsSnapshot())

check('finish returns summary', summary !== null, summary !== null ? summary.id : 'null')
check('finishes session', snap.state === 'finished', snap.state)
check('summary counts punches', summary?.totalPunches === 4, `${summary?.totalPunches}`)
check(
  'summary splits by side',
  summary?.totalsBySide.left === 2 && summary?.totalsBySide.right === 2,
  `${summary?.totalsBySide.left}L/${summary?.totalsBySide.right}R`,
)
check(
  'summary splits by type',
  summary?.totalsByType.jab === 2 &&
    summary?.totalsByType.hook === 1 &&
    summary?.totalsByType.uppercut === 1,
  `${summary?.totalsByType.jab}J/${summary?.totalsByType.hook}H/${summary?.totalsByType.uppercut}U`,
)
check('summary tracks peak speed', summary?.peakSpeed === 8.0, `${summary?.peakSpeed}`)
check(
  'summary tracks avg speed',
  summary?.avgSpeed !== null && summary.avgSpeed > 6,
  `${summary?.avgSpeed}`,
)
check('summary tracks longest combo', summary?.longestCombo === 4, `${summary?.longestCombo}`)
check('summary has duration', (summary?.durationMs ?? 0) > 0, `${summary?.durationMs}`)

manager.feed(punch('hook', 'left', 5.0, 6_000))
snap = manager.getState(manager.getMetricsSnapshot())
check('ignores after finish', snap.metrics.totalCount === 4, `${snap.metrics.totalCount}`)

manager.begin()
snap = manager.getState(manager.getMetricsSnapshot())
check(
  'begin resets session for new workout',
  snap.metrics.totalCount === 0 && snap.elapsedMs < 10,
  `${snap.metrics.totalCount}/${snap.elapsedMs}`,
)

if (failures > 0) {
  console.log(`\n${failures} check(s) failed`)
  process.exit(1)
} else {
  console.log('\nall checks passed')
}
