"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navigation, Target, Gamepad2, Zap } from "lucide-react";
import type { Movement } from "@/lib/game-types";

type MobileControlsProps = {
  onMovementChange: (m: Movement) => void;
  onShoot: () => void;
};

const RESET: Movement = { forward: false, back: false, left: false, right: false };

export function MobileControls({ onMovementChange, onShoot }: MobileControlsProps) {
  const movementRef = useRef<Movement>({ ...RESET });
  const [active, setActive] = useState<Set<keyof Movement>>(new Set());
  const [vibration, setVibration] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const press = useCallback(
    (dir: keyof Movement) => {
      movementRef.current = { ...movementRef.current, [dir]: true };
      onMovementChange({ ...movementRef.current });
      setActive((prev) => new Set(prev).add(dir));
      if (vibration && "vibrate" in navigator) navigator.vibrate(10);
    },
    [onMovementChange, vibration],
  );

  const release = useCallback(
    (dir: keyof Movement) => {
      movementRef.current = { ...movementRef.current, [dir]: false };
      onMovementChange({ ...movementRef.current });
      setActive((prev) => {
        const next = new Set(prev);
        next.delete(dir);
        return next;
      });
    },
    [onMovementChange],
  );

  const shoot = useCallback(() => {
    onShoot();
    if (vibration && "vibrate" in navigator) navigator.vibrate(50);
  }, [onShoot, vibration]);

  function dirBtn(dir: keyof Movement, icon: React.ReactNode, label: string) {
    const isActive = active.has(dir);
    return (
      <Button
        variant="secondary"
        size="default"
        aria-label={label}
        className={`h-12 w-12 rounded-lg transition-all ${
          isActive
            ? "bg-blue-600 scale-95 shadow-lg shadow-blue-600/50"
            : "bg-slate-700 hover:bg-slate-600"
        }`}
        onPointerDown={() => press(dir)}
        onPointerUp={() => release(dir)}
        onPointerCancel={() => release(dir)}
      >
        {icon}
      </Button>
    );
  }

  if (!isMobile) return null;

  return (
    <>
      {/* D-pad */}
      <div className="pointer-events-auto fixed bottom-24 left-4 z-50">
        <Card className="bg-black/80 backdrop-blur-sm border-white/20">
          <CardContent className="p-3">
            <div className="grid grid-cols-3 gap-2 w-36 h-36">
              <div />
              {dirBtn("forward", <Navigation className="w-5 h-5 -rotate-90" />, "Forward")}
              <div />
              {dirBtn("left",    <Navigation className="w-5 h-5 rotate-180" />, "Turn left")}
              <div className="flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-slate-400" />
              </div>
              {dirBtn("right",   <Navigation className="w-5 h-5" />,            "Turn right")}
              <div />
              {dirBtn("back",    <Navigation className="w-5 h-5 rotate-90" />,  "Reverse")}
              <div />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fire button */}
      <div className="pointer-events-auto fixed bottom-24 right-4 z-50">
        <Button
          size="lg"
          aria-label="Shoot"
          onPointerDown={shoot}
          className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/50 active:scale-95 transition-all"
        >
          <Target className="w-6 h-6" />
        </Button>
      </div>

      {/* Bottom bar */}
      <div className="pointer-events-auto fixed bottom-4 left-4 right-4 z-50">
        <Card className="bg-black/80 backdrop-blur-sm border-white/20">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-400">
                  {active.size > 0 ? "Moving" : "Ready"}
                </span>
              </div>
              <Button
                size="default"
                variant="secondary"
                onClick={() => setVibration((v) => !v)}
                title={vibration ? "Disable vibration" : "Enable vibration"}
                className={`w-8 h-8 p-0 transition-all ${
                  vibration ? "text-white hover:bg-white/10" : "text-slate-500"
                }`}
              >
                <Zap className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
