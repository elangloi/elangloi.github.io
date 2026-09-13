import { layoutBoy, type Anchor, type BoyAnim, type BoyPose } from './boy'
import {
  ABSORB_DUR,
  BASE_SPEED,
  BODY_BOB,
  BOY_BACK_RATIO,
  BOY_BACK_SCALE,
  BOOST_PER_CAR,
  BOOST_PER_FRIEND,
  BODY_DRAW_MARGIN,
  BOY_FRONT_SCALE,
  CAMERA_SCREEN_X_RATIO,
  CAR_KIND,
  CAR_SPAWN_CHANCE,
  DEPTH_SMOOTH_RATE,
  DEPTH_SPEED,
  EAT_RADIUS,
  FOOD_AHEAD_DISTANCE,
  FOOD_DESPAWN_MARGIN,
  FOOD_MAX_GAP,
  FOOD_MIN_GAP,
  FRIEND_KINDS,
  FRIEND_SPAWN_CHANCE,
  GROUND_RATIO,
  GROWTH_PER_MEAL,
  INITIAL_BODY_LEN,
  MAX_STEPS_PER_SEC,
  MOUTH_OPEN_RATE,
  MOUTH_Y,
  PARTY_BOUNCE,
  PARTY_BURST_DUR,
  PARTY_EVERY,
  PARTY_GRAVITY,
  PARTY_MAX_LAUNCH,
  PARTY_MIN_LAUNCH,
  PARTY_REGROUP_DUR,
  PLAIN_FOOD_KIND_COUNT,
  POPUP_DUR,
  SICK_DUR,
  SICK_SLOW,
  SPEED_PER_BOOST,
  SPEED_SMOOTH_RATE,
  STRIDE,
  SWALLOW_DUR,
  TRAIL_MARGIN,
} from './constants'
import type { Food, GameState, HeldKeys, PartyPiece, TrailPoint, Viewport } from './types'

export function groundYFor(viewportHeight: number): number {
  return viewportHeight * GROUND_RATIO
}

/** Baseline y for a depth (0 = front plane), before the walk bob is added. */
export function planeYFor(depth: number, viewportHeight: number): number {
  const frontY = groundYFor(viewportHeight)
  const backY = viewportHeight * BOY_BACK_RATIO
  return frontY + (backY - frontY) * depth
}

export function scaleFor(depth: number): number {
  return BOY_FRONT_SCALE + (BOY_BACK_SCALE - BOY_FRONT_SCALE) * depth
}

/** Depth the head had when it passed world x, interpolated from the trail. */
export function trailDepthAt(trail: TrailPoint[], x: number): number {
  if (x <= trail[0].x) return trail[0].depth
  const last = trail[trail.length - 1]
  if (x >= last.x) return last.depth
  let lo = 0
  let hi = trail.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (trail[mid].x <= x) lo = mid
    else hi = mid
  }
  const a = trail[lo]
  const b = trail[hi]
  const t = (x - a.x) / (b.x - a.x)
  return a.depth + (b.depth - a.depth) * t
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
    trail: [{ x: 0, depth: 0 }],
    walkPhase: 0,
    mouthOpen: 0,
    lastEatAt: -Infinity,
    snacksEaten: 0,
    speedBoosts: 0,
    speed: BASE_SPEED,
    lastBoostAt: -Infinity,
    lastSickAt: -Infinity,
    popups: [],
    party: null,
    lastPartyAt: -Infinity,
    mouthWorldX: 0,
    mouthY: groundY + MOUTH_Y,
    food: [],
    spawnFrontier: 0,
    nextFoodId: 0,
  }
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

/** Specials get their own odds; the rest is an even split of the plain snacks. */
function rollFoodKind(): number {
  const r = Math.random()
  if (r < CAR_SPAWN_CHANCE) return CAR_KIND
  if (r < CAR_SPAWN_CHANCE + FRIEND_SPAWN_CHANCE) {
    return FRIEND_KINDS[Math.floor(Math.random() * FRIEND_KINDS.length)]
  }
  return Math.floor(Math.random() * PLAIN_FOOD_KIND_COUNT)
}

function isFriend(kind: number): boolean {
  return FRIEND_KINDS.includes(kind)
}

export function isSick(state: GameState): boolean {
  return state.timeSec - state.lastSickAt < SICK_DUR
}

function spawnFood(state: GameState): void {
  while (state.spawnFrontier < state.worldX + FOOD_AHEAD_DISTANCE) {
    state.spawnFrontier += randomBetween(FOOD_MIN_GAP, FOOD_MAX_GAP)
    state.food.push({
      id: state.nextFoodId++,
      x: state.spawnFrontier,
      kind: rollFoodKind(),
      depth: Math.random(),
      absorbingSince: null,
      fromX: 0,
      fromY: 0,
    })
  }
}

