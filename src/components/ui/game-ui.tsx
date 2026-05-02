"use client";

import { Progress } from "@/components/ui/progress";

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
// Each event is its own floating pill — right-aligned so newest entries
// sit near the screen edge and never overlap with game-play UI.

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
  // Show newest 5, newest at the bottom
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
