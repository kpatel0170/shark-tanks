export type Movement = {
  forward: boolean
  back: boolean
  left: boolean
  right: boolean
}

export type PlayerState = {
  id: number
  x: number
  y: number
  width: number
  height: number
  angle: number
  health: number
  maxHealth: number
  point: number
  nickname: string
  socketId?: string
  spectating?: boolean
}

export type BulletState = {
  id: number
  x: number
  y: number
  width: number
  height: number
  angle: number
  playerId: number
}

export type WallState = {
  id: number
  x: number
  y: number
  width: number
  height: number
  angle: number
}

export type ChatMessage = {
  nickname: string
  message: string
}

export type LobbyPlayer = {
  socketId: string
  nickname: string
}

export const DEFAULT_MOVEMENT: Movement = {
  forward: false,
  back: false,
  left: false,
  right: false,
}
