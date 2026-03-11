"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { SharkTankCanvas } from "@/components/game/shark-tank-canvas";
import { useSocket } from "@/components/socket-provider";
import {
  type BulletState,
  type Movement,
  type PlayerState,
  type WallState,
} from "@/lib/game-types";
import { SOCKET_EVENTS } from "@/lib/socket";

const DEFAULT_MOVEMENT: Movement = {
  forward: false,
  back: false,
  left: false,
  right: false,
};

function mapKeyToMovement(key: string): keyof Movement | null {
  switch (key.toLowerCase()) {
    case "w":
    case "arrowup":
      return "forward";
    case "s":
    case "arrowdown":
      return "back";
    case "a":
    case "arrowleft":
      return "left";
    case "d":
    case "arrowright":
      return "right";
    default:
      return null;
  }
}

export default function GamePage() {
  const router = useRouter();
  const socket = useSocket();

  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [bullets, setBullets] = useState<BulletState[]>([]);
  const [walls, setWalls] = useState<WallState[]>([]);
  const [feed, setFeed] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [activePlayers, setActivePlayers] = useState(0);

  const pressedKeysRef = useRef<Set<string>>(new Set());

  const nickname = useMemo(() => {
    if (typeof window === "undefined") return "Player";
    return (
      localStorage.getItem("nickname") ??
      `Player-${Math.floor(Math.random() * 1000)}`
    );
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.emit(SOCKET_EVENTS.GAME_START, { nickname });

    const onState = (
      playerState: Record<number, PlayerState>,
      bulletState: Record<number, BulletState>,
      wallState: Record<number, WallState>,
    ) => {
      setPlayers(Object.values(playerState));
      setBullets(Object.values(bulletState));
      setWalls(Object.values(wallState));

      // Update local player score
      const localPlayer = Object.values(playerState).find(
        (p) => p.socketId === socket.id,
      );
      if (localPlayer) {
        setScore(localPlayer.point);
      }
    };

    const onJoin = (values: string[]) =>
      setFeed((previous) => [
        ...previous.slice(-9),
        `${values.join(", ")} joined the game`,
      ]);
    const onDeath = (playerName: string) =>
      setFeed((previous) => [...previous.slice(-9), `${playerName} died`]);

    const onDead = () => {
      setFeed((previous) => [...previous.slice(-9), "You died"]);
      router.push("/lobby");
    };

    const onUpdatedUserList = (count: number) => setActivePlayers(count);

    socket.on(SOCKET_EVENTS.STATE, onState);
    socket.on(SOCKET_EVENTS.JOINING_LIST, onJoin);
    socket.on(SOCKET_EVENTS.UPDATED_PLAYER_LIST, onDeath);
    socket.on(SOCKET_EVENTS.DEAD, onDead);
    socket.on(SOCKET_EVENTS.UPDATED_USER_LIST, onUpdatedUserList);

    return () => {
      socket.off(SOCKET_EVENTS.STATE, onState);
      socket.off(SOCKET_EVENTS.JOINING_LIST, onJoin);
      socket.off(SOCKET_EVENTS.UPDATED_PLAYER_LIST, onDeath);
      socket.off(SOCKET_EVENTS.DEAD, onDead);
      socket.off(SOCKET_EVENTS.UPDATED_USER_LIST, onUpdatedUserList);
    };
  }, [socket, router, nickname]);

  useEffect(() => {
    if (!socket) return;

    const movement: Movement = { ...DEFAULT_MOVEMENT };

    const emitMovement = () => {
      socket.emit(SOCKET_EVENTS.MOVEMENT, movement);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const normalizedKey = event.key.toLowerCase();
      if (pressedKeysRef.current.has(normalizedKey)) return;

      pressedKeysRef.current.add(normalizedKey);

      const movementKey = mapKeyToMovement(event.key);
      if (!movementKey) {
        if (event.code === "Space" || normalizedKey === "x") {
          socket.emit(SOCKET_EVENTS.SHOOT);
        }
        return;
      }

      movement[movementKey] = true;
      emitMovement();
    };

    const onKeyUp = (event: KeyboardEvent) => {
      pressedKeysRef.current.delete(event.key.toLowerCase());

      const movementKey = mapKeyToMovement(event.key);
      if (!movementKey) return;

      movement[movementKey] = false;
      emitMovement();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      pressedKeysRef.current.clear();
      socket.emit(SOCKET_EVENTS.MOVEMENT, DEFAULT_MOVEMENT);
    };
  }, [socket]);

  return (
    <div className="relative h-screen">
      <SharkTankCanvas
        players={players}
        bullets={bullets}
        walls={walls}
        localSocketId={socket?.id}
      />

      {/* Legacy-style HUD overlay */}
      <div className="absolute left-4 top-4 z-50 text-white">
        <div className="text-lg font-bold">Your Score: {score}</div>
      </div>

      <div className="absolute right-4 top-4 z-50 rounded bg-black/60 px-3 py-2 text-sm text-white">
        Active players: {activePlayers}
      </div>

      {/* Latest News Feed */}
      <div className="absolute left-4 bottom-4 z-50 max-w-sm rounded bg-black/60 p-3 text-white">
        <div className="mb-2 text-sm font-bold">Latest News</div>
        <div className="max-h-32 space-y-1 overflow-y-auto text-xs">
          {feed.length ? (
            feed.map((item, index) => <p key={`${item}-${index}`}>{item}</p>)
          ) : (
            <p>No events yet.</p>
          )}
        </div>
      </div>

      {/* Controls hint */}
      <div className="absolute right-4 bottom-4 z-50 rounded bg-black/60 px-3 py-2 text-xs text-white">
        Controls: WASD/Arrows to move, Space or X to shoot
      </div>
    </div>
  );
}
