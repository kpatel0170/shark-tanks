"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  Users,
  Settings,
  Volume2,
  VolumeX,
  Navigation,
  Target,
  Gamepad2,
} from "lucide-react";

// ─── Game Stats (top-left HUD) ───────────────────────────────────────────────

interface GameStatsProps {
  score: number;
  activePlayers: number;
  health: number;
  maxHealth: number;
}

export function GameStats({ score, activePlayers, health, maxHealth }: GameStatsProps) {
  const healthPct = maxHealth > 0 ? Math.round((health / maxHealth) * 100) : 0;
  const healthColor =
    healthPct > 60 ? "bg-green-500" :
    healthPct > 30 ? "bg-yellow-500" : "bg-red-500";

  return (
    <Card className="bg-black/80 backdrop-blur-sm border-white/20 min-w-[160px]">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-500 shrink-0" />
          <span className="text-xl font-bold text-white">{score.toLocaleString()}</span>
        </div>

        <Badge className="bg-slate-700 text-white gap-1">
          <Users className="w-3 h-3" />
          {activePlayers} {activePlayers === 1 ? "player" : "players"}
        </Badge>

        {maxHealth > 0 && (
          <div className="space-y-1">
            <div className="text-xs text-slate-400">
              HP {health}/{maxHealth}
            </div>
            <Progress value={healthPct} className="h-2" indicatorClassName={healthColor} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Game Settings (top-right HUD, desktop only) ─────────────────────────────

interface GameSettingsProps {
  quality: "high" | "medium" | "low";
  onQualityChange: (q: "high" | "medium" | "low") => void;
}

export function GameSettings({ quality, onQualityChange }: GameSettingsProps) {
  return (
    <Card className="bg-black/80 backdrop-blur-sm border-white/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-white">Quality</span>
          <select
            value={quality}
            onChange={(e) => onQualityChange(e.target.value as "high" | "medium" | "low")}
            className="bg-black/60 text-white px-2 py-1 rounded border border-white/20 text-sm"
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Event Feed (bottom-left HUD) ────────────────────────────────────────────

interface GameFeedProps {
  feed: string[];
}

export function GameFeed({ feed }: GameFeedProps) {
  return (
    <Card className="bg-black/80 backdrop-blur-sm border-white/20 max-w-xs">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
          <Target className="w-4 h-4" />
          Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-28 space-y-0.5 overflow-y-auto text-xs">
          {feed.length ? (
            feed.map((item, i) => (
              <p key={`${item}-${i}`} className="text-slate-300">{item}</p>
            ))
          ) : (
            <p className="text-slate-500">No events yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Controls Reference (bottom-right HUD, desktop only) ─────────────────────

export function ControlsInfo() {
  return (
    <Card className="bg-black/80 backdrop-blur-sm border-white/20">
      <CardContent className="p-3 space-y-1.5 text-xs text-white">
        <div className="flex items-center gap-1.5">
          <Navigation className="w-3 h-3" />
          WASD / Arrows — Move
        </div>
        <div className="flex items-center gap-1.5">
          <Target className="w-3 h-3" />
          Space / X — Shoot
        </div>
        <div className="flex items-center gap-1.5">
          <Gamepad2 className="w-3 h-3" />
          Mobile pad below on touch
        </div>
      </CardContent>
    </Card>
  );
}
