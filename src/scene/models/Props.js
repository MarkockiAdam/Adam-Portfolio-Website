import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import {
  mugAppleTexture, cardTexture, globeTexture, sscCertificateTexture,
  pingDotTexture, pingRingTexture, floppyLabelTexture
} from '../textures.js'

const flat = (color, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.6, flatShading: true, ...extra })
const smooth = (color, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.5, ...extra })

// ── White porcelain mug with rainbow apple + steam ─
export function buildMug(animators) {
  const group = new THREE.Group()
  const porcelain = smooth(0xf7f6f2, { roughness: 0.22 })

  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 1.2, 36, 1, true), porcelain)
  cup.material.side = THREE.DoubleSide
  cup.position.y = 0.6
  cup.castShadow = true
  group.add(cup)

  const bottom = new THREE.Mesh(new THREE.CircleGeometry(0.52, 36), porcelain)
  bottom.rotation.x = Math.PI / 2
  bottom.position.y = 0.01
  group.add(bottom)

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.035, 10, 36), porcelain)
  rim.rotation.x = Math.PI / 2
  rim.position.y = 1.2
  group.add(rim)

  const coffee = new THREE.Mesh(
    new THREE.CircleGeometry(0.48, 36),
    smooth(0x6b4a2f, { roughness: 0.25 })
  )
  coffee.rotation.x = -Math.PI / 2
  coffee.position.y = 1.1
  group.add(coffee)

  // Squared handle, like the vintage Apple mug
  const handleBar = (w, h, x, y) => {
    const bar = new THREE.Mesh(new RoundedBoxGeometry(w, h, 0.16, 2, 0.05), porcelain)
    bar.position.set(x, y, 0)
    bar.castShadow = true
    group.add(bar)
  }
  handleBar(0.14, 0.72, 0.92, 0.62)   // vertical
  handleBar(0.42, 0.14, 0.72, 0.94)   // top
  handleBar(0.42, 0.14, 0.72, 0.3)    // bottom

  // Rainbow apple decal (front)
  const decal = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.5),
    new THREE.MeshBasicMaterial({ map: mugAppleTexture(), transparent: true, toneMapped: false })
  )
  decal.position.set(0, 0.62, 0.525)
  group.add(decal)

  // Steam sprites
  const steamMat = new THREE.SpriteMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.0,
    depthWrite: false
  })
  const puffs = []
  for (let i = 0; i < 3; i++) {
    const puff = new THREE.Sprite(steamMat.clone())
    puff.scale.setScalar(0.22)
    puff.position.set((i - 1) * 0.12, 1.3, 0)
    group.add(puff)
    puffs.push({ puff, seed: i * 2.1 })
  }
  animators.push((t) => {
    puffs.forEach(({ puff, seed }) => {
      const k = (t * 0.45 + seed) % 1.6
      puff.position.y = 1.25 + k * 0.75
      puff.material.opacity = k < 1.3 ? 0.22 * (1 - k / 1.4) : 0
      puff.scale.setScalar(0.16 + k * 0.16)
    })
  })

  return group
}

// Reusable AR-style tap indicator (dot + expanding ring)
export function makePing(animators, y) {
  const ping = new THREE.Group()
  ping.position.y = y
  const dot = new THREE.Sprite(new THREE.SpriteMaterial({
    map: pingDotTexture(),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }))
  dot.scale.setScalar(0.22)
  const ring = new THREE.Sprite(new THREE.SpriteMaterial({
    map: pingRingTexture(),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }))
  ping.add(dot, ring)
  animators.push((t) => {
    if (!ping.visible) return
    const k = (t % 1.8) / 1.8
    ring.scale.setScalar(0.3 + k * 0.75)
    ring.material.opacity = 0.85 * (1 - k)
    dot.scale.setScalar(0.22 + Math.sin(t * 2.4) * 0.02)
  })
  return ping
}

