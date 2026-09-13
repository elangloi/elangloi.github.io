import { drawBoy } from './boy'
import {
  ABSORB_DUR,
  BODY_DRAW_MARGIN,
  CAMERA_SCREEN_X_RATIO,
  CLOUD_SPACING,
  CLOUD_SPEED,
  FG_PROP_RATIO,
  FG_PROP_SCALE,
  FG_SPACING,
  FG_SPEED,
  HEAD_OFFSET_X,
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
  SKY_PROP_RATIO,
} from './constants'
import { boyAnim, groundYFor } from './engine'
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
  ground,
  house,
  layer,
  mountain,
  mushroom,
  onigiri,
  sky,
  strawberry,
  treeRound,
  treeTall,
  ufo,
} from './noby-sprites.js'
import type { GameState, Viewport } from './types'

type Ctx = CanvasRenderingContext2D

const HINT_TEXT = '↑ ↓ move · hold Space to eat'
const HINT_FADE_START_MS = 4500
const HINT_FADE_END_MS = 6500

/** Order must match FOOD_KIND_COUNT. */
const FOOD_FNS = [strawberry, grapes, dango, onigiri, mushroom, apple]

const SKY_PROPS = [cloud, cloud, ufo, cloud]
const MID_PROPS = [treeRound, building, treeTall, giraffe, house]
const S = NEAR_PROP_SCALE
const NEAR_PROPS: Array<(c: Ctx, x: number, y: number, t: number) => void> = [
  (c, x, y) => flower(c, x, y, S),
  (c, x, y) => car(c, x, y, S),
  (c, x, y, t) => friend(c, x, y, S, t),
  (c, x, y) => bush(c, x, y, S),
  (c, x, y) => mushroom(c, x, y, S),
  (c, x, y, t) => fairy(c, x, y - 60, S, t),
]
/** Drawn after the boy, so they pass in front of him. */
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

export function render(ctx: Ctx, state: GameState, viewport: Viewport, now: number): void {
  const { width, height } = viewport
  const screenX = width * CAMERA_SCREEN_X_RATIO
  const cameraX = state.worldX - screenX
  const horizon = height * HORIZON_RATIO
  const groundY = groundYFor(height)
  const t = state.timeSec

  sky(ctx, width, height)

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

  ground(ctx, width, height, horizon)

  layer(ctx, cameraX, MID_SPEED, MID_SPACING, width, height * MID_PROP_RATIO, (c, x, y, i) => {
    const slot = slotIndex(cameraX, MID_SPEED, MID_SPACING, i)
    const prop = MID_PROPS[wrapIndex(slot, MID_PROPS.length)]
    prop(c, x, y, MID_PROP_SCALE * (0.85 + slotHash(slot) * 0.3))
  })

  layer(ctx, cameraX, NEAR_SPEED, NEAR_SPACING, width, height * NEAR_PROP_RATIO, (c, x, y, i) => {
    const slot = slotIndex(cameraX, NEAR_SPEED, NEAR_SPACING, i)
    NEAR_PROPS[wrapIndex(slot, NEAR_PROPS.length)](c, x, y, t)
  })

  drawFood(ctx, state, cameraX, width, groundY, false)

  // Cap the drawn length: anything past the left edge is invisible either way,
  // and the body draws one capsule per 22px with no culling of its own.
  const scale = state.boyScale
  const drawLen = Math.min(state.bodyLen, width / scale + BODY_DRAW_MARGIN)
  const anchorScreenX = state.worldX - (HEAD_OFFSET_X + drawLen) * scale - cameraX
  drawBoy(ctx, anchorScreenX, state.boyY, drawLen, scale, t, boyAnim(state))

  // Drawn after the boy so a morsel passes over his face on its way in.
  drawFood(ctx, state, cameraX, width, groundY, true)

  layer(ctx, cameraX, FG_SPEED, FG_SPACING, width, height * FG_PROP_RATIO, (c, x, y, i) => {
    const slot = slotIndex(cameraX, FG_SPEED, FG_SPACING, i)
    const prop = FG_PROPS[wrapIndex(slot, FG_PROPS.length)]
    prop(c, x, y, FG_PROP_SCALE * (0.9 + slotHash(slot) * 0.35))
  })

  if (state.startTime !== null) {
    drawHint(ctx, width, now - state.startTime)
  }
}

function drawFood(
  ctx: Ctx,
  state: GameState,
  cameraX: number,
  width: number,
  groundY: number,
  absorbing: boolean,
): void {
  const mouthScreenX = state.mouthWorldX - cameraX
  for (const food of state.food) {
    if ((food.absorbingSince !== null) !== absorbing) continue
    const drawFn = FOOD_FNS[wrapIndex(food.kind, FOOD_FNS.length)]

    if (food.absorbingSince !== null) {
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
      drawFn(ctx, x, y, Math.max(0.08, 1 - 0.92 * p))
      ctx.restore()
      continue
    }

    const sx = food.x - cameraX
    if (sx < -140 || sx > width + 140) continue
    drawFn(ctx, sx, groundY, 1)
  }
}

function drawHint(ctx: Ctx, width: number, elapsedMs: number): void {
  if (elapsedMs > HINT_FADE_END_MS) return
  let alpha = 1
  if (elapsedMs > HINT_FADE_START_MS) {
    alpha = 1 - (elapsedMs - HINT_FADE_START_MS) / (HINT_FADE_END_MS - HINT_FADE_START_MS)
  }
  alpha = Math.max(0, Math.min(1, alpha))
  if (alpha <= 0) return

  ctx.save()
  ctx.globalAlpha = alpha
  ctx.font = '600 16px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const boxWidth = ctx.measureText(HINT_TEXT).width + 34
  ctx.fillStyle = 'rgba(255,255,255,0.72)'
  ctx.beginPath()
  ctx.roundRect(width / 2 - boxWidth / 2, 22, boxWidth, 34, 17)
  ctx.fill()
  ctx.fillStyle = PAL.ink
  ctx.fillText(HINT_TEXT, width / 2, 40)
  ctx.restore()
}
