import { WebSocketServer, WebSocket } from 'ws'
import type { Server as HttpServer } from 'http'
import { randomUUID } from 'crypto'
import { SOCKET_EVENTS } from './src/lib/socket'

type Movement = {
  forward?: boolean
  back?: boolean
  left?: boolean
  right?: boolean
}

type EntityMap<T extends { id: number }> = Record<number, T>

type LobbyMember = {
  socketId: string
  nickname: string
}

type Broadcast = (type: string, payload?: Record<string, unknown>) => void
type SendTo = (socketId: string, type: string, payload?: Record<string, unknown>) => void

const GROUND_MIN = -2500
const GROUND_MAX = 2500
const TICK_RATE = 1000 / 20

class GameObject {
  public id: number
  public x: number
  public y: number
  public width: number
  public height: number
  public angle: number

  constructor(props: Partial<GameObject> = {}) {
    this.id = Math.floor(Math.random() * 1_000_000_000)
    this.x = props.x ?? 0
    this.y = props.y ?? 0
    this.width = props.width ?? 0
    this.height = props.height ?? 0
    this.angle = props.angle ?? 0
  }

  move(distance: number, walls: EntityMap<Wall>): boolean {
    const previousX = this.x
    const previousY = this.y

    this.x += distance * Math.cos(this.angle)
    this.y += distance * Math.sin(this.angle)

    const outOfBounds =
      this.x < GROUND_MIN ||
      this.y < GROUND_MIN ||
      this.x + this.width > GROUND_MAX ||
      this.y + this.height > GROUND_MAX

    if (outOfBounds || Object.values(walls).some(w => this.intersects(w))) {
      this.x = previousX
      this.y = previousY
      return false
    }

    return true
  }

  intersects(other: GameObject): boolean {
    return (
      this.x <= other.x + other.width &&
      this.x + this.width >= other.x &&
      this.y <= other.y + other.height &&
      this.y + this.height >= other.y
    )
  }

  toJSON() {
    return { id: this.id, x: this.x, y: this.y, width: this.width, height: this.height, angle: this.angle }
  }
}

class Wall extends GameObject {}

class Bullet extends GameObject {
  public player: Player

  constructor(props: Partial<GameObject> & { player: Player }) {
    super(props)
    this.width = 15
    this.height = 15
    this.player = props.player
  }

  remove(gameState: GameState) {
    delete this.player.bullets[this.id]
    delete gameState.bullets[this.id]
  }

  override toJSON() {
    return { ...super.toJSON(), playerId: this.player.id }
  }
}

class Player extends GameObject {
  public socketId?: string
  public nickname: string
  public health: number
  public maxHealth: number
  public point: number
  public bullets: EntityMap<Bullet>
  public movement: Movement
  public spectating: boolean

  constructor(props: { socketId?: string; nickname: string }, walls: EntityMap<Wall>) {
    super()
    this.socketId = props.socketId
    this.nickname = props.nickname
    this.width = 80
    this.height = 80
    this.health = 10
    this.maxHealth = 10
    this.point = 0
    this.bullets = {}
    this.movement = {}
    this.spectating = false

    do {
      this.x = Math.random() * (GROUND_MAX - this.width)
      this.y = Math.random() * (GROUND_MAX - this.height)
      this.angle = Math.random() * Math.PI * 2
    } while (Object.values(walls).some(w => this.intersects(w)))
  }

  shoot(gameState: GameState) {
    if (Object.keys(this.bullets).length >= 5 || this.spectating) return
    const bullet = new Bullet({
      x: this.x + this.width / 2,
      y: this.y + this.height / 2,
      angle: this.angle,
      player: this,
    })
    bullet.move(this.width / 2, gameState.walls)
    this.bullets[bullet.id] = bullet
    gameState.bullets[bullet.id] = bullet
  }