// ── Fiat 126p "Maluch" toy ─────────────────────────
// True side-profile silhouette extruded across the width, with wheel arches
export function buildMaluch(animators) {
  const group = new THREE.Group()
  const red = smooth(0xd42b23, { roughness: 0.35 })
  const black = smooth(0x232326, { roughness: 0.5 })
  const dark = smooth(0x17171c, { roughness: 0.3 })

  // Side silhouette (front = +x). CCW outline with wheel-arch cutouts.
  const R = 0.27 // arch radius
  const s = new THREE.Shape()
  s.moveTo(-0.95, 0.22)
  s.lineTo(-0.85, 0.22)
  s.absarc(-0.58, 0.22, R, Math.PI, 0, true)   // rear arch
  s.lineTo(0.35, 0.22)
  s.absarc(0.62, 0.22, R, Math.PI, 0, true)    // front arch
  s.lineTo(0.95, 0.22)
  s.lineTo(0.96, 0.5)                          // front face
  s.quadraticCurveTo(0.96, 0.64, 0.84, 0.68)   // nose roll-over
  s.lineTo(0.4, 0.79)                          // short sloping hood
  s.lineTo(0.13, 1.14)                         // raked windshield
  s.lineTo(-0.6, 1.17)                         // roof
  s.quadraticCurveTo(-0.85, 1.15, -0.9, 0.95)  // rounded rear roofline
  s.lineTo(-0.95, 0.55)                        // rear panel
  s.closePath()

  const body = new THREE.Mesh(
    new THREE.ExtrudeGeometry(s, {
      depth: 0.84,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 3
    }),
    red
  )
  body.position.z = -0.42
  body.castShadow = true
  group.add(body)

  // Glass band: windshield + side glass + rear window as one dark extrude.
  // Front/rear edges sit slightly PROUD of the body so the windshield and
  // rear window actually show; top/bottom edges stay hidden inside the shell.
  const g = new THREE.Shape()
  g.moveTo(0.38, 0.8)
  g.lineTo(0.12, 1.1)
  g.lineTo(-0.6, 1.1)
  g.quadraticCurveTo(-0.83, 1.1, -0.88, 0.9)
  g.lineTo(-0.88, 0.78)
  g.closePath()
  const glass = new THREE.Mesh(
    new THREE.ExtrudeGeometry(g, { depth: 0.98, bevelEnabled: false }),
    dark
  )
  glass.position.z = -0.49
  group.add(glass)

  // Dedicated windshield + rear window panes, floated just above the
  // beveled body surface so they always read as glass
  const paneMat = dark
  const addPane = (a, b, offset, width) => {
    const mid = new THREE.Vector2((a.x + b.x) / 2, (a.y + b.y) / 2)
    const dir = new THREE.Vector2(b.x - a.x, b.y - a.y)
    const len = dir.length()
    const n = new THREE.Vector2(dir.y, -dir.x).normalize() // outward normal
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(width, len * 0.88), paneMat)
    pane.position.set(mid.x + n.x * offset, mid.y + n.y * offset, 0)
    pane.lookAt(
      pane.position.x + n.x,
      pane.position.y + n.y,
      0
    )
    group.add(pane)
  }
  // Windshield: along the beveled windshield slope (bottom → top)
  addPane(new THREE.Vector2(0.44, 0.82), new THREE.Vector2(0.17, 1.17), 0.035, 0.7)
  // Rear window: along the rear curve
  addPane(new THREE.Vector2(-0.93, 0.8), new THREE.Vector2(-0.87, 1.08), 0.035, 0.62)

  // Black bumpers (slightly wider than the body)
  for (const [x, w] of [[1.0, 0.09], [-0.99, 0.09]]) {
    const bumper = new THREE.Mesh(new RoundedBoxGeometry(w, 0.12, 1.02, 2, 0.03), black)
    bumper.position.set(x, 0.33, 0)
    bumper.castShadow = true
    group.add(bumper)
  }

  // Side trim strips
  for (const side of [-1, 1]) {
    const trim = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.04, 0.02), black)
    trim.position.set(0, 0.45, side * 0.48)
    group.add(trim)
  }

  // Square headlights high on the front face + orange indicators below
  const lightMat = smooth(0xfff3d0, { emissive: 0x8a8058, emissiveIntensity: 0.5 })
  const indicatorMat = smooth(0xe88a2c, { emissive: 0x7a4210, emissiveIntensity: 0.4 })
  for (const side of [-1, 1]) {
    const headlight = new THREE.Mesh(new RoundedBoxGeometry(0.05, 0.13, 0.2, 2, 0.02), lightMat)
    headlight.position.set(0.97, 0.56, side * 0.27)
    group.add(headlight)
    const indicator = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.11), indicatorMat)
    indicator.position.set(0.99, 0.42, side * 0.29)
    group.add(indicator)
  }

  // Tiny center badge
  const badge = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.06), smooth(0x2b3f8a))
  badge.position.set(0.985, 0.6, 0)
  group.add(badge)

  // Rear-quarter air intake slats
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.018, 0.02), black)
      slat.position.set(-0.68, 0.98 - i * 0.05, side * 0.475)
      group.add(slat)
    }
  }

  // White front plate
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.09, 0.32), smooth(0xf4f2ec))
  plate.position.set(1.05, 0.33, 0)
  group.add(plate)

  // Door mirror
  const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.05), black)
  mirror.position.set(0.32, 0.86, 0.48)
  group.add(mirror)

  // Wheels tucked into the arches
  const wheelGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.12, 18)
  const hubGeo = new THREE.CylinderGeometry(0.115, 0.115, 0.13, 14)
  const hubMat = smooth(0xd6d3c8)
  const capMat = smooth(0x8a877c)
  for (const [x, z] of [[0.62, 0.36], [0.62, -0.36], [-0.58, 0.36], [-0.58, -0.36]]) {
    const wheel = new THREE.Mesh(wheelGeo, black)
    wheel.rotation.x = Math.PI / 2
    wheel.position.set(x, 0.22, z)
    wheel.castShadow = true
    group.add(wheel)
    const hub = new THREE.Mesh(hubGeo, hubMat)
    hub.rotation.x = Math.PI / 2
    hub.position.set(x, 0.22, z)
    group.add(hub)
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.135, 8), capMat)
    cap.rotation.x = Math.PI / 2
    cap.position.set(x, 0.22, z)
    group.add(cap)
  }

  // Tap indicator above the roof
  const ping = makePing(animators, 1.75)
  group.add(ping)

  return { group, ping }
}

