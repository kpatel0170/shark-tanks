'use client'

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { PlayerState } from '@/lib/game-types'

type GameHudProps = {
  score: number
  health: number
  maxHealth: number
  activePlayers: number
  feed: string[]
  showPanel: boolean
  onTogglePanel: () => void
}

export function GameHud({
  score,
  health,
  maxHealth,
  activePlayers,
  feed,
  showPanel,
  onTogglePanel,
}: GameHudProps) {
  const healthPercent = maxHealth > 0 ? Math.min(100, Math.max(0, Math.round((health / maxHealth) * 100))) : 0

  return (
    <>
      <div className="absolute left-4 top-4 z-50 flex flex-wrap items-center gap-2">
        <Button onClick={onTogglePanel}>Game Menu</Button>
        <Badge>Your Score: {score}</Badge>
      </div>

      <div className="absolute right-4 top-4 z-50 rounded bg-black/60 px-3 py-2 text-sm text-white">Active Players: {activePlayers}</div>

      {showPanel ? (
        <aside className="absolute left-0 top-0 z-40 h-screen w-full max-w-sm space-y-4 overflow-y-auto border-r border-white/20 bg-slate-900/90 p-4 text-white">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Battle Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">Health: {health}/{maxHealth}</div>
              <Progress value={healthPercent} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Latest Events</CardTitle>
            </CardHeader>
            <CardContent className="max-h-32 space-y-1 overflow-y-auto text-sm">
              {feed.length ? feed.map((item, index) => <p key={`${item}-${index}`}>{item}</p>) : <p>No events yet.</p>}
            </CardContent>
          </Card>

          <p className="text-xs opacity-90">Controls: WASD/Arrows to move, Space or X to shoot.</p>
        </aside>
      ) : null}
    </>
  )
}
