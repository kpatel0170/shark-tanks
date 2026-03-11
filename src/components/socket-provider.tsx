'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { io, type Socket } from 'socket.io-client'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { SOCKET_PATH } from '@/lib/socket'

type SocketProviderProps = {
  children: React.ReactNode
}

const SocketContext = createContext<Socket | null>(null)

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const queryClient = useMemo(() => new QueryClient(), [])

  useEffect(() => {
    const socketPath = process.env.NEXT_PUBLIC_SOCKET_PATH ?? SOCKET_PATH
    const instance = io('/', { path: socketPath })

    setSocket(instance)

    return () => {
      instance.disconnect()
      setSocket(null)
    }
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