// ── Yellow vase with daisies ───────────────────────
export function buildVase(animators) {
  const group = new THREE.Group()

  const profile = []
  const shape = [
    [0.02, 0], [0.42, 0.02], [0.5, 0.18], [0.42, 0.55], [0.3, 0.85],
    [0.34, 1.05], [0.46, 1.25], [0.44, 1.4], [0.36, 1.42]
  ]
  shape.forEach(([x, y]) => profile.push(new THREE.Vector2(x, y)))
  const vase = new THREE.Mesh(
    new THREE.LatheGeometry(profile, 28),
    smooth(0xf2c53d, { roughness: 0.35 })
  )
  vase.castShadow = true
  group.add(vase)

  const stemMat = smooth(0x3f8f4a)
  const petalMat = smooth(0xf5f2ea)
  const centerMat = smooth(0xef8f4b, { roughness: 0.4 })
  const petalGeo = new THREE.SphereGeometry(0.16, 8, 6)
  petalGeo.scale(1, 0.38, 0.55)

  const flowers = []
  const defs = [
    { lean: [0.28, 0.1], h: 1.5, size: 1.0 },
    { lean: [-0.3, -0.12], h: 1.85, size: 1.15 },
    { lean: [0.05, -0.3], h: 1.2, size: 0.8 }
  ]
  defs.forEach(({ lean, h, size }, fi) => {
    const top = new THREE.Vector3(lean[0], 1.4 + h, lean[1])
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.0, 0),
      new THREE.Vector3(lean[0] * 0.5, 1.4 + h * 0.5, lean[1] * 0.5),
      top
    ])
    const stem = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.035, 6), stemMat)
    stem.castShadow = true
    group.add(stem)

    const head = new THREE.Group()
    head.position.copy(top)
    const center = new THREE.Mesh(new THREE.SphereGeometry(0.14 * size, 12, 10), centerMat)
    head.add(center)
    for (let p = 0; p < 8; p++) {
      const petal = new THREE.Mesh(petalGeo, petalMat)
      const a = (p / 8) * Math.PI * 2
      petal.position.set(Math.cos(a) * 0.24 * size, 0, Math.sin(a) * 0.24 * size)
      petal.rotation.y = -a
      petal.scale.setScalar(size)
      petal.castShadow = true
      head.add(petal)
    }
    head.rotation.x = 0.35 + lean[1]
    head.rotation.z = -lean[0] * 0.8
    group.add(head)
    flowers.push({ head, seed: fi * 2.4, baseZ: head.rotation.z })
  })

  animators.push((t) => {
    flowers.forEach(({ head, seed, baseZ }) => {
      head.rotation.z = baseZ + Math.sin(t * 0.8 + seed) * 0.05
    })
  })

  return group
}

