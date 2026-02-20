'use client'

import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import type { PlayerState } from '@/lib/game-types'

type ChatMessage = {
  nickname: string
  message: string
}

type GameHudProps = {
  score: number
  health: number
  maxHealth: number
  activePlayers: number
  feed: string[]
  players: PlayerState[]
  showPanel: boolean
  matchSeconds: number
  onTogglePanel: () => void
  onSendChat: (message: string) => void
  chatMessages: ChatMessage[]
  spectating: boolean
  onToggleSpectate: () => void
}

function formatMatchTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function GameHud({
  score,
  health,
  maxHealth,
  activePlayers,
  feed,
  players,
  showPanel,
  matchSeconds,
  onTogglePanel,
  onSendChat,
  chatMessages,
  spectating,
  onToggleSpectate,
}: GameHudProps) {
  const [chatInput, setChatInput] = useState('')

  const healthPercent = maxHealth > 0 ? Math.max(0, Math.round((health / maxHealth) * 100)) : 0

  const leaderboard = useMemo(() => {
    return [...players].sort((first, second) => second.point - first.point).slice(0, 5)
  }, [players])

  const handleSend = () => {
    const value = chatInput.trim()
    if (!value) return

    onSendChat(value)
    setChatInput('')
  }

  return (
    <>
      <div className="absolute left-4 top-4 z-50 flex flex-wrap items-center gap-2">
        <Button onClick={onTogglePanel}>Game Menu</Button>
        <Badge>Your Score: {score}</Badge>
        <Badge>Match: {formatMatchTime(matchSeconds)}</Badge>
        <Button variant="secondary" onClick={onToggleSpectate}>
          {spectating ? 'Stop Spectating' : 'Spectate'}
        </Button>
      </div>

      <div className="absolute right-4 top-4 z-50 rounded bg-black/60 px-3 py-2 text-sm text-white">Active Players: {activePlayers}</div>

      {showPanel ? (
        <aside className="absolute left-0 top-0 z-40 h-screen w-full max-w-sm space-y-4 border-r border-white/20 bg-slate-900/90 p-4 text-white">
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
              <CardTitle className="text-lg">Leaderboard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {leaderboard.map((player) => (
                <div key={player.id} className="flex items-center justify-between rounded bg-white/5 px-2 py-1">
                  <span>{player.nickname}</span>
                  <Badge>{player.point}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Latest News</CardTitle>
            </CardHeader>
            <CardContent className="max-h-32 space-y-1 overflow-y-auto text-sm">
              {feed.length ? feed.map((item, index) => <p key={`${item}-${index}`}>{item}</p>) : <p>No events yet.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Squad Chat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="max-h-24 space-y-1 overflow-y-auto text-xs">
                {chatMessages.length ? (
                  chatMessages.map((chatMessage, index) => (
                    <p key={`${chatMessage.nickname}-${index}`}>
                      <span className="font-semibold">{chatMessage.nickname}:</span> {chatMessage.message}
                    </p>
                  ))
                ) : (
                  <p className="opacity-80">No messages</p>
                )}
              </div>
              <div className="flex gap-2">
                <Input value={chatInput} onChange={(event) => setChatInput(event.target.value)} placeholder="Type message" />
                <Button onClick={handleSend}>Send</Button>
              </div>
            </CardContent>
          </Card>

          <p className="text-xs opacity-90">Controls: WASD/Arrows to move, Space or X to shoot.</p>
        </aside>
      ) : null}
    </>
  )
}
