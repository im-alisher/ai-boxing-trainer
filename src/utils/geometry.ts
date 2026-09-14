export interface Point2D {
  x: number
  y: number
}

export interface Point3D extends Point2D {
  z: number
}

export function distance(a: Point2D, b: Point2D): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

export function distance3(a: Point3D, b: Point3D): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const dz = a.z - b.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

export function moveTowards(current: number, target: number, alpha: number): number {
  return current + (target - current) * alpha
}

export function angleDegrees(a: Point2D, b: Point2D, c: Point2D): number {
  const ab = distance(a, b)
  const bc = distance(b, c)
  const ac = distance(a, c)

  const denominator = 2 * ab * bc
  if (denominator === 0) {
    return 180
  }

  const cosine = (ab * ab + bc * bc - ac * ac) / denominator
  const clamped = Math.min(1, Math.max(-1, cosine))
  return (Math.acos(clamped) * 180) / Math.PI
}
