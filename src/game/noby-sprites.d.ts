/* Type declarations for noby-sprites.js.
   That file is a verbatim copy of the design export and is intentionally not
   edited — refresh it from noby-design/ and only this sidecar needs updating. */

type Ctx = CanvasRenderingContext2D

/** Draw fn convention: (x, y) is the BOTTOM-CENTER anchor, s is a uniform scale. */
type Prop = (c: Ctx, x: number, y: number, s?: number) => void

/** Same as Prop, but animated off a time value in seconds. */
type AnimatedProp = (c: Ctx, x: number, y: number, s?: number, t?: number) => void

export declare const PAL: {
  sky: string
  skyDeep: string
  cloud: string
  mtn: string
  snow: string
  grassLight: string
  grass: string
  grassDark: string
  path: string
  trunk: string
  treeA: string
  treeB: string
  pink: string
  pinkLight: string
  cream: string
  yellow: string
  orange: string
  red: string
  purple: string
  blue: string
  blueLight: string
  grey: string
  greyDark: string
  brown: string
  ink: string
}

export declare const RAINBOW: string[]

export declare function shadow(c: Ctx, w: number, h?: number): void

/* ---------- the boy ---------- */
export declare function nobyHead(c: Ctx, x: number, y: number, s?: number, look?: number): void
export declare function nobyTail(c: Ctx, x: number, y: number, s?: number): void
export declare function nobyBody(
  c: Ctx,
  x: number,
  y: number,
  len: number,
  s?: number,
  t?: number,
  h?: number,
): void

export interface EatScale {
  sx: number
  sy: number
}

export interface EatPulse {
  /** Call with the current time in seconds when food is swallowed. */
  trigger(t: number): void
  /** Squash-and-stretch pair for time t; {1,1} when idle. */
  value(t: number): EatScale
}

export declare function makeEat(dur?: number): EatPulse

/** Whole creature, drawn left-to-right from the bottom-center anchor. */
export declare function noby(
  c: Ctx,
  x: number,
  y: number,
  len?: number,
  s?: number,
  t?: number,
  eat?: EatScale,
): void

/* ---------- food ---------- */
export declare const strawberry: Prop
export declare const grapes: Prop
export declare const dango: Prop
export declare const onigiri: Prop
export declare const mushroom: Prop
export declare const apple: Prop

/* ---------- scenery ---------- */
export declare const treeRound: Prop
export declare const treeTall: Prop
export declare const bush: Prop
export declare const flower: Prop
export declare const car: Prop
export declare const building: Prop
export declare const giraffe: Prop
export declare const house: Prop
export declare const cloud: Prop
export declare const mountain: Prop
export declare const ufo: Prop
export declare const fairy: AnimatedProp
export declare const friend: AnimatedProp

/* ---------- ground + parallax ---------- */
export declare function ground(c: Ctx, w: number, h: number, horizon: number): void
export declare function sky(c: Ctx, w: number, h: number): void

/** Repeat a prop across a scrolling layer. `draw` receives a SCREEN x and a slot
 *  index that may be negative. */
export declare function layer(
  c: Ctx,
  camX: number,
  speed: number,
  spacing: number,
  width: number,
  y: number,
  draw: (c: Ctx, x: number, y: number, i: number) => void,
): void
