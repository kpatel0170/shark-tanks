"use client";

import { Progress } from "@/components/ui/progress";
import type { PlayerState } from "@/lib/game-types";

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
    healthPct > 60 ? "bg-[#00ff88]" :
    healthPct > 30 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="bg-black/60 backdrop-blur-sm rounded border border-white/10 px-3 py-2.5 space-y-2 min-w-[130px]">
      <div className="text-2xl font-black text-white font-mono leading-none">{score.toLocaleString()}</div>

      {maxHealth > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] tracking-widest uppercase text-slate-400">
            HP {health}/{maxHealth}
          </div>
          <Progress value={healthPct} className="h-1.5 bg-white/10" indicatorClassName={healthColor} />
        </div>
      )}

      <div className="text-[10px] tracking-widest uppercase text-slate-500">
        {activePlayers} {activePlayers === 1 ? "player" : "players"} online
      </div>
    </div>
  );
}

// ─── Quality Setting (compact, desktop only) ─────────────────────────────────

interface GameSettingsProps {
  quality: "high" | "medium" | "low";
  onQualityChange: (q: "high" | "medium" | "low") => void;
}

export function GameSettings({ quality, onQualityChange }: GameSettingsProps) {
  return (
    <div className="bg-black/60 backdrop-blur-sm rounded border border-white/10 px-3 py-2 flex items-center gap-2">
      <span className="text-[10px] tracking-widest uppercase text-slate-400">Quality</span>
      <select
        value={quality}
        onChange={(e) => onQualityChange(e.target.value as "high" | "medium" | "low")}
        className="bg-transparent text-white text-xs border-none outline-none cursor-pointer"
      >
        <option value="high" className="bg-black">High</option>
        <option value="medium" className="bg-black">Medium</option>
        <option value="low" className="bg-black">Low</option>
      </select>
    </div>
  );
}

// ─── Event Feed (top-right HUD) ───────────────────────────────────────────────

interface GameFeedProps {
  feed: string[];
}

function feedColor(msg: string): string {
  if (msg.startsWith("You")) return "text-yellow-300";
  if (msg.includes("destroyed")) return "text-red-400";
  if (msg.includes("joined")) return "text-[#00ff88]";
  return "text-slate-300";
}

export function GameFeed({ feed }: GameFeedProps) {
  const visible = feed.slice(-5);
  return (
    <div className="flex flex-col items-end gap-1 pointer-events-none">
      {visible.map((item, i) => (
        <div
          key={`${i}-${item}`}
          className={`px-2.5 py-1 rounded text-xs font-medium bg-black/60 backdrop-blur-sm border border-white/10 ${feedColor(item)}`}
        >
          {item}
        </div>
      ))}
    </div>
  );
}

// ─── Leaderboard overlay (Tab-toggled) ───────────────────────────────────────

interface LeaderboardProps {
  players: PlayerState[];
  localSocketId?: string;
  onClose: () => void;
}

export function Leaderboard({ players, localSocketId, onClose }: LeaderboardProps) {
  const sorted = [...players].sort((a, b) => b.point - a.point);

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Panel — stop click-through */}
      <div
        className="bg-black/90 backdrop-blur-md rounded-lg border border-white/10 w-80 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <span className="text-xs font-bold tracking-widest uppercase text-slate-400">
            Scoreboard
          </span>
          <span className="text-[10px] text-slate-600 tracking-widest uppercase">Tab to close</span>
        </div>

        {/* Column labels */}
        <div className="flex items-center gap-3 px-4 py-1.5 border-b border-white/5">
          <span className="w-5 text-right text-[10px] text-slate-600">#</span>
          <span className="flex-1 text-[10px] tracking-widest uppercase text-slate-600">Player</span>
          <span className="text-[10px] tracking-widest uppercase text-slate-600">Kills</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
          {sorted.length === 0 && (
            <div className="px-4 py-4 text-xs text-slate-500 text-center">
              No players yet
            </div>
          )}
          {sorted.map((p, i) => {
            const isLocal = p.socketId === localSocketId;
            const isBot   = !p.socketId;
            return (
              <div
                key={p.id}
                className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                  isLocal ? "bg-[#00ff88]/10" : ""
                }`}
              >
                <span className="w-5 text-right text-slate-500 text-xs font-mono">{i + 1}</span>
                <span
                  className={`flex-1 font-medium truncate ${
                    isLocal ? "text-[#00ff88]" : isBot ? "text-slate-400" : "text-white"
                  }`}
                >
                  {p.nickname}
                  {isBot && <span className="ml-1.5 text-[10px] text-slate-600 font-normal">BOT</span>}
                </span>
                <span className="text-white font-mono text-sm font-bold">{p.point}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
