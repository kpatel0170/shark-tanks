"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { SharkTankCanvas } from "@/components/game/shark-tank-canvas";
import { MobileControls } from "@/components/game/mobile-controls";
import {
  GameStats,
  GameSettings,
  GameFeed,
  MatchTimer,
  Leaderboard,
  RoundEndOverlay,
} from "@/components/ui/game-ui";
import { useSocket } from "@/components/socket-provider";
import { type BulletState, type Movement, type PlayerState } from "@/lib/game-types";
import { SOCKET_EVENTS } from "@/lib/socket";
import {
  playShoot,
  playHit,
  playDeath,
  playJoin,
  playRoundEnd,
  toggleMute,
  isMuted,
} from "@/lib/game-sounds";

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

function DeathOverlay({ onRespawn, onLobby }: { onRespawn: () => void; onLobby: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="flex flex-col items-center gap-6 rounded-xl border border-red-800 bg-black/90 px-10 py-8 text-center shadow-2xl">
        <h2 className="text-2xl font-bold tracking-widest text-red-400 uppercase">
          You Were Destroyed
        </h2>
        <div className="flex gap-4">
          <button
            onClick={onRespawn}
            className="rounded bg-[#00ff88] px-6 py-2 font-bold text-sm tracking-widest uppercase text-black hover:bg-[#00e87a] transition-colors"
          >
            Respawn
          </button>
          <button
            onClick={onLobby}
            className="rounded bg-white/10 px-6 py-2 font-bold text-sm tracking-widest uppercase text-white hover:bg-white/20 transition-colors"
          >
            Exit
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
        <h2 className="text-2xl font-bold tracking-widest text-yellow-400 uppercase">
          Connection Lost
        </h2>
        <button
          onClick={onReconnect}
          className="rounded bg-yellow-600 px-6 py-2 font-bold text-sm tracking-widest uppercase text-white hover:bg-yellow-500 transition-colors"
        >
          Reconnect
        </button>
      </div>
    </div>
  );
}

type RoundEndData = {
  winner: string;
  scores: Array<{ nickname: string; point: number }>;
};

