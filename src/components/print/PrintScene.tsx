import { Canvas, invalidate } from '@react-three/fiber'
import { Suspense, useEffect } from 'react'
import * as THREE from 'three'
import { AdaptiveDpr } from '@react-three/drei'
import type { Project } from '@/lib/content/manifest'
import { CAMERA_POS, FOV } from '@/components/scene/sceneConfig'
import Starfield from '@/components/scene/Starfield'
import BackgroundField from '@/components/scene/BackgroundField'
import PostFX from '@/components/scene/PostFX'
import PrintRing from './PrintRing'

function ForceRenderOnPrint() {
  useEffect(() => {
    // preserveDrawingBuffer (below) keeps the last frame in the buffer, but
    // force one extra render right as the print dialog opens as cheap
    // insurance against a throttled rAF loop.
    const onBeforePrint = () => invalidate()
    window.addEventListener('beforeprint', onBeforePrint)
    return () => window.removeEventListener('beforeprint', onBeforePrint)
  }, [])
  return null
}

/** the print page's background — the site's real Starfield + BackgroundField
 *  (so particles/starstuff match the homepage exactly), plus PrintRing (the
 *  homepage's neutral "index" ring look, not the interactive "open" carousel
 *  look), with preserveDrawingBuffer so a frame survives into a print
 *  snapshot. */
export default function PrintScene({
  featured,
  onSelect,
}: {
  featured: Project
  onSelect: (p: Project) => void
}) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: CAMERA_POS, fov: FOV }}
      gl={{ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 0.95
      }}
    >
      <color attach="background" args={['#000000']} />
      <fogExp2 attach="fog" args={['#000000', 0.016]} />
      <ambientLight intensity={0.45} />
      <ForceRenderOnPrint />
      <Suspense fallback={null}>
        <Starfield />
        <BackgroundField />
        <PrintRing featured={featured} onSelect={onSelect} />
      </Suspense>
      <PostFX />
      <AdaptiveDpr pixelated />
    </Canvas>
  )
}
