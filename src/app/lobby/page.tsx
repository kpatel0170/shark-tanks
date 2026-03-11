"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/components/socket-provider";
import { SOCKET_EVENTS } from "@/lib/socket";

export default function LobbyPage() {
  const socket = useSocket();
  const [nickname, setNickname] = useState("");
  const [activePlayers, setActivePlayers] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedName = localStorage.getItem("nickname");
    if (savedName) setNickname(savedName);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onUpdatedUsers = (count: number) => setActivePlayers(count);

    socket.on(SOCKET_EVENTS.UPDATED_USER_LIST, onUpdatedUsers);

    return () => {
      socket.off(SOCKET_EVENTS.UPDATED_USER_LIST, onUpdatedUsers);
    };
  }, [socket]);

  const handleGameStart = () => {
    const validNickname = nickname.trim().slice(0, 10) || "Player";
    localStorage.setItem("nickname", validNickname);
    window.location.href = "/game";
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-900 via-purple-900 to-indigo-900 p-6 text-white">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 pt-24 text-center">
        <h1 className="text-5xl font-black">SharkTanks</h1>
        <p className="text-lg">Join the battle, forge your destiny</p>

        <div className="w-full max-w-md space-y-4">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Your Username"
            maxLength={10}
            className="w-full rounded-md bg-white/10 px-4 py-2 text-white placeholder-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <div className="rounded-lg bg-white/10 px-3 py-2 text-sm backdrop-blur-sm">
            Active Players: {activePlayers}
          </div>

          <button
            onClick={handleGameStart}
            className="w-full rounded-md bg-emerald-500 px-6 py-3 font-semibold hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            Let's Go!
          </button>
        </div>

        <div className="max-w-md text-xs opacity-90">
          <p>3D multiplayer game - give it a moment to load.</p>
          <p>Mobile: play in landscape mode.</p>
        </div>
      </div>
    </div>
  );
}
