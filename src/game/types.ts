export interface Food {
  id: number
  x: number
  /** Index into the food draw-fn table in render.ts. */
  kind: number
  /** timeSec the morsel started flying toward the mouth, or null while untouched. */
  absorbingSince: number | null
  /** Screen-space point the morsel launched from, captured when absorption starts. */
  fromX: number
  fromY: number
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
  /** 0..1 smoothed mouth aperture; held open for as long as the eat key is down. */
  mouthOpen: number
  /** timeSec of the last completed swallow; -Infinity before the first one. */
  lastEatAt: number
  /** Mouth position, kept on state so food can fly to it and eating can measure from it. */
  mouthWorldX: number
  mouthY: number
  food: Food[]
  spawnFrontier: number
  nextFoodId: number
  startTime: number | null
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
