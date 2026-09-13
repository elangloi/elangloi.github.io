import { drawBoy } from './boy'
import {
  ABSORB_DUR,
  CAR_KIND,
  CLOUD_SPACING,
  CLOUD_SPEED,
  FG_PROP_RATIO,
  FG_PROP_SCALE,
  FG_SPACING,
  FG_SPEED,
  HORIZON_RATIO,
  MID_PROP_RATIO,
  MID_PROP_SCALE,
  MID_SPACING,
  MID_SPEED,
  MOUNTAIN_OFFSET,
  MOUNTAIN_SPACING,
  MOUNTAIN_SPEED,
  NEAR_PROP_RATIO,
  NEAR_PROP_SCALE,
  NEAR_SPACING,
  NEAR_SPEED,
  PARTY_BURST_DUR,
  PARTY_REGROUP_DUR,
  POPUP_DUR,
  POPUP_RISE,
  SICK_DUR,
  SKY_PROP_RATIO,
  SPEED_MSG_DUR,
} from './constants'
import { boyAnim, boyPose, cameraXFor, partyPose, planeYFor, scaleFor } from './engine'
import { cake, candy, donut, pancake } from './snacks'
import { dayPhase, drawHeadlights, drawNightTint, drawSky, drawStars, drawSunMoon, nightStrength } from './sky'
import {
  PAL,
  apple,
  building,
  bush,
  car,
  cloud,
  dango,
  fairy,
  flower,
  friend,
  giraffe,
  grapes,
  house,
  layer,
  mountain,
  mushroom,
  onigiri,
  strawberry,
  treeRound,
  treeTall,
  ufo,
} from './noby-sprites.js'
import type { GameState, Viewport } from './types'

type Ctx = CanvasRenderingContext2D

type FoodFn = (c: Ctx, x: number, y: number, s: number, t: number) => void

/** Indices are the food kinds: plain snacks, then CAR_KIND, FAIRY_KIND, FRIEND_KIND, GIRAFFE_KIND. */
const FOOD_FNS: FoodFn[] = [
  strawberry,
  grapes,
  dango,
  onigiri,
  mushroom,
  apple,
  cake,
  donut,
  pancake,
  candy,
  car,
  // The fairy hovers; keep her floating above the ground line like the scenery did.
  (c, x, y, s, t) => fairy(c, x, y - 60 * s, s, t),
  friend,
  giraffe,
]

const SKY_PROPS = [cloud, cloud, ufo, cloud]
const MID_PROPS = [treeRound, building, treeTall, house]
const S = NEAR_PROP_SCALE
const NEAR_PROPS: Array<(c: Ctx, x: number, y: number) => void> = [
  (c, x, y) => flower(c, x, y, S),
  (c, x, y) => bush(c, x, y, S),
  (c, x, y) => mushroom(c, x, y, S),
]
/** Anchored below the bottom edge, so they always pass in front of the boy. */
const FG_PROPS = [bush, flower, bush]

/**
 * layer() yields a LOCAL loop index that re-enters the same range every time the
 * band scrolls one full spacing. Keying content off it makes every prop swap
 * identity at the wrap. This converts it to a world-stable slot number, so each
 * prop keeps its identity and variation and simply flows leftward.
 */
function slotIndex(cameraX: number, speed: number, spacing: number, i: number): number {
  return i + Math.floor((cameraX * speed) / spacing)
}

function wrapIndex(i: number, n: number): number {
  return ((i % n) + n) % n
}

