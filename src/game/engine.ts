import type { BoyAnim } from './boy'
import {
  ABSORB_DUR,
  BASE_SPEED,
  BODY_BOB,
  BOY_BACK_RATIO,
  BOY_BACK_SCALE,
  BOY_FRONT_SCALE,
  DEPTH_SMOOTH_RATE,
  DEPTH_SPEED,
  EAT_RADIUS,
  FOOD_AHEAD_DISTANCE,
  FOOD_DESPAWN_MARGIN,
  FOOD_KIND_COUNT,
  FOOD_MAX_GAP,
  FOOD_MIN_GAP,
  GROUND_RATIO,
  GROWTH_PER_MEAL,
  INITIAL_BODY_LEN,
  MOUTH_OPEN_RATE,
  MOUTH_Y,
  STRIDE,
  SWALLOW_DUR,
} from './constants'
import type { Food, GameState, HeldKeys } from './types'

export function groundYFor(viewportHeight: number): number {
  return viewportHeight * GROUND_RATIO
}

export function createGameState(viewportHeight: number): GameState {
  const groundY = groundYFor(viewportHeight)
  return {
    worldX: 0,
    timeSec: 0,
    depth: 0,
    depthTarget: 0,
    boyY: groundY,
    boyScale: BOY_FRONT_SCALE,
    bodyLen: INITIAL_BODY_LEN,
    mouthOpen: 0,
    lastEatAt: -Infinity,
    mouthWorldX: 0,
    mouthY: groundY + MOUTH_Y,
    food: [],
    spawnFrontier: 0,
    nextFoodId: 0,
    startTime: null,
  }
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function spawnFood(state: GameState): void {
  while (state.spawnFrontier < state.worldX + FOOD_AHEAD_DISTANCE) {
    state.spawnFrontier += randomBetween(FOOD_MIN_GAP, FOOD_MAX_GAP)
    state.food.push({
      id: state.nextFoodId++,
      x: state.spawnFrontier,
      kind: Math.floor(Math.random() * FOOD_KIND_COUNT),
      absorbingSince: null,
      fromX: 0,
      fromY: 0,
    })
  }
}

/** While the eat key is held, anything in reach is pulled toward the mouth. */
function updateAbsorption(state: GameState, held: boolean, groundY: number): void {
  if (held) {
    for (const food of state.food) {
      if (food.absorbingSince !== null) continue
      const dist = Math.hypot(food.x - state.mouthWorldX, groundY - state.mouthY)
      if (dist <= EAT_RADIUS) {
        food.absorbingSince = state.timeSec
        food.fromX = food.x
        food.fromY = groundY
      }
    }
  }

  const remaining: Food[] = []
  for (const food of state.food) {
    const swallowed =
      food.absorbingSince !== null && state.timeSec - food.absorbingSince >= ABSORB_DUR
    if (swallowed) {
      state.bodyLen += GROWTH_PER_MEAL
      state.lastEatAt = state.timeSec
      continue
    }
    remaining.push(food)
  }
  state.food = remaining
}

function despawnFood(state: GameState): void {
  const cutoff = state.worldX - FOOD_DESPAWN_MARGIN
  state.food = state.food.filter((food) => food.absorbingSince !== null || food.x > cutoff)
}

export function update(
  state: GameState,
  dt: number,
  held: HeldKeys,
  viewportHeight: number,
  now: number,
): void {
  if (state.startTime === null) state.startTime = now

  state.timeSec += dt
  state.worldX += BASE_SPEED * dt

  // Up pushes him back into the scene rather than lifting him off the ground.
  if (held.up) state.depthTarget += DEPTH_SPEED * dt
  if (held.down) state.depthTarget -= DEPTH_SPEED * dt
  state.depthTarget = Math.min(1, Math.max(0, state.depthTarget))
  state.depth += (state.depthTarget - state.depth) * (1 - Math.exp(-DEPTH_SMOOTH_RATE * dt))

  const frontY = groundYFor(viewportHeight)
  const backY = viewportHeight * BOY_BACK_RATIO
  const bob = Math.sin((state.worldX / STRIDE) * Math.PI * 2) * BODY_BOB
  state.boyY = frontY + (backY - frontY) * state.depth + bob
  state.boyScale = BOY_FRONT_SCALE + (BOY_BACK_SCALE - BOY_FRONT_SCALE) * state.depth

  state.mouthWorldX = state.worldX
  state.mouthY = state.boyY + MOUTH_Y * state.boyScale

  spawnFood(state)
  updateAbsorption(state, held.eat, frontY)
  despawnFood(state)

  // Open for as long as the key is down, not just while a morsel is in flight.
  const wantOpen =
    held.eat || state.food.some((food) => food.absorbingSince !== null) ? 1 : 0
  state.mouthOpen += (wantOpen - state.mouthOpen) * (1 - Math.exp(-MOUTH_OPEN_RATE * dt))
}

/** Mouth, swallow and gait phases derived from current state. */
export function boyAnim(state: GameState): BoyAnim {
  const sinceEat = state.timeSec - state.lastEatAt
  const swallowPhase = sinceEat / SWALLOW_DUR
  const swallow = swallowPhase >= 0 && swallowPhase <= 1 ? swallowPhase : -1
  const walk = (state.worldX / STRIDE) * Math.PI * 2
  return { bite: state.mouthOpen, swallow, walk }
}
