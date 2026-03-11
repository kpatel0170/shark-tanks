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
import {
  Gamepad2,
  Trophy,
  Users,
  Wifi,
  Zap,
  Target,
  Shield,
  Star,
  Crown,
  Swords,
  Flame,
  Sparkles,
} from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4 sm:p-6 lg:p-8 flex items-center justify-center relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-blue-500/20 rounded-full blur-lg animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-40 right-1/3 w-12 h-12 bg-red-500/20 rounded-full blur-lg animate-pulse delay-500"></div>
      </div>

      <div className="w-full max-w-lg mx-auto relative z-10">
        <Card className="border-white/20 bg-black/30 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center space-y-4 pb-8">
            {/* Logo with Animation */}
            <div className="flex justify-center items-center gap-3">
              <div className="relative">
                <Swords className="w-8 h-8 text-red-500 animate-pulse" />
                <Sparkles className="w-4 h-4 text-yellow-400 absolute -top-2 -right-2 animate-spin" />
              </div>
              <CardTitle className="text-4xl sm:text-5xl lg:text-6xl font-black text-white bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                SharkTanks
              </CardTitle>
              <div className="relative">
                <Shield className="w-8 h-8 text-blue-500 animate-pulse" />
                <Star className="w-4 h-4 text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
              </div>
            </div>

            <CardDescription className="text-lg sm:text-xl text-slate-300 flex items-center justify-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Join the battle, forge your destiny
              <Flame className="w-5 h-5 text-orange-500" />
            </CardDescription>

            {/* Status Badges */}
            <div className="flex justify-center gap-2 flex-wrap">
              <Badge className="bg-green-600/80 text-white border-green-400/50 flex items-center gap-1">
                <Wifi className="w-3 h-3" />
                Online
              </Badge>
              <Badge className="bg-blue-600/80 text-white border-blue-400/50 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Live
              </Badge>
              <Badge className="bg-purple-600/80 text-white border-purple-400/50 flex items-center gap-1">
                <Target className="w-3 h-3" />
                Multiplayer
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="nickname"
                  className="text-sm font-medium text-white flex items-center gap-2"
                >
                  <Crown className="w-4 h-4 text-yellow-500" />
                  Your Username
                </label>
                <Input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Enter nickname"
                  maxLength={10}
                  className="bg-slate-900/80 border-white/20 text-white placeholder:text-slate-400 h-12 text-lg font-semibold focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <div className="text-xs text-slate-400 flex justify-between">
                  <span>{nickname.length}/10 characters</span>
                  {nickname.length >= 3 && (
                    <span className="text-green-400 flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Ready for battle!
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-white/10">
                <span className="text-sm text-slate-300 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  Active Players
                </span>
                <Badge className="bg-blue-600 text-white text-sm px-3 py-1">
                  {activePlayers}
                </Badge>
              </div>

              <Button
                onClick={handleGameStart}
                size="lg"
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0 shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={nickname.length < 3}
              >
                <Gamepad2 className="w-5 h-5 mr-2" />
                Let's Go!
                <Trophy className="w-5 h-5 ml-2" />
              </Button>
            </div>

            <div className="text-xs text-slate-400 space-y-2 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-yellow-500" />
                  3D multiplayer game - give it a moment to load
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1">
                  <Target className="w-3 h-3 text-green-500" />
                  Mobile: play in landscape mode for best experience
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-blue-500" />
                  WASD/Arrows to move, Space/X to shoot
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <Sparkles className="w-3 h-3" />
            <span>Built with Next.js & Three.js</span>
            <Sparkles className="w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
}
