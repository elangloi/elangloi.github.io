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

export interface BoyAnim {
  /** 0..1 — head swells and the mouth opens while food is going in. */
  bite: number
  /** 0..1 progress of a lump travelling head -> tail, or -1 when idle. */
  swallow: number
  /** Gait phase in radians, keyed to distance travelled. */
  walk: number
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

/** Feet only ever rise, so they plant on the ground instead of sinking through it. */
function step(walk: number, offset: number): number {
  return Math.max(0, Math.sin(walk + offset)) * FOOT_LIFT
}

/** Gaussian lump centered on the swallow position, in capsule-index space. */
function bulgeAt(i: number, n: number, swallow: number): number {
  if (swallow < 0) return 0
  const center = (n - 1) * (1 - swallow) // starts at the head end, travels to the tail
  const d = i - center
  return Math.exp(-(d * d) / 2.2)
}

function drawBody(c: Ctx, len: number, t: number, swallow: number, baseH: number): void {
  const n = Math.max(3, Math.round(len / CAP_W))
  for (let i = 0; i < n; i++) {
    const px = i * CAP_W
    const dy = Math.sin(t * 3.3 - i * 0.55) * WAVE_AMP
    const h = baseH * (1 + BULGE_AMOUNT * bulgeAt(i, n, swallow))
    c.fillStyle = RAINBOW[i % RAINBOW.length]
    c.beginPath()
    c.roundRect(px, -h + dy, CAP_W + CAP_OVERLAP, h, h / 2)
    c.fill()
  }
}

function drawTail(c: Ctx, walk: number): void {
  rr(c, -28, -20 - step(walk, Math.PI * 0.5), 20, 12, 6, PAL.purple)
  rr(c, 8, -20 - step(walk, Math.PI * 1.5), 20, 12, 6, PAL.purple)
  circ(c, 0, -46, 32, PAL.pink)
}

function drawHead(c: Ctx, look: number, bite: number, walk: number): void {
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
  ell(c, 0, -50 + 2 * bite, 32 + 6 * bite, 25 + 5 * bite, PAL.pinkLight)

  const squint = 1 - 0.25 * bite
  circ(c, -12 + look, -55 - 11 * bite, 3.4 * squint, PAL.ink)
  circ(c, 12 + look, -55 - 11 * bite, 3.4 * squint, PAL.ink)
  ell(c, look, -51 - 7 * bite, 3.6, 2.6, '#E8887F')

  ell(c, look, -36 + 2 * bite, 6.8 + 10.2 * bite, 5.6 + 7.4 * bite, PAL.orange)
  c.restore()
}

export function drawBoy(
  c: Ctx,
  x: number,
  y: number,
  len: number,
  s: number,
  t: number,
  anim: BoyAnim,
): void {
  c.save()
  c.fillStyle = 'rgba(40,80,30,0.16)'
  c.beginPath()
  c.ellipse(x + ((34 + len) * s) / 2, y - 2, ((len + 120) * s) / 2.4, 7 * s, 0, 0, Math.PI * 2)
  c.fill()
  c.restore()

  const idle = 1 + Math.sin(t * 1.5) * 0.02

  c.save()
  c.translate(x + 30 * s, y - 26 * s)
  c.scale(s, s)
  drawBody(c, len, t, anim.swallow, BODY_H * idle)
  c.restore()

  c.save()
  c.translate(x + (34 + len) * s, y)
  c.scale(s, s * idle)
  drawHead(c, Math.sin(t * 1.5) * 1.5, anim.bite, anim.walk)
  c.restore()

  c.save()
  c.translate(x + 26 * s, y)
  c.scale(s, s)
  drawTail(c, anim.walk)
  c.restore()
}
