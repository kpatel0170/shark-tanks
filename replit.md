# Shark Tanks

A multiplayer 3D top-down tank game built with Next.js 16, native WebSockets, and React Three Fiber.

## Architecture

- **Frontend**: Next.js 16 (App Router) + React 19 + Tailwind CSS + shadcn/ui
- **Game rendering**: React Three Fiber / Three.js (`@react-three/fiber`, `@react-three/drei`)
- **Real-time**: Native WebSockets — `ws` package on server, browser `WebSocket` API on client
- **Custom server**: `server.ts` bootstraps Next.js + WebSocket upgrade together via `tsx`
- **Game logic**: `socket-server.ts` — server-side game loop, physics, players, bullets, bots, rooms

## Running the Project

```
npm run dev:replit   # Replit dev server on port 5000
npm run build        # production build
npm run start        # production server
```

## Key Files

| File | Purpose |
|------|---------|
| `server.ts` | Custom HTTP server — starts Next.js + mounts WebSocket server at `/ws` |
| `socket-server.ts` | Game engine: physics loop, Player/Bullet/Wall/Bot classes, room management |
| `src/lib/socket.ts` | Shared WebSocket event name constants |
| `src/lib/game-types.ts` | Shared TypeScript types (PlayerState, BulletState, etc.) |
| `src/lib/game-socket.ts` | Client-side WebSocket wrapper (on/off/emit, message queue, auto-reconnect) |
| `src/components/socket-provider.tsx` | React context exposing `GameSocket` instance |
| `src/app/game/page.tsx` | Game page — keyboard/mobile input, game state, HUD wiring |
| `src/app/lobby/page.tsx` | Lobby — nickname input, live player count |
| `src/components/game/shark-tank-canvas.tsx` | 3D canvas — tanks, bullets, walls, camera follow |
| `src/components/game/mobile-controls.tsx` | Touch D-pad + fire button (mobile only) |
| `src/components/ui/game-ui.tsx` | HUD components: GameStats, GameSettings, GameFeed, ControlsInfo |

## WebSocket Protocol

Messages are JSON objects with a `type` field matching `SOCKET_EVENTS` constants.

**Client → Server**
- `{ type: 'game-start', nickname }` — join / re-join game
- `{ type: 'movement', forward, back, left, right }` — input tick
- `{ type: 'shoot' }` — fire bullet

**Server → Client**
- `{ type: 'connected', id }` — assigned socket ID on connect
- `{ type: 'state', players: [], bullets: [], walls: [] }` — full game tick (~20 Hz)
- `{ type: 'dead' }` — local player was destroyed → redirect to lobby
- `{ type: 'updatedUserlist', count }` — active player count changed
- `{ type: 'joiningList', nicknames }` — player(s) joined
- `{ type: 'updatedPlayerList', nickname }` — player left/died

## Game Canvas Notes

- Walls are hardcoded client-side (`WALLS` constant in `shark-tank-canvas.tsx`) — match server values exactly; walls are static so no need to sync them per tick
- `CameraController` (useFrame lerp) owns the camera — **no OrbitControls** to avoid conflict
- Bullet colour: red = your own shots, teal = enemy shots (compared via `bullet.playerId === localPlayer.id`)
- Local player has a green ring indicator under their tank
- `quality` prop controls canvas DPR (`[1,2]` / `[1,1.5]` / `1`) and antialias toggle

## Replit Notes

- Port **5000** — required for Replit webview proxy
- Install with `--legacy-peer-deps` (`@react-three/fiber` v9 has React 18 peer dep)
- No CORS needed — WebSocket upgrade is on the same origin/server
