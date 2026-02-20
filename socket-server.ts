import { Server, type Socket } from 'socket.io'
import type { Server as HttpServer } from 'http'
import { SOCKET_EVENTS, SOCKET_PATH } from './src/lib/socket'

type Movement = {
  forward?: boolean
  back?: boolean
  left?: boolean
  right?: boolean
}

type EntityMap<T extends { id: number }> = Record<number, T>

type ChatPayload = {
  nickname: string
  message: string
}

type LobbyMember = {
  socketId: string
  nickname: string
}

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

    const isOutOfBounds =
      this.x < GROUND_MIN ||
      this.y < GROUND_MIN ||
      this.x + this.width > GROUND_MAX ||
      this.y + this.height > GROUND_MAX

    const collidesWall = Object.values(walls).some((wall) => this.intersects(wall))

    if (isOutOfBounds || collidesWall) {
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
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      angle: this.angle,
    }
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
    return {
      ...super.toJSON(),
      playerId: this.player.id,
    }
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
    } while (Object.values(walls).some((wall) => this.intersects(wall)))
  }

  shoot(gameState: GameState) {
    if (Object.keys(this.bullets).length >= 5 || this.spectating) {
      return
    }

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

  damage(io: Server, gameState: GameState) {
    if (this.spectating) return
    this.health -= 1

    if (this.health <= 0) {
      if (this.socketId) {
        io.to(this.socketId).emit(SOCKET_EVENTS.DEAD)
      }
      delete gameState.players[this.id]
      io.emit(SOCKET_EVENTS.UPDATED_PLAYER_LIST, this.nickname)
    }
  }

  maybeRestoreHealth() {
    if ([20, 50, 100].includes(this.point)) {
      this.health = this.maxHealth
    }
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
      if (!this.move(4, gameState.walls)) {
        this.angle = Math.random() * Math.PI * 2
      }

      if (Math.random() < 0.03) {
        this.shoot(gameState)
      }
    }, TICK_RATE)
  }

  cleanup() {
    clearInterval(this.timer)
  }

  override damage(io: Server, gameState: GameState) {
    super.damage(io, gameState)
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
  playerNames: string[]
  lobbyRooms: Record<string, LobbyMember[]>
  matchStart: number
}

function createWalls(): EntityMap<Wall> {
  const walls: EntityMap<Wall> = {}
  const definitions: Array<Pick<GameObject, 'x' | 'y' | 'width' | 'height'>> = [
    { x: 0, y: 2, width: 200, height: 1000 },
    { x: 1000, y: 100, width: 200, height: 1000 },
    { x: 2000, y: 1000, width: 200, height: 1000 },
    { x: -1000, y: -1000, width: 200, height: 1000 },
    { x: -1500, y: 700, width: 200, height: 1000 },
  ]

  definitions.forEach((definition) => {
    const wall = new Wall(definition)
    walls[wall.id] = wall
  })

  return walls
}

function serializeCollection<T extends { id: number; toJSON: () => object }>(collection: EntityMap<T>) {
  return Object.fromEntries(Object.values(collection).map((entity) => [entity.id, entity.toJSON()]))
}

