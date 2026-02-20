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
