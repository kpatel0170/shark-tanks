# Shark Tanks (Next.js + Socket.io + TypeScript)

This project migrates the original Express + Socket.io + Three.js game to a Next.js app while preserving realtime gameplay and keeping the runtime fully TypeScript-based.

## Core gameplay guarantees

- multiplayer movement + shooting
- bullets and wall collisions
- score and health tracking
- death event + latest news feed
- GLTF tank model rendering (`public/models/tank2.glb`)

## Run locally with npm

```bash
npm install
npm run dev
```

`npm run dev` starts `server.ts` (via `tsx`) so Next.js and Socket.io share one HTTP server.

## Routes

- `/` landing page
- `/lobby` lobby + nickname setup
- `/game` 3D battle scene
- `/api/socket` socket path

## Implemented upgrade phases

### Phase 1 (safe reliability)
- centralized socket event constants
- dead flow handling with redirect to lobby
- key repeat guard for shooting/movement

### Phase 2 (safe UI)
- shadcn-style component migration for lobby and HUD
- health progress, badges, structured cards, chat input

### Phase 3 (capability parity)
- mobile touch controls for movement + shoot

### Phase 4 (depth, incremental)
- room/lobby plumbing (`join-lobby`, `players-update`)
- in-game leaderboard panel
- basic chat broadcast
- spectate mode toggle
- match timer feed
