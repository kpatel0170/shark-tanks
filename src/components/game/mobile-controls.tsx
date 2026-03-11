'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { DEFAULT_MOVEMENT, type Movement } from '@/lib/game-types'

type MobileControlsProps = {
  onMovementChange: (nextMovement: Movement) => void
  onShoot: () => void
}

export function MobileControls({ onMovementChange, onShoot }: MobileControlsProps) {
  const movementRef = useRef<Movement>({ ...DEFAULT_MOVEMENT })

  const setDirection = (direction: keyof Movement, active: boolean) => {
    movementRef.current = { ...movementRef.current, [direction]: active }
    onMovementChange({ ...movementRef.current })
  }

  return (
    <div className="pointer-events-auto fixed bottom-4 left-1/2 z-50 grid -translate-x-1/2 grid-cols-3 gap-2 rounded-lg bg-black/50 p-2 md:hidden">
      <Button
        className="col-start-2"
        onPointerDown={() => setDirection('forward', true)}
        onPointerUp={() => setDirection('forward', false)}
        onPointerCancel={() => setDirection('forward', false)}
      >
        ↑
      </Button>
      <Button onPointerDown={() => setDirection('left', true)} onPointerUp={() => setDirection('left', false)} onPointerCancel={() => setDirection('left', false)}>
        ←
      </Button>
      <Button onPointerDown={onShoot}>●</Button>
      <Button onPointerDown={() => setDirection('right', true)} onPointerUp={() => setDirection('right', false)} onPointerCancel={() => setDirection('right', false)}>
        →
      </Button>
      <Button
        className="col-start-2"
        onPointerDown={() => setDirection('back', true)}
        onPointerUp={() => setDirection('back', false)}
        onPointerCancel={() => setDirection('back', false)}
      >
        ↓
      </Button>
    </div>
  )
}
