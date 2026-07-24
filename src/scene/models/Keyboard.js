import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

const BEIGE = 0xe4dcc8
const KEY = 0xefe9da

export function buildKeyboard() {
  const group = new THREE.Group()

  const base = new THREE.Mesh(
    new RoundedBoxGeometry(4.7, 0.34, 1.75, 3, 0.08),
    new THREE.MeshStandardMaterial({ color: BEIGE, roughness: 0.6 })
  )
  base.position.y = 0.17
  base.rotation.x = -0.04
  base.castShadow = true
  group.add(base)

  // Keys — instanced caps in 4 rows + spacebar row
  const rows = [14, 13, 12, 11]
  let count = rows.reduce((a, b) => a + b, 0) + 3 // + space + 2 modifiers
  const keyGeo = new RoundedBoxGeometry(0.27, 0.13, 0.27, 2, 0.035)
  const keyMat = new THREE.MeshStandardMaterial({ color: KEY, roughness: 0.5 })
  const keys = new THREE.InstancedMesh(keyGeo, keyMat, count)
  keys.castShadow = true

  const m = new THREE.Matrix4()
  const pos = new THREE.Vector3()
  const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.04, 0, 0))
  const scl = new THREE.Vector3(1, 1, 1)
  let idx = 0

  rows.forEach((n, r) => {
    const w = n * 0.31
    for (let i = 0; i < n; i++) {
      pos.set(-w / 2 + 0.155 + i * 0.31, 0.4 - r * 0.008, -0.62 + r * 0.32)
      m.compose(pos, quat, scl)
      keys.setMatrixAt(idx++, m)
    }
  })
  // Bottom row: two modifiers + spacebar
  pos.set(-1.55, 0.37, 0.66); m.compose(pos, quat, scl); keys.setMatrixAt(idx++, m)
  pos.set(1.55, 0.37, 0.66); m.compose(pos, quat, scl); keys.setMatrixAt(idx++, m)
  pos.set(0, 0.37, 0.66)
  scl.set(7.4, 1, 1)
  m.compose(pos, quat, scl)
  keys.setMatrixAt(idx++, m)

  keys.instanceMatrix.needsUpdate = true
  group.add(keys)

  return { group }
}

export function buildMouse() {
  const group = new THREE.Group()
  const beige = new THREE.MeshStandardMaterial({ color: BEIGE, roughness: 0.55 })

  const body = new THREE.Mesh(new RoundedBoxGeometry(0.85, 0.34, 1.15, 3, 0.1), beige)
  body.position.y = 0.17
  body.castShadow = true
  group.add(body)

  const button = new THREE.Mesh(
    new RoundedBoxGeometry(0.55, 0.08, 0.34, 2, 0.03),
    new THREE.MeshStandardMaterial({ color: 0xd8cfb8, roughness: 0.55 })
  )
  button.position.set(0, 0.33, -0.3)
  group.add(button)

  return { group }
}

// A sagging cable between two world-space points
export function buildCable(from, to, color = 0xcdc4ac) {
  const mid = from.clone().lerp(to, 0.5)
  mid.y = Math.min(from.y, to.y) * 0.3 + 0.03
  const side = new THREE.Vector3(to.z - from.z, 0, from.x - to.x).normalize().multiplyScalar(0.5)
  const c1 = from.clone().lerp(mid, 0.5).add(side)
  const c2 = mid.clone().lerp(to, 0.5).sub(side)
  c1.y = 0.05
  c2.y = 0.05
  const curve = new THREE.CatmullRomCurve3([from, c1, mid, c2, to])
  const tube = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 32, 0.035, 6),
    new THREE.MeshStandardMaterial({ color, roughness: 0.7 })
  )
  tube.castShadow = true
  return tube
}
