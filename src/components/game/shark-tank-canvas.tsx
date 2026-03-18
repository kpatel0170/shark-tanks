"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text, OrbitControls, useGLTF, useTexture } from "@react-three/drei";
import { Suspense } from "react";
import type { Group, Mesh } from "three";
import { Vector3, CubeTextureLoader } from "three";
import type { BulletState, PlayerState, WallState } from "@/lib/game-types";

// Preload assets on client mount only (moved into component to avoid SSR hook violations)

// Hardcoded wall positions
const WALLS = [
  { id: 1, x: 0, y: 2, width: 200, height: 1000, angle: 0 },
  { id: 2, x: 1000, y: 100, width: 200, height: 1000, angle: 0 },
  { id: 3, x: 2000, y: 1000, width: 200, height: 1000, angle: 0 },
  { id: 4, x: -1000, y: -1000, width: 200, height: 1000, angle: 0 },
  { id: 5, x: -1500, y: 700, width: 200, height: 1000, angle: 0 },
];

// Loads and attaches the custom skybox as the scene background.
// CubeTextureLoader takes all 6 faces in one call, so we bypass useLoader
// (which maps over arrays) and load imperatively via useEffect.
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
    return () => {
      scene.background = null;
    };
  }, [scene]);

  return null;
}

function EnhancedTankModel({
  player,
  isLocalPlayer,
}: {
  player: PlayerState;
  isLocalPlayer: boolean;
}) {
  const meshRef = useRef<Group>(null);
  const { scene: gltfScene } = useGLTF("/models/tank4.glb");
  // Clone once per player instance, not on every render
  const clonedScene = useMemo(() => gltfScene.clone(), [gltfScene]);

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.position.set(
      player.x + player.width / 2,
      player.height / 2,
      player.y + player.height / 2,
    );
    meshRef.current.rotation.y = -player.angle;
  });

  return (
    <group ref={meshRef}>
      <primitive object={clonedScene} scale={[16, 16, 16]} />
      <Text
        position={[0, 120, 0]}
        rotation={[0, Math.PI / 2, 0]}
        fontSize={16}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.5}
        outlineColor="black"
      >
        {player.nickname}
      </Text>
      <Text
        position={[0, 100, 0]}
        rotation={[0, Math.PI / 2, 0]}
        fontSize={14}
        color="#00ff00"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.3}
        outlineColor="black"
      >
        {"❤️".repeat(player.health)}
      </Text>
    </group>
  );
}

function WallMesh({ wall }: { wall: (typeof WALLS)[0] }) {
  const wallTex = useTexture("/assets/walls.jpg");
  return (
    <mesh
      position={[wall.x + wall.width / 2, 50, wall.y + wall.height / 2]}
      castShadow
    >
      <boxGeometry args={[wall.width, 200, wall.height]} />
      <meshLambertMaterial map={wallTex} />
    </mesh>
  );
}

function BulletMesh({ bullet }: { bullet: BulletState }) {
  const meshRef = useRef<Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.position.set(bullet.x, 25, bullet.y);
    meshRef.current.rotation.x += 0.1;
    meshRef.current.rotation.y += 0.1;
  });

  return (
    <mesh ref={meshRef} castShadow>
      <sphereGeometry args={[bullet.width / 2, 16, 16]} />
      <meshStandardMaterial
        color={bullet.playerId === 0 ? "#ff6b6b" : "#4ecdc4"}
        emissive={bullet.playerId === 0 ? "#ff0000" : "#00ffff"}
        emissiveIntensity={0.5}
        metalness={0.8}
        roughness={0.2}
      />
      <pointLight
        position={[0, 0, 0]}
        color={bullet.playerId === 0 ? "#ff6b6b" : "#4ecdc4"}
        intensity={0.5}
        distance={50}
      />
    </mesh>
  );
}

// Persistent vector — avoids allocating a new Vector3 every frame
const _cameraTarget = new Vector3();

function CameraController({ localPlayer }: { localPlayer?: PlayerState }) {
  const { camera } = useThree();
  const cameraPos = useRef(new Vector3(1000, 300, 1000));

  useFrame(() => {
    if (!localPlayer) return;

    const playerX = localPlayer.x + localPlayer.width / 2;
    const playerZ = localPlayer.y + localPlayer.height / 2;
    const { angle } = localPlayer;

    _cameraTarget.set(
      playerX - 150 * Math.cos(angle),
      200,
      playerZ - 150 * Math.sin(angle),
    );

    cameraPos.current.lerp(_cameraTarget, 0.05);
    camera.position.copy(cameraPos.current);
    camera.lookAt(playerX, 50, playerZ);
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
      {/* Declarative lighting — no useEffect / manual scene manipulation */}
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
      <directionalLight
        position={[500, 200, 500]}
        intensity={0.3}
        color={0xb3d4ff}
      />

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
        <EnhancedTankModel
          key={player.id}
          player={player}
          isLocalPlayer={player.socketId === localSocketId}
        />
      ))}

      {bullets.map((bullet) => (
        <BulletMesh key={bullet.id} bullet={bullet} />
      ))}
    </>
  );
}

type SharkTankCanvasProps = {
  players: PlayerState[];
  bullets: BulletState[];
  walls: WallState[];
  localSocketId?: string;
};

export function SharkTankCanvas({
  players,
  bullets,
  localSocketId,
}: SharkTankCanvasProps) {
  const [isClient, setIsClient] = useState(false);

  // Call useMemo before conditional to maintain hook order
  const localPlayer = useMemo(
    () => players.find((p) => p.socketId === localSocketId),
    [players, localSocketId],
  );

  useEffect(() => {
    setIsClient(true);
    // Preload assets on client mount
    useGLTF.preload("/models/tank4.glb");
    useTexture.preload("/assets/walls.jpg");
    useTexture.preload("/assets/bullets.jpg");
    useTexture.preload("/assets/tank2.png");
    useTexture.preload("/assets/front.jpg");
    useTexture.preload("/assets/bottom.jpg");
    useTexture.preload("/assets/tires.png");
    useTexture.preload("/assets/tires2.png");
    useTexture.preload("/assets/back.jpg");
  }, []);

  if (!isClient) {
    return <div className="h-screen w-full bg-[#001133]" />;
  }

  return (
    <div className="h-screen w-full" style={{ touchAction: "none" }}>
      <Canvas
        shadows
        camera={{
          position: [1000, 300, 1000],
          fov: 100,
          near: 0.5,
          far: 20000,
        }}
        gl={{ antialias: true }}
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

        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          minDistance={100}
          maxDistance={2000}
          maxPolarAngle={Math.PI}
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
          panSpeed={0.8}
        />
      </Canvas>
    </div>
  );
}
