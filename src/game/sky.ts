/* Day/night: the sky blends through dawn → day → dusk → night on a loop, the
   sun arcs over the first half and the moon over the second, and a blue tint
   settles over the world after dark. Both faces are drawn in the boy's style. */

import { DAY_LENGTH_SEC, DAY_START_PHASE, HORIZON_RATIO } from './constants'
import { PAL } from './noby-sprites.js'

type Ctx = CanvasRenderingContext2D

/** 0..1 around the clock: 0 dawn, ~0.25 noon, 0.5 dusk, ~0.75 midnight. */
export function dayPhase(timeSec: number): number {
  const p = (timeSec / DAY_LENGTH_SEC + DAY_START_PHASE) % 1
  return p < 0 ? p + 1 : p
}

/* ---------- palette keyframes ---------- */

interface SkyStop {
  at: number
  top: string
  bottom: string
  /** Strength of the blue tint laid over the whole scene. */
  tint: number
}

const STOPS: SkyStop[] = [
  { at: 0.0, top: '#8FA8D8', bottom: PAL.pinkLight, tint: 0.14 }, // dawn
  { at: 0.12, top: PAL.skyDeep, bottom: PAL.sky, tint: 0 }, // day
  { at: 0.42, top: PAL.skyDeep, bottom: PAL.sky, tint: 0 },
  { at: 0.5, top: '#7C6FB5', bottom: PAL.pink, tint: 0.08 }, // dusk
  { at: 0.6, top: '#1E2A5A', bottom: '#3B4A85', tint: 0.34 }, // night
  { at: 0.9, top: '#1E2A5A', bottom: '#3B4A85', tint: 0.34 },
  { at: 1.0, top: '#8FA8D8', bottom: PAL.pinkLight, tint: 0.14 }, // back to dawn
]

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function mixHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const bl = Math.round(ab + (bb - ab) * t)
  return `rgb(${r},${g},${bl})`
}

interface SkyLook {
  top: string
  bottom: string
  tint: number
}

function skyLook(phase: number): SkyLook {
  let i = 0
  while (i < STOPS.length - 2 && STOPS[i + 1].at <= phase) i++
  const a = STOPS[i]
  const b = STOPS[i + 1]
  const t = (phase - a.at) / (b.at - a.at)
  const ease = t * t * (3 - 2 * t)
  return {
    top: mixHex(a.top, b.top, ease),
    bottom: mixHex(a.bottom, b.bottom, ease),
    tint: a.tint + (b.tint - a.tint) * ease,
  }
}

/* ---------- drawing ---------- */

export function drawSky(ctx: Ctx, width: number, height: number, phase: number): void {
  const look = skyLook(phase)
  const g = ctx.createLinearGradient(0, 0, 0, height)
  g.addColorStop(0, look.top)
  g.addColorStop(1, look.bottom)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, width, height)
}

/** 0 by day, 1 in full night — drives stars and headlights. */
export function nightStrength(phase: number): number {
  return Math.max(0, Math.min(1, (skyLook(phase).tint - 0.12) / 0.22))
}

const STAR_COUNT = 42

