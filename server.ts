import http, { type IncomingMessage, type ServerResponse } from 'http'
import next from 'next'
import { initializeSocket } from './socket-server'

const dev = process.env.NODE_ENV !== 'production'
const port = Number(process.env.PORT) || 3000

// Always bind to 0.0.0.0 — Replit's proxy forwards requests with a different
// Host header than the container hostname, so locking to HOSTNAME causes 502s.
const app = next({ dev, hostname: '0.0.0.0', port })
const handle = app.getRequestHandler()

app
  .prepare()
  .then(() => {
    const httpServer = http.createServer((req: IncomingMessage, res: ServerResponse) => handle(req, res))

    initializeSocket(httpServer)

    httpServer.listen(port, '0.0.0.0', () => {
      console.log(`> Ready on http://0.0.0.0:${port}`)
    })
  })
  .catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
