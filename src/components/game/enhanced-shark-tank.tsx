"use client";

import { useState } from "react";
import { SharkTankCanvas } from "./shark-tank-canvas";
import { useGameSettings } from "@/hooks/use-game-enhancements";
import type { BulletState, PlayerState, WallState } from "@/lib/game-types";

// Settings panel component
function SettingsPanel({
  settings,
  updateSetting,
}: {
  settings: any;
  updateSetting: (key: string, value: any) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute top-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-black/60 text-white p-2 rounded hover:bg-black/80 transition-colors"
      >
        ⚙️ Settings
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-black/90 text-white p-4 rounded-lg shadow-xl">
          <h3 className="font-bold mb-4">Game Settings</h3>

          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span>Sound</span>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) =>
                  updateSetting("soundEnabled", e.target.checked)
                }
                className="w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between">
              <span>Music</span>
              <input
                type="checkbox"
                checked={settings.musicEnabled}
                onChange={(e) =>
                  updateSetting("musicEnabled", e.target.checked)
                }
                className="w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between">
              <span>Quality</span>
              <select
                value={settings.quality}
                onChange={(e) => updateSetting("quality", e.target.value)}
                className="bg-black/60 text-white px-2 py-1 rounded"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 py-2 rounded transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

// Thin wrapper — SharkTankCanvas owns the Canvas; this adds the settings panel overlay
export function EnhancedSharkTankCanvas({
  players,
  bullets,
  walls,
  localSocketId,
}: {
  players: PlayerState[];
  bullets: BulletState[];
  walls: WallState[];
  localSocketId?: string;
}) {
  const { settings, updateSetting } = useGameSettings();

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <SettingsPanel settings={settings} updateSetting={updateSetting} />
      <SharkTankCanvas
        players={players}
        bullets={bullets}
        walls={walls}
        localSocketId={localSocketId}
      />
    </div>
  );
}

// Passthrough — previously had a fake 2.5-second simulated delay (removed)
export function SharkTankGameLoader({
  players,
  bullets,
  walls,
  localSocketId,
}: {
  players: PlayerState[];
  bullets: BulletState[];
  walls: WallState[];
  localSocketId?: string;
}) {
  return (
    <EnhancedSharkTankCanvas
      players={players}
      bullets={bullets}
      walls={walls}
      localSocketId={localSocketId}
    />
  );
}
