"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/components/socket-provider";
import { SOCKET_EVENTS } from "@/lib/socket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gamepad2, Trophy, Users } from "lucide-react";

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
    <div className="min-h-screen bg-linear-to-br from-blue-900 via-purple-900 to-indigo-900 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
      <div className="w-full max-w-lg mx-auto">
        <Card className="border-white/20 bg-black/30 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4 pb-8">
            <CardTitle className="text-4xl sm:text-5xl lg:text-6xl font-black text-white flex items-center justify-center gap-3">
              <Gamepad2 className="w-8 h-8 sm:w-12 sm:h-12" />
              SharkTanks
            </CardTitle>
            <CardDescription className="text-lg sm:text-xl text-slate-300">
              Join the battle, forge your destiny
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="nickname"
                  className="text-sm font-medium text-white"
                >
                  Your Username
                </label>
                <Input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Enter nickname"
                  maxLength={10}
                  className="bg-slate-900/80 border-white/20 text-white placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Active Players</span>
                <Badge className="bg-slate-700 text-white flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {activePlayers}
                </Badge>
              </div>

              <Button
                onClick={handleGameStart}
                size="lg"
                className="w-full h-12 text-lg font-semibold flex items-center gap-2"
              >
                <Trophy className="w-5 h-5" />
                Let's Go!
              </Button>
            </div>

            <div className="text-xs text-slate-400 space-y-1 pt-4 border-t border-white/10">
              <p>3D multiplayer game - give it a moment to load</p>
              <p>Mobile: play in landscape mode for best experience</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
