"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { SharkTankCanvas } from "@/components/game/shark-tank-canvas";
import { MobileControls } from "@/components/game/mobile-controls";
import { GameStats, GameSettings, GameFeed, ControlsInfo } from "@/components/ui/game-ui";
import { useSocket } from "@/components/socket-provider";
import { type BulletState, type Movement, type PlayerState } from "@/lib/game-types";
import { SOCKET_EVENTS } from "@/lib/socket";

const DEFAULT_MOVEMENT: Movement = { forward: false, back: false, left: false, right: false };

function mapKeyToMovement(key: string): keyof Movement | null {
  switch (key.toLowerCase()) {
    case "w": case "arrowup":    return "forward";
    case "s": case "arrowdown":  return "back";
    case "a": case "arrowleft":  return "left";
    case "d": case "arrowright": return "right";
    default: return null;
  }
}

function DeathOverlay({
  onRespawn,
  onLobby,
}: {
  onRespawn: () => void;
  onLobby: () => void;
}) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="flex flex-col items-center gap-6 rounded-xl border border-red-800 bg-black/90 px-10 py-8 text-center shadow-2xl">
        <div className="text-5xl">💥</div>
        <h2 className="text-2xl font-bold tracking-widest text-red-400 uppercase">
          You Were Destroyed
        </h2>
        <div className="flex gap-4">
          <button
            onClick={onRespawn}
            className="rounded-lg bg-green-700 px-6 py-2 font-semibold text-white transition hover:bg-green-600"
          >
            Respawn
          </button>
          <button
            onClick={onLobby}
            className="rounded-lg bg-zinc-700 px-6 py-2 font-semibold text-white transition hover:bg-zinc-600"
          >
            Exit to Lobby
          </button>
        </div>
      </div>
    </div>
  );
}

function DisconnectOverlay({ onReconnect }: { onReconnect: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="flex flex-col items-center gap-6 rounded-xl border border-yellow-700 bg-black/90 px-10 py-8 text-center shadow-2xl">
        <div className="text-5xl">📡</div>
        <h2 className="text-2xl font-bold tracking-widest text-yellow-400 uppercase">
          Connection Lost
        </h2>
        <button
          onClick={onReconnect}
          className="rounded-lg bg-yellow-600 px-6 py-2 font-semibold text-white transition hover:bg-yellow-500"
        >
          Reconnect
        </button>
      </div>
    </div>
  );
}

