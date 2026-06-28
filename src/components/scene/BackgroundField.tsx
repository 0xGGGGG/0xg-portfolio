import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { PROJECTS, mod, projectBySlug, NEUTRAL_ACCENT } from '@/lib/content/manifest'
import { useNav } from '@/lib/scroll/store'

const N = 680
const MAX_DIST = 0.6 // world units for a connection
const MAX_SEG = 2400 // segment cap (perf)
const TAU = Math.PI * 2
const SPRING = 1.2 // distribution-morph stiffness (was 2.4 -> ~2x slower morph)

export type FieldMode = 'constellation' | 'neural' | 'tree' | 'dag' | 'grid' | 'galaxy' | 'spiral'

// one distribution per project (none is 'constellation' — that's reserved for the index)
const MODE_BY_ORDINAL: FieldMode[] = ['neural', 'tree', 'dag', 'grid', 'galaxy', 'spiral']
const modeFor = (open: boolean, ordinal: number): FieldMode =>
  open ? MODE_BY_ORDINAL[ordinal % MODE_BY_ORDINAL.length] : 'constellation'

const hash = (i: number, s: number) => {
  const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453
  return x - Math.floor(x)
}

function layout(mode: FieldMode): Float32Array {
  const a = new Float32Array(N * 3)
  for (let i = 0; i < N; i++) {
    let x = 0,
      y = 0
    const z = hash(i, 9) * 2 - 1
    switch (mode) {
      case 'grid': {
        const cols = Math.ceil(Math.sqrt(N))
        const rows = Math.ceil(N / cols)
        x = ((i % cols) / (cols - 1)) * 2 - 1
        y = (Math.floor(i / cols) / (rows - 1)) * 2 - 1
        break
      }
      case 'neural': {
        const L = 6
        const layer = Math.floor((i / N) * L)
        const per = Math.max(1, Math.round(N / L))
        x = (layer / (L - 1)) * 2 - 1
        y = (((i % per) / (per - 1)) * 2 - 1) * 0.92 + (hash(i, 3) - 0.5) * 0.12
        break
      }
      case 'tree': {
        const depth = Math.floor(Math.log2(i + 1))
        const idx = i - (Math.pow(2, depth) - 1)
        const span = Math.pow(2, depth)
        y = 1 - (depth / 8) * 2
        x = span === 1 ? 0 : (idx / (span - 1)) * 2 - 1
        x *= 0.45 + depth * 0.07
        break
      }
      case 'dag': {
        const L = 8
        x = ((i % L) / (L - 1)) * 2 - 1
        y = (hash(i, 5) * 2 - 1) * 0.95
        break
      }
      case 'galaxy': {
        const r = Math.sqrt(i / N)
        const th = i * 2.39996
        x = r * Math.cos(th)
        y = r * Math.sin(th)
        break
      }
      case 'spiral': {
        // multi-arm pinwheel radiating from the centre (0xGCG — self-replication)
        const arms = 5
        const arm = i % arms
        const t = Math.floor(i / arms) / Math.ceil(N / arms)
        const r = 0.12 + t * 0.92
        const ang = (arm / arms) * TAU + t * 3.2 * TAU
        x = Math.cos(ang) * r
        y = Math.sin(ang) * r
        break
      }
      default: {
        // constellation (index): empty core where 0xG sits, then a dense halo of
        // stars around it, thinning out toward the edges
        const th = hash(i, 1) * TAU
        let r: number
        if (i % 5 < 3) {
          r = 0.18 + Math.pow(hash(i, 2), 1.8) * 0.4 // dense halo [0.18, 0.58]
        } else {
          r = 0.58 + hash(i, 2) * 0.5 // sparser outer field [0.58, 1.08]
        }
        x = Math.cos(th) * r
        y = Math.sin(th) * r
      }
    }
    a[i * 3] = x
    a[i * 3 + 1] = y
    a[i * 3 + 2] = z
  }
  return a
}

function dotTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.3, 'rgba(255,255,255,0.65)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(c)
}

