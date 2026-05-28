"use client";

import { Volume2, VolumeX } from "lucide-react";
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

// ─── Match Timer (centered top HUD) ──────────────────────────────────────────

interface MatchTimerProps {
  remaining: number;
}

export function MatchTimer({ remaining }: MatchTimerProps) {
  const mins    = Math.floor(remaining / 60);
  const secs    = remaining % 60;
  const display = `${mins}:${secs.toString().padStart(2, "0")}`;
  const color   =
    remaining < 30 ? "text-red-400 animate-pulse" :
    remaining < 60 ? "text-yellow-400" : "text-white";

  return (
    <div className="bg-black/60 backdrop-blur-sm rounded border border-white/10 px-4 py-2 flex items-center gap-2">
      <span className="text-[10px] tracking-widest uppercase text-slate-500">Round</span>
      <span className={`font-mono font-bold text-base leading-none ${color}`}>{display}</span>
    </div>
  );
}

// ─── Round End Overlay ────────────────────────────────────────────────────────

interface RoundScore {
  nickname: string;
  point: number;
}

interface RoundEndOverlayProps {
  winner: string;
  scores: RoundScore[];
  localSocketId?: string;
  players: PlayerState[];
  onClose: () => void;
}

export function RoundEndOverlay({ winner, scores, players, localSocketId, onClose }: RoundEndOverlayProps) {
  const localNickname = players.find(p => p.socketId === localSocketId)?.nickname;
  const youWon = localNickname === winner;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75">
      <div className="bg-black/95 border border-white/10 rounded-xl px-8 py-8 text-center shadow-2xl w-80">
        {/* Header */}
        <div className="text-[10px] tracking-widest uppercase text-slate-500 mb-2">Round Over</div>
        <div className={`text-3xl font-black mb-1 ${youWon ? "text-[#00ff88]" : "text-white"}`}>
          {winner}
        </div>
        <div className="text-xs tracking-widest uppercase text-slate-500 mb-6">
          {youWon ? "You win this round!" : "wins the round"}
        </div>

        {/* Score table */}
        <div className="space-y-1 mb-6 text-left">
          {scores.map((s, i) => {
            const isWinner = i === 0;
            return (
              <div
                key={s.nickname}
                className={`flex items-center justify-between px-3 py-1.5 rounded text-sm ${
                  isWinner ? "bg-[#00ff88]/10 text-[#00ff88]" : "text-slate-400"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono w-4 text-slate-600">{i + 1}</span>
                  <span className="font-medium">{s.nickname}</span>
                </div>
                <span className="font-mono font-bold">{s.point}</span>
              </div>
            );
          })}
        </div>

        {/* Next round note */}
        <p className="text-[10px] text-slate-600 tracking-widest uppercase mb-4">
          Scores reset · New round starting
        </p>

        <button
          onClick={onClose}
          className="w-full h-10 rounded bg-[#00ff88] text-black font-bold text-sm tracking-widest uppercase hover:bg-[#00e87a] transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

// ─── Quality Setting (compact, desktop only) ─────────────────────────────────

interface GameSettingsProps {
  quality: "high" | "medium" | "low";
  onQualityChange: (q: "high" | "medium" | "low") => void;
  muted: boolean;
  onToggleMute: () => void;
}

export function GameSettings({ quality, onQualityChange, muted, onToggleMute }: GameSettingsProps) {
  return (
    <div className="bg-black/60 backdrop-blur-sm rounded border border-white/10 px-3 py-2 flex items-center gap-3">
      {/* Mute toggle */}
      <button
        onClick={onToggleMute}
        title={muted ? "Unmute" : "Mute"}
        className="text-slate-400 hover:text-white transition-colors text-sm leading-none"
      >
        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>

      <span className="text-white/10">|</span>

      <span className="text-[10px] tracking-widest uppercase text-slate-400">Quality</span>
      <select
        value={quality}
        onChange={(e) => onQualityChange(e.target.value as "high" | "medium" | "low")}
        className="bg-transparent text-white text-xs border-none outline-none cursor-pointer"
      >
        <option value="high"   className="bg-black">High</option>
        <option value="medium" className="bg-black">Medium</option>
        <option value="low"    className="bg-black">Low</option>
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
    <div className="absolute inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-black/90 backdrop-blur-md rounded-lg border border-white/10 w-80 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <span className="text-xs font-bold tracking-widest uppercase text-slate-400">Scoreboard</span>
          <span className="text-[10px] text-slate-600 tracking-widest uppercase">Tab to close</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-1.5 border-b border-white/5">
          <span className="w-5 text-right text-[10px] text-slate-600">#</span>
          <span className="flex-1 text-[10px] tracking-widest uppercase text-slate-600">Player</span>
          <span className="text-[10px] tracking-widest uppercase text-slate-600">Kills</span>
        </div>
        <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
          {sorted.length === 0 && (
            <div className="px-4 py-4 text-xs text-slate-500 text-center">No players yet</div>
          )}
          {sorted.map((p, i) => {
            const isLocal = p.socketId === localSocketId;
            const isBot   = !p.socketId;
            return (
              <div
                key={p.id}
                className={`flex items-center gap-3 px-4 py-2 text-sm ${isLocal ? "bg-[#00ff88]/10" : ""}`}
              >
                <span className="w-5 text-right text-slate-500 text-xs font-mono">{i + 1}</span>
                <span className={`flex-1 font-medium truncate ${isLocal ? "text-[#00ff88]" : isBot ? "text-slate-400" : "text-white"}`}>
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
