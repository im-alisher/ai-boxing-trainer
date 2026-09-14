import { PunchDetector } from '@/game/punchDetector'
import type { NormalizedLandmark } from '@mediapipe/tasks-vision'
import type { PunchFrameData, PunchType } from '@/types/punch'

const FS = 1000 / 60

function p(x: number, y: number, z = 0): NormalizedLandmark {
  return { x, y, z, visibility: 1 }
}

const LS = p(0.4, 0.4, 0.02)
const RS = p(0.6, 0.4, 0.02)

const GUARD_WRIST = p(0.4, 0.31, -0.02)
const GUARD_ELBOW = p(0.48, 0.42, -0.01)

function frame(
  t: number,
  lw: NormalizedLandmark,
  le: NormalizedLandmark,
  rw: NormalizedLandmark = p(0.6, 0.3, -0.02),
  re: NormalizedLandmark = p(0.54, 0.36, -0.01),
): PunchFrameData {
  return {
    timestampMs: t,
    shoulderWidth: 0.2,
    leftShoulder: LS,
    leftElbow: le,
    leftWrist: lw,
    rightShoulder: RS,
    rightElbow: re,
    rightWrist: rw,
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function guardFor(t: number, detector: PunchDetector, seconds: number): number {
  for (let i = 0; i < (seconds * 1000) / FS; i += 1) {
    detector.update(frame(t, GUARD_WRIST, GUARD_ELBOW))
    t += FS
  }
  return t
}

interface Scenario {
  name: string
  expected: PunchType
  endWrist: NormalizedLandmark
  endElbow: NormalizedLandmark
  steps: number
}

const scenarios: Scenario[] = [
  {
    name: 'jab',
    expected: 'jab',
    endWrist: p(0.16, 0.5, -0.1),
    endElbow: p(0.25, 0.48, -0.04),
    steps: 14,
  },
  {
    name: 'hook',
    expected: 'hook',
    endWrist: p(0.56, 0.32, -0.03),
    endElbow: p(0.52, 0.42, -0.01),
    steps: 10,
  },
  {
    name: 'uppercut',
    expected: 'uppercut',
    endWrist: p(0.34, 0.14, -0.05),
    endElbow: p(0.42, 0.42, -0.02),
    steps: 9,
  },
]

for (const scenario of scenarios) {
  const detector = new PunchDetector()
  let t = guardFor(1_000, detector, 0.7)

  const events: string[] = []
  for (let step = 0; step < scenario.steps; step += 1) {
    const k = step / (scenario.steps - 1)
    const lw = p(
      lerp(GUARD_WRIST.x, scenario.endWrist.x, k),
      lerp(GUARD_WRIST.y, scenario.endWrist.y, k),
      lerp(GUARD_WRIST.z, scenario.endWrist.z, k),
    )
    const le = p(
      lerp(GUARD_ELBOW.x, scenario.endElbow.x, k),
      lerp(GUARD_ELBOW.y, scenario.endElbow.y, k),
      lerp(GUARD_ELBOW.z, scenario.endElbow.z, k),
    )
    const result = detector.update(frame(t, lw, le))
    for (const event of result) {
      events.push(`${event.side} ${event.type} ${event.speed.toFixed(2)}x/s`)
    }
    t += FS
  }

  // hold extended position so the wrist decelerates and the window closes
  for (let i = 0; i < 15; i += 1) {
    const result = detector.update(frame(t, scenario.endWrist, scenario.endElbow))
    for (const event of result) {
      events.push(`${event.side} ${event.type} ${event.speed.toFixed(2)}x/s`)
    }
    t += FS
  }

  // retract back to guard and rest
  for (let step = 0; step < 12; step += 1) {
    const k = step / 11
    const lw = p(
      lerp(scenario.endWrist.x, GUARD_WRIST.x, k),
      lerp(scenario.endWrist.y, GUARD_WRIST.y, k),
      lerp(scenario.endWrist.z, GUARD_WRIST.z, k),
    )
    const le = p(
      lerp(scenario.endElbow.x, GUARD_ELBOW.x, k),
      lerp(scenario.endElbow.y, GUARD_ELBOW.y, k),
      lerp(scenario.endElbow.z, GUARD_ELBOW.z, k),
    )
    const result = detector.update(frame(t, lw, le))
    for (const event of result) {
      events.push(`${event.side} ${event.type} ${event.speed.toFixed(2)}x/s`)
    }
    t += FS
  }
  for (let i = 0; i < 20; i += 1) {
    const result = detector.update(frame(t, GUARD_WRIST, GUARD_ELBOW))
    for (const event of result) {
      events.push(`${event.side} ${event.type} ${event.speed.toFixed(2)}x/s`)
    }
    t += FS
  }

  const matched = events.some((line) => line.includes(`left ${scenario.expected}`))
  const wrong = events.find((line) => !line.includes(`left ${scenario.expected}`))
  const status = matched && wrong === undefined ? 'PASS' : 'FAIL'
  console.log(`[${status}] ${scenario.name}`)
  console.log(events.length > 0 ? `  -> ${events.join('\n  -> ')}` : '  -> (no events)')
}
