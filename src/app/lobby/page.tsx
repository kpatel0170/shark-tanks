'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSocket } from '@/components/socket-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SOCKET_EVENTS } from '@/lib/socket'

export default function LobbyPage() {
  const router = useRouter()
  const socket = useSocket()
  const [nickname, setNickname] = useState('')
  const [room, setRoom] = useState('default')
  const [activePlayers, setActivePlayers] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const savedName = localStorage.getItem('nickname')
    const savedRoom = localStorage.getItem('room')

    if (savedName) setNickname(savedName)
    if (savedRoom) setRoom(savedRoom)
  }, [])

  useEffect(() => {
    if (!socket) return

    const onUpdatedUsers = (count: number) => setActivePlayers(count)

    socket.on(SOCKET_EVENTS.UPDATED_USER_LIST, onUpdatedUsers)

    const joinTimeout = setTimeout(() => {
      socket.emit(SOCKET_EVENTS.JOIN_LOBBY, { room })
    }, 300)

    return () => {
      clearTimeout(joinTimeout)
      socket.off(SOCKET_EVENTS.UPDATED_USER_LIST, onUpdatedUsers)
    }
  }, [room, socket])

  const handleSaveProfile = () => {
    if (typeof window === 'undefined') return

    localStorage.setItem('nickname', nickname.trim() || 'Player')
    localStorage.setItem('room', room.trim() || 'default')
  }

  const handleStartGame = () => {
    handleSaveProfile()
    router.push('/game')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-6 text-white sm:p-8">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Shark Tanks Multiplayer</CardTitle>
          <CardDescription>Set your identity, pick a room, then launch into battle.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname</Label>
              <Input
                id="nickname"
                value={nickname}
                maxLength={10}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="Your Username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="room">Room</Label>
              <Input id="room" value={room} onChange={(event) => setRoom(event.target.value)} placeholder="default" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-white/10 px-3 py-2 text-sm">
            <span>Cluster status</span>
            <Badge>Active players: {activePlayers}</Badge>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={handleSaveProfile} variant="secondary" className="flex-1">
              Save Profile
            </Button>
            <Button className="flex-1" onClick={handleStartGame}>
              Start Game
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
