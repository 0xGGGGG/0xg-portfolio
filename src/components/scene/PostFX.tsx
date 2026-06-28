import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'

export default function PostFX() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        mipmapBlur
        luminanceThreshold={0.12}
        luminanceSmoothing={0.6}
        intensity={0.9}
        radius={0.75}
      />
      <Vignette eskil={false} offset={0.25} darkness={0.7} />
    </EffectComposer>
  )
}
