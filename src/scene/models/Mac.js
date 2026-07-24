import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import {
  screenTexture, badgeTexture, nameplateTexture, stickerTexture
} from '../textures.js'

const BEIGE = 0xe4dcc8
const BEIGE_DARK = 0xcdc4ac
const DARK = 0x2a2a2e

export function buildMac() {
  const group = new THREE.Group()

  const beigeMat = new THREE.MeshStandardMaterial({ color: BEIGE, roughness: 0.62 })
  const beigeDarkMat = new THREE.MeshStandardMaterial({ color: BEIGE_DARK, roughness: 0.7 })
  const darkMat = new THREE.MeshStandardMaterial({ color: DARK, roughness: 0.45 })

  // Base plinth (recessed foot)
  const base = new THREE.Mesh(new RoundedBoxGeometry(3.3, 0.34, 3.0, 3, 0.06), beigeDarkMat)
  base.position.y = 0.17
  group.add(base)

  // Main body — slightly tapered toward the back via two stacked boxes
  const body = new THREE.Mesh(new RoundedBoxGeometry(3.6, 4.35, 3.2, 4, 0.16), beigeMat)
  body.position.y = 0.34 + 4.35 / 2
  body.castShadow = true
  group.add(body)

  const FRONT = 1.6 // body front face z

  // Recessed screen bezel (dark)
  const bezel = new THREE.Mesh(new RoundedBoxGeometry(2.92, 2.16, 0.14, 3, 0.05), darkMat)
  bezel.position.set(0, 3.28, FRONT + 0.02)
  group.add(bezel)

  // Bezel frame lip (beige ring standing proud around the recess)
  const lip = new THREE.Mesh(new RoundedBoxGeometry(3.12, 2.36, 0.06, 3, 0.03), beigeDarkMat)
  lip.position.set(0, 3.28, FRONT - 0.02)
  group.add(lip)

  // CRT display (canvas texture, rounded corners baked into alpha-free art)
  const { texture: screenTex, regions: screenRegions } = screenTexture()
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(2.56, 1.71),
    new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false })
  )
  screen.position.set(0, 3.28, FRONT + 0.1)
  group.add(screen)

  // Glass sheen
  const sheen = new THREE.Mesh(
    new THREE.PlaneGeometry(2.56, 1.71),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.05,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  )
  sheen.position.set(0, 3.28, FRONT + 0.11)
  group.add(sheen)

  // Floppy slot
  const slot = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.09, 0.06), darkMat)
  slot.position.set(0.62, 1.5, FRONT + 0.01)
  group.add(slot)
  const slotLip = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.22, 0.03), beigeDarkMat)
  slotLip.position.set(0.62, 1.5, FRONT + 0.005)
  group.add(slotLip)

  // Ejectable floppy disk, hidden inside the slot
  const floppy = new THREE.Group()
  const diskBody = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.045, 1.1),
    new THREE.MeshStandardMaterial({ color: 0x3a4a9e, roughness: 0.6 })
  )
  floppy.add(diskBody)
  const shutter = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.05, 0.34),
    new THREE.MeshStandardMaterial({ color: 0xb9b3a4, metalness: 0.7, roughness: 0.35 })
  )
  shutter.position.set(-0.12, 0.005, -0.3)
  floppy.add(shutter)
  const diskLabel = new THREE.Mesh(
    new THREE.PlaneGeometry(0.7, 0.5),
    new THREE.MeshStandardMaterial({ color: 0xf4f2ec, roughness: 0.8 })
  )
  diskLabel.rotation.x = -Math.PI / 2
  diskLabel.position.set(0, 0.026, 0.22)
  floppy.add(diskLabel)
  floppy.position.set(0.62, 1.5, FRONT - 0.5) // tucked inside
  group.add(floppy)

  // Brightness dial under the screen (left) — chunky and clickable
  const dial = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.13, 0.14, 20),
    beigeDarkMat
  )
  dial.rotation.x = Math.PI / 2
  dial.position.set(-1.15, 2.05, FRONT + 0.04)
  group.add(dial)
  const dialMark = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.1, 0.02), darkMat)
  dialMark.position.set(-1.15, 2.09, FRONT + 0.11)
  group.add(dialMark)

  // Rainbow AM badge
  const badge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.22, 0.28),
    new THREE.MeshBasicMaterial({ map: badgeTexture(), toneMapped: false })
  )
  badge.position.set(-1.35, 1.62, FRONT + 0.012)
  group.add(badge)

  // Nameplate
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(1.15, 0.18),
    new THREE.MeshBasicMaterial({ map: nameplateTexture('Adamtosh 128k'), transparent: true })
  )
  plate.position.set(-0.7, 1.06, FRONT + 0.012)
  group.add(plate)

  // Top handle recess
  const handle = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.5), darkMat)
  handle.position.set(0, 4.66, -0.7)
  group.add(handle)

  // Side vents (both sides)
  const ventGeo = new THREE.BoxGeometry(0.02, 0.05, 2.2)
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const vent = new THREE.Mesh(ventGeo, darkMat)
      vent.position.set(side * 1.81, 4.15 - i * 0.14, -0.2)
      group.add(vent)
    }
  }

  // Stickers on the right side
  const stick = (tex, size, y, z, rot) => {
    const s = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false })
    )
    s.position.set(1.815, y, z)
    s.rotation.y = Math.PI / 2
    s.rotation.z = rot
    group.add(s)
  }
  stick(stickerTexture('ball'), 0.72, 3.4, 0.6, 0.2)
  stick(stickerTexture('heart'), 0.55, 2.6, -0.5, -0.25)
  stick(stickerTexture('note'), 0.62, 1.7, 0.5, 0.12)

  group.traverse((o) => { if (o.isMesh && o !== screen) o.castShadow = true })

  return { group, screen, screenTex, screenRegions, body, slot, slotLip, floppy, dial, dialMark }
}
