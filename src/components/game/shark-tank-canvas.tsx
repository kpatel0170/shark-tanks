"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Billboard, Text, useGLTF, useTexture } from "@react-three/drei";
import { Suspense } from "react";
import type { Group, Mesh } from "three";
import { Vector3, CubeTextureLoader, PCFShadowMap, MathUtils } from "three";
import type { BulletState, PlayerState } from "@/lib/game-types";

// Server tick period in seconds
const TICK_S = 0.05;

const { lerp } = MathUtils;

// Stable shadow config — inline object creates a new reference each render
// which causes R3F to re-apply renderer settings and trigger deprecation warnings.
const SHADOW_CONFIG = { type: PCFShadowMap };

// Module-level preloads — must be outside components (drei requirement)
useGLTF.preload("/models/tank4.glb");
useTexture.preload("/assets/walls.jpg");

// Static wall layout — matches server constants, never changes mid-session
const WALLS = [
  { id: 1, x: 0,     y: 2,     width: 200, height: 1000 },
  { id: 2, x: 1000,  y: 100,   width: 200, height: 1000 },
  { id: 3, x: 2000,  y: 1000,  width: 200, height: 1000 },
  { id: 4, x: -1000, y: -1000, width: 200, height: 1000 },
  { id: 5, x: -1500, y: 700,   width: 200, height: 1000 },
];

// ─── Interpolation helpers ────────────────────────────────────────────────────

