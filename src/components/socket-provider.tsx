'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { SOCKET_PATH } from '@/lib/socket'
import type { Socket } from 'socket.io-client'

type SocketProviderProps = {
  children: React.ReactNode
}

const SocketContext = createContext<Socket | null>(null)

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const queryClient = useMemo(() => new QueryClient(), [])

  useEffect(() => {
    let instance: Socket | null = null

    const initSocket = async () => {
      const { io } = await import('socket.io-client')
      const socketPath = process.env.NEXT_PUBLIC_SOCKET_PATH ?? SOCKET_PATH
      instance = io('/', {
        path: socketPath,
        transports: ['websocket'],
      })

      setSocket(instance)
    }

    initSocket()

    return () => {
      if (instance) {
        instance.disconnect()
        setSocket(null)
      }
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
