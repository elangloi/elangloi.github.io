import { useEffect, useRef, useState } from 'react'
import Hud from '@/components/hud/Hud'
import { createSounds } from './audio'
import { createGameState, update } from './engine'
import { setupInput } from './input'
import { render } from './render'

const MAX_DT_SECONDS = 0.05
const MUTED_KEY = 'nobynoby:muted'

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTED_KEY) === '1'
  } catch {
    return false
  }
}

export default function Game() {
  const frameRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [hud, setHud] = useState({ snacksEaten: 0, speedBoosts: 0 })
  const [muted, setMuted] = useState(readMuted)
  const soundsRef = useRef(createSounds())

  useEffect(() => {
    soundsRef.current.setMuted(muted)
    try {
      localStorage.setItem(MUTED_KEY, muted ? '1' : '0')
    } catch {
      // Storage is a convenience; the toggle still works for this visit.
    }
  }, [muted])

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
    const input = setupInput(canvas)
    const sounds = soundsRef.current

    // Browsers gate audio behind a user gesture; the first key or click unlocks it.
    const unlock = () => sounds.start()
    window.addEventListener('keydown', unlock)
    window.addEventListener('pointerdown', unlock)

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

      for (const event of state.sounds) sounds.play(event)
      state.sounds.length = 0

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
      window.removeEventListener('keydown', unlock)
      window.removeEventListener('pointerdown', unlock)
      sounds.destroy()
    }
  }, [])

  return (
    <div className="flex h-full flex-col bg-background p-1.5 sm:p-3">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <Hud
          snacksEaten={hud.snacksEaten}
          speedBoosts={hud.speedBoosts}
          muted={muted}
          onToggleMuted={() => setMuted((m) => !m)}
        />
        <div ref={frameRef} className="relative min-h-0 flex-1 border-t border-border">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 block h-full w-full touch-none select-none"
          />
        </div>
      </div>
    </div>
  )
}
