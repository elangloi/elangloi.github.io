import type { HeldKeys } from './types'

export interface InputHandle {
  getHeld: () => HeldKeys
  destroy: () => void
}

function isEatKey(e: KeyboardEvent): boolean {
  return e.code === 'Space'
}

/**
 * Keyboard: arrows steer, Space eats. Pointer (touch or mouse) on the canvas:
 * he walks toward the touched plane and eats for as long as it's held down.
 */
export function setupInput(canvas: HTMLElement): InputHandle {
  const held: HeldKeys = { up: false, down: false, eat: false, pointerY: null }
  let keyEat = false
  let pointerId: number | null = null

  function syncEat(): void {
    held.eat = keyEat || pointerId !== null
  }

  function handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'ArrowUp') {
      held.up = true
      e.preventDefault()
    } else if (e.key === 'ArrowDown') {
      held.down = true
      e.preventDefault()
    } else if (isEatKey(e)) {
      keyEat = true
      syncEat()
      e.preventDefault()
    }
  }

  function handleKeyUp(e: KeyboardEvent): void {
    if (e.key === 'ArrowUp') held.up = false
    else if (e.key === 'ArrowDown') held.down = false
    else if (isEatKey(e)) {
      keyEat = false
      syncEat()
    }
  }

  function handlePointerDown(e: PointerEvent): void {
    if (pointerId !== null) return // one finger drives; ignore extras
    pointerId = e.pointerId
    held.pointerY = e.offsetY
    syncEat()
    canvas.setPointerCapture(e.pointerId)
    e.preventDefault()
  }

  function handlePointerMove(e: PointerEvent): void {
    if (e.pointerId !== pointerId) return
    held.pointerY = e.offsetY
  }

  function handlePointerUp(e: PointerEvent): void {
    if (e.pointerId !== pointerId) return
    pointerId = null
    held.pointerY = null
    syncEat()
  }

  /** Keys stick down if the tab loses focus mid-press. */
  function clearHeld(): void {
    held.up = false
    held.down = false
    held.pointerY = null
    keyEat = false
    pointerId = null
    syncEat()
  }

  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  window.addEventListener('blur', clearHeld)
  canvas.addEventListener('pointerdown', handlePointerDown)
  canvas.addEventListener('pointermove', handlePointerMove)
  canvas.addEventListener('pointerup', handlePointerUp)
  canvas.addEventListener('pointercancel', handlePointerUp)

  return {
    getHeld: () => held,
    destroy: () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', clearHeld)
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerup', handlePointerUp)
      canvas.removeEventListener('pointercancel', handlePointerUp)
    },
  }
}