// ── Kirby figurine ─────────────────────────────────
export function buildKirby() {
  const group = new THREE.Group()
  const pink = smooth(0xf6a8c5, { roughness: 0.35 })
  const crimson = smooth(0xc9294e, { roughness: 0.4 })
  const blush = smooth(0xef6f9e, { roughness: 0.5 })
  const navy = smooth(0x14143c, { roughness: 0.2 })
  const white = smooth(0xffffff, { roughness: 0.2 })
  const mouthMat = smooth(0x8e2038, { roughness: 0.5 })

  const R = 0.62
  const body = new THREE.Mesh(new THREE.SphereGeometry(R, 32, 24), pink)
  body.position.y = 0.72
  body.castShadow = true
  group.add(body)

  // Feet — crimson flattened ellipsoids poking out front
  const footGeo = new THREE.SphereGeometry(0.3, 20, 16)
  for (const side of [-1, 1]) {
    const foot = new THREE.Mesh(footGeo, crimson)
    foot.scale.set(1.15, 0.62, 1.35)
    foot.position.set(side * 0.4, 0.19, 0.28)
    foot.rotation.y = side * 0.45
    foot.castShadow = true
    group.add(foot)
  }

  // Stubby arms
  const armGeo = new THREE.SphereGeometry(0.22, 16, 12)
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(armGeo, pink)
    arm.scale.set(1, 1.15, 1)
    arm.position.set(side * 0.58, 0.82, 0.1)
    arm.rotation.z = side * -0.5
    arm.castShadow = true
    group.add(arm)
  }

  // Face sits on the front of the sphere
  const face = new THREE.Group()
  face.position.y = 0.72
  // Eyes — tall dark ovals with white highlights
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.115, 14, 12), navy)
    eye.scale.set(0.52, 1.85, 0.35)
    eye.position.set(side * 0.17, 0.15, R - 0.035)
    face.add(eye)
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), white)
    glint.scale.set(0.75, 1.25, 0.5)
    glint.position.set(side * 0.17, 0.27, R + 0.012)
    face.add(glint)
  }
  // Cheeks
  for (const side of [-1, 1]) {
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 10), blush)
    cheek.scale.set(1.25, 0.7, 0.3)
    cheek.position.set(side * 0.35, -0.04, R - 0.09)
    cheek.rotation.y = side * 0.6
    face.add(cheek)
  }
  // Open mouth
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 10), mouthMat)
  mouth.scale.set(0.9, 1.1, 0.35)
  mouth.position.set(0, -0.09, R - 0.03)
  face.add(mouth)
  group.add(face)

  return group
}

