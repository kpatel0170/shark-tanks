"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text, OrbitControls, useGLTF } from "@react-three/drei";
import { Suspense } from "react";
import type { Group } from "three";
import {
  Vector3,
  BoxGeometry,
  MeshStandardMaterial,
  MeshLambertMaterial,
  TextureLoader,
  Box3,
  Sphere,
  CubeTextureLoader,
  RepeatWrapping,
  PerspectiveCamera,
  Scene as ThreeScene,
  WebGLRenderer,
  DirectionalLight,
  AmbientLight,
  Mesh,
  Group as ThreeGroup,
  BoxGeometry as ThreeBoxGeometry,
  SphereGeometry,
  MeshBasicMaterial,
} from "three";
import type { BulletState, PlayerState, WallState } from "@/lib/game-types";

// Main texture loading for the game
function useTextures() {
  const [textures, setTextures] = useState<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const textureLoader = new TextureLoader();

    // Load textures for the game code
    const playerTexture2 = textureLoader.load("/assets/tank2.png");
    const playerTexture = textureLoader.load("/assets/front.jpg");
    const playerTexture1 = textureLoader.load("/assets/bottom.jpg");
    const playerTexture3 = textureLoader.load("/assets/tires.png");
    const playerTexture4 = textureLoader.load("/assets/tires2.png");
    const playerTexture5 = textureLoader.load("/assets/back.jpg");
    const wallTexture = textureLoader.load("/assets/walls.jpg");
    const bulletTexture = textureLoader.load("/assets/bullets.jpg");

    // Create game materials
    const bulletMaterial = new MeshLambertMaterial({ map: bulletTexture });
    const wallMaterial = new MeshLambertMaterial({ map: wallTexture });
    const playerMaterial = [
      new MeshLambertMaterial({ map: playerTexture1, color: 0x404040 }),
      new MeshLambertMaterial({ map: playerTexture5, color: 0x404040 }),
      new MeshLambertMaterial({ map: playerTexture2 }),
      new MeshLambertMaterial({ map: playerTexture, color: 0x404040 }),
      new MeshLambertMaterial({ map: playerTexture3, color: 0x404040 }),
      new MeshLambertMaterial({ map: playerTexture4, color: 0x404040 }),
    ];

    const textMaterial = new MeshBasicMaterial({ color: 0x85bb65, side: 2 });
    const nicknameMaterial = new MeshBasicMaterial({ color: "black", side: 2 });

    // Load skybox for the game
    const loader_map = new CubeTextureLoader();
    const skyboxTexture = loader_map.load([
      "/assets/nx.png",
      "/assets/px.png",
      "/assets/py1.png",
      "/assets/ny.png",
      "/assets/nz.png",
      "/assets/pz.png",
    ]);

    setTextures({
      bulletMaterial,
      wallMaterial,
      playerMaterial,
      textMaterial,
      nicknameMaterial,
      skyboxTexture,
    });
  }, []);

  return textures;
}

// Main wall setup - hardcoded positions
function useWalls() {
  return useMemo(
    () => [
      { id: 1, x: 0, y: 2, width: 200, height: 1000, angle: 0 },
      { id: 2, x: 1000, y: 100, width: 200, height: 1000, angle: 0 },
      { id: 3, x: 2000, y: 1000, width: 200, height: 1000, angle: 0 },
      { id: 4, x: -1000, y: -1000, width: 200, height: 1000, angle: 0 },
      { id: 5, x: -1500, y: 700, width: 200, height: 1000, angle: 0 },
    ],
    [],
  );
}

// Preload the GLTF model
useGLTF.preload("/models/tank4.glb");

// Enhanced tank model using GLTF - no fallback
function EnhancedTankModel({
  player,
  isLocalPlayer,
}: {
  player: PlayerState;
  isLocalPlayer: boolean;
}) {
  const meshRef = useRef<Group>(null);

  // Load GLTF model according to official docs
  const gltf = useGLTF("/models/tank4.glb");

  useFrame(() => {
    if (meshRef.current) {
      // Update position and rotation exactly like legacy
      meshRef.current.position.set(
        player.x + player.width / 2,
        player.height / 2, // Raise tank above ground
        player.y + player.height / 2,
      );
      meshRef.current.rotation.y = -player.angle;
    }
  });

  // Only render if GLTF is loaded
  if (!gltf?.scene) {
    return null; // Don't render anything until GLTF loads
  }

  return (
    <group ref={meshRef}>
      {/* Tank GLB model - make it much larger and more visible */}
      <primitive
        object={gltf.scene.clone()}
        scale={[16, 16, 16]} // Much larger scale for better visibility
        position={[0, 0, 0]}
      />

      {/* Nickname text - positioned above tank */}
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

      {/* Health indicator */}
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

// Main player mesh
function PlayerMesh({
  player,
  textures,
  isLocalPlayer,
}: {
  player: PlayerState;
  textures: any;
  isLocalPlayer: boolean;
}) {
  const meshRef = useRef<Group>(null);
  const healthMeshRef = useRef<Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      // Update position and rotation exactly like legacy
      meshRef.current.position.set(
        player.x + player.width / 2,
        player.width / 2,
        player.y + player.height / 2,
      );
      meshRef.current.rotation.y = -player.angle;

      // Don't control camera directly - let OrbitControls handle it
      // Camera will follow through the CameraController component
    }
  });

  if (!textures) return null;

  return (
    <group ref={meshRef}>
      {/* Tank body - simple box */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[player.width, player.width, player.height]} />
        <meshLambertMaterial map={textures.playerMaterial[2].map} />
      </mesh>

      {/* Nickname text - simplified version */}
      <Text
        position={[0, 70, 0]}
        rotation={[0, Math.PI / 2, 0]}
        fontSize={10}
        color="black"
        anchorX="center"
        anchorY="middle"
      >
        {player.nickname}
      </Text>

      {/* Health indicator */}
      <Text
        position={[0, 50, 0]}
        rotation={[0, Math.PI / 2, 0]}
        fontSize={10}
        color="#85bb65"
        anchorX="center"
        anchorY="middle"
      >
        {"$".repeat(player.health)}
      </Text>
    </group>
  );
}