/** While the eat key is held, anything in reach is pulled toward the mouth. */
function updateAbsorption(state: GameState, held: boolean, viewport: Viewport): void {
  if (held) {
    for (const food of state.food) {
      if (food.absorbingSince !== null) continue
      const foodY = planeYFor(food.depth, viewport.height)
      const dist = Math.hypot(food.x - state.mouthWorldX, foodY - state.mouthY)
      if (dist <= EAT_RADIUS) {
        food.absorbingSince = state.timeSec
        food.fromX = food.x
        food.fromY = foodY
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
      state.snacksEaten += 1
      if (food.kind === CAR_KIND) {
        state.speedBoosts += BOOST_PER_CAR
        state.lastBoostAt = state.timeSec
      } else if (isFriend(food.kind)) {
        state.speedBoosts = Math.max(0, state.speedBoosts + BOOST_PER_FRIEND)
        state.lastSickAt = state.timeSec
      }
      // Friends get the rain cloud instead of a cheer.
      if (!isFriend(food.kind)) {
        state.popups.push({ x: state.mouthWorldX, y: state.mouthY, at: state.timeSec })
      }
      if (state.snacksEaten % PARTY_EVERY === 0) startParty(state, viewport)
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

export function update(state: GameState, dt: number, held: HeldKeys, viewport: Viewport): void {
  const viewportHeight = viewport.height
  state.timeSec += dt
  let targetSpeed = BASE_SPEED + SPEED_PER_BOOST * state.speedBoosts
  if (isSick(state)) targetSpeed *= SICK_SLOW
  state.speed += (targetSpeed - state.speed) * (1 - Math.exp(-SPEED_SMOOTH_RATE * dt))
  state.worldX += state.speed * dt
  // Feet keep pace with the ground until the cap; past that the gait just glides.
  const stepsPerSec = Math.min(MAX_STEPS_PER_SEC, state.speed / STRIDE)
  state.walkPhase += stepsPerSec * Math.PI * 2 * dt

  // Up pushes him back into the scene rather than lifting him off the ground.
  if (held.up) state.depthTarget += DEPTH_SPEED * dt
  if (held.down) state.depthTarget -= DEPTH_SPEED * dt
  state.depthTarget = Math.min(1, Math.max(0, state.depthTarget))
  state.depth += (state.depthTarget - state.depth) * (1 - Math.exp(-DEPTH_SMOOTH_RATE * dt))

  state.boyY = planeYFor(state.depth, viewportHeight) + walkBob(state)
  state.boyScale = scaleFor(state.depth)

  // The body replays the head's path, so remember where it's been.
  state.trail.push({ x: state.worldX, depth: state.depth })
  const keepFrom = state.worldX - (state.bodyLen + TRAIL_MARGIN)
  let drop = 0
  while (drop < state.trail.length - 1 && state.trail[drop + 1].x <= keepFrom) drop++
  if (drop > 0) state.trail.splice(0, drop)

  state.mouthWorldX = state.worldX
  state.mouthY = state.boyY + MOUTH_Y * state.boyScale

  spawnFood(state)
  // No eating while he's in pieces.
  updateAbsorption(state, held.eat && state.party === null, viewport)
  despawnFood(state)

  state.popups = state.popups.filter((popup) => state.timeSec - popup.at < POPUP_DUR)
  updateParty(state, dt, viewport)

  // Open for as long as the key is down, not just while a morsel is in flight.
  const wantOpen =
    (held.eat && state.party === null) || state.food.some((food) => food.absorbingSince !== null)
      ? 1
      : 0
  state.mouthOpen += (wantOpen - state.mouthOpen) * (1 - Math.exp(-MOUTH_OPEN_RATE * dt))
}

/** Mouth, swallow and gait phases derived from current state. */
export function boyAnim(state: GameState): BoyAnim {
  const sinceEat = state.timeSec - state.lastEatAt
  const swallowPhase = sinceEat / SWALLOW_DUR
  const swallow = swallowPhase >= 0 && swallowPhase <= 1 ? swallowPhase : -1
  const walk = state.walkPhase
  // Full queasiness for the duration, easing back to normal over the last bit.
  const sickLeft = SICK_DUR - (state.timeSec - state.lastSickAt)
  const sick = Math.max(0, Math.min(1, sickLeft / 0.6))
  return { bite: state.mouthOpen, swallow, walk, sick, happy: partyHappiness(state) }
}

export function walkBob(state: GameState): number {
  return Math.sin(state.walkPhase) * BODY_BOB
}

export function cameraXFor(state: GameState, viewport: Viewport): number {
  return state.worldX - viewport.width * CAMERA_SCREEN_X_RATIO
}

/** Screen-space layout of the whole boy: head, then capsules trailing his path. */
export function boyPose(state: GameState, viewport: Viewport): BoyPose {
  const cameraX = cameraXFor(state, viewport)
  const bob = walkBob(state)
  return layoutBoy(
    { x: state.worldX - cameraX, y: state.boyY, s: state.boyScale },
    state.bodyLen,
    (dist) => trailDepthAt(state.trail, state.worldX - dist),
    (depth) => ({ y: planeYFor(depth, viewport.height) + bob, s: scaleFor(depth) }),
    -BODY_DRAW_MARGIN,
  )
}

/* ---------- the party ---------- */

function launch(anchor: Anchor, j: number): PartyPiece {
  const angle = randomBetween(Math.PI * 1.22, Math.PI * 1.78) // fan mostly upward
  const power = randomBetween(PARTY_MIN_LAUNCH, PARTY_MAX_LAUNCH)
  return {
    j,
    x: anchor.x,
    y: anchor.y,
    vx: Math.cos(angle) * power,
    vy: Math.sin(angle) * power,
    s: anchor.s,
    rot: 0,
    vrot: randomBetween(-9, 9),
  }
}

/** Blow the on-screen body apart from wherever each piece currently sits. */
function startParty(state: GameState, viewport: Viewport): void {
  const pose = boyPose(state, viewport)
  const pieces = pose.segments.map((seg, j) => launch(seg, j))
  if (pose.tail) pieces.push(launch(pose.tail, -1))
  state.party = { startedAt: state.timeSec, pieces }
  state.lastPartyAt = state.timeSec
}

function updateParty(state: GameState, dt: number, viewport: Viewport): void {
  const party = state.party
  if (!party) return
  const since = state.timeSec - party.startedAt
  if (since >= PARTY_BURST_DUR + PARTY_REGROUP_DUR) {
    state.party = null
    return
  }
  if (since >= PARTY_BURST_DUR) return // regroup is a pure tween in partyPose

  const { width, height } = viewport
  for (const p of party.pieces) {
    p.vy += PARTY_GRAVITY * dt
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.rot += p.vrot * dt
    // Bounce off the canvas edges. y is a bottom anchor, so the floor is `height`.
    const halfW = 14 * p.s
    if (p.y > height) {
      p.y = height
      p.vy = -Math.abs(p.vy) * PARTY_BOUNCE
      p.vrot *= PARTY_BOUNCE
    } else if (p.y - 50 * p.s < 0) {
      p.y = 50 * p.s
      p.vy = Math.abs(p.vy) * PARTY_BOUNCE
    }
    if (p.x < halfW) {
      p.x = halfW
      p.vx = Math.abs(p.vx) * PARTY_BOUNCE
    } else if (p.x + halfW > width) {
      p.x = width - halfW
      p.vx = -Math.abs(p.vx) * PARTY_BOUNCE
    }
  }
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

/** The pose to draw: the laid-out body, or the loose pieces while the party's on. */
export function partyPose(state: GameState, pose: BoyPose): BoyPose {
  const party = state.party
  if (!party) return pose
  const since = state.timeSec - party.startedAt
  const regroup = Math.max(0, Math.min(1, (since - PARTY_BURST_DUR) / PARTY_REGROUP_DUR))
  const k = easeInOut(regroup)

  const blend = (p: PartyPiece, home: Anchor): Anchor => ({
    x: p.x + (home.x - p.x) * k,
    y: p.y + (home.y - p.y) * k,
    s: p.s + (home.s - p.s) * k,
    rot: p.rot * (1 - k),
  })

  const segments = pose.segments.slice()
  const shown = new Set<number>()
  let tail = pose.tail
  for (const p of party.pieces) {
    if (p.j === -1) {
      if (tail) tail = blend(p, tail)
      continue
    }
    if (p.j < segments.length) {
      segments[p.j] = blend(p, segments[p.j])
      shown.add(p.j)
    }
  }
  // Capsules that were off-screen at the bang stay hidden until the body's whole again.
  const visible = k >= 1 ? segments : segments.filter((_, j) => shown.has(j))
  return { head: pose.head, segments: visible, tail }
}

/** 0..1 — grinning for the whole party, fading as the body settles back. */
export function partyHappiness(state: GameState): number {
  const party = state.party
  if (!party) return 0
  const since = state.timeSec - party.startedAt
  const left = PARTY_BURST_DUR + PARTY_REGROUP_DUR - since
  return Math.max(0, Math.min(1, left / 0.5))
}
