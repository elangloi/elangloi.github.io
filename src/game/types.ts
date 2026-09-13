export interface Food {
  id: number
  x: number
  /** Index into the food draw-fn table in render.ts. */
  kind: number
  /** 0 = front plane, 1 = back — same scale as the boy's depth; he has to match it to eat. */
  depth: number
  /** timeSec the morsel started flying toward the mouth, or null while untouched. */
  absorbingSince: number | null
  /** Screen-space point the morsel launched from, captured when absorption starts. */
  fromX: number
  fromY: number
}

/** One sample of where the head was: segments behind it replay this path. */
export interface TrailPoint {
  x: number
  depth: number
}

/** A floating "ate a snack!" anchored to where the bite happened. */
export interface Popup {
  /** World x, so it drifts with the scenery instead of sticking to the head. */
  x: number
  y: number
  at: number
}

/** One capsule (or the tail) let loose during the party, in screen space. */
export interface PartyPiece {
  /** Segment index from the head, or -1 for the tail. */
  j: number
  x: number
  y: number
  vx: number
  vy: number
  s: number
  rot: number
  vrot: number
}

export interface Party {
  startedAt: number
  pieces: PartyPiece[]
}

export interface GameState {
  /** World-space x of the boy's head; the body trails off to the left. */
  worldX: number
  /** Elapsed seconds — the art kit's animations are all keyed off seconds. */
  timeSec: number
  /** 0 = front plane (large, near camera), 1 = pushed back toward the scenery. */
  depth: number
  depthTarget: number
  /** Screen-space y of the boy's bottom-center anchor, derived from depth. */
  boyY: number
  /** Uniform sprite scale, derived from depth. */
  boyScale: number
  bodyLen: number
  /** Head depth history keyed by worldX, oldest first; pruned past the tail. */
  trail: TrailPoint[]
  /** Gait phase in radians; advances with speed but is rate-capped (MAX_STEPS_PER_SEC). */
  walkPhase: number
  /** 0..1 smoothed mouth aperture; held open for as long as the eat key is down. */
  mouthOpen: number
  /** timeSec of the last completed swallow; -Infinity before the first one. */
  lastEatAt: number
  /** Total morsels swallowed, surfaced in the HUD. */
  snacksEaten: number
  /** Net speed points shown as +N: cars add, friends subtract, floored at 0. */
  speedBoosts: number
  /** Current scroll speed in world px/sec, eased toward the boosted target. */
  speed: number
  /** timeSec of the last car swallowed; -Infinity before the first. */
  lastBoostAt: number
  /** timeSec of the last friend swallowed; -Infinity before the first. */
  lastSickAt: number
  popups: Popup[]
  /** Non-null while the body is blown apart and regrouping. */
  party: Party | null
  /** timeSec the last party started; -Infinity before the first. */
  lastPartyAt: number
  /** Mouth position, kept on state so food can fly to it and eating can measure from it. */
  mouthWorldX: number
  mouthY: number
  food: Food[]
  spawnFrontier: number
  nextFoodId: number
}

export interface HeldKeys {
  up: boolean
  down: boolean
  eat: boolean
}

export interface Viewport {
  width: number
  height: number
}
