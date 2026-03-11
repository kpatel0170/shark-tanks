"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Navigation,
  Target,
  Gamepad2,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import type { Movement } from "@/lib/game-types";

type MobileControlsProps = {
  onMovementChange: (nextMovement: Movement) => void;
  onShoot: () => void;
};

const INITIAL_MOVEMENT: Movement = {
  forward: false,
  back: false,
  left: false,
  right: false,
};

export function MobileControls({
  onMovementChange,
  onShoot,
}: MobileControlsProps) {
  const movementRef = useRef<Movement>({ ...INITIAL_MOVEMENT });
  const [activeButtons, setActiveButtons] = useState<Set<string>>(new Set());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const setDirection = useCallback(
    (direction: keyof Movement, active: boolean) => {
      movementRef.current = { ...movementRef.current, [direction]: active };
      onMovementChange({ ...movementRef.current });

      if (active && vibrationEnabled && "vibrate" in navigator) {
        navigator.vibrate(10);
      }
    },
    [onMovementChange, vibrationEnabled],
  );

  const handleShoot = useCallback(() => {
    onShoot();
    if (vibrationEnabled && "vibrate" in navigator) {
      navigator.vibrate(50);
    }
  }, [onShoot, vibrationEnabled]);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  const toggleVibration = useCallback(() => {
    setVibrationEnabled((prev) => !prev);
  }, []);

  if (!isMobile) return null;

  return (
    <>
      {/* Movement Controls */}
      <div className="pointer-events-auto fixed bottom-24 left-4 z-50">
        <Card className="bg-black/80 backdrop-blur-sm border-white/20">
          <CardContent className="p-3">
            <div className="grid grid-cols-3 gap-2 w-36 h-36">
              <div></div>
              <Button
                variant="secondary"
                size="default"
                aria-label="Move forward"
                className={`h-12 w-12 rounded-lg transition-all ${
                  activeButtons.has("forward")
                    ? "bg-blue-600 scale-95 shadow-lg shadow-blue-600/50"
                    : "bg-slate-700 hover:bg-slate-600"
                }`}
                onPointerDown={() => {
                  setActiveButtons((prev) => new Set(prev).add("forward"));
                  setDirection("forward", true);
                }}
                onPointerUp={() => {
                  setActiveButtons((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete("forward");
                    return newSet;
                  });
                  setDirection("forward", false);
                }}
                onPointerCancel={() => {
                  setActiveButtons((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete("forward");
                    return newSet;
                  });
                  setDirection("forward", false);
                }}
              >
                <Navigation className="w-5 h-5 -rotate-90" />
              </Button>
              <div></div>

              <Button
                variant="secondary"
                size="default"
                aria-label="Turn left"
                className={`h-12 w-12 rounded-lg transition-all ${
                  activeButtons.has("left")
                    ? "bg-blue-600 scale-95 shadow-lg shadow-blue-600/50"
                    : "bg-slate-700 hover:bg-slate-600"
                }`}
                onPointerDown={() => {
                  setActiveButtons((prev) => new Set(prev).add("left"));
                  setDirection("left", true);
                }}
                onPointerUp={() => {
                  setActiveButtons((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete("left");
                    return newSet;
                  });
                  setDirection("left", false);
                }}
                onPointerCancel={() => {
                  setActiveButtons((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete("left");
                    return newSet;
                  });
                  setDirection("left", false);
                }}
              >
                <Navigation className="w-5 h-5 rotate-180" />
              </Button>
              <div className="h-12 w-12 flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-slate-400" />
              </div>
              <Button
                variant="secondary"
                size="default"
                aria-label="Turn right"
                className={`h-12 w-12 rounded-lg transition-all ${
                  activeButtons.has("right")
                    ? "bg-blue-600 scale-95 shadow-lg shadow-blue-600/50"
                    : "bg-slate-700 hover:bg-slate-600"
                }`}
                onPointerDown={() => {
                  setActiveButtons((prev) => new Set(prev).add("right"));
                  setDirection("right", true);
                }}
                onPointerUp={() => {
                  setActiveButtons((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete("right");
                    return newSet;
                  });
                  setDirection("right", false);
                }}
                onPointerCancel={() => {
                  setActiveButtons((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete("right");
                    return newSet;
                  });
                  setDirection("right", false);
                }}
              >
                <Navigation className="w-5 h-5" />
              </Button>

              <div></div>
              <Button
                variant="secondary"
                size="default"
                aria-label="Move back"
                className={`h-12 w-12 rounded-lg transition-all ${
                  activeButtons.has("back")
                    ? "bg-blue-600 scale-95 shadow-lg shadow-blue-600/50"
                    : "bg-slate-700 hover:bg-slate-600"
                }`}
                onPointerDown={() => {
                  setActiveButtons((prev) => new Set(prev).add("back"));
                  setDirection("back", true);
                }}
                onPointerUp={() => {
                  setActiveButtons((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete("back");
                    return newSet;
                  });
                  setDirection("back", false);
                }}
                onPointerCancel={() => {
                  setActiveButtons((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete("back");
                    return newSet;
                  });
                  setDirection("back", false);
                }}
              >
                <Navigation className="w-5 h-5 rotate-90" />
              </Button>
              <div></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shoot Button */}
      <div className="pointer-events-auto fixed bottom-24 right-4 z-50">
        <Button
          size="lg"
          aria-label="Shoot"
          onPointerDown={handleShoot}
          className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/50 active:scale-95 transition-all"
        >
          <Target className="w-6 h-6" />
        </Button>
      </div>

      {/* Mobile Settings Bar */}
      <div className="pointer-events-auto fixed bottom-4 left-4 right-4 z-50">
        <Card className="bg-black/80 backdrop-blur-sm border-white/20">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="border-white/20 text-white bg-slate-800/50">
                  <Gamepad2 className="w-3 h-3 mr-1" />
                  Mobile
                </Badge>
                <div className="text-xs text-slate-400">
                  {activeButtons.size > 0 ? "Moving" : "Ready"}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="default"
                  variant="secondary"
                  onClick={toggleSound}
                  className="w-8 h-8 p-0 text-white hover:bg-white/10"
                >
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <VolumeX className="w-4 h-4" />
                  )}
                </Button>

                <Button
                  size="default"
                  variant="secondary"
                  onClick={toggleVibration}
                  className={`w-8 h-8 p-0 transition-all ${
                    vibrationEnabled
                      ? "text-white hover:bg-white/10"
                      : "text-slate-500"
                  }`}
                >
                  <Zap className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
