'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { GameSocket } from '@/lib/game-socket'

const SocketContext = createContext<GameSocket | null>(null)

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<GameSocket | null>(null)
  const queryClient = useMemo(() => new QueryClient(), [])

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const instance = new GameSocket(`${protocol}//${window.location.host}/ws`)
    setSocket(instance)
    return () => instance.disconnect()
  }, [])

  return (
    <SocketContext.Provider value={socket}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </SocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(SocketContext)
}