export default function GamePage() {
  const router = useRouter();
  const socket = useSocket();

  const [players, setPlayers]               = useState<PlayerState[]>([]);
  const [bullets, setBullets]               = useState<BulletState[]>([]);
  const [activePlayers, setActivePlayers]   = useState(0);
  const [feed, setFeed]                     = useState<string[]>([]);
  const [quality, setQuality]               = useState<"high" | "medium" | "low">("high");
  const [isDead, setIsDead]                 = useState(false);
  const [isDisconnected, setIsDisconnected] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [remainingTime, setRemainingTime]   = useState(180);
  const [roundEnd, setRoundEnd]             = useState<RoundEndData | null>(null);
  const [muted, setMuted]                   = useState(false);

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

  const handleToggleMute = () => {
    const nowMuted = toggleMute();
    setMuted(nowMuted);
  };

  // Auto-dismiss round-end overlay after 8 seconds
  useEffect(() => {
    if (!roundEnd) return;
    const t = setTimeout(() => setRoundEnd(null), 8000);
    return () => clearTimeout(t);
  }, [roundEnd]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const pushFeed = (msg: string) =>
      setFeed((prev) => [...prev.slice(-9), msg]);

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

    const onJoin = ({ nicknames = [] }: { nicknames?: string[] }) => {
      pushFeed(`${nicknames.join(", ") || "Someone"} joined`);
      playJoin();
    };

    const onDeath = ({ nickname }: { nickname?: string }) => {
      pushFeed(`${nickname || "Someone"} was destroyed`);
      playHit();
    };

    const onDead = () => {
      pushFeed("You were destroyed");
      playDeath();
      setIsDead(true);
    };

    const onCount = ({ count = 0 }: { count?: number }) => setActivePlayers(count);

    const onTimer = ({ remaining = 180 }: { remaining?: number }) =>
      setRemainingTime(remaining);

    const onRoundEnd = ({ winner = "", scores = [] }: { winner?: string; scores?: RoundEndData["scores"] }) => {
      setRoundEnd({ winner, scores });
      playRoundEnd();
    };

    const onDisconnect = () => setIsDisconnected(true);

    socket.on(SOCKET_EVENTS.STATE,               onState);
    socket.on(SOCKET_EVENTS.JOINING_LIST,        onJoin);
    socket.on(SOCKET_EVENTS.UPDATED_PLAYER_LIST, onDeath);
    socket.on(SOCKET_EVENTS.DEAD,                onDead);
    socket.on(SOCKET_EVENTS.UPDATED_USER_LIST,   onCount);
    socket.on(SOCKET_EVENTS.MATCH_TIMER,         onTimer);
    socket.on(SOCKET_EVENTS.ROUND_END,           onRoundEnd);
    socket.on("disconnect",                      onDisconnect);

    socket.emit(SOCKET_EVENTS.GAME_START, { nickname });

    return () => {
      socket.off(SOCKET_EVENTS.STATE,               onState);
      socket.off(SOCKET_EVENTS.JOINING_LIST,        onJoin);
      socket.off(SOCKET_EVENTS.UPDATED_PLAYER_LIST, onDeath);
      socket.off(SOCKET_EVENTS.DEAD,                onDead);
      socket.off(SOCKET_EVENTS.UPDATED_USER_LIST,   onCount);
      socket.off(SOCKET_EVENTS.MATCH_TIMER,         onTimer);
      socket.off(SOCKET_EVENTS.ROUND_END,           onRoundEnd);
      socket.off("disconnect",                      onDisconnect);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  // Keyboard input — movement + Tab for leaderboard
  useEffect(() => {
    if (!socket) return;

    const movement: Movement = { ...DEFAULT_MOVEMENT };
    const emit = () => socket.emit(SOCKET_EVENTS.MOVEMENT, movement);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault();
        setShowLeaderboard((v) => !v);
        return;
      }

      const key = e.key.toLowerCase();
      if (pressedKeys.current.has(key)) return;
      pressedKeys.current.add(key);

      const dir = mapKeyToMovement(e.key);
      if (dir) { movement[dir] = true; emit(); return; }

      if (e.code === "Space" || key === "x") {
        socket.emit(SOCKET_EVENTS.SHOOT);
        playShoot();
      }
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

      {/* Top-left: score + health + player count */}
      <div className="absolute top-3 left-3 z-40">
        <GameStats
          score={localPlayer?.point ?? 0}
          activePlayers={activePlayers}
          health={localPlayer?.health ?? 0}
          maxHealth={localPlayer?.maxHealth ?? 0}
        />
      </div>

      {/* Top-center: round countdown */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40">
        <MatchTimer remaining={remainingTime} />
      </div>

      {/* Top-right: event feed + settings (desktop) */}
      <div className="absolute top-3 right-3 z-40 flex flex-col items-end gap-2">
        <GameFeed feed={feed} />
        <div className="hidden md:block">
          <GameSettings
            quality={quality}
            onQualityChange={setQuality}
            muted={muted}
            onToggleMute={handleToggleMute}
          />
        </div>
      </div>

      {/* Scoreboard button — mobile only */}
      <button
        onClick={() => setShowLeaderboard((v) => !v)}
        className="absolute bottom-3 left-3 z-40 md:hidden bg-black/60 backdrop-blur-sm border border-white/10 rounded px-3 py-1.5 text-[10px] tracking-widest uppercase text-slate-400 hover:text-white transition-colors"
      >
        Scores
      </button>

      {/* Desktop Tab hint */}
      <div className="absolute bottom-3 left-3 z-40 hidden md:block pointer-events-none">
        <span className="text-[10px] tracking-widest uppercase text-slate-600">
          Tab — scoreboard
        </span>
      </div>

      {/* Mobile controls */}
      <MobileControls
        onMovementChange={(m) => socket?.emit(SOCKET_EVENTS.MOVEMENT, m)}
        onShoot={() => { socket?.emit(SOCKET_EVENTS.SHOOT); playShoot(); }}
      />

      {/* Leaderboard overlay */}
      {showLeaderboard && (
        <Leaderboard
          players={players}
          localSocketId={socket?.id}
          onClose={() => setShowLeaderboard(false)}
        />
      )}

      {/* Round-end overlay */}
      {roundEnd && (
        <RoundEndOverlay
          winner={roundEnd.winner}
          scores={roundEnd.scores}
          players={players}
          localSocketId={socket?.id}
          onClose={() => setRoundEnd(null)}
        />
      )}

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
