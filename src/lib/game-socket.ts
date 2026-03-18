'use client'

type Handler = (payload: Record<string, unknown>) => void

export class GameSocket {
  private ws: WebSocket
  private listeners = new Map<string, Set<Handler>>()
  private queue: string[] = []

  id: string | undefined = undefined
  connected = false

  constructor(url: string) {
    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      this.connected = true
      this.queue.forEach(msg => this.ws.send(msg))
      this.queue = []
      this.dispatch('connect', {})
    }

    this.ws.onclose = () => {
      this.connected = false
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
    this.queue = []
    this.ws.close()
  }
}
