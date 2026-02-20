'use client'

import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls, useGLTF } from '@react-three/drei'
import type { Group } from 'three'
import { Box3, Vector3 } from 'three'
import type { BulletState, PlayerState, WallState } from '@/lib/game-types'

type SharkTankCanvasProps = {
  players: PlayerState[]
  bullets: BulletState[]
  walls: WallState[]
}

function TankModel({ player }: { player: PlayerState }) {
  const { scene } = useGLTF('/models/tank2.glb') as { scene: Group }
  const clonedScene = useMemo(() => scene.clone(), [scene])

  return (
    <primitive
      object={clonedScene}
      position={[player.x / 25, 0, player.y / 25]}
      rotation={[0, -player.angle, 0]}
      scale={[2.5, 2.5, 2.5]}
    />
  )
}

function BulletMesh({ bullet }: { bullet: BulletState }) {
  return (
    <mesh position={[bullet.x / 25, 1.2, bullet.y / 25]}>
      <sphereGeometry args={[0.4, 16, 16]} />
      <meshStandardMaterial color="#f59e0b" emissive="#f97316" emissiveIntensity={0.5} />
    </mesh>
  )
}

function WallMesh({ wall }: { wall: WallState }) {
  return (
    <mesh position={[wall.x / 25 + wall.width / 50, 3, wall.y / 25 + wall.height / 50]} receiveShadow castShadow>
      <boxGeometry args={[wall.width / 25, 6, wall.height / 25]} />
      <meshStandardMaterial color="#334155" />
    </mesh>
  )
}

export function SharkTankCanvas({ players, bullets, walls }: SharkTankCanvasProps) {
  const center = useMemo(() => {
    if (!players.length) return [0, 0, 0] as [number, number, number]
    const points = players.map((player) => new Vector3(player.x / 25, 0, player.y / 25))
    const box = new Box3().setFromPoints(points)
    const middle = box.getCenter(new Vector3())
    return [middle.x, middle.y, middle.z] as [number, number, number]
  }, [players])

  return (
    <div className="h-screen w-full bg-gradient-to-b from-blue-900 to-black">
      <Canvas shadows camera={{ position: [center[0] + 20, 18, center[2] + 20], fov: 55 }}>
        <ambientLight intensity={0.45} />
        <directionalLight position={[20, 30, 10]} intensity={1} castShadow />
        <Environment preset="sunset" />

        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[220, 220]} />
          <meshStandardMaterial color="#14532d" />
        </mesh>

        {walls.map((wall) => (
          <WallMesh key={wall.id} wall={wall} />
        ))}

        {players.map((player) => (
          <TankModel key={player.id} player={player} />
        ))}

        {bullets.map((bullet) => (
          <BulletMesh key={bullet.id} bullet={bullet} />
        ))}

        <OrbitControls target={center} maxPolarAngle={Math.PI / 2.2} />
      </Canvas>
    </div>
  )
}

useGLTF.preload('/models/tank2.glb')
