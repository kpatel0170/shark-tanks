'use client'

import { Button } from '@/components/ui/button'
import type { Movement } from '@/lib/game-types'

type MobileControlsProps = {
  onMovementChange: (nextMovement: Movement) => void
  onShoot: () => void
}

const INITIAL_MOVEMENT: Movement = {
  forward: false,
  back: false,
  left: false,
  right: false,
}

export function MobileControls({ onMovementChange, onShoot }: MobileControlsProps) {
  const setDirection = (direction: keyof Movement, active: boolean) => {
    const next = { ...INITIAL_MOVEMENT, [direction]: active }
    onMovementChange(next)
  }

  return (
    <div className="pointer-events-auto fixed bottom-4 left-1/2 z-50 grid -translate-x-1/2 grid-cols-3 gap-2 rounded-lg bg-black/50 p-2 touch-none md:hidden">
      <Button
        className="col-start-2"
        onTouchStart={() => setDirection('forward', true)}
        onTouchEnd={() => setDirection('forward', false)}
      >
        ↑
      </Button>
      <Button onTouchStart={() => setDirection('left', true)} onTouchEnd={() => setDirection('left', false)}>
        ←
      </Button>
      <Button onTouchStart={() => onShoot()} onTouchEnd={() => {}}>●</Button>
      <Button onTouchStart={() => setDirection('right', true)} onTouchEnd={() => setDirection('right', false)}>
        →
      </Button>
      <Button
        className="col-start-2"
        onTouchStart={() => setDirection('back', true)}
        onTouchEnd={() => setDirection('back', false)}
      >
        ↓
      </Button>
    </div>
  )
}
