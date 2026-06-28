import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import * as THREE from 'three'
import { AdaptiveDpr } from '@react-three/drei'
import { CAMERA_POS, FOV } from './sceneConfig'
import Starfield from './Starfield'
import BackgroundField from './BackgroundField'
import WireframeMorph from './WireframeMorph'
import Constellation from './Constellation'
import PostFX from './PostFX'

export default function SceneCanvas() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: CAMERA_POS, fov: FOV }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 0.95
      }}
    >
      <color attach="background" args={['#000000']} />
      <fogExp2 attach="fog" args={['#000000', 0.016]} />
      <ambientLight intensity={0.45} />
      <Suspense fallback={null}>
        <Starfield />
        <BackgroundField />
        <Constellation />
      </Suspense>
      {/* models load on their own boundary so they never block the scene */}
      <Suspense fallback={null}>
        <WireframeMorph />
      </Suspense>
      <PostFX />
      <AdaptiveDpr pixelated />
    </Canvas>
  )
}