  damage(broadcast: Broadcast, sendTo: SendTo, gameState: GameState) {
    if (this.spectating) return
    this.health -= 1
    if (this.health <= 0) {
      if (this.socketId) sendTo(this.socketId, SOCKET_EVENTS.DEAD)
      delete gameState.players[this.id]
      broadcast(SOCKET_EVENTS.UPDATED_PLAYER_LIST, { nickname: this.nickname })
    }
  }

  maybeRestoreHealth() {
    if ([20, 50, 100].includes(this.point)) this.health = this.maxHealth
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      socketId: this.socketId,
      nickname: this.nickname,
      health: this.health,
      maxHealth: this.maxHealth,
      point: this.point,
      spectating: this.spectating,
    }
  }
}

class BotPlayer extends Player {
  private timer: ReturnType<typeof setInterval>

  constructor(props: { nickname: string }, walls: EntityMap<Wall>, gameState: GameState) {
    super(props, walls)

    this.timer = setInterval(() => {
      // Find the nearest living human player
      const humans = Object.values(gameState.players).filter(
        p => p !== this && !(p instanceof BotPlayer) && !p.spectating && p.health > 0
      )

      if (humans.length > 0) {
        // Pick closest by Euclidean distance
        const nearest = humans.reduce((best, p) => {
          const d  = (p.x - this.x) ** 2 + (p.y - this.y) ** 2
          const db = (best.x - this.x) ** 2 + (best.y - this.y) ** 2
          return d < db ? p : best
        })

        const cx = this.x + this.width  / 2
        const cy = this.y + this.height / 2
        const tx = nearest.x + nearest.width  / 2
        const ty = nearest.y + nearest.height / 2

        const dx   = tx - cx
        const dy   = ty - cy
        const dist = Math.sqrt(dx * dx + dy * dy)
        const targetAngle = Math.atan2(dy, dx)

        // Shortest-path angle difference
        let diff = ((targetAngle - this.angle) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI

        // Rotate toward target at a fixed turn rate
        const TURN_RATE = 0.07
        if (Math.abs(diff) > TURN_RATE) {
          this.angle += Math.sign(diff) * TURN_RATE
        } else {
          this.angle = targetAngle
        }

        // Move forward when roughly aimed (within ~23°) — back off if too close
        if (Math.abs(diff) < 0.4) {
          if (dist > 200) {
            if (!this.move(5, gameState.walls)) this.angle += Math.PI / 3
          }
        }

        // Shoot when in range and well-aimed (within ~11°)
        if (dist < 900 && Math.abs(diff) < 0.2) {
          this.shoot(gameState)
        }
      } else {
        // No humans — roam randomly
        if (!this.move(4, gameState.walls)) this.angle = Math.random() * Math.PI * 2
        if (Math.random() < 0.02) this.shoot(gameState)
      }
    }, TICK_RATE)
  }

  cleanup() {
    clearInterval(this.timer)
  }

  override damage(broadcast: Broadcast, sendTo: SendTo, gameState: GameState) {
    super.damage(broadcast, sendTo, gameState)
    if (this.health <= 0) {
      this.cleanup()
      const { nickname } = this
      const { walls } = gameState
      setTimeout(() => {
        const newBot = new BotPlayer({ nickname }, walls, gameState)
        gameState.players[newBot.id] = newBot
      }, 3000)
    }
  }
}

type GameState = {
  players: EntityMap<Player>
  bullets: EntityMap<Bullet>
  walls: EntityMap<Wall>
  lobbyRooms: Record<string, LobbyMember[]>
  matchStart: number
}

function createWalls(): EntityMap<Wall> {
  const walls: EntityMap<Wall> = {}
  const definitions = [
    { x: 0, y: 2, width: 200, height: 1000 },
    { x: 1000, y: 100, width: 200, height: 1000 },
    { x: 2000, y: 1000, width: 200, height: 1000 },
    { x: -1000, y: -1000, width: 200, height: 1000 },
    { x: -1500, y: 700, width: 200, height: 1000 },
  ]
  definitions.forEach(def => {
    const wall = new Wall(def)
    walls[wall.id] = wall
  })
  return walls
}

export function initializeSocket(httpServer: HttpServer) {
  // noServer: true — we route upgrade events manually below so that
  // non-game paths (e.g. /_next/webpack-hmr) are NOT rejected with 400.
  // The default { server, path } mode rejects every non-matching upgrade,
  // which kills Next.js's HMR WebSocket and forces full page reloads.
  const wss = new WebSocketServer({ noServer: true })

  httpServer.on('upgrade', (req, socket, head) => {
    const path = (req.url ?? '').split('?')[0]
    if (path !== '/ws') return  // leave HMR and any other WS for Next.js
    wss.handleUpgrade(req, socket as import('stream').Duplex, head, ws => {
      wss.emit('connection', ws, req)
    })
  })
  const clients = new Map<string, WebSocket>()
  const rooms = new Map<string, Set<string>>()

  function send(ws: WebSocket, type: string, payload: Record<string, unknown> = {}) {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type, ...payload }))
  }

  function sendTo(socketId: string, type: string, payload: Record<string, unknown> = {}) {
    const ws = clients.get(socketId)
    if (ws) send(ws, type, payload)
  }

  function broadcast(type: string, payload: Record<string, unknown> = {}) {
    const msg = JSON.stringify({ type, ...payload })
    for (const ws of clients.values()) {
      if (ws.readyState === WebSocket.OPEN) ws.send(msg)
    }
  }

  function broadcastToRoom(roomId: string, type: string, payload: Record<string, unknown> = {}) {
    const room = rooms.get(roomId)
    if (!room) return
    const msg = JSON.stringify({ type, ...payload })
    for (const socketId of room) {
      const ws = clients.get(socketId)
      if (ws?.readyState === WebSocket.OPEN) ws.send(msg)
    }
  }

  const gameState: GameState = {
    players: {},
    bullets: {},
    walls: createWalls(),
    lobbyRooms: {},
    matchStart: Date.now(),
  }

  const BOT_NAMES = ['Karthick', 'Stacy', 'Rex']
  const bots = BOT_NAMES.map(nickname => {
    const b = new BotPlayer({ nickname }, gameState.walls, gameState)
    gameState.players[b.id] = b
    return b
  })

  wss.on('connection', ws => {
    const socketId = randomUUID()
    clients.set(socketId, ws)
    let player: Player | null = null

    send(ws, 'connected', { id: socketId })
    broadcast(SOCKET_EVENTS.UPDATED_USER_LIST, { count: clients.size })

    ws.on('message', data => {
      let msg: Record<string, unknown>
      try { msg = JSON.parse(data.toString()) } catch { return }

      switch (msg.type) {
        case SOCKET_EVENTS.JOIN_LOBBY: {
          const room = (typeof msg.room === 'string' ? msg.room.trim() : '') || 'default'
          const nickname = (typeof msg.nickname === 'string' ? msg.nickname.trim().slice(0, 10) : '') || 'Player'
          const roomSet = rooms.get(room) ?? new Set<string>()
          roomSet.add(socketId)
          rooms.set(room, roomSet)
          const members = gameState.lobbyRooms[room] ?? []
          gameState.lobbyRooms[room] = [...members.filter(m => m.socketId !== socketId), { socketId, nickname }]
          broadcastToRoom(room, SOCKET_EVENTS.PLAYERS_UPDATE, { members: gameState.lobbyRooms[room] })
          break
        }
        case SOCKET_EVENTS.GAME_START: {
          const nickname = (typeof msg.nickname === 'string' ? msg.nickname.trim().slice(0, 10) : '') || 'Player'
          const room = (typeof msg.room === 'string' ? msg.room.trim() : '') || 'default'
          if (player) delete gameState.players[player.id]
          player = new Player({ socketId, nickname }, gameState.walls)
          const roomSet = rooms.get(room) ?? new Set<string>()
          roomSet.add(socketId)
          rooms.set(room, roomSet)
          gameState.players[player.id] = player
          broadcast(SOCKET_EVENTS.JOINING_LIST, { nicknames: [player.nickname] })
          break
        }
        case SOCKET_EVENTS.MOVEMENT: {
          if (!player || player.health <= 0 || player.spectating) break
          player.movement = {
            forward: Boolean(msg.forward),
            back: Boolean(msg.back),
            left: Boolean(msg.left),
            right: Boolean(msg.right),
          }
          break
        }
        case SOCKET_EVENTS.SHOOT: {
          if (!player || player.health <= 0 || player.spectating) break
          player.shoot(gameState)
          break
        }
        case SOCKET_EVENTS.CHAT_MESSAGE: {
          const nickname = (typeof msg.nickname === 'string' ? msg.nickname.trim() : 'Player').slice(0, 10)
          const message = (typeof msg.message === 'string' ? msg.message.trim() : '').slice(0, 140)
          if (!message) break
          broadcast(SOCKET_EVENTS.CHAT_MESSAGE, { nickname, message })
          break
        }
        case SOCKET_EVENTS.SPECTATE_MODE: {
          if (!player) break
          player.spectating = Boolean(msg.enabled)
          player.movement = {}
          break
        }
      }
    })

    ws.on('close', () => {
      clients.delete(socketId)
      if (player) {
        delete gameState.players[player.id]
        player = null
      }
      for (const [room, memberSet] of rooms) {
        memberSet.delete(socketId)
        const lobbyMembers = gameState.lobbyRooms[room]
        if (lobbyMembers) {
          gameState.lobbyRooms[room] = lobbyMembers.filter(m => m.socketId !== socketId)
          broadcastToRoom(room, SOCKET_EVENTS.PLAYERS_UPDATE, { members: gameState.lobbyRooms[room] })
        }
      }
      broadcast(SOCKET_EVENTS.UPDATED_USER_LIST, { count: clients.size })
    })
  })

  const loop = setInterval(() => {
    for (const p of Object.values(gameState.players)) {
      if (p.movement.forward) p.move(20, gameState.walls)
      if (p.movement.back) p.move(-20, gameState.walls)
      if (p.movement.left) p.angle -= 0.05
      if (p.movement.right) p.angle += 0.05
    }

    for (const bullet of Object.values(gameState.bullets)) {
      if (!bullet.move(50, gameState.walls)) {
        bullet.remove(gameState)
        continue
      }
      for (const target of Object.values(gameState.players)) {
        if (target === bullet.player || target.spectating) continue
        if (bullet.intersects(target)) {
          target.damage(broadcast, sendTo, gameState)
          bullet.player.point += 1
          bullet.player.maybeRestoreHealth()
          bullet.remove(gameState)
        }
      }
    }

    const players = Object.values(gameState.players).map(p => p.toJSON())
    const bullets = Object.values(gameState.bullets).map(b => b.toJSON())
    const walls = Object.values(gameState.walls).map(w => w.toJSON())
    const seconds = Math.floor((Date.now() - gameState.matchStart) / 1000)
    const roomIds = Object.keys(gameState.lobbyRooms)

    if (roomIds.length === 0) {
      broadcast(SOCKET_EVENTS.STATE, { players, bullets, walls })
      broadcast(SOCKET_EVENTS.MATCH_TIMER, { seconds })
    } else {
      for (const roomId of roomIds) {
        broadcastToRoom(roomId, SOCKET_EVENTS.STATE, { players, bullets, walls })
        broadcastToRoom(roomId, SOCKET_EVENTS.MATCH_TIMER, { seconds })
      }
    }
  }, TICK_RATE)

  return () => {
    clearInterval(loop)
    bots.forEach(b => b.cleanup())
    wss.removeAllListeners()
    wss.close()
  }
}
