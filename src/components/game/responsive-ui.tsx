"use client";

import { useState, useEffect, useCallback } from "react";
import { Gamepad2, Keyboard, Volume2, VolumeX } from "lucide-react";

// Mobile touch controls
export function MobileControls({ onMove, onShoot }: {
  onMove: (direction: 'up' | 'down' | 'left' | 'right' | 'stop') => void;
  onShoot: () => void;
}) {
  const [activeButtons, setActiveButtons] = useState<Set<string>>(new Set());

  const handleTouchStart = useCallback((direction: string) => {
    setActiveButtons(prev => new Set(prev).add(direction));
    onMove(direction as any);
  }, [onMove]);

  const handleTouchEnd = useCallback((direction: string) => {
    setActiveButtons(prev => {
      const newSet = new Set(prev);
      newSet.delete(direction);
      return newSet;
    });
    onMove('stop');
  }, [onMove]);

  return (
    <div className="md:hidden fixed bottom-8 left-8 right-8 flex justify-between items-end z-50">
      {/* Movement Controls */}
      <div className="relative">
        <div className="grid grid-cols-3 gap-2 w-32 h-32">
          <div></div>
          <button
            onTouchStart={() => handleTouchStart('up')}
            onTouchEnd={() => handleTouchEnd('up')}
            className={`bg-black/60 rounded-lg flex items-center justify-center transition-all ${
              activeButtons.has('up') ? 'bg-blue-600 scale-95' : ''
            }`}
          >
            <span className="text-white text-xl">↑</span>
          </button>
          <div></div>
          
          <button
            onTouchStart={() => handleTouchStart('left')}
            onTouchEnd={() => handleTouchEnd('left')}
            className={`bg-black/60 rounded-lg flex items-center justify-center transition-all ${
              activeButtons.has('left') ? 'bg-blue-600 scale-95' : ''
            }`}
          >
            <span className="text-white text-xl">←</span>
          </button>
          <div></div>
          <button
            onTouchStart={() => handleTouchStart('right')}
            onTouchEnd={() => handleTouchEnd('right')}
            className={`bg-black/60 rounded-lg flex items-center justify-center transition-all ${
              activeButtons.has('right') ? 'bg-blue-600 scale-95' : ''
            }`}
          >
            <span className="text-white text-xl">→</span>
          </button>
          
          <div></div>
          <button
            onTouchStart={() => handleTouchStart('down')}
            onTouchEnd={() => handleTouchEnd('down')}
            className={`bg-black/60 rounded-lg flex items-center justify-center transition-all ${
              activeButtons.has('down') ? 'bg-blue-600 scale-95' : ''
            }`}
          >
            <span className="text-white text-xl">↓</span>
          </button>
          <div></div>
        </div>
      </div>

      {/* Shoot Button */}
      <button
        onTouchStart={onShoot}
        className="bg-red-600 hover:bg-red-700 rounded-full w-20 h-20 flex items-center justify-center transition-all active:scale-95"
      >
        <span className="text-white text-2xl font-bold">FIRE</span>
      </button>
    </div>
  );
}

// Keyboard indicator
export function KeyboardIndicator() {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setActiveKeys(prev => new Set(prev).add(e.key.toLowerCase()));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setActiveKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(e.key.toLowerCase());
        return newSet;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div className="hidden md:block fixed bottom-4 right-4 bg-black/60 text-white p-3 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <Keyboard size={16} />
        <span className="text-sm font-bold">Controls Active</span>
      </div>
      <div className="grid grid-cols-3 gap-1 text-xs">
        <div></div>
        <div className={`w-6 h-6 rounded flex items-center justify-center ${
          activeKeys.has('w') || activeKeys.has('arrowup') ? 'bg-blue-600' : 'bg-gray-600'
        }`}>↑</div>
        <div></div>
        <div className={`w-6 h-6 rounded flex items-center justify-center ${
          activeKeys.has('a') || activeKeys.has('arrowleft') ? 'bg-blue-600' : 'bg-gray-600'
        }`}>←</div>
        <div></div>
        <div className={`w-6 h-6 rounded flex items-center justify-center ${
          activeKeys.has('d') || activeKeys.has('arrowright') ? 'bg-blue-600' : 'bg-gray-600'
        }`}>→</div>
        <div></div>
        <div className={`w-6 h-6 rounded flex items-center justify-center ${
          activeKeys.has('s') || activeKeys.has('arrowdown') ? 'bg-blue-600' : 'bg-gray-600'
        }`}>↓</div>
        <div></div>
      </div>
      <div className={`mt-2 w-6 h-6 rounded flex items-center justify-center ${
        activeKeys.has(' ') || activeKeys.has('x') ? 'bg-red-600' : 'bg-gray-600'
      }`}>FIRE</div>
    </div>
  );
}

// Sound toggle button
export function SoundToggle({ enabled, onToggle }: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="fixed top-20 right-4 bg-black/60 text-white p-3 rounded-lg hover:bg-black/80 transition-colors z-50"
    >
      {enabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
    </button>
  );
}

// Game stats display
export function GameStats({ score, players, duration }: {
  score: number;
  players: number;
  duration: number;
}) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed top-4 left-4 bg-black/60 text-white p-4 rounded-lg z-50">
      <div className="space-y-2">
        <div className="text-2xl font-bold">Score: {score.toLocaleString()}</div>
        <div className="text-sm opacity-80">Players: {players}</div>
        <div className="text-sm opacity-80">Time: {formatTime(duration)}</div>
      </div>
    </div>
  );
}

// Responsive layout wrapper
export function ResponsiveGameWrapper({ children }: {
  children: React.ReactNode;
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className={`relative ${isMobile ? 'touch-none' : ''}`}>
      {children}
    </div>
  );
}
