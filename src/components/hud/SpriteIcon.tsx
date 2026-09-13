import { useEffect, useRef } from 'react'

type Ctx = CanvasRenderingContext2D
type Prop = (c: Ctx, x: number, y: number, s?: number) => void

interface SpriteIconProps {
  draw: Prop
  /** Rendered box size in CSS px. Sprites are ~100 tall at scale 1. */
  size?: number
  className?: string
}

const SPRITE_HEIGHT = 104

/** Draws one of the art kit's bottom-center-anchored props into a small canvas. */
export default function SpriteIcon({ draw, size = 22, className }: SpriteIconProps) {
  const ref = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, size, size)
    draw(ctx, size / 2, size - 1, size / SPRITE_HEIGHT)
  }, [draw, size])

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={className}
      style={{ width: size, height: size, display: 'block' }}
    />
  )
}
