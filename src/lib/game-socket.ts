'use client'

type Handler = (payload: Record<string, unknown>) => void

// Ping interval (ms) — keeps Replit's reverse proxy from closing idle WS connections
const PING_INTERVAL_MS = 20_000

export class GameSocket {
  private ws: WebSocket
  private listeners = new Map<string, Set<Handler>>()
  private queue: string[] = []
  private pingTimer: ReturnType<typeof setInterval> | null = null

  id: string | undefined = undefined
  connected = false

  constructor(url: string) {
    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      this.connected = true
      this.queue.forEach(msg => this.ws.send(msg))
      this.queue = []
      this.startPing()
      this.dispatch('connect', {})
    }

    this.ws.onclose = () => {
      this.connected = false
      this.stopPing()
      this.dispatch('disconnect', {})
    }

    this.ws.onmessage = ({ data }) => {
      let msg: Record<string, unknown>
      try { msg = JSON.parse(data) } catch { return }
      const { type, ...payload } = msg
      if (typeof type !== 'string') return
      if (type === 'connected' && typeof payload.id === 'string') {
        this.id = payload.id
      }
      this.dispatch(type, payload)
    }
  }

  private startPing() {
    this.pingTimer = setInterval(() => {
      if (this.ws.readyState === WebSocket.OPEN) {
        // Lightweight ping — server ignores unknown types, just keeps the connection alive
        this.ws.send(JSON.stringify({ type: 'ping' }))
      }
    }, PING_INTERVAL_MS)
  }

  private stopPing() {
    if (this.pingTimer !== null) {
      clearInterval(this.pingTimer)
      this.pingTimer = null
    }
  }

  private dispatch(type: string, payload: Record<string, unknown>) {
    this.listeners.get(type)?.forEach(fn => fn(payload))
  }

  on(event: string, handler: Handler) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set())
    this.listeners.get(event)!.add(handler)
  }

  off(event: string, handler: Handler) {
    this.listeners.get(event)?.delete(handler)
  }

  emit(event: string, payload?: unknown) {
    const extra = payload !== null && typeof payload === 'object' ? payload : {}
    const msg = JSON.stringify({ type: event, ...extra })
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(msg)
    } else {
      this.queue.push(msg)
    }
  }

  disconnect() {
    this.stopPing()
    this.queue = []
    this.ws.close()
  }
}
