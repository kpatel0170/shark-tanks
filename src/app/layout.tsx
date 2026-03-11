import type { Metadata } from 'next'
import { SocketProvider } from '@/components/socket-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Shark Tanks',
  description: 'Join the battle, forge your destiny.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SocketProvider>{children}</SocketProvider>
      </body>
    </html>
  )
}