// Main bullet mesh with better visuals
function BulletMesh({
  bullet,
  textures,
}: {
  bullet: BulletState;
  textures: any;
}) {
  const meshRef = useRef<Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.set(bullet.x, 25, bullet.y);
      meshRef.current.rotation.x += 0.1;
      meshRef.current.rotation.y += 0.1;
    }
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
      {/* Add glow effect */}
      <pointLight
        position={[0, 0, 0]}
        color={bullet.playerId === 0 ? "#ff6b6b" : "#4ecdc4"}
        intensity={0.5}
        distance={50}
      />
    </mesh>
  );
}

// Main wall mesh
function WallMesh({ wall, textures }: { wall: WallState; textures: any }) {
  if (!textures) return null;

  return (
    <mesh
      position={[wall.x + wall.width / 2, 50, wall.y + wall.height / 2]}
      castShadow
    >
      <boxGeometry args={[wall.width, 200, wall.height]} />
      <primitive object={textures.wallMaterial} />
    </mesh>
  );
}

// Camera controller that works with OrbitControls
function CameraController({ localPlayer }: { localPlayer?: PlayerState }) {
  const { camera } = useThree();

  useFrame(() => {
    if (!localPlayer) return;

    // Calculate desired camera position behind player
    const playerX = localPlayer.x + localPlayer.width / 2;
    const playerZ = localPlayer.y + localPlayer.height / 2;
    const angle = localPlayer.angle;

    // Main camera positioning
    const targetX = playerX - 150 * Math.cos(angle);
    const targetY = 200;
    const targetZ = playerZ - 150 * Math.sin(angle);

    // Smoothly interpolate camera position
    camera.position.lerp(new Vector3(targetX, targetY, targetZ), 0.05);

    // Look at player position
    camera.lookAt(playerX, targetY - 150, playerZ);
  });

  return null;
}

// Main scene setup
function Scene({
  children,
  textures,
  localPlayer,
}: {
  children: React.ReactNode;
  textures: any;
  localPlayer?: PlayerState;
}) {
  const { scene, camera } = useThree() as {
    scene: ThreeScene;
    camera: PerspectiveCamera;
  };

  useEffect(() => {
    if (!textures || !scene) return;

    // Set background
    scene.background = textures.skyboxTexture;

    // Set up floor
    const floorGeometry = new BoxGeometry(5000, 1, 5000);
    const floorMaterial = new MeshStandardMaterial({ color: 0x404040 });
    const floorMesh = new Mesh(floorGeometry, floorMaterial);
    floorMesh.receiveShadow = true;
    floorMesh.position.y = -0.5;
    scene.add(floorMesh);

    // Set up enhanced lighting
    const mainLight = new DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(-100, 300, -100);
    mainLight.castShadow = true;
    mainLight.shadow.camera.left = -2000;
    mainLight.shadow.camera.right = 2000;
    mainLight.shadow.camera.top = 2000;
    mainLight.shadow.camera.bottom = -2000;
    mainLight.shadow.camera.far = 2000;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    scene.add(mainLight);

    const fillLight = new DirectionalLight(0xb3d4ff, 0.3);
    fillLight.position.set(500, 200, 500);
    scene.add(fillLight);

    const ambient = new AmbientLight(0x808080, 0.6);
    scene.add(ambient);

    return () => {
      scene.remove(floorMesh);
      scene.remove(mainLight);
      scene.remove(fillLight);
      scene.remove(ambient);
    };
  }, [textures, scene]);

  return <>{children}</>;
}

// Main game component
type SharkTankCanvasProps = {
  players: PlayerState[];
  bullets: BulletState[];
  walls: WallState[];
  localSocketId?: string;
};

export function SharkTankCanvas({
  players,
  bullets,
  walls,
  localSocketId,
}: SharkTankCanvasProps) {
  const textures = useTextures();
  const gameWalls = useWalls();

  const localPlayer = useMemo(
    () => players.find((p) => p.socketId === localSocketId),
    [players, localSocketId],
  );

  if (!textures) {
    return (
      <div className="h-screen w-full bg-blue-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading game assets...</div>
      </div>
    );
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
        <Suspense fallback={null}>
          <Scene textures={textures} localPlayer={localPlayer}>
            {/* Camera controller for following player */}
            <CameraController localPlayer={localPlayer} />

            {/* Game walls - hardcoded positions */}
            {gameWalls.map((wall) => (
              <WallMesh key={wall.id} wall={wall} textures={textures} />
            ))}

            {/* Players - Enhanced with GLTF models */}
            {players.map((player) => (
              <EnhancedTankModel
                key={player.id}
                player={player}
                isLocalPlayer={player.socketId === localSocketId}
              />
            ))}

            {/* Bullets */}
            {bullets.map((bullet) => (
              <BulletMesh key={bullet.id} bullet={bullet} textures={textures} />
            ))}

            {/* OrbitControls for manual camera control */}
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={100}
              maxDistance={2000}
              maxPolarAngle={Math.PI}
              enableDamping={true}
              dampingFactor={0.05}
              rotateSpeed={0.5}
              zoomSpeed={0.8}
              panSpeed={0.8}
            />
          </Scene>
        </Suspense>
      </Canvas>
    </div>
  );
}
