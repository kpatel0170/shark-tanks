'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { GameHud } from '@/components/game/game-hud'
import { MobileControls } from '@/components/game/mobile-controls'
import { SharkTankCanvas } from '@/components/game/shark-tank-canvas'
import { useSocket } from '@/components/socket-provider'
import type { BulletState, Movement, PlayerState, WallState } from '@/lib/game-types'
import { SOCKET_EVENTS } from '@/lib/socket'

type ChatMessage = {
  nickname: string
  message: string
}

const DEFAULT_MOVEMENT: Movement = {
  forward: false,
  back: false,
  left: false,
  right: false,
}

function mapKeyToMovement(key: string): keyof Movement | null {
  switch (key.toLowerCase()) {
    case 'w':
    case 'arrowup':
      return 'forward'
    case 's':
    case 'arrowdown':
      return 'back'
    case 'a':
    case 'arrowleft':
      return 'left'
    case 'd':
    case 'arrowright':
      return 'right'
    default:
      return null
  }
}

export default function GamePage() {
  const router = useRouter()
  const socket = useSocket()

  const [players, setPlayers] = useState<PlayerState[]>([])
  const [bullets, setBullets] = useState<BulletState[]>([])
  const [walls, setWalls] = useState<WallState[]>([])
  const [feed, setFeed] = useState<string[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [menuOpen, setMenuOpen] = useState(true)
  const [matchSeconds, setMatchSeconds] = useState(0)
  const [spectating, setSpectating] = useState(false)

  const pressedKeysRef = useRef<Set<string>>(new Set())

  const nickname = useMemo(() => {
    if (typeof window === 'undefined') return 'Player'
    return localStorage.getItem('nickname') ?? `Player-${Math.floor(Math.random() * 1000)}`
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nickname', nickname)
    }
  }, [nickname])

  useEffect(() => {
    if (!socket) return

    const room = typeof window === 'undefined' ? 'default' : localStorage.getItem('room') ?? 'default'

    socket.emit(SOCKET_EVENTS.JOIN_LOBBY, { room })
    socket.emit(SOCKET_EVENTS.GAME_START, { nickname, room })

    const onState = (
      playerState: Record<number, PlayerState>,
      bulletState: Record<number, BulletState>,
      wallState: Record<number, WallState>
    ) => {
      setPlayers(Object.values(playerState))
      setBullets(Object.values(bulletState))
      setWalls(Object.values(wallState))
    }

    const onJoin = (values: string[]) => {
      setFeed((previousValue) => [...previousValue.slice(-9), `${values.join(', ')} joined the game`])
    }

    const onDeath = (playerName: string) => {
      setFeed((previousValue) => [...previousValue.slice(-9), `${playerName} died`])
    }

    const onDead = () => {
      setFeed((previousValue) => [...previousValue.slice(-9), 'You died'])
      router.push('/lobby')
    }

    const onChat = (chatMessage: ChatMessage) => {
      setChatMessages((previousValue) => [...previousValue.slice(-29), chatMessage])
    }

    const onMatchTimer = (value: number) => {
      setMatchSeconds(value)
    }

    socket.on(SOCKET_EVENTS.STATE, onState)
    socket.on(SOCKET_EVENTS.JOINING_LIST, onJoin)
    socket.on(SOCKET_EVENTS.UPDATED_PLAYER_LIST, onDeath)
    socket.on(SOCKET_EVENTS.DEAD, onDead)
    socket.on(SOCKET_EVENTS.CHAT_MESSAGE, onChat)
    socket.on(SOCKET_EVENTS.MATCH_TIMER, onMatchTimer)

    return () => {
      socket.off(SOCKET_EVENTS.STATE, onState)
      socket.off(SOCKET_EVENTS.JOINING_LIST, onJoin)
      socket.off(SOCKET_EVENTS.UPDATED_PLAYER_LIST, onDeath)
      socket.off(SOCKET_EVENTS.DEAD, onDead)
      socket.off(SOCKET_EVENTS.CHAT_MESSAGE, onChat)
      socket.off(SOCKET_EVENTS.MATCH_TIMER, onMatchTimer)
    }
  }, [nickname, router, socket])

  useEffect(() => {
    if (!socket) return

    const movement: Movement = { ...DEFAULT_MOVEMENT }

    const emitMovement = () => {
      socket.emit(SOCKET_EVENTS.MOVEMENT, movement)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const normalizedKey = event.key.toLowerCase()

      if (pressedKeysRef.current.has(normalizedKey)) {
        return
      }
      pressedKeysRef.current.add(normalizedKey)

      const movementKey = mapKeyToMovement(event.key)

      if (!movementKey) {
        if (event.code === 'Space' || normalizedKey === 'x') {
          socket.emit(SOCKET_EVENTS.SHOOT)
        }
        return
      }

      movement[movementKey] = true
      emitMovement()
    }

    const onKeyUp = (event: KeyboardEvent) => {
      pressedKeysRef.current.delete(event.key.toLowerCase())

      const movementKey = mapKeyToMovement(event.key)
      if (!movementKey) return

      movement[movementKey] = false
      emitMovement()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      pressedKeysRef.current.clear()
      socket.emit(SOCKET_EVENTS.MOVEMENT, DEFAULT_MOVEMENT)
    }
  }, [socket])

  const localPlayer = useMemo(() => players.find((player) => player.socketId === socket?.id), [players, socket?.id])

  const handleMobileMovement = (nextMovement: Movement) => {
    socket?.emit(SOCKET_EVENTS.MOVEMENT, nextMovement)
  }

  const handleShoot = () => {
    socket?.emit(SOCKET_EVENTS.SHOOT)
  }

  const handleSendChat = (message: string) => {
    socket?.emit(SOCKET_EVENTS.CHAT_MESSAGE, { nickname, message })
  }

  const handleSpectateToggle = () => {
    const nextState = !spectating
    setSpectating(nextState)
    socket?.emit(SOCKET_EVENTS.SPECTATE_MODE, nextState)
  }

  return (
    <div className="relative flex h-screen">
      <SharkTankCanvas players={players} bullets={bullets} walls={walls} />
      <GameHud
        score={localPlayer?.point ?? 0}
        health={localPlayer?.health ?? 0}
        maxHealth={localPlayer?.maxHealth ?? 10}
        activePlayers={players.length}
        feed={feed}
        players={players}
        showPanel={menuOpen}
        matchSeconds={matchSeconds}
        onTogglePanel={() => setMenuOpen((previousValue) => !previousValue)}
        onSendChat={handleSendChat}
        chatMessages={chatMessages}
        spectating={spectating}
        onToggleSpectate={handleSpectateToggle}
      />
      <MobileControls onMovementChange={handleMobileMovement} onShoot={handleShoot} />
    </div>
  )
}
