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
  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [bullets, setBullets] = useState<BulletState[]>([]);
  const [walls, setWalls] = useState<WallState[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [quality, setQuality] = useState<"high" | "medium" | "low">("high");

  const pressedKeysRef = useRef<Set<string>>(new Set());

  const localPlayer = useMemo(
    () => players.find(p => p.socketId === socket?.id) ?? null,
    [players, socket?.id],
  );

  useEffect(() => {
    if (!socket) return;

    const onState = (payload: Record<string, unknown>) => {
      const { players, bullets, walls } = payload as {
        players: PlayerState[];
        bullets: BulletState[];
        walls: WallState[];
      };
      if (players?.length > 0) {
        setPlayers(players);
        setBullets(bullets ?? []);
        setWalls(walls ?? []);
      }
    };

    const onJoin = ({ nicknames = [] }: { nicknames?: string[] }) =>
      setFeed(prev => [...prev.slice(-9), `${nicknames.join(", ") || "Someone"} joined the game`]);

    const onDeath = ({ nickname }: { nickname?: string }) =>
      setFeed(prev => [...prev.slice(-9), `${nickname || "Someone"} died`]);

    const onDead = () => {
      setFeed(prev => [...prev.slice(-9), "You died"]);
      router.push("/lobby");
    };

    const onUpdatedUserList = ({ count = 0 }: { count?: number }) =>
      setActivePlayers(count);

    socket.on(SOCKET_EVENTS.STATE, onState);
    socket.on(SOCKET_EVENTS.JOINING_LIST, onJoin);
    socket.on(SOCKET_EVENTS.UPDATED_PLAYER_LIST, onDeath);
    socket.on(SOCKET_EVENTS.DEAD, onDead);
    socket.on(SOCKET_EVENTS.UPDATED_USER_LIST, onUpdatedUserList);

    const savedName = localStorage.getItem("nickname") || "Player";
    socket.emit(SOCKET_EVENTS.GAME_START, { nickname: savedName });

    return () => {
      socket.off(SOCKET_EVENTS.STATE, onState);
      socket.off(SOCKET_EVENTS.JOINING_LIST, onJoin);
      socket.off(SOCKET_EVENTS.UPDATED_PLAYER_LIST, onDeath);
      socket.off(SOCKET_EVENTS.DEAD, onDead);
      socket.off(SOCKET_EVENTS.UPDATED_USER_LIST, onUpdatedUserList);
    };
  }, [socket, router]);

  useEffect(() => {
    if (localPlayer) setScore(localPlayer.point);
  }, [localPlayer]);

  useEffect(() => {
    if (!socket) return;

    const movement: Movement = { ...DEFAULT_MOVEMENT };

    const emitMovement = () => socket.emit(SOCKET_EVENTS.MOVEMENT, movement);

    const onKeyDown = (event: KeyboardEvent) => {
      if (!event?.key) return;
      const key = event.key.toLowerCase();
      if (pressedKeysRef.current.has(key)) return;
      pressedKeysRef.current.add(key);

      const dir = mapKeyToMovement(event.key);
      if (!dir) {
        if (event.code === "Space" || key === "x") socket.emit(SOCKET_EVENTS.SHOOT);
        return;
      }
      movement[dir] = true;
      emitMovement();
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (!event?.key) return;
      pressedKeysRef.current.delete(event.key.toLowerCase());
      const dir = mapKeyToMovement(event.key);
      if (!dir) return;
      movement[dir] = false;
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
    <ResponsiveLayout className="relative h-screen bg-black">
      <SharkTankCanvas
        players={players}
        bullets={bullets}
        walls={walls}
        localSocketId={socket?.id}
      />

      <div className="absolute top-4 left-4 z-50">
        <GameStats score={score} activePlayers={activePlayers} isMobile={false} />
      </div>

      <div className="absolute top-4 right-4 z-50 hidden md:block">
        <GameSettings
          soundEnabled={soundEnabled}
          quality={quality}
          onSoundToggle={() => setSoundEnabled(!soundEnabled)}
          onQualityChange={setQuality}
          isMobile={false}
        />
      </div>

      <div className="absolute left-4 bottom-4 z-50">
        <GameFeed feed={feed} isMobile={false} />
      </div>

      <div className="absolute right-4 bottom-4 z-50">
        <ControlsInfo isMobile={false} />
      </div>

      <MobileControls
        onMovementChange={movement => socket?.emit(SOCKET_EVENTS.MOVEMENT, movement)}
        onShoot={() => socket?.emit(SOCKET_EVENTS.SHOOT)}
      />
    </ResponsiveLayout>
  );
}