const VERT = /* glsl */ `
  attribute float aSize;
  attribute float aBright;
  varying float vB;
  void main() {
    vB = aBright;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (12.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`
const FRAG = /* glsl */ `
  uniform sampler2D uTex;
  uniform vec3 uColor;
  varying float vB;
  void main() {
    vec4 t = texture2D(uTex, gl_PointCoord);
    gl_FragColor = vec4(uColor * vB, t.a);
  }
`

export default function BackgroundField() {
  const { viewport } = useThree()
  const group = useRef<THREE.Group>(null)
  const points = useRef<THREE.Points>(null)

  // Track the pointer at the WINDOW level (R3F's canvas pointer freezes whenever
  // the cursor is over a DOM card or leaves the page). `active` relaxes the repel
  // when the cursor leaves the window so it never gets stuck off-centre.
  const mouse = useRef({ x: 0, y: 0, active: false })
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = -((e.clientY / window.innerHeight) * 2 - 1)
      mouse.current.active = true
    }
    const relax = () => (mouse.current.active = false)
    window.addEventListener('pointermove', onMove)
    document.addEventListener('mouseleave', relax)
    window.addEventListener('blur', relax)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('mouseleave', relax)
      window.removeEventListener('blur', relax)
    }
  }, [])

  const tex = useMemo(dotTexture, [])
  const layouts = useMemo(() => {
    const m: Record<string, Float32Array> = {}
    ;(['constellation', 'neural', 'tree', 'dag', 'grid', 'galaxy', 'spiral'] as FieldMode[]).forEach(
      (k) => (m[k] = layout(k)),
    )
    return m
  }, [])

  const state = useMemo(() => {
    const pos = new Float32Array(N * 3)
    const vel = new Float32Array(N * 3)
    const target = layouts.constellation.slice()
    const baseSize = new Float32Array(N)
    const flare = new Float32Array(N)
    const aSize = new Float32Array(N)
    const aBright = new Float32Array(N)
    for (let i = 0; i < N; i++) {
      baseSize[i] = 4 + hash(i, 11) * 5.5 // ~4..9.5 px (between the two)
      aSize[i] = baseSize[i]
      aBright[i] = 0.6
    }
    const lineGeo = new Float32Array(MAX_SEG * 2 * 3)
    const lineCol = new Float32Array(MAX_SEG * 2 * 3)
    return { pos, vel, target, baseSize, flare, aSize, aBright, lineGeo, lineCol }
  }, [layouts])

  const accent = useRef(new THREE.Color('#27e0a0'))
  const curMode = useRef<FieldMode>('constellation')

  const pointsGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(state.pos, 3))
    g.setAttribute('aSize', new THREE.BufferAttribute(state.aSize, 1))
    g.setAttribute('aBright', new THREE.BufferAttribute(state.aBright, 1))
    return g
  }, [state])

  const pointsMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTex: { value: tex }, uColor: { value: new THREE.Color('#bfeede') } },
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [tex],
  )

  const linesGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(state.lineGeo, 3))
    g.setAttribute('color', new THREE.BufferAttribute(state.lineCol, 3))
    return g
  }, [state])

  useFrame((root, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    const t = root.clock.elapsedTime
    // very slow galaxy-like drift of the whole field
    if (group.current) {
      group.current.rotation.z += dt * 0.012
      group.current.position.y = Math.sin(t * 0.05) * 0.15
    }
    const { open, active, hovered } = useNav.getState()
    const ord = mod(active)
    const want = modeFor(open, ord)
    if (want !== curMode.current) {
      curMode.current = want
      state.target.set(layouts[want])
    }
    // neutral at the index; colored only when a project is open or hovered
    const accentHex = open
      ? PROJECTS[ord].accent
      : hovered
        ? projectBySlug(hovered)?.accent ?? NEUTRAL_ACCENT
        : NEUTRAL_ACCENT
    accent.current.set(accentHex)

    // square field so the slow rotation reads symmetrically (no rectangular skew)
    const s = (Math.max(viewport.width, viewport.height) / 2) * 1.08
    const sx = s
    const sy = s
    const sz = 1.4
    const m = mouse.current
    const mxw = m.x * (viewport.width / 2)
    const myw = m.y * (viewport.height / 2)

    const { pos, vel, target, baseSize, flare, aSize, aBright } = state
    for (let i = 0; i < N; i++) {
      const ix = i * 3
      const tx = target[ix] * sx
      const ty = target[ix + 1] * sy
      const tz = target[ix + 2] * sz - 3.2
      // softer spring -> the distribution morphs ~2x slower (galaxy-like drift),
      // settling over roughly the time the circle takes to return to centre
      vel[ix] += (tx - pos[ix]) * SPRING * dt
      vel[ix + 1] += (ty - pos[ix + 1]) * SPRING * dt
      vel[ix + 2] += (tz - pos[ix + 2]) * SPRING * dt
      // mouse spring (repel) — and flare the dot when it's pushed
      const dx = pos[ix] - mxw
      const dy = pos[ix + 1] - myw
      const d2 = dx * dx + dy * dy
      const R = 1.7
      if (m.active && d2 < R * R) {
        const d = Math.sqrt(d2) || 0.001
        const f = (1 - d / R) * 7 * dt
        vel[ix] += (dx / d) * f
        vel[ix + 1] += (dy / d) * f
        flare[i] = Math.min(1.2, flare[i] + (1 - d / R) * 0.45)
      }
      vel[ix] *= 0.92
      vel[ix + 1] *= 0.92
      vel[ix + 2] *= 0.92
      pos[ix] += vel[ix]
      pos[ix + 1] += vel[ix + 1]
      pos[ix + 2] += vel[ix + 2]

      // brightness: subtle random twinkle + decaying flare
      flare[i] *= 0.94
      const twinkle = 0.55 + 0.25 * Math.sin(t * (0.6 + hash(i, 7) * 1.4) + hash(i, 8) * 6.28)
      aBright[i] = twinkle + flare[i] * 2.2
      aSize[i] = baseSize[i] * (1 + flare[i] * 0.55)
    }
    pointsGeo.attributes.position.needsUpdate = true
    pointsGeo.attributes.aSize.needsUpdate = true
    pointsGeo.attributes.aBright.needsUpdate = true
    pointsMat.uniforms.uColor.value.copy(accent.current).lerp(new THREE.Color('#ffffff'), 0.55)

    // connection lines
    const lg = state.lineGeo
    const lc = state.lineCol
    const ac = accent.current
    let seg = 0
    const maxD2 = MAX_DIST * MAX_DIST
    for (let i = 0; i < N && seg < MAX_SEG; i++) {
      const ix = i * 3
      for (let j = i + 1; j < N && seg < MAX_SEG; j++) {
        const jx = j * 3
        const dx = pos[ix] - pos[jx]
        const dy = pos[ix + 1] - pos[jx + 1]
        const dz = pos[ix + 2] - pos[jx + 2]
        const d2 = dx * dx + dy * dy + dz * dz
        if (d2 < maxD2) {
          const a = (1 - Math.sqrt(d2) / MAX_DIST) * 0.5
          const o = seg * 6
          lg[o] = pos[ix]; lg[o + 1] = pos[ix + 1]; lg[o + 2] = pos[ix + 2]
          lg[o + 3] = pos[jx]; lg[o + 4] = pos[jx + 1]; lg[o + 5] = pos[jx + 2]
          lc[o] = ac.r * a; lc[o + 1] = ac.g * a; lc[o + 2] = ac.b * a
          lc[o + 3] = ac.r * a; lc[o + 4] = ac.g * a; lc[o + 5] = ac.b * a
          seg++
        }
      }
    }
    linesGeo.setDrawRange(0, seg * 2)
    linesGeo.attributes.position.needsUpdate = true
    linesGeo.attributes.color.needsUpdate = true
  })

  return (
    <group ref={group}>
      <points ref={points} geometry={pointsGeo} material={pointsMat} frustumCulled={false} />
      <lineSegments geometry={linesGeo} frustumCulled={false}>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0.7}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  )
}