/** Stable pseudo-random in [0,1) keyed to a world slot. */
function slotHash(i: number): number {
  const x = Math.sin(i * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

export function render(ctx: Ctx, state: GameState, viewport: Viewport): void {
  const { width, height } = viewport
  const cameraX = cameraXFor(state, viewport)
  const horizon = height * HORIZON_RATIO
  const t = state.timeSec

  const phase = dayPhase(t)
  drawSky(ctx, width, height, phase)
  drawStars(ctx, width, height, phase, t)
  drawSunMoon(ctx, width, height, phase, t)

  layer(ctx, cameraX, CLOUD_SPEED, CLOUD_SPACING, width, height * SKY_PROP_RATIO, (c, x, y, i) => {
    const slot = slotIndex(cameraX, CLOUD_SPEED, CLOUD_SPACING, i)
    const prop = SKY_PROPS[wrapIndex(slot, SKY_PROPS.length)]
    prop(c, x, y + slotHash(slot) * 70, 0.8 + slotHash(slot + 7) * 0.5)
  })

  layer(
    ctx,
    cameraX,
    MOUNTAIN_SPEED,
    MOUNTAIN_SPACING,
    width,
    horizon + MOUNTAIN_OFFSET,
    (c, x, y, i) => {
      const slot = slotIndex(cameraX, MOUNTAIN_SPEED, MOUNTAIN_SPACING, i)
      mountain(c, x, y, 0.8 + slotHash(slot) * 0.45)
    },
  )

  drawGround(ctx, width, height, horizon)

  const midY = height * MID_PROP_RATIO
  const nearY = height * NEAR_PROP_RATIO
  const fgY = height * FG_PROP_RATIO

  const drawMid = () =>
    layer(ctx, cameraX, MID_SPEED, MID_SPACING, width, midY, (c, x, y, i) => {
      const slot = slotIndex(cameraX, MID_SPEED, MID_SPACING, i)
      const prop = MID_PROPS[wrapIndex(slot, MID_PROPS.length)]
      prop(c, x, y, MID_PROP_SCALE * (0.85 + slotHash(slot) * 0.3))
    })

  const drawNear = () =>
    layer(ctx, cameraX, NEAR_SPEED, NEAR_SPACING, width, nearY, (c, x, y, i) => {
      const slot = slotIndex(cameraX, NEAR_SPEED, NEAR_SPACING, i)
      NEAR_PROPS[wrapIndex(slot, NEAR_PROPS.length)](c, x, y)
    })

  const drawPlayer = () => {
    const pose = partyPose(state, boyPose(state, viewport))
    drawBoy(ctx, pose, state.bodyLen, t, boyAnim(state))
    // Drawn right after the boy so a morsel passes over his face on its way in.
    drawAbsorbingFood(ctx, state, cameraX)
  }

  const drawFg = () =>
    layer(ctx, cameraX, FG_SPEED, FG_SPACING, width, fgY, (c, x, y, i) => {
      const slot = slotIndex(cameraX, FG_SPEED, FG_SPACING, i)
      const prop = FG_PROPS[wrapIndex(slot, FG_PROPS.length)]
      prop(c, x, y, FG_PROP_SCALE * (0.9 + slotHash(slot) * 0.35))
    })

  // Painter's order by baseline: whatever stands lower on screen is nearer and
  // draws later. The boy is keyed off the plane his front feet are on (bob
  // excluded so he doesn't flicker across a band he's standing level with);
  // sort is stable, so on a tie the scenery listed first stays behind him.
  const bands = [
    { y: midY, draw: drawMid },
    { y: nearY, draw: drawNear },
    { y: planeYFor(state.depth, height), draw: drawPlayer },
    { y: fgY, draw: drawFg },
  ]
  // Each resting morsel sits on its own plane, so it sorts on its own.
  const cars: Array<{ x: number; y: number; s: number }> = []
  for (const food of state.food) {
    if (food.absorbingSince !== null) continue
    const sx = food.x - cameraX
    if (sx < -140 || sx > width + 140) continue
    const y = planeYFor(food.depth, height)
    if (food.kind === CAR_KIND) cars.push({ x: sx, y, s: scaleFor(food.depth) })
    bands.push({
      y,
      draw: () => FOOD_FNS[wrapIndex(food.kind, FOOD_FNS.length)](ctx, sx, y, scaleFor(food.depth), t),
    })
  }
  bands.sort((a, b) => a.y - b.y)
  for (const band of bands) band.draw()

  // Night settles over the world, but the cheers and clouds stay bright.
  drawNightTint(ctx, width, height, phase)
  const night = nightStrength(phase)
  for (const car of cars) drawHeadlights(ctx, car.x, car.y, car.s, night)
  drawPopups(ctx, state, cameraX)

  // Whichever happened most recently gets the sky.
  const latest = Math.max(state.lastSickAt, state.lastBoostAt, state.lastPartyAt)
  if (latest === -Infinity) return
  if (latest === state.lastPartyAt) {
    const cloud = { ...HAPPY_CLOUD, text: `${state.snacksEaten} snacks!!` }
    drawSkyMessage(ctx, width, t - latest, PARTY_BURST_DUR + PARTY_REGROUP_DUR, cloud)
  } else if (latest === state.lastSickAt) {
    drawSkyMessage(ctx, width, t - latest, SICK_DUR, SAD_CLOUD)
  } else {
    drawSkyMessage(ctx, width, t - latest, SPEED_MSG_DUR, HAPPY_CLOUD)
  }
}

const POPUP_TEXT = 'ate a snack!'

/** Little cheers that rise from where each bite happened and fade out. */
function drawPopups(ctx: Ctx, state: GameState, cameraX: number): void {
  if (state.popups.length === 0) return
  ctx.save()
  ctx.font = '700 18px "Fredoka Variable", "Geist Variable", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  ctx.lineWidth = 5
  ctx.strokeStyle = PAL.cloud
  ctx.fillStyle = PAL.pink
  for (const popup of state.popups) {
    const p = (state.timeSec - popup.at) / POPUP_DUR
    const ease = 1 - (1 - p) * (1 - p) // rises fast, then hangs
    const x = popup.x - cameraX
    const y = popup.y - 30 - POPUP_RISE * ease
    // Pops in a touch large, then settles; fades over the last third.
    const scale = 1 + 0.25 * Math.max(0, 1 - p * 4)
    ctx.globalAlpha = Math.min(1, (1 - p) * 3)
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(scale, scale)
    ctx.strokeText(POPUP_TEXT, 0, 0)
    ctx.fillText(POPUP_TEXT, 0, 0)
    ctx.restore()
  }
  ctx.restore()
}

interface CloudStyle {
  text: string
  fill: string
  ink: string
  /** Draws a sad raindrop under the cloud. */
  rain: boolean
}

const HAPPY_CLOUD: CloudStyle = { text: 'speeding up!', fill: PAL.cloud, ink: PAL.pink, rain: false }
const SAD_CLOUD: CloudStyle = { text: "don't eat friends!", fill: PAL.grey, ink: PAL.ink, rain: true }
const CLOUD_Y = 110 // px below the top edge
const CLOUD_FADE = 0.35 // seconds to pop in / fade out

/** A fluffy cloud with a message on it, floating in the sky for `dur` seconds. */
function drawSkyMessage(ctx: Ctx, width: number, since: number, dur: number, style: CloudStyle): void {
  if (!(since >= 0 && since <= dur)) return
  const fadeIn = Math.min(1, since / CLOUD_FADE)
  const fadeOut = Math.min(1, (dur - since) / CLOUD_FADE)
  const alpha = Math.min(fadeIn, fadeOut)
  // Overshoots slightly on the way in, then drifts gently upward.
  const pop = 1 + 0.12 * Math.sin(fadeIn * Math.PI)

  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(width / 2, CLOUD_Y - since * 6)
  ctx.scale(pop, pop)

  ctx.font = '700 30px "Fredoka Variable", "Geist Variable", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const w = ctx.measureText(style.text).width + 72
  const h = 54

  // Puffs around a pill body, in the kit's cloud style. One path, one fill:
  // overlapping fills under globalAlpha would show seams while fading.
  ctx.fillStyle = style.fill
  ctx.beginPath()
  ctx.roundRect(-w / 2, -h / 2, w, h, h / 2)
  const puffs = Math.max(3, Math.round(w / 48))
  for (let i = 0; i < puffs; i++) {
    const px = -w / 2 + 24 + ((w - 48) * i) / (puffs - 1)
    const r = 22 + (i % 2) * 8
    ctx.moveTo(px + r, -h / 2 + 10 - (i % 2) * 6)
    ctx.arc(px, -h / 2 + 10 - (i % 2) * 6, r, 0, Math.PI * 2)
  }
  ctx.fill()

  ctx.fillStyle = style.ink
  ctx.fillText(style.text, 0, 2)

  if (style.rain) drawSadRaindrop(ctx, h / 2, since)
  ctx.restore()
}

const RAIN_FALL_DUR = 1.4 // seconds for one drop to fall and loop
const RAIN_FALL_DIST = 70

/** One teardrop with a frown, falling from the cloud's underside on a loop. */
function drawSadRaindrop(ctx: Ctx, cloudBottom: number, since: number): void {
  const p = (since % RAIN_FALL_DUR) / RAIN_FALL_DUR
  const y = cloudBottom + 6 + p * p * RAIN_FALL_DIST
  const r = 11

  ctx.save()
  ctx.translate(-8, y)
  ctx.globalAlpha *= 1 - Math.max(0, (p - 0.75) / 0.25) // fizzles out at the bottom

  // Teardrop: a pointed top flowing into a round bottom.
  ctx.fillStyle = PAL.blue
  ctx.beginPath()
  ctx.moveTo(0, -r * 1.7)
  ctx.quadraticCurveTo(r * 1.05, -r * 0.5, r, r * 0.15)
  ctx.arc(0, r * 0.15, r, 0, Math.PI, false)
  ctx.quadraticCurveTo(-r * 1.05, -r * 0.5, 0, -r * 1.7)
  ctx.fill()

  // Sad face: two eyes and an upside-down smile.
  ctx.fillStyle = PAL.ink
  ctx.beginPath()
  ctx.arc(-4, -1, 1.6, 0, Math.PI * 2)
  ctx.arc(4, -1, 1.6, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = PAL.ink
  ctx.lineWidth = 1.8
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(0, 8, 3.6, Math.PI * 1.2, Math.PI * 1.8)
  ctx.stroke()
  ctx.restore()
}

/** The kit's ground() adds a big dark patch across the grass; this is just the gradient. */
function drawGround(ctx: Ctx, width: number, height: number, horizon: number): void {
  const g = ctx.createLinearGradient(0, horizon, 0, height)
  g.addColorStop(0, PAL.grassLight)
  g.addColorStop(1, PAL.grass)
  ctx.fillStyle = g
  ctx.fillRect(0, horizon, width, height - horizon)
}

function drawAbsorbingFood(ctx: Ctx, state: GameState, cameraX: number): void {
  const mouthScreenX = state.mouthWorldX - cameraX
  for (const food of state.food) {
    if (food.absorbingSince === null) continue
    const drawFn = FOOD_FNS[wrapIndex(food.kind, FOOD_FNS.length)]
    const p = Math.min(1, (state.timeSec - food.absorbingSince) / ABSORB_DUR)
    const e = p * p // accelerates as it's drawn in
    const fromX = food.fromX - cameraX
    const x = fromX + (mouthScreenX - fromX) * e
    // Food is bottom-anchored; bias upward so it centers on the mouth as it shrinks.
    const targetY = state.mouthY + 40 * (1 - e)
    const y = food.fromY + (targetY - food.fromY) * e
    // Position eases in so it's "sucked" toward the mouth, but the shrink is
    // steady — on the p*p curve it stayed near full size, blanketing the face.
    ctx.save()
    ctx.globalAlpha = 1 - 0.25 * p
    drawFn(ctx, x, y, scaleFor(food.depth) * Math.max(0.08, 1 - 0.92 * p), state.timeSec)
    ctx.restore()
  }
}

