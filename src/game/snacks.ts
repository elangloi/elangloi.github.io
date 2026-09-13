/* Extra snacks in the art kit's idiom: bottom-center anchor, ~90px tall at
   scale 1, a contact shadow first, palette colors only. */

import { PAL, RAINBOW, shadow } from './noby-sprites.js'

type Ctx = CanvasRenderingContext2D

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
const wrap = (c: Ctx, x: number, y: number, s: number, fn: (c: Ctx) => void) => {
  c.save()
  c.translate(x, y)
  c.scale(s, s)
  fn(c)
  c.restore()
}

const SPONGE = '#F3D9A4'
const FROSTING = '#FFF6EC'
const DOUGH = '#E6B36E'
const SYRUP = '#B8722E'

/** A tall slice of layered cake with frosting drips and a cherry on top. */
export function cake(c: Ctx, x: number, y: number, s = 1): void {
  wrap(c, x, y, s, (c) => {
    shadow(c, 76)
    rr(c, -34, -66, 68, 66, 8, SPONGE)
    rr(c, -34, -46, 68, 8, 3, PAL.pink) // jam layers
    rr(c, -34, -24, 68, 8, 3, PAL.pink)
    // Frosting cap with drips down the front.
    rr(c, -36, -76, 72, 16, 8, FROSTING)
    for (const [dx, h] of [
      [-22, 16],
      [-4, 24],
      [14, 14],
      [26, 20],
    ]) {
      rr(c, dx - 5, -68, 10, h, 5, FROSTING)
    }
    circ(c, 0, -84, 8, PAL.red)
    circ(c, -3, -87, 2.4, 'rgba(255,255,255,0.45)')
    rr(c, -1.5, -98, 3, 14, 1.5, PAL.treeA)
  })
}

/** A pink-iced ring donut with rainbow sprinkles. */
export function donut(c: Ctx, x: number, y: number, s = 1): void {
  wrap(c, x, y, s, (c) => {
    shadow(c, 84)
    const cy = -42
    const ring = (r: number, hole: number, f: string) => {
      c.fillStyle = f
      c.beginPath()
      c.arc(0, cy, r, 0, Math.PI * 2)
      c.arc(0, cy, hole, 0, Math.PI * 2, true) // reverse winding cuts the hole
      c.fill()
    }
    ring(42, 13, DOUGH)
    // Icing sits on the top, its lower edge wavy.
    c.save()
    c.beginPath()
    c.moveTo(-44, cy + 4)
    for (let i = 0; i <= 8; i++) {
      const px = -44 + (88 * i) / 8
      c.quadraticCurveTo(px - 5.5, cy + (i % 2 ? 14 : -2), px, cy + 6)
    }
    c.lineTo(48, cy - 50)
    c.lineTo(-48, cy - 50)
    c.closePath()
    c.clip()
    ring(41, 14, PAL.pink)
    c.restore()
    // Sprinkles, scattered around the top half.
    const spots = [
      [-26, -18, 0.4],
      [-8, -30, -0.6],
      [12, -28, 0.9],
      [28, -14, -0.2],
      [-30, 0, 1.2],
      [22, 4, 0.5],
      [0, -6, -1.1],
      [-14, 8, 0.3],
    ]
    spots.forEach(([sx, sy, rot], i) => {
      c.save()
      c.translate(sx, cy + sy)
      c.rotate(rot)
      rr(c, -5, -1.6, 10, 3.2, 1.6, RAINBOW[i % RAINBOW.length])
      c.restore()
    })
  })
}

/** Three pancakes, a pat of butter, and syrup running down one side. */
export function pancake(c: Ctx, x: number, y: number, s = 1): void {
  wrap(c, x, y, s, (c) => {
    shadow(c, 96)
    for (let i = 0; i < 3; i++) {
      const cy = -12 - i * 18
      ell(c, 0, cy + 4, 46, 13, '#C98F4A') // browned underside
      ell(c, 0, cy, 46, 13, DOUGH)
    }
    // Syrup pooled on top and dripping over the edge.
    ell(c, 0, -48, 36, 9, SYRUP)
    rr(c, 22, -50, 12, 30, 6, SYRUP)
    rr(c, -34, -50, 10, 20, 5, SYRUP)
    // Butter, slightly askew.
    c.save()
    c.translate(-2, -56)
    c.rotate(-0.12)
    rr(c, -12, -8, 24, 14, 3, PAL.yellow)
    rr(c, -12, -8, 24, 5, 3, '#FBE98A')
    c.restore()
  })
}

/** A wrapped boiled sweet: striped body with twisted ends. */
export function candy(c: Ctx, x: number, y: number, s = 1): void {
  wrap(c, x, y, s, (c) => {
    shadow(c, 80)
    const cy = -32
    // Wrapper twists.
    c.fillStyle = PAL.purple
    for (const dir of [-1, 1]) {
      c.beginPath()
      c.moveTo(dir * 26, cy - 6)
      c.lineTo(dir * 50, cy - 22)
      c.quadraticCurveTo(dir * 44, cy, dir * 50, cy + 22)
      c.lineTo(dir * 26, cy + 6)
      c.closePath()
      c.fill()
    }
    ell(c, 0, cy, 32, 26, PAL.purple)
    // Diagonal stripes, clipped to the body.
    c.save()
    c.beginPath()
    c.ellipse(0, cy, 32, 26, 0, 0, Math.PI * 2)
    c.clip()
    c.fillStyle = PAL.pinkLight
    for (let i = -3; i <= 3; i++) {
      c.save()
      c.translate(i * 16, cy)
      c.rotate(0.5)
      c.fillRect(-4, -40, 8, 80)
      c.restore()
    }
    c.restore()
    ell(c, -10, cy - 10, 7, 4, 'rgba(255,255,255,0.35)')
  })
}
