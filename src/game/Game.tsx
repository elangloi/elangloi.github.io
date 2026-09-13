import { useEffect, useRef } from 'react'
import { createGameState, update } from './engine'
import { setupInput } from './input'
import { render } from './render'

const MAX_DT_SECONDS = 0.05

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    let width = window.innerWidth
    let height = window.innerHeight

    function resize(): void {
      width = window.innerWidth
      height = window.innerHeight
      const dpr = window.devicePixelRatio || 1
      canvas!.width = width * dpr
      canvas!.height = height * dpr
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const state = createGameState(height)
    const input = setupInput()

    let rafId = 0
    let lastTime: number | null = null

    function loop(time: number): void {
      const dt = lastTime === null ? 0 : Math.min((time - lastTime) / 1000, MAX_DT_SECONDS)
      lastTime = time

      update(state, dt, input.getHeld(), height, time)
      render(ctx!, state, { width, height }, time)

      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
      input.destroy()
    }
  }, [])

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100vw', height: '100vh' }} />
}
