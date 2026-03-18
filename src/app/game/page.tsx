"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { SharkTankCanvas } from "@/components/game/shark-tank-canvas";
import { MobileControls } from "@/components/game/mobile-controls";
import {
  GameStats,
  GameSettings,
  GameFeed,
  ControlsInfo,
  ResponsiveLayout,
} from "@/components/ui/game-ui";
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
  const [score, setScore] = useState<number>(0);
  const [activePlayers, setActivePlayers] = useState<number>(0);
  const [feed, setFeed] = useState<string[]>([]);
  const [players, setPlayers] = useState<PlayerState[]>([
    {
      id: 1,
      socketId: "demo-1",
      nickname: "TestTank1",
      x: 500,
      y: 500,
      width: 50,
      height: 50,
      angle: 0,
      health: 3,
      maxHealth: 3,
      point: 0,
    },
    {
      id: 2,
      socketId: "demo-2",
      nickname: "TestTank2",
      x: 1000,
      y: 1000,
      width: 50,
      height: 50,
      angle: Math.PI / 4,
      health: 2,
      maxHealth: 2,
      point: 100,
    },
  ]);
  const [bullets, setBullets] = useState<BulletState[]>([]);
  const [walls, setWalls] = useState<WallState[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [quality, setQuality] = useState<"high" | "medium" | "low">("high");

  const pressedKeysRef = useRef<Set<string>>(new Set());

  const localPlayer = useMemo(
    () =>
      players?.find(
        (p) => p.socketId === socket?.id || p.socketId === "demo-1",
      ) || null,
    [players, socket?.id],
  );

  useEffect(() => {
    if (!socket) return;

    const onState = (state: {
      players: PlayerState[];
      bullets: BulletState[];
      walls: WallState[];
    }) => {
      // Only update if we have real socket data (not demo)
      if (state.players && state.players.length > 0) {
        setPlayers(state.players);
        setBullets(state.bullets || []);
        setWalls(state.walls || []);
      }
    };

    const onJoin = (values: string[]) =>
      setFeed((previous) => [
        ...previous.slice(-9),
        `${values?.join(", ") || "Someone"} joined the game`,
      ]);

    const onDeath = (playerName: string) =>
      setFeed((previous) => [
        ...previous.slice(-9),
        `${playerName || "Someone"} died`,
      ]);

    const onDead = () => {
      setFeed((previous) => [...previous.slice(-9), "You died"]);
      router.push("/lobby");
    };

    const onUpdatedUserList = (count: number) => setActivePlayers(count || 0);

    socket.on(SOCKET_EVENTS.STATE, onState);
    socket.on(SOCKET_EVENTS.JOINING_LIST, onJoin);
    socket.on(SOCKET_EVENTS.UPDATED_PLAYER_LIST, onDeath);
    socket.on(SOCKET_EVENTS.DEAD, onDead);
    socket.on(SOCKET_EVENTS.UPDATED_USER_LIST, onUpdatedUserList);

    // Emit game-start event when joining
    if (socket.connected) {
      const savedName = localStorage.getItem("nickname") || "Player";
      socket.emit(SOCKET_EVENTS.GAME_START, { nickname: savedName });
    } else {
      // If no socket connection, keep demo players visible
      console.log("Socket not connected, using demo players for testing");
    }

    return () => {
      socket.off(SOCKET_EVENTS.STATE, onState);
      socket.off(SOCKET_EVENTS.JOINING_LIST, onJoin);
      socket.off(SOCKET_EVENTS.UPDATED_PLAYER_LIST, onDeath);
      socket.off(SOCKET_EVENTS.DEAD, onDead);
    };
  }, [socket, router]);

  useEffect(() => {
    if (localPlayer) {
      setScore(localPlayer.point);
    }
  }, [localPlayer]);

  useEffect(() => {
    if (!socket) return;

    const movement: Movement = { ...DEFAULT_MOVEMENT };

    const emitMovement = () => {
      if (socket?.connected) {
        socket.emit(SOCKET_EVENTS.MOVEMENT, movement);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (!event?.key) return;

      const normalizedKey = event.key.toLowerCase();
      if (pressedKeysRef.current.has(normalizedKey)) return;

      pressedKeysRef.current.add(normalizedKey);

      const movementKey = mapKeyToMovement(event.key);
      if (!movementKey) {
        if (event.code === "Space" || normalizedKey === "x") {
          socket?.emit(SOCKET_EVENTS.SHOOT);
        }
        return;
      }

      movement[movementKey] = true;
      emitMovement();
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (!event?.key) return;

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
      socket?.emit(SOCKET_EVENTS.MOVEMENT, DEFAULT_MOVEMENT);
    };
  }, [socket]);

  return (
    <ResponsiveLayout className="relative h-screen bg-black">
      <SharkTankCanvas
        players={players}
        bullets={bullets}
        walls={walls}
        localSocketId={socket?.id}
      />

      {/* Score & Players HUD */}
      <div className="absolute top-4 left-4 z-50">
        <GameStats
          score={score}
          activePlayers={activePlayers}
          isMobile={false}
        />
      </div>

      {/* Game Settings Panel */}
      <div className="absolute top-4 right-4 z-50 hidden md:block">
        <GameSettings
          soundEnabled={soundEnabled}
          quality={quality}
          onSoundToggle={() => setSoundEnabled(!soundEnabled)}
          onQualityChange={(quality) => setQuality(quality)}
          isMobile={false}
        />
      </div>

      {/* Game Feed */}
      <div className="absolute left-4 bottom-4 z-50">
        <GameFeed feed={feed} isMobile={false} />
      </div>

      {/* Controls Info */}
      <div className="absolute right-4 bottom-4 z-50">
        <ControlsInfo isMobile={false} />
      </div>

      {/* Mobile Controls */}
      <MobileControls
        onMovementChange={(movement) => {
          if (socket?.connected) {
            socket.emit(SOCKET_EVENTS.MOVEMENT, movement);
          }
        }}
        onShoot={() => {
          if (socket?.connected) {
            socket.emit(SOCKET_EVENTS.SHOOT);
          }
        }}
      />
    </ResponsiveLayout>
  );
}
