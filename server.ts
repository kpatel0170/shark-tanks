import http, { type IncomingMessage, type ServerResponse } from 'http'
import next from 'next'
import { initializeSocket } from './socket-server'

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = Number(process.env.PORT) || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app
  .prepare()
  .then(() => {
    const httpServer = http.createServer((req: IncomingMessage, res: ServerResponse) => handle(req, res))

    initializeSocket(httpServer)

    httpServer.listen(port, hostname, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
    })
  })
  .catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