/** Fixed stars that fade in with the tint and twinkle gently. */
export function drawStars(ctx: Ctx, width: number, height: number, phase: number, t: number): void {
  const strength = nightStrength(phase)
  if (strength <= 0) return
  const horizon = height * HORIZON_RATIO
  ctx.save()
  ctx.fillStyle = PAL.cloud
  for (let i = 0; i < STAR_COUNT; i++) {
    const hx = Math.sin(i * 12.9898) * 43758.5453
    const hy = Math.sin(i * 78.233) * 43758.5453
    const x = (hx - Math.floor(hx)) * width
    const y = (hy - Math.floor(hy)) * horizon * 0.85
    const twinkle = 0.55 + 0.45 * Math.sin(t * 2.1 + i * 1.7)
    ctx.globalAlpha = strength * twinkle
    ctx.beginPath()
    ctx.arc(x, y, 1.2 + (i % 3) * 0.6, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

/** Where a body sits along its arc, p = 0 rising on the left to 1 setting on the right. */
function arcPosition(p: number, width: number, height: number): { x: number; y: number } {
  const horizon = height * HORIZON_RATIO
  const x = width * (0.08 + 0.84 * p)
  const y = horizon + 30 - Math.sin(p * Math.PI) * (horizon - 40)
  return { x, y }
}

export function drawSunMoon(ctx: Ctx, width: number, height: number, phase: number, t: number): void {
  if (phase < 0.5) {
    const { x, y } = arcPosition(phase / 0.5, width, height)
    drawSun(ctx, x, y, t)
  } else {
    const { x, y } = arcPosition((phase - 0.5) / 0.5, width, height)
    drawMoon(ctx, x, y, t)
  }
}

export function drawNightTint(ctx: Ctx, width: number, height: number, phase: number): void {
  const tint = skyLook(phase).tint
  if (tint <= 0) return
  ctx.save()
  ctx.globalAlpha = tint
  ctx.fillStyle = '#1B2C6B'
  ctx.fillRect(0, 0, width, height)
  ctx.restore()
}

/* ---------- the faces ---------- */

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

/** Eyes, nose, and cheeks in the boy's proportions; the mouth is the caller's. */
function face(c: Ctx, look: number): void {
  ell(c, -18, 6, 6, 3.5, 'rgba(244,167,161,0.75)') // blush
  ell(c, 18, 6, 6, 3.5, 'rgba(244,167,161,0.75)')
  circ(c, -10 + look, -3, 3.2, PAL.ink)
  circ(c, 10 + look, -3, 3.2, PAL.ink)
  ell(c, look, 2, 3.4, 2.4, '#E8887F')
}

function drawSun(c: Ctx, x: number, y: number, t: number): void {
  const R = 34
  c.save()
  c.translate(x, y)

  // Stubby rounded rays, turning slowly.
  c.save()
  c.rotate(t * 0.25)
  c.fillStyle = PAL.orange
  for (let i = 0; i < 10; i++) {
    c.save()
    c.rotate((i / 10) * Math.PI * 2)
    c.beginPath()
    c.roundRect(R + 6, -5, 16 + (i % 2) * 6, 10, 5)
    c.fill()
    c.restore()
  }
  c.restore()

  // A gentle breathe, like the boy's idle.
  const puff = 1 + Math.sin(t * 1.5) * 0.03
  c.scale(puff, puff)
  circ(c, 0, 0, R, PAL.yellow)
  ell(c, 0, 4, 22, 17, '#FAEBA8')
  face(c, Math.sin(t * 1.5) * 1.5)
  // Wide open grin.
  c.fillStyle = PAL.orange
  c.beginPath()
  c.moveTo(-8, 9)
  c.quadraticCurveTo(0, 12, 8, 9)
  c.ellipse(0, 9, 8, 6, 0, 0, Math.PI)
  c.closePath()
  c.fill()
  c.restore()
}

function drawMoon(c: Ctx, x: number, y: number, t: number): void {
  const R = 30
  c.save()
  c.translate(x, y)
  const puff = 1 + Math.sin(t * 0.9) * 0.02
  c.scale(puff, puff)

  circ(c, 0, 0, R, PAL.cream)
  // A few craters, off to one side.
  for (const [cx, cy, r] of [
    [-16, -14, 5],
    [14, -18, 3.5],
    [18, 12, 4.5],
  ]) {
    circ(c, cx, cy, r, 'rgba(138,90,43,0.16)')
  }
  ell(c, 0, 4, 19, 15, '#FBF1DF')

  // Blush and nose like the sun, but the eyes are sleepy arcs and the mouth a little yawn.
  ell(c, -17, 6, 6, 3.5, 'rgba(244,167,161,0.6)')
  ell(c, 17, 6, 6, 3.5, 'rgba(244,167,161,0.6)')
  c.strokeStyle = PAL.ink
  c.lineWidth = 2.2
  c.lineCap = 'round'
  for (const ex of [-10, 10]) {
    c.beginPath()
    c.arc(ex, -2, 4, Math.PI * 0.15, Math.PI * 0.85)
    c.stroke()
  }
  ell(c, 0, 2, 3.2, 2.2, '#E8887F')
  const yawn = 0.6 + 0.4 * Math.max(0, Math.sin(t * 0.7))
  ell(c, 0, 11, 4.5, 5.5 * yawn, PAL.orange)

  // The odd "z" drifting off as it sails.
  c.font = '700 13px "Fredoka Variable", sans-serif'
  c.fillStyle = PAL.cloud
  c.globalAlpha = 0.8
  const zp = (t * 0.45) % 1
  c.fillText('z', R + 4 + zp * 12, -R + 8 - zp * 22)
  c.restore()
}

/* ---------- headlights ---------- */

const BEAM_LEN = 170
const BEAM_SPREAD = 34

/**
 * Two beams off the front of a car (kit sprite: bottom-center anchor, nose at
 * +74). Drawn after the night tint so they cut through it.
 */
export function drawHeadlights(c: Ctx, x: number, y: number, s: number, strength: number): void {
  if (strength <= 0) return
  c.save()
  c.translate(x, y)
  c.scale(s, s)
  c.globalAlpha = strength

  const beam = c.createLinearGradient(74, 0, 74 + BEAM_LEN, 0)
  beam.addColorStop(0, 'rgba(242,214,75,0.55)')
  beam.addColorStop(1, 'rgba(242,214,75,0)')
  c.fillStyle = beam
  for (const ly of [-34, -22]) {
    c.beginPath()
    c.moveTo(72, ly - 3)
    c.lineTo(74 + BEAM_LEN, ly - BEAM_SPREAD)
    c.lineTo(74 + BEAM_LEN, ly + BEAM_SPREAD * 0.6)
    c.lineTo(72, ly + 3)
    c.closePath()
    c.fill()
  }
  // The lamps themselves.
  for (const ly of [-34, -22]) {
    circ(c, 72, ly, 4.5, '#FFF4B8')
    circ(c, 72, ly, 2.2, '#FFFFFF')
  }
  c.restore()
}
