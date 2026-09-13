import { Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { strawberry } from '@/game/noby-sprites.js'
import SpriteIcon from './SpriteIcon'

interface HudProps {
  snacksEaten: number
  speedBoosts: number
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-border bg-background px-1.5 font-bubbly text-xs font-semibold text-foreground shadow-[0_1px_0_0_var(--color-border)]">
      {children}
    </kbd>
  )
}

export default function Hud({ snacksEaten, speedBoosts }: HudProps) {
  return (
    <header className="grid h-12 shrink-0 grid-cols-[1fr_auto_1fr] items-center px-4 font-bubbly text-sm">
      <span className="text-2xl font-bold leading-none text-noby-pink">nobynoby</span>

      <div className="flex items-center gap-4 text-muted-foreground">
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

      <div className="flex justify-end gap-2">
        <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 text-sm font-medium tabular-nums">
          <SpriteIcon draw={strawberry} size={20} />
          ate {snacksEaten} {snacksEaten === 1 ? 'snack' : 'snacks'}
        </Badge>
        <Badge
          variant="secondary"
          className="gap-1 px-2.5 py-1 text-sm font-medium tabular-nums [&>svg]:size-3.5!"
          title="speed: cars add, friends take away"
        >
          <Zap className="fill-noby-pink text-noby-pink" />+{speedBoosts}
        </Badge>
      </div>
    </header>
  )
}