// ── Spinning desk globe (Terra Cracovianum) ────────
export function buildGlobe(animators) {
  const S = 1.15 // model scale, baked in so hover-scaling works from 1
  const group = new THREE.Group()
  const brass = smooth(0xc9a24a, { metalness: 0.75, roughness: 0.3 })
  const wood = smooth(0x4a3627, { roughness: 0.65 })

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42 * S, 0.5 * S, 0.14 * S, 24), wood)
  base.position.y = 0.07 * S
  base.castShadow = true
  group.add(base)

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.045 * S, 0.06 * S, 0.35 * S, 12), brass)
  stem.position.y = 0.3 * S
  group.add(stem)

  const R = 0.55 * S
  const tilt = new THREE.Group()
  tilt.position.y = (0.3 + 0.12) * S + R
  tilt.rotation.z = -0.41 // ~23.5°
  group.add(tilt)

  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(R, 32, 24),
    new THREE.MeshStandardMaterial({ map: globeTexture(), roughness: 0.55 })
  )
  earth.castShadow = true
  tilt.add(earth)

  // Meridian arc
  const arc = new THREE.Mesh(
    new THREE.TorusGeometry(R + 0.07 * S, 0.028 * S, 10, 48, Math.PI * 1.25),
    brass
  )
  arc.rotation.z = Math.PI * 0.87
  tilt.add(arc)

  // Polar pins
  for (const side of [-1, 1]) {
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.02 * S, 0.02 * S, 0.16 * S, 8), brass)
    pin.position.y = side * (R + 0.05 * S)
    tilt.add(pin)
  }

  // Tap indicator: soft dot + expanding ring, AR-hotspot style
  const ping = new THREE.Group()
  ping.position.y = tilt.position.y + R + 0.42
  const dot = new THREE.Sprite(new THREE.SpriteMaterial({
    map: pingDotTexture(),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }))
  dot.scale.setScalar(0.22)
  const ring = new THREE.Sprite(new THREE.SpriteMaterial({
    map: pingRingTexture(),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }))
  ping.add(dot, ring)
  group.add(ping)

  const state = { speed: 0.35 }
  animators.push((t, dt) => {
    earth.rotation.y += state.speed * dt
    state.speed += (0.35 - state.speed) * Math.min(1, dt * 1.2)

    if (ping.visible) {
      const k = (t % 1.8) / 1.8
      ring.scale.setScalar(0.3 + k * 0.75)
      ring.material.opacity = 0.85 * (1 - k)
      dot.scale.setScalar(0.22 + Math.sin(t * 2.4) * 0.02)
    }
  })

  return { group, earth, state, ping }
}

// ── Floppy caddy with social-link disks ────────────
export function buildFloppyCaddy(register, links) {
  const group = new THREE.Group()
  const plastic = smooth(0x2e2e35, { roughness: 0.55 })

  // Open-top caddy box — long single row so every disk shows fully
  const LEN = 3.35
  const bottom = new THREE.Mesh(new RoundedBoxGeometry(LEN, 0.1, 0.6, 2, 0.03), plastic)
  bottom.position.y = 0.05
  bottom.castShadow = true
  group.add(bottom)
  const wallGeoL = new RoundedBoxGeometry(0.07, 0.42, 0.6, 2, 0.03)
  const wallGeoF = new RoundedBoxGeometry(LEN, 0.42, 0.06, 2, 0.03)
  for (const side of [-1, 1]) {
    const wall = new THREE.Mesh(wallGeoL, plastic)
    wall.position.set(side * (LEN / 2 - 0.035), 0.24, 0)
    wall.castShadow = true
    group.add(wall)
  }
  for (const side of [-1, 1]) {
    const wall = new THREE.Mesh(wallGeoF, plastic)
    wall.position.set(0, 0.2, side * 0.27)
    wall.castShadow = true
    group.add(wall)
  }

  // Disks — one row, no occlusion, every logo readable
  const disks = [
    { kind: 'mail', name: 'MAIL', shell: '#d8d0bc', url: links.mail, self: true },
    { kind: 'github', name: 'GITHUB', shell: '#3a3f46', url: links.github },
    { kind: 'linkedin', name: 'LINKEDIN', shell: '#2a6fc2', url: links.linkedin },
    { kind: 'x', name: 'Twttr', shell: '#26262c', url: links.x }
  ]
  const SPACING = 0.8
  disks.forEach((d, i) => {
    const holder = new THREE.Group()
    const disk = new THREE.Mesh(
      new RoundedBoxGeometry(0.74, 0.74, 0.07, 2, 0.02),
      [
        smooth(d.shell), smooth(d.shell), smooth(d.shell), smooth(d.shell),
        new THREE.MeshStandardMaterial({ map: floppyLabelTexture(d.kind, d.name, d.shell), roughness: 0.6 }),
        smooth(d.shell)
      ]
    )
    disk.castShadow = true
    holder.add(disk)
    holder.position.set((i - 1.5) * SPACING, 0.62, 0)
    holder.rotation.y = -0.045 + i * 0.03
    holder.rotation.x = -0.1
    holder.userData.hoverScale = 1.12
    group.add(holder)
    register(disk, {
      onClick: () => window.open(d.url, d.self ? '_self' : '_blank', d.self ? '' : 'noopener'),
      root: holder
    })
  })

  return group
}