// Shortest-path angle lerp — prevents spinning the long way around when crossing ±π
function lerpAngle(a: number, b: number, t: number): number {
  let d = ((b - a) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
  return a + d * t;
}

// Full state for one interpolated entity (position + heading)
type InterpState = {
  fromX: number; fromY: number; fromAngle: number;
  toX:   number; toY:   number; toAngle:   number;
  t: number;
};

function makeInterp(x: number, y: number, angle: number): InterpState {
  return { fromX: x, fromY: y, fromAngle: angle, toX: x, toY: y, toAngle: angle, t: 1 };
}

// Advance interpolation each frame.
// Detects new server snapshots by value comparison and restarts from the
// current visual position, so there is never a visible snap.
function stepInterp(
  s: InterpState,
  sx: number, sy: number, sAngle: number,
  delta: number,
): [number, number, number] {
  if (sx !== s.toX || sy !== s.toY || sAngle !== s.toAngle) {
    s.fromX     = lerp(s.fromX, s.toX, s.t);
    s.fromY     = lerp(s.fromY, s.toY, s.t);
    s.fromAngle = lerpAngle(s.fromAngle, s.toAngle, s.t);
    s.toX = sx; s.toY = sy; s.toAngle = sAngle;
    s.t = 0;
  }
  s.t = Math.min(s.t + delta / TICK_S, 1);
  return [
    lerp(s.fromX, s.toX, s.t),
    lerp(s.fromY, s.toY, s.t),
    lerpAngle(s.fromAngle, s.toAngle, s.t),
  ];
}

// Position-only variant for bullets (no heading needed)
type InterpXZ = { fromX: number; fromY: number; toX: number; toY: number; t: number };

function makeInterpXZ(x: number, y: number): InterpXZ {
  return { fromX: x, fromY: y, toX: x, toY: y, t: 1 };
}

function stepInterpXZ(s: InterpXZ, sx: number, sy: number, delta: number): [number, number] {
  if (sx !== s.toX || sy !== s.toY) {
    s.fromX = lerp(s.fromX, s.toX, s.t);
    s.fromY = lerp(s.fromY, s.toY, s.t);
    s.toX = sx; s.toY = sy;
    s.t = 0;
  }
  s.t = Math.min(s.t + delta / TICK_S, 1);
  return [lerp(s.fromX, s.toX, s.t), lerp(s.fromY, s.toY, s.t)];
}

// ─── Scene components ─────────────────────────────────────────────────────────

function Skybox() {
  const { scene } = useThree();

  useEffect(() => {
    const texture = new CubeTextureLoader().load([
      "/assets/nx.png",
      "/assets/px.png",
      "/assets/py1.png",
      "/assets/ny.png",
      "/assets/nz.png",
      "/assets/pz.png",
    ]);
    scene.background = texture;
    return () => { scene.background = null; };
  }, [scene]);

  return null;
}

// ─── Tank label: always faces the camera via Billboard ────────────────────────
// Replaces the old fixed-rotation Text + emoji hearts, which mirrored at
// certain camera angles and rendered hearts as wireframe SVG outlines.

function TankLabel({
  nickname,
  health,
  maxHealth,
  isLocalPlayer,
}: {
  nickname: string;
  health: number;
  maxHealth: number;
  isLocalPlayer: boolean;
}) {
  const pct      = maxHealth > 0 ? Math.max(0, health) / maxHealth : 0;
  const BAR_W    = 90;
  const BAR_H    = 7;
  const fillW    = Math.max(1, BAR_W * pct);
  const barColor = pct > 0.6 ? "#00ff88" : pct > 0.3 ? "#ffcc00" : "#ff4444";
  const nameColor = isLocalPlayer ? "#00ff88" : "#ffffff";

  return (
    // Billboard rotates children to face the camera every frame —
    // no manual rotation needed, no mirroring at any angle.
    <Billboard position={[0, 130, 0]}>
      {/* Nickname */}
      <Text
        fontSize={16}
        color={nameColor}
        anchorX="center"
        anchorY="bottom"
        position={[0, 6, 0]}
        outlineWidth={1.5}
        outlineColor="#000000"
        outlineOpacity={1}
      >
        {nickname}
      </Text>

      {/* Health bar — dark track */}
      <mesh position={[0, -4, 0]}>
        <planeGeometry args={[BAR_W, BAR_H]} />
        <meshBasicMaterial color="#111111" transparent opacity={0.85} depthTest={false} />
      </mesh>

      {/* Health bar — coloured fill, anchored to left edge */}
      <mesh position={[(fillW - BAR_W) / 2, -4, 0.1]}>
        <planeGeometry args={[fillW, BAR_H]} />
        <meshBasicMaterial color={barColor} depthTest={false} />
      </mesh>
    </Billboard>
  );
}

function TankModel({
  player,
  isLocalPlayer,
}: {
  player: PlayerState;
  isLocalPlayer: boolean;
}) {
  const meshRef = useRef<Group>(null);
  const { scene: gltfScene } = useGLTF("/models/tank4.glb");
  const clonedScene = useMemo(() => gltfScene.clone(), [gltfScene]);

  const interp = useRef<InterpState>(makeInterp(player.x, player.y, player.angle));

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const { x, y, angle, width, height } = player;
    const [ix, iy, iAngle] = stepInterp(interp.current, x, y, angle, delta);
    meshRef.current.position.set(ix + width / 2, height / 2, iy + height / 2);
    meshRef.current.rotation.y = -iAngle;
  });

  return (
    <group ref={meshRef}>
      {/* Green ring under the local player's tank */}
      {isLocalPlayer && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -player.height / 2 + 2, 0]}>
          <ringGeometry args={[52, 60, 32]} />
          <meshBasicMaterial color="#00ff88" transparent opacity={0.7} />
        </mesh>
      )}

      <primitive object={clonedScene} scale={[16, 16, 16]} />

      <TankLabel
        nickname={player.nickname}
        health={player.health}
        maxHealth={player.maxHealth}
        isLocalPlayer={isLocalPlayer}
      />
    </group>
  );
}

function WallMesh({ wall }: { wall: (typeof WALLS)[0] }) {
  const wallTex = useTexture("/assets/walls.jpg");
  return (
    <mesh position={[wall.x + wall.width / 2, 50, wall.y + wall.height / 2]} castShadow>
      <boxGeometry args={[wall.width, 200, wall.height]} />
      <meshLambertMaterial map={wallTex} />
    </mesh>
  );
}

