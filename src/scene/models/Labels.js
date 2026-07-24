import * as THREE from 'three'
import { textLabel } from '../textures.js'
import { profile } from '../../content.js'

// Builds all floating clickable labels.
// register(mesh, {onClick}) wires raycast interaction in Scene.
export function buildLabels(register, actions) {
  const group = new THREE.Group()
  const redrawables = []

  const add = (mesh, x, y, z, onClick) => {
    mesh.position.set(x, y, z)
    group.add(mesh)
    redrawables.push(mesh)
    if (onClick) register(mesh, { onClick })
    return mesh
  }

  // Name (right) with two subtitle lines
  add(textLabel(profile.firstName, { size: 0.85, color: '#f2f2f6' }), 5.6, 5.9, -3.3)
  add(textLabel(profile.subtitle1, {
    size: 0.22, color: '#a5a5b4', font: '400', skew: -0.12
  }), 5.0, 5.22, -3.3)
  add(textLabel(profile.subtitle2, {
    size: 0.2, color: '#8d8d9c', font: '400', skew: -0.12
  }), 5.1, 4.82, -3.3)

  // Gentle float
  const bases = []
  group.children.forEach((child, i) => bases.push({ child, y: child.position.y, seed: i * 1.3 }))
  const animate = (t) => {
    bases.forEach(({ child, y, seed }) => {
      child.position.y = y + Math.sin(t * 0.7 + seed) * 0.05
    })
  }

  // Redraw labels once web fonts arrive
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      redrawables.forEach((m) => m.userData.redraw?.())
    })
  }

  return { group, animate }
}
