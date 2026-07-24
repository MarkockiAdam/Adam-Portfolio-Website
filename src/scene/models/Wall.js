import * as THREE from 'three'
import { gridTexture, stickyTexture, polaroidTexture } from '../textures.js'
import { stickyNotes } from '../../content.js'

export function buildBackdrop() {
  const group = new THREE.Group()

  const gridTex = gridTexture()

  const wallTex = gridTex.clone()
  wallTex.repeat.set(30, 16)
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(90, 48),
    new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.95 })
  )
  wall.position.set(0, 10, -3.4)
  wall.receiveShadow = true
  group.add(wall)

  const floorTex = gridTex.clone()
  floorTex.repeat.set(30, 14)
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(90, 42),
    new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.95 })
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.set(0, 0, 17.6)
  floor.receiveShadow = true
  group.add(floor)

  // Sticky notes pinned to the wall
  const notePositions = [
    { x: -3.6, y: 6.7, rot: -0.06 },
    { x: 4.7, y: 3.8, rot: -0.1 }
  ]
  const pinMat = new THREE.MeshStandardMaterial({ color: 0xd93b3b, roughness: 0.35 })
  stickyNotes.forEach((note, i) => {
    const p = notePositions[i % notePositions.length]
    const sticky = new THREE.Mesh(
      new THREE.PlaneGeometry(1.35, 1.35),
      new THREE.MeshBasicMaterial({ map: stickyTexture(note.text, note.color, note.doodle), toneMapped: false })
    )
    sticky.position.set(p.x, p.y, -3.32)
    sticky.rotation.z = p.rot
    group.add(sticky)
    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), pinMat)
    pin.position.set(p.x, p.y + 0.62, -3.28)
    group.add(pin)
  })

  // Polaroid
  const polaroid = new THREE.Mesh(
    new THREE.PlaneGeometry(1.3, 1.52),
    new THREE.MeshBasicMaterial({ map: polaroidTexture(), toneMapped: false })
  )
  polaroid.position.set(-5.2, 4.5, -3.32)
  polaroid.rotation.z = 0.07
  group.add(polaroid)
  const pin = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), pinMat)
  pin.position.set(-5.2, 5.3, -3.28)
  group.add(pin)

  return { group, polaroid }
}