function BulletMesh({ bullet, isOwn }: { bullet: BulletState; isOwn: boolean }) {
  const meshRef = useRef<Mesh>(null);
  const color    = isOwn ? "#ff6b6b" : "#4ecdc4";
  const emissive = isOwn ? "#ff0000" : "#00ffff";

  const interp = useRef<InterpXZ>(makeInterpXZ(bullet.x, bullet.y));

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const [ix, iy] = stepInterpXZ(interp.current, bullet.x, bullet.y, delta);
    meshRef.current.position.set(ix, 25, iy);
    meshRef.current.rotation.x += 0.1;
    meshRef.current.rotation.y += 0.1;
  });

  return (
    <mesh ref={meshRef} castShadow>
      <sphereGeometry args={[bullet.width / 2, 16, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={0.5}
        metalness={0.8}
        roughness={0.2}
      />
      <pointLight position={[0, 0, 0]} color={color} intensity={0.5} distance={50} />
    </mesh>
  );
}

function CameraController({ localPlayer }: { localPlayer?: PlayerState }) {
  const { camera } = useThree();

  // Camera interpolates position AND angle independently.
  // No secondary lerp on top — the interpolation itself provides all the
  // smoothing needed. A second lerp would create lag-then-catch-up oscillation.
  const interp = useRef<InterpState | null>(null);

  useFrame((_, delta) => {
    if (!localPlayer) return;

    const px    = localPlayer.x + localPlayer.width  / 2;
    const pz    = localPlayer.y + localPlayer.height / 2;
    const angle = localPlayer.angle;

    // Lazily initialise once the local player is first available
    if (!interp.current) interp.current = makeInterp(px, pz, angle);

    const [ix, iz, iAngle] = stepInterp(interp.current, px, pz, angle, delta);

    // Position camera directly — no extra lerp. The interpolated values are
    // already per-frame smooth so a second smoothing pass only adds oscillation.
    camera.position.set(
      ix - 150 * Math.cos(iAngle),
      200,
      iz - 150 * Math.sin(iAngle),
    );
    camera.lookAt(ix, 50, iz);
  });

  return null;
}

function GameScene({
  players,
  bullets,
  localPlayer,
  localSocketId,
}: {
  players: PlayerState[];
  bullets: BulletState[];
  localPlayer?: PlayerState;
  localSocketId?: string;
}) {
  return (
    <>
      <ambientLight color={0x808080} intensity={0.6} />
      <directionalLight
        position={[-100, 300, -100]}
        intensity={1.2}
        castShadow
        shadow-camera-left={-2000}
        shadow-camera-right={2000}
        shadow-camera-top={2000}
        shadow-camera-bottom={-2000}
        shadow-camera-far={2000}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[500, 200, 500]} intensity={0.3} color={0xb3d4ff} />

      <Skybox />

      {/* Floor */}
      <mesh receiveShadow position={[0, -0.5, 0]}>
        <boxGeometry args={[5000, 1, 5000]} />
        <meshStandardMaterial color={0x404040} />
      </mesh>

      <CameraController localPlayer={localPlayer} />

      {WALLS.map((wall) => (
        <WallMesh key={wall.id} wall={wall} />
      ))}

      {players.map((player) => (
        <TankModel
          key={player.id}
          player={player}
          isLocalPlayer={player.socketId === localSocketId}
        />
      ))}

      {bullets.map((bullet) => (
        <BulletMesh
          key={bullet.id}
          bullet={bullet}
          isOwn={bullet.playerId === localPlayer?.id}
        />
      ))}
    </>
  );
}

type SharkTankCanvasProps = {
  players: PlayerState[];
  bullets: BulletState[];
  localSocketId?: string;
  quality?: "high" | "medium" | "low";
};

export function SharkTankCanvas({
  players,
  bullets,
  localSocketId,
  quality = "high",
}: SharkTankCanvasProps) {
  const [isClient, setIsClient] = useState(false);

  const localPlayer = useMemo(
    () => players.find((p) => p.socketId === localSocketId),
    [players, localSocketId],
  );

  // Memoize all Canvas props — new object/array references on every render
  // cause R3F to re-apply renderer settings and trigger Three.js warnings.
  const dpr = useMemo<[number, number]>(
    () =>
      quality === "high"   ? [1, 2]   :
      quality === "medium" ? [1, 1.5] : [1, 1],
    [quality],
  );
  const glOptions = useMemo(() => ({ antialias: quality !== "low" }), [quality]);

  useEffect(() => { setIsClient(true); }, []);

  if (!isClient) {
    return <div className="h-screen w-full bg-[#001133]" />;
  }

  return (
    <div className="h-screen w-full" style={{ touchAction: "none" }}>
      <Canvas
        shadows={SHADOW_CONFIG}
        dpr={dpr}
        camera={{ position: [1000, 300, 1000], fov: 100, near: 0.5, far: 20000 }}
        gl={glOptions}
      >
        <color attach="background" args={["#001133"]} />
        <Suspense fallback={null}>
          <GameScene
            players={players}
            bullets={bullets}
            localPlayer={localPlayer}
            localSocketId={localSocketId}
          />
        </Suspense>
        {/* No OrbitControls — CameraController owns the camera */}
      </Canvas>
    </div>
  );
}