export default function GamePage() {
  const router = useRouter();
  const socket = useSocket();

  const [players, setPlayers]             = useState<PlayerState[]>([]);
  const [bullets, setBullets]             = useState<BulletState[]>([]);
  const [activePlayers, setActivePlayers] = useState(0);
  const [feed, setFeed]                   = useState<string[]>([]);
  const [quality, setQuality]             = useState<"high" | "medium" | "low">("high");
  const [isDead, setIsDead]               = useState(false);
  const [isDisconnected, setIsDisconnected] = useState(false);

  const pressedKeys = useRef<Set<string>>(new Set());

  const localPlayer = useMemo(
    () => players.find((p) => p.socketId === socket?.id) ?? null,
    [players, socket?.id],
  );

  const nickname = typeof window !== "undefined"
    ? localStorage.getItem("nickname") || "Player"
    : "Player";

  const handleRespawn = () => {
    setIsDead(false);
    socket?.emit(SOCKET_EVENTS.GAME_START, { nickname });
  };

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const onState = (payload: Record<string, unknown>) => {
      const { players: p, bullets: b } = payload as {
        players: PlayerState[];
        bullets: BulletState[];
      };
      if (p?.length > 0) {
        setPlayers(p);
        setBullets(b ?? []);
      }
    };

    const pushFeed = (msg: string) =>
      setFeed((prev) => [...prev.slice(-9), msg]);

    const onJoin    = ({ nicknames = [] }: { nicknames?: string[] }) =>
      pushFeed(`${nicknames.join(", ") || "Someone"} joined`);

    const onDeath   = ({ nickname }: { nickname?: string }) =>
      pushFeed(`${nickname || "Someone"} was destroyed`);

    // Show death overlay — do NOT auto-navigate so the player can respawn
    const onDead    = () => { pushFeed("You were destroyed"); setIsDead(true); };

    const onCount   = ({ count = 0 }: { count?: number }) => setActivePlayers(count);

    const onDisconnect = () => setIsDisconnected(true);

    socket.on(SOCKET_EVENTS.STATE,               onState);
    socket.on(SOCKET_EVENTS.JOINING_LIST,        onJoin);
    socket.on(SOCKET_EVENTS.UPDATED_PLAYER_LIST, onDeath);
    socket.on(SOCKET_EVENTS.DEAD,                onDead);
    socket.on(SOCKET_EVENTS.UPDATED_USER_LIST,   onCount);
    socket.on('disconnect',                      onDisconnect);

    socket.emit(SOCKET_EVENTS.GAME_START, { nickname });

    return () => {
      socket.off(SOCKET_EVENTS.STATE,               onState);
      socket.off(SOCKET_EVENTS.JOINING_LIST,        onJoin);
      socket.off(SOCKET_EVENTS.UPDATED_PLAYER_LIST, onDeath);
      socket.off(SOCKET_EVENTS.DEAD,                onDead);
      socket.off(SOCKET_EVENTS.UPDATED_USER_LIST,   onCount);
      socket.off('disconnect',                      onDisconnect);
    };
  // router intentionally omitted — it's only used in onClick handlers, not inside this effect
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  // Keyboard input
  useEffect(() => {
    if (!socket) return;

    const movement: Movement = { ...DEFAULT_MOVEMENT };
    const emit = () => socket.emit(SOCKET_EVENTS.MOVEMENT, movement);

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (pressedKeys.current.has(key)) return;
      pressedKeys.current.add(key);

      const dir = mapKeyToMovement(e.key);
      if (dir) { movement[dir] = true; emit(); return; }
      if (e.code === "Space" || key === "x") socket.emit(SOCKET_EVENTS.SHOOT);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      pressedKeys.current.delete(e.key.toLowerCase());
      const dir = mapKeyToMovement(e.key);
      if (dir) { movement[dir] = false; emit(); }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup",   onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup",   onKeyUp);
      pressedKeys.current.clear();
      socket.emit(SOCKET_EVENTS.MOVEMENT, DEFAULT_MOVEMENT);
    };
  }, [socket]);

  return (
    <div className="relative h-screen bg-black overflow-hidden">
      <SharkTankCanvas
        players={players}
        bullets={bullets}
        localSocketId={socket?.id}
        quality={quality}
      />

      {/* Top-left: score + player count + health */}
      <div className="absolute top-4 left-4 z-50">
        <GameStats
          score={localPlayer?.point ?? 0}
          activePlayers={activePlayers}
          health={localPlayer?.health ?? 0}
          maxHealth={localPlayer?.maxHealth ?? 0}
        />
      </div>

      {/* Top-right: quality (desktop only) */}
      <div className="absolute top-4 right-4 z-50 hidden md:block">
        <GameSettings quality={quality} onQualityChange={setQuality} />
      </div>

      {/* Bottom-left: event feed */}
      <div className="absolute bottom-4 left-4 z-50 hidden sm:block">
        <GameFeed feed={feed} />
      </div>

      {/* Bottom-right: controls hint (desktop only) */}
      <div className="absolute bottom-4 right-4 z-50 hidden md:block">
        <ControlsInfo />
      </div>

      {/* Mobile: d-pad + fire + bottom bar */}
      <MobileControls
        onMovementChange={(m) => socket?.emit(SOCKET_EVENTS.MOVEMENT, m)}
        onShoot={() => socket?.emit(SOCKET_EVENTS.SHOOT)}
      />

      {isDead && (
        <DeathOverlay
          onRespawn={handleRespawn}
          onLobby={() => router.push("/lobby")}
        />
      )}

      {isDisconnected && !isDead && (
        <DisconnectOverlay onReconnect={() => window.location.reload()} />
      )}
    </div>
  );
}
