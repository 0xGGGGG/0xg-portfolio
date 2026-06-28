import { Stars } from '@react-three/drei'

export default function Starfield() {
  return (
    <Stars radius={60} depth={40} count={1400} factor={2.4} saturation={0} fade speed={0.5} />
  )
}