export function initializeSocket(httpServer: HttpServer) {
  const corsOrigin = process.env.NODE_ENV === 'production'
    ? (process.env.NEXT_PUBLIC_APP_URL ?? false)
    : '*'

  const io = new Server(httpServer, {
    path: SOCKET_PATH,
    cors: { origin: corsOrigin },
  })

  const gameState: GameState = {
    players: {},
    bullets: {},
    walls: createWalls(),
    playerNames: [],
    lobbyRooms: {},
    matchStart: Date.now(),
  }

  const bot = new BotPlayer({ nickname: 'Karthick' }, gameState.walls, gameState)
  gameState.players[bot.id] = bot

  io.on('connection', (socket: Socket) => {
    let player: Player | null = null

    io.emit(SOCKET_EVENTS.UPDATED_USER_LIST, io.engine.clientsCount)

    socket.on(SOCKET_EVENTS.JOIN_LOBBY, (payload?: { room?: string; nickname?: string }) => {
      const room = payload?.room?.trim() || 'default'
      const nickname = payload?.nickname?.trim().slice(0, 10) || 'Player'

      socket.join(room)

      const members = gameState.lobbyRooms[room] ?? []
      const filtered = members.filter((member) => member.socketId !== socket.id)
      filtered.push({ socketId: socket.id, nickname })
      gameState.lobbyRooms[room] = filtered

      io.to(room).emit(SOCKET_EVENTS.PLAYERS_UPDATE, filtered)
    })

    socket.on(SOCKET_EVENTS.GAME_START, (config?: { nickname?: string }) => {
      const nickname = (config?.nickname ?? 'Player').trim().slice(0, 10) || 'Player'

      // idempotent start: remove old player for this socket before spawning a new one
      if (player) {
        delete gameState.players[player.id]
      }

      player = new Player(
        {
          socketId: socket.id,
          nickname,
        },
        gameState.walls
      )

      gameState.players[player.id] = player
      gameState.playerNames.push(player.nickname)
      io.emit(SOCKET_EVENTS.JOINING_LIST, [player.nickname])
    })

    socket.on(SOCKET_EVENTS.MOVEMENT, (movement: Movement) => {
      if (!player || player.health <= 0 || player.spectating) return
      player.movement = movement
    })

    socket.on(SOCKET_EVENTS.SHOOT, () => {
      if (!player || player.health <= 0 || player.spectating) return
      player.shoot(gameState)
    })

    socket.on(SOCKET_EVENTS.CHAT_MESSAGE, (payload: ChatPayload) => {
      const nickname = (payload?.nickname?.trim() || 'Player').slice(0, 10)
      const message = (payload?.message ?? '').trim().slice(0, 140)

      if (!message) return

      io.emit(SOCKET_EVENTS.CHAT_MESSAGE, { nickname, message })
    })

    socket.on(SOCKET_EVENTS.SPECTATE_MODE, (enabled: boolean) => {
      if (!player) return
      player.spectating = Boolean(enabled)
      player.movement = {}
    })

    socket.on('disconnect', () => {
      if (player) {
        delete gameState.players[player.id]
        player = null
      }

      Object.keys(gameState.lobbyRooms).forEach((room) => {
        gameState.lobbyRooms[room] = gameState.lobbyRooms[room].filter((member) => member.socketId !== socket.id)
        io.to(room).emit(SOCKET_EVENTS.PLAYERS_UPDATE, gameState.lobbyRooms[room])
      })

      io.emit(SOCKET_EVENTS.UPDATED_USER_LIST, io.engine.clientsCount)
    })
  })

  const loop = setInterval(() => {
    Object.values(gameState.players).forEach((player) => {
      if (player.movement.forward) player.move(20, gameState.walls)
      if (player.movement.back) player.move(-20, gameState.walls)
      if (player.movement.left) player.angle -= 0.05
      if (player.movement.right) player.angle += 0.05
    })

    Object.values(gameState.bullets).forEach((bullet) => {
      if (!bullet.move(50, gameState.walls)) {
        bullet.remove(gameState)
        return
      }

      Object.values(gameState.players).forEach((target) => {
        if (target === bullet.player || target.spectating) return

        if (bullet.intersects(target)) {
          target.damage(io, gameState)
          bullet.player.point += 1
          bullet.player.maybeRestoreHealth()
          bullet.remove(gameState)
        }
      })
    })

    io.emit(SOCKET_EVENTS.STATE, serializeCollection(gameState.players), serializeCollection(gameState.bullets), serializeCollection(gameState.walls))
    io.emit(SOCKET_EVENTS.MATCH_TIMER, Math.floor((Date.now() - gameState.matchStart) / 1000))
  }, TICK_RATE)

  return () => {
    clearInterval(loop)
    bot.cleanup()
    io.removeAllListeners()
    io.close()
  }
}
