/* The player character, composed from the art kit's palette and proportions.
   noby() and nobyTail() aren't called directly: they expose only a single
   vertical scale and static feet, which can't express an opening mouth, a lump
   travelling down the body, or a walk cycle. */

import { FOOT_LIFT } from './constants'
import { PAL, RAINBOW } from './noby-sprites.js'

type Ctx = CanvasRenderingContext2D

const CAP_W = 22 // capsule pitch, matching nobyBody
const CAP_OVERLAP = 6
const WAVE_AMP = 7
const BODY_H = 44
const BULGE_AMOUNT = 0.6 // how much a swallowed lump swells a capsule
const SICK_FACE = '#BFD9A0' // queasy green the face oval fades toward

function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16)
  const pb = parseInt(b.slice(1), 16)
  const ch = (shift: number) => {
    const x = (pa >> shift) & 255
    const y = (pb >> shift) & 255
    return Math.round(x + (y - x) * t)
  }
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`
}

export interface BoyAnim {
  /** 0..1 — head swells and the mouth opens while food is going in. */
  bite: number
  /** 0..1 progress of a lump travelling head -> tail, or -1 when idle. */
  swallow: number
  /** Gait phase in radians, keyed to distance travelled. */
  walk: number
  /** 0..1 — face goes green and the eyes squeeze shut after eating a friend. */
  sick: number
  /** 0..1 — big grin while the body's bouncing around; the eyes stay as they are. */
  happy: number
}

const circ = (c: Ctx, x: number, y: number, r: number, f: string) => {
  c.fillStyle = f
  c.beginPath()
  c.arc(x, y, r, 0, Math.PI * 2)
  c.fill()
}
const ell = (c: Ctx, x: number, y: number, rx: number, ry: number, f: string) => {
  c.fillStyle = f
  c.beginPath()
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
  c.fill()
}
const rr = (c: Ctx, x: number, y: number, w: number, h: number, r: number, f: string) => {
  c.fillStyle = f
  c.beginPath()
  c.roundRect(x, y, w, h, r)
  c.fill()
}

/** A big "U" grin: a bowl with a gently dipped top lip, corners rounded by the stroke. */
function smile(c: Ctx, x: number, y: number, rx: number, ry: number): void {
  c.fillStyle = PAL.orange
  c.strokeStyle = PAL.orange
  c.lineWidth = 3
  c.lineJoin = 'round'
  c.beginPath()
  c.moveTo(x - rx, y)
  c.quadraticCurveTo(x, y + ry * 0.35, x + rx, y) // top lip dips a little
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI) // round bottom of the U
  c.closePath()
  c.fill()
  c.stroke()
}

/** Feet only ever rise, so they plant on the ground instead of sinking through it. */
function step(walk: number, offset: number): number {
  return Math.max(0, Math.sin(walk + offset)) * FOOT_LIFT
}

/** Screen-space bottom-center anchor and uniform scale for one piece of the boy. */
export interface Anchor {
  x: number
  y: number
  s: number
  /** Radians about the piece's own center; only set while it's flying loose. */
  rot?: number
}

export interface BoyPose {
  head: Anchor
  /** Capsules from the head end back toward the tail; may be cut short off-screen. */
  segments: Anchor[]
  /** Null when the tail end is off-screen and was culled. */
  tail: Anchor | null
}

/** Gaussian lump centered on the swallow position, in head-relative capsule index. */
function bulgeAt(j: number, n: number, swallow: number): number {
  if (swallow < 0) return 0
  const center = (n - 1) * swallow // starts at the head end, travels to the tail
  const d = j - center
  return Math.exp(-(d * d) / 2.2)
}

/** Capsule count for a body length, matching how the kit's nobyBody paces them. */
export function capsuleCount(len: number): number {
  return Math.max(3, Math.round(len / CAP_W))
}

/**
 * Walk backward from the head, placing one capsule per CAP_W. `depthAt` gives
 * the depth the head had that many px ago, and `place` turns a depth into a
 * baseline y and scale, so each segment sits where the head was when it passed.
 * Stops once the body runs off the left edge (`minX`).
 */
export function layoutBoy(
  head: Anchor,
  len: number,
  depthAt: (distBehind: number) => number,
  place: (depth: number) => { y: number; s: number },
  minX: number,
): BoyPose {
  const n = capsuleCount(len)
  const segments: Anchor[] = []
  // Body starts 4 local px behind the head anchor (kit: body at +30, head at +34).
  let cursor = head.x - 4 * head.s
  for (let j = 0; j < n; j++) {
    if (cursor < minX) return { head, segments, tail: null }
    const { y, s } = place(depthAt(head.x - cursor))
    cursor -= CAP_W * s
    segments.push({ x: cursor, y, s })
  }
  if (cursor < minX) return { head, segments, tail: null }
  const { y, s } = place(depthAt(head.x - cursor))
  return { head, segments, tail: { x: cursor - 4 * s, y, s } }
}

function drawSegment(c: Ctx, seg: Anchor, j: number, n: number, t: number, swallow: number, baseH: number): void {
  const dy = Math.sin(t * 3.3 + j * 0.55) * WAVE_AMP
  const h = baseH * (1 + BULGE_AMOUNT * bulgeAt(j, n, swallow))
  c.save()
  c.translate(seg.x, seg.y - 26 * seg.s)
  c.scale(seg.s, seg.s)
  if (seg.rot) {
    const cx = (CAP_W + CAP_OVERLAP) / 2
    const cy = -h / 2 + dy
    c.translate(cx, cy)
    c.rotate(seg.rot)
    c.translate(-cx, -cy)
  }
  c.fillStyle = RAINBOW[j % RAINBOW.length]
  c.beginPath()
  c.roundRect(0, -h + dy, CAP_W + CAP_OVERLAP, h, h / 2)
  c.fill()
  c.restore()
}

function drawTail(c: Ctx, walk: number): void {
  rr(c, -28, -20 - step(walk, Math.PI * 0.5), 20, 12, 6, PAL.purple)
  rr(c, 8, -20 - step(walk, Math.PI * 1.5), 20, 12, 6, PAL.purple)
  circ(c, 0, -46, 32, PAL.pink)
}

function drawHead(c: Ctx, look: number, bite: number, walk: number, sick: number, happy: number): void {
  rr(c, -56, -64, 18, 11, 5.5, PAL.pink) // arm nubs
  rr(c, 38, -64, 18, 11, 5.5, PAL.pink)
  rr(c, -28, -22 - step(walk, 0), 20, 12, 6, PAL.purple) // feet
  rr(c, 8, -22 - step(walk, Math.PI), 20, 12, 6, PAL.purple)

  c.save()
  const grow = 1 + 0.22 * bite
  c.translate(0, -55)
  c.scale(grow, grow)
  c.translate(0, 55)

  ell(c, 0, -55, 52, 40, PAL.pink)

  /* The face oval grows along with the mouth so the open mouth is always fully
     contained inside it, and the eyes and nose ride up to clear the mouth.
     At bite = 1: oval -78..-18, mouth -47..-21, nose -60.6..-55.4, eyes
     -68.6..-63.4 — the oval in turn stays inside the head ball's -95..-15. */
  ell(c, 0, -50 + 2 * bite, 32 + 6 * bite, 25 + 5 * bite, mix(PAL.pinkLight, SICK_FACE, sick))

  // Sick eyes squash into little lines.
  const squint = 1 - 0.25 * bite
  const eyeRy = 3.4 * squint * (1 - 0.7 * sick)
  ell(c, -12 + look, -55 - 11 * bite, 3.4 * squint, eyeRy, PAL.ink)
  ell(c, 12 + look, -55 - 11 * bite, 3.4 * squint, eyeRy, PAL.ink)
  ell(c, look, -51 - 7 * bite, 3.6, 2.6, '#E8887F')

  if (happy > 0) {
    smile(c, look, -40, 6 + 10 * happy, 4 + 7 * happy)
  } else {
    ell(c, look, -36 + 2 * bite, 6.8 + 10.2 * bite, 5.6 + 7.4 * bite, PAL.orange)
  }
  c.restore()
}

export function drawBoy(c: Ctx, pose: BoyPose, len: number, t: number, anim: BoyAnim): void {
  const idle = 1 + Math.sin(t * 1.5) * 0.02
  const n = capsuleCount(len)

  // Tail to head, so each capsule overlaps the one behind it.
  for (let j = pose.segments.length - 1; j >= 0; j--) {
    drawSegment(c, pose.segments[j], j, n, t, anim.swallow, BODY_H * idle)
  }

  const { head } = pose
  c.save()
  c.translate(head.x, head.y)
  c.scale(head.s, head.s * idle)
  drawHead(c, Math.sin(t * 1.5) * 1.5, anim.bite, anim.walk, anim.sick, anim.happy)
  c.restore()

  if (pose.tail) {
    c.save()
    c.translate(pose.tail.x, pose.tail.y)
    c.scale(pose.tail.s, pose.tail.s)
    if (pose.tail.rot) {
      c.translate(0, -46) // spin about the ball
      c.rotate(pose.tail.rot)
      c.translate(0, 46)
    }
    drawTail(c, anim.walk)
    c.restore()
  }
}
