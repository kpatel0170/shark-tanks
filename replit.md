# Shark Tanks

A multiplayer 3D tank game built with Next.js, native WebSockets, and React Three Fiber.

## Architecture

- **Frontend**: Next.js 16 (App Router) + React 19 + Tailwind CSS + shadcn/ui
- **Game rendering**: React Three Fiber / Three.js
- **Real-time**: Native WebSockets (`ws` package on server, `WebSocket` browser API on client)
- **Custom server**: `server.ts` bootstraps Next.js + WebSocket server together via `tsx`
- **Game logic**: `socket-server.ts` — server-side game loop, players, bullets, walls, bots

## Running the Project

```
npm run dev:replit   # Replit dev server on port 5000
npm run dev          # dev server on port 5000 (default)
npm run build        # production build
npm run start        # production server
```

## Key Files

| File | Purpose |
|------|---------|
| `server.ts` | Custom HTTP server — starts Next.js + WebSocket server |
| `socket-server.ts` | Game engine: physics, players, bullets, bots, rooms |
| `src/lib/socket.ts` | Shared event name constants |
| `src/lib/game-socket.ts` | Client-side WebSocket wrapper (on/off/emit, message queue) |
| `src/components/socket-provider.tsx` | React context exposing `GameSocket` |
| `src/app/game/page.tsx` | Game page — keyboard input, state rendering |
| `src/app/lobby/page.tsx` | Lobby — nickname input, player count |

## WebSocket Protocol

Messages are JSON objects with a `type` field matching `SOCKET_EVENTS` constants:

- `{ type: 'connected', id: '<uuid>' }` — server → client on connect (assigns socket ID)
- `{ type: 'game-start', nickname, room }` — client joins game
- `{ type: 'movement', forward, back, left, right }` — client movement input
- `{ type: 'state', players: [], bullets: [], walls: [] }` — server tick broadcast
- `{ type: 'dead' }` — server tells client their player died

WebSocket path: `/ws`

## Replit Notes

- Port **5000** required for Replit webview
- Installed with `--legacy-peer-deps` (`@react-three/fiber` v9 peer dep constraint)
- CORS not needed — same-server WebSocket upgrade
- `ws` package was already present as a transitive dep of socket.io; socket.io itself removed
