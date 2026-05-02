"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/components/socket-provider";
import { SOCKET_EVENTS } from "@/lib/socket";

export default function LobbyPage() {
  const router = useRouter();
  const socket = useSocket();
  const inputRef = useRef<HTMLInputElement>(null);
  const [nickname, setNickname] = useState("");
  const [activePlayers, setActivePlayers] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("nickname");
    if (saved) setNickname(saved);
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const onCount = ({ count = 0 }: { count?: number }) => setActivePlayers(count);
    socket.on(SOCKET_EVENTS.UPDATED_USER_LIST, onCount);
    return () => socket.off(SOCKET_EVENTS.UPDATED_USER_LIST, onCount);
  }, [socket]);

  const handleEnter = () => {
    const valid = nickname.trim().slice(0, 10) || "Player";
    localStorage.setItem("nickname", valid);
    // Soft navigation — preserves the WebSocket connection held by the root layout
    router.push("/game");
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && nickname.trim().length >= 1) handleEnter();
  };

  const ready = nickname.trim().length >= 1;

  return (
    <div className="min-h-screen bg-[#000d1a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Title */}
        <div className="mb-10 text-center">
          <h1 className="text-5xl font-black tracking-tight text-white uppercase">
            Shark<span className="text-[#00ff88]">Tanks</span>
          </h1>
          <p className="mt-2 text-sm tracking-widest text-slate-500 uppercase">
            3D Multiplayer · WebSocket Battle
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label
              htmlFor="callsign"
              className="block mb-1.5 text-xs font-semibold tracking-widest text-slate-400 uppercase"
            >
              Callsign
            </label>
            <input
              ref={inputRef}
              id="callsign"
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              onKeyDown={onKey}
              placeholder="Enter nickname"
              maxLength={10}
              spellCheck={false}
              className="w-full h-12 px-4 rounded bg-white/5 border border-white/10 text-white text-base font-medium placeholder:text-slate-600 focus:outline-none focus:border-[#00ff88]/50 focus:bg-white/8 transition-colors"
            />
          </div>

          {/* Player count */}
          <div className="flex items-center justify-between px-1 text-xs text-slate-500">
            <span className="uppercase tracking-widest">Online</span>
            <span className="font-mono text-slate-300">
              {activePlayers} {activePlayers === 1 ? "player" : "players"}
            </span>
          </div>

          {/* CTA */}
          <button
            onClick={handleEnter}
            disabled={!ready}
            className="w-full h-12 rounded font-bold text-sm tracking-widest uppercase transition-colors
              bg-[#00ff88] text-black hover:bg-[#00e87a]
              disabled:bg-white/10 disabled:text-white/30 disabled:cursor-not-allowed"
          >
            Enter Battle
          </button>
        </div>

        {/* Controls hint */}
        <p className="mt-8 text-center text-xs text-slate-600 tracking-wide">
          WASD / Arrows to move &nbsp;·&nbsp; Space or X to shoot
        </p>
      </div>
    </div>
  );
}
