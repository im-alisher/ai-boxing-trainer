import { PunchMetricsTracker } from '../src/game/metricsTracker'
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

console.log('=== metrics tracker ===')

{
  const tracker = new PunchMetricsTracker()
  let snap = tracker.snapshot()
  check(
    'fresh snapshot is empty',
    snap.totalCount === 0 && snap.peakSpeed === null,
    `${snap.totalCount}/${snap.currentCombo}/${snap.longestCombo}`,
  )

  snap = tracker.feed(punch('jab', 'left', 6.5, 1_000))
  check(
    'first punch counted',
    snap.totalCount === 1 && snap.totalsBySide.left === 1,
    `${snap.totalsBySide.left}L/${snap.totalsByType.jab}J/${snap.lastPunchType}`,
  )
  check(
    'first combo starts at 1',
    snap.currentCombo === 1,
    `${snap.currentCombo}/${snap.longestCombo}`,
  )

  snap = tracker.feed(punch('hook', 'left', 5.0, 1_400))
  check(
    'second punch in combo',
    snap.currentCombo === 2 && snap.longestCombo === 2,
    `${snap.currentCombo}/${snap.longestCombo}`,
  )

  snap = tracker.feed(punch('uppercut', 'right', 7.2, 3_600))
  check('gap breaks combo', snap.currentCombo === 1, `${snap.currentCombo}/${snap.longestCombo}`)
  check('side totals tracked', snap.totalsBySide.right === 1, `${snap.totalsBySide.right}R`)

  snap = tracker.feed(punch('jab', 'right', 8.0, 4_000))
  check(
    'reopened combo increments',
    snap.currentCombo === 2 && snap.longestCombo === 2,
    `${snap.currentCombo}/${snap.longestCombo}`,
  )
  check('peak speed tracked', snap.peakSpeed === 8.0, `${snap.peakSpeed}`)
  check('last speed tracked', snap.lastSpeed === 8.0, `${snap.lastSpeed}`)

  snap = tracker.feed(punch('hook', 'right', 6.0, 4_300))
  check(
    'three-punch combo',
    snap.currentCombo === 3 && snap.longestCombo === 3,
    `${snap.currentCombo}/${snap.longestCombo}`,
  )

  snap = tracker.reset()
  check(
    'reset clears totals',
    snap.totalCount === 0 && snap.peakSpeed === null && snap.longestCombo === 0,
    `${snap.totalCount}/${snap.peakSpeed}/${snap.longestCombo}`,
  )
}

{
  const tracker = new PunchMetricsTracker()
  for (let i = 0; i < 60; i += 1) {
    tracker.feed(punch(i % 2 === 0 ? 'jab' : 'hook', i % 2 === 0 ? 'left' : 'right', 5, i * 1_000))
  }
  let snap = tracker.snapshot()
  check(
    'pace over 59s window',
    snap.punchesPerMinute === 61,
    `${snap.punchesPerMinute}pmm/${snap.totalCount}`,
  )

  snap = tracker.feed(punch('hook', 'right', 5, 120_000))
  check(
    'old punches pruned from pace',
    snap.punchesPerMinute === 60 && snap.totalCount === 61,
    `${snap.punchesPerMinute}pmm/${snap.totalCount}`,
  )
}

if (failures > 0) {
  console.log(`\n${failures} check(s) failed`)
  process.exit(1)
} else {
  console.log('\nall checks passed')
}
