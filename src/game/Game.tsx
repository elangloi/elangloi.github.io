import { useEffect, useRef, useState } from 'react'
import Hud from '@/components/hud/Hud'
import { createGameState, update } from './engine'
import { setupInput } from './input'
import { render } from './render'

const MAX_DT_SECONDS = 0.05

export default function Game() {
  const frameRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [hud, setHud] = useState({ snacksEaten: 0, speedBoosts: 0 })

  useEffect(() => {
    const frame = frameRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!frame || !canvas || !ctx) return

    let width = frame.clientWidth
    let height = frame.clientHeight

    function resize(): void {
      width = frame!.clientWidth
      height = frame!.clientHeight
      const dpr = window.devicePixelRatio || 1
      canvas!.width = width * dpr
      canvas!.height = height * dpr
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(frame)

    const state = createGameState(height)
    const input = setupInput()

    let rafId = 0
    let lastTime: number | null = null
    let shownSnacks = state.snacksEaten
    let shownBoosts = state.speedBoosts

    function loop(time: number): void {
      const dt = lastTime === null ? 0 : Math.min((time - lastTime) / 1000, MAX_DT_SECONDS)
      lastTime = time

      const viewport = { width, height }
      update(state, dt, input.getHeld(), viewport)
      render(ctx!, state, viewport)

      // Only cross into React when a number actually changes.
      if (state.snacksEaten !== shownSnacks || state.speedBoosts !== shownBoosts) {
        shownSnacks = state.snacksEaten
        shownBoosts = state.speedBoosts
        setHud({ snacksEaten: shownSnacks, speedBoosts: shownBoosts })
      }

      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafId)
      observer.disconnect()
      input.destroy()
    }
  }, [])

  return (
    <div className="flex h-full flex-col bg-background p-3">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <Hud snacksEaten={hud.snacksEaten} speedBoosts={hud.speedBoosts} />
        <div ref={frameRef} className="relative min-h-0 flex-1 border-t border-border">
          <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
        </div>
      </div>
    </div>
  )
}
