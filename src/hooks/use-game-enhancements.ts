"use client";

import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { Vector3, Euler, MathUtils } from "three";

// Performance monitoring hook
export function usePerformanceMonitor() {
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const [fps, setFps] = useState(60);
  const [quality, setQuality] = useState<"high" | "medium" | "low">("high");

  useFrame(() => {
    frameCount.current++;
    const currentTime = performance.now();

    if (currentTime - lastTime.current >= 1000) {
      const currentFps = frameCount.current;
      setFps(currentFps);

      // Auto-adjust quality based on performance
      if (currentFps < 30 && quality !== "low") {
        setQuality("low");
      } else if (currentFps < 45 && quality === "low") {
        setQuality("medium");
      } else if (currentFps > 55 && quality !== "high") {
        setQuality("high");
      }

      frameCount.current = 0;
      lastTime.current = currentTime;
    }
  });

  return { fps, quality };
}

// Optimized camera controller with smooth following
export function useSmoothCamera(target: Vector3 | null, smoothness = 0.1) {
  const { camera } = useThree();
  const currentPos = useRef(new Vector3());
  const targetPos = useRef(new Vector3());

  useFrame(() => {
    if (!target) return;

    targetPos.current.copy(target);
    targetPos.current.y += 200; // Height offset
    targetPos.current.z -= 300; // Distance offset

    currentPos.current.lerp(targetPos.current, smoothness);
    camera.position.copy(currentPos.current);
    camera.lookAt(target);
  });
}

// Particle effects system
export function useParticleEffects() {
  const particles = useRef<Array<{ pos: Vector3; vel: Vector3; life: number }>>(
    [],
  );

  const addExplosion = useCallback((position: Vector3) => {
    for (let i = 0; i < 20; i++) {
      particles.current.push({
        pos: position.clone(),
        vel: new Vector3(
          (Math.random() - 0.5) * 10,
          Math.random() * 10,
          (Math.random() - 0.5) * 10,
        ),
        life: 1.0,
      });
    }
  }, []);

  const updateParticles = useCallback(() => {
    particles.current = particles.current.filter((p) => {
      p.pos.add(p.vel);
      p.vel.y -= 0.5; // Gravity
      p.life -= 0.02;
      return p.life > 0;
    });
  }, []);

  return { particles: particles.current, addExplosion, updateParticles };
}

// Sound effects system (using Web Audio API)
export function useSoundEffects() {
  const audioContext = useRef<AudioContext | null>(null);
  const sounds = useRef<Map<string, AudioBuffer>>(new Map());

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioContext.current = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
    }
  }, []);

  const loadSound = useCallback(async (name: string, url: string) => {
    if (!audioContext.current) return;

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer =
        await audioContext.current.decodeAudioData(arrayBuffer);
      sounds.current.set(name, audioBuffer);
    } catch (error) {
      console.warn(`Failed to load sound: ${name}`, error);
    }
  }, []);

  const playSound = useCallback((name: string, volume = 0.5) => {
    if (!audioContext.current) return;

    const buffer = sounds.current.get(name);
    if (!buffer) return;

    const source = audioContext.current.createBufferSource();
    const gainNode = audioContext.current.createGain();

    source.buffer = buffer;
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(audioContext.current.destination);
    source.start();
  }, []);

  return { loadSound, playSound };
}

// Local storage for game settings
export function useGameSettings() {
  const [settings, setSettings] = useState(() => {
    if (typeof window === "undefined")
      return {
        soundEnabled: true,
        musicEnabled: true,
        quality: "high",
        controls: "keyboard",
      };

    const saved = localStorage.getItem("sharkTankSettings");
    return saved
      ? JSON.parse(saved)
      : {
          soundEnabled: true,
          musicEnabled: true,
          quality: "high",
          controls: "keyboard",
        };
  });

  const updateSetting = useCallback((key: string, value: any) => {
    setSettings((prev: any) => {
      const newSettings = { ...prev, [key]: value };
      localStorage.setItem("sharkTankSettings", JSON.stringify(newSettings));
      return newSettings;
    });
  }, []);

  return { settings, updateSetting };
}

// Responsive canvas sizing
export function useResponsiveCanvas() {
  const [size, setSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return size;
}
