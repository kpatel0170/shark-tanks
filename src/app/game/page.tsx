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
    () => players.find((p) => p.socketId === socket?.id),
    [players, socket?.id],
  );

  useEffect(() => {
    if (!socket) return;

    const onState = (state: {
      players: PlayerState[];
      bullets: BulletState[];
      walls: WallState[];
    }) => {
      setPlayers(state.players);
      setBullets(state.bullets);
      setWalls(state.walls);
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
    <div className="relative h-screen bg-black">
      <SharkTankCanvas
        players={players}
        bullets={bullets}
        walls={walls}
        localSocketId={socket?.id}
      />

      {/* Score & Players HUD */}
      <div className="absolute top-4 left-4 z-50">
        <Card className="bg-black/80 backdrop-blur-sm border-white/20">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <div className="text-2xl font-bold text-white">
                {score.toLocaleString()}
              </div>
            </div>
            <Badge className="bg-slate-700 text-white">
              <Users className="w-3 h-3 mr-1" />
              {activePlayers} Players
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Game Settings Panel */}
      <div className="absolute top-4 right-4 z-50 hidden md:block">
        <Card className="bg-black/80 backdrop-blur-sm border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Game Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white">Sound</span>
              <Button
                size="default"
                variant="secondary"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="w-12 h-6 p-0"
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white">Quality</span>
              <select
                value={quality}
                onChange={(e) =>
                  setQuality(e.target.value as "high" | "medium" | "low")
                }
                className="bg-black/60 text-white px-2 py-1 rounded border border-white/20 text-sm"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Game Feed */}
      <div className="absolute left-4 bottom-4 z-50 max-w-sm">
        <Card className="bg-black/80 backdrop-blur-sm border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <Newspaper className="w-4 h-4" />
              Latest News
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-32 space-y-1 overflow-y-auto text-xs">
              {feed.length ? (
                feed.map((item, index) => (
                  <p key={`${item}-${index}`} className="text-slate-300">
                    {item}
                  </p>
                ))
              ) : (
                <p className="text-slate-500">No events yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Controls Info */}
      <div className="absolute right-4 bottom-4 z-50 md:hidden">
        <Card className="bg-black/80 backdrop-blur-sm border-white/20">
          <CardContent className="p-3">
            <div className="text-xs space-y-1 text-white">
              <div className="flex items-center gap-1">
                <Navigation className="w-3 h-3" />
                WASD/Arrows - Move
              </div>
              <div className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                Space/X - Shoot
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Desktop Controls Info */}
      <div className="absolute right-4 bottom-4 z-50 hidden md:block">
        <Card className="bg-black/80 backdrop-blur-sm border-white/20">
          <CardContent className="p-3">
            <div className="text-xs space-y-1 text-white">
              <div className="flex items-center gap-1">
                <Navigation className="w-3 h-3" />
                WASD/Arrows - Move
              </div>
              <div className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                Space/X - Shoot
              </div>
              <div className="flex items-center gap-1">
                <Gamepad2 className="w-3 h-3" />
                Mouse - Camera
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Controls */}
      <MobileControls
        onMovementChange={(movement) =>
          socket?.emit(SOCKET_EVENTS.MOVEMENT, movement)
        }
        onShoot={() => socket?.emit(SOCKET_EVENTS.SHOOT)}
      />
    </div>
  );
}