// ── Swift Student Challenge winner certificate ─────
export function buildSSCCertificate(animators) {
  const group = new THREE.Group()
  const size = 1.45
  const thick = 0.034
  const paper = smooth(0xf4f2ec, { roughness: 0.85 })

  const body = new THREE.Mesh(
    new RoundedBoxGeometry(size, size, thick, 2, 0.012),
    paper
  )
  body.castShadow = true
  body.receiveShadow = true
  group.add(body)

  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(size * 0.96, size * 0.96),
    new THREE.MeshBasicMaterial({ map: sscCertificateTexture(), toneMapped: false })
  )
  face.position.z = thick / 2 + 0.001
  group.add(face)

  const back = new THREE.Mesh(
    new THREE.PlaneGeometry(size * 0.96, size * 0.96),
    paper
  )
  back.position.z = -(thick / 2 + 0.001)
  back.rotation.y = Math.PI
  group.add(back)

  // Pivot so the card sits on its bottom edge when pitched back
  body.position.y = size / 2
  face.position.y = size / 2
  back.position.y = size / 2

  const ping = makePing(animators, size + 0.35)
  group.add(ping)

  return { group, ping }
}

// ── Card stack ─────────────────────────────────────
export function buildCards() {
  const group = new THREE.Group()
  const backMat = smooth(0x3d6fb0)
  const geo = new RoundedBoxGeometry(0.72, 0.035, 1.0, 2, 0.015)
  for (let i = 0; i < 5; i++) {
    const card = new THREE.Mesh(geo, backMat)
    card.position.y = 0.02 + i * 0.037
    card.rotation.y = (i - 2) * 0.09
    card.castShadow = true
    group.add(card)
  }
  const top = new THREE.Mesh(
    new THREE.PlaneGeometry(0.7, 0.98),
    new THREE.MeshBasicMaterial({ map: cardTexture(), toneMapped: false })
  )
  top.rotation.x = -Math.PI / 2
  top.rotation.z = 0.28
  top.position.y = 0.21
  group.add(top)
  return group
}

// ── Bee circling the flowers ───────────────────────
export function buildBee(animators, center) {
  const group = new THREE.Group()
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), flat(0xf2c53d))
  body.scale.set(1.3, 1, 1)
  group.add(body)
  const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.025, 6, 12), flat(0x232326))
  stripe.rotation.y = Math.PI / 2
  group.add(stripe)
  const wingGeo = new THREE.CircleGeometry(0.07, 8)
  const wingMat = new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0.55, side: THREE.DoubleSide
  })
  const w1 = new THREE.Mesh(wingGeo, wingMat)
  w1.position.set(0, 0.08, 0.05)
  w1.rotation.x = -0.9
  const w2 = w1.clone()
  w2.position.z = -0.05
  w2.rotation.x = 0.9
  group.add(w1, w2)

  animators.push((t) => {
    const a = t * 0.55
    group.position.set(
      center.x + Math.cos(a) * 1.6,
      center.y + 2.6 + Math.sin(t * 1.7) * 0.25,
      center.z + Math.sin(a) * 1.2
    )
    group.rotation.y = -a + Math.PI / 2
    w1.rotation.x = -0.9 + Math.sin(t * 40) * 0.5
    w2.rotation.x = 0.9 - Math.sin(t * 40) * 0.5
  })

  return group
}
