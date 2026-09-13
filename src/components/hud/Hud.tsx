import { Volume2, VolumeX, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { strawberry } from '@/game/noby-sprites.js'
import SpriteIcon from './SpriteIcon'

interface HudProps {
  snacksEaten: number
  speedBoosts: number
  muted: boolean
  onToggleMuted: () => void
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-border bg-background px-1.5 font-bubbly text-xs font-semibold text-foreground shadow-[0_1px_0_0_var(--color-border)]">
      {children}
    </kbd>
  )
}

export default function Hud({ snacksEaten, speedBoosts, muted, onToggleMuted }: HudProps) {
  return (
    // On phones the bar collapses: smaller title, key hints hidden (touch drives
    // the game there), and the counters shrink to icon + number.
    <header className="grid h-10 shrink-0 grid-cols-[auto_1fr_auto] items-center gap-2 px-3 font-bubbly text-sm md:h-12 md:grid-cols-[1fr_auto_1fr] md:px-4">
      <span className="text-lg font-bold leading-none text-noby-pink md:text-2xl">nobynoby</span>

      <div className="hidden items-center gap-4 text-muted-foreground md:flex">
        <span className="flex items-center gap-1.5">
          <Key>↑</Key>
          <Key>↓</Key>
          <span>move</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Key>Space</Key>
          <span>hold to eat</span>
        </span>
      </div>
      <span className="truncate text-center text-xs text-muted-foreground md:hidden">
        hold to walk &amp; eat
      </span>

      <div className="flex justify-end gap-1.5 md:gap-2">
        <Badge
          variant="secondary"
          className="gap-1 px-2 py-1 text-sm font-medium tabular-nums md:gap-1.5 md:px-2.5"
          title="snacks eaten"
        >
          <SpriteIcon draw={strawberry} size={20} />
          <span className="hidden md:inline">ate</span>
          {snacksEaten}
          <span className="hidden md:inline">{snacksEaten === 1 ? 'snack' : 'snacks'}</span>
        </Badge>
        <Badge
          variant="secondary"
          className="gap-1 px-2 py-1 text-sm font-medium tabular-nums md:px-2.5 [&>svg]:size-3.5!"
          title="speed: cars add, friends take away"
        >
          <Zap className="fill-noby-pink text-noby-pink" />+{speedBoosts}
        </Badge>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={muted ? 'unmute' : 'mute'}
          aria-pressed={muted}
          title={muted ? 'sound off' : 'sound on'}
          onClick={onToggleMuted}
          className="text-muted-foreground"
        >
          {muted ? <VolumeX /> : <Volume2 />}
        </Button>
      </div>
    </header>
  )
}
