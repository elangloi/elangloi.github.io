import type { HeldKeys } from './types'

export interface InputHandle {
  getHeld: () => HeldKeys
  destroy: () => void
}

function isEatKey(e: KeyboardEvent): boolean {
  return e.code === 'Space'
}

export function setupInput(): InputHandle {
  const held: HeldKeys = { up: false, down: false, eat: false }

  function handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'ArrowUp') {
      held.up = true
      e.preventDefault()
    } else if (e.key === 'ArrowDown') {
      held.down = true
      e.preventDefault()
    } else if (isEatKey(e)) {
      held.eat = true
      e.preventDefault()
    }
  }

  function handleKeyUp(e: KeyboardEvent): void {
    if (e.key === 'ArrowUp') held.up = false
    else if (e.key === 'ArrowDown') held.down = false
    else if (isEatKey(e)) held.eat = false
  }

  /** Keys stick down if the tab loses focus mid-press. */
  function clearHeld(): void {
    held.up = false
    held.down = false
    held.eat = false
  }

  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  window.addEventListener('blur', clearHeld)

  return {
    getHeld: () => held,
    destroy: () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', clearHeld)
    },
  }
}
