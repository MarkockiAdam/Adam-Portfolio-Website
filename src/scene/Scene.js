import * as THREE from 'three'
import { buildMac } from './models/Mac.js'
import { buildKeyboard, buildMouse, buildCable } from './models/Keyboard.js'
import {
  buildMug, buildMaluch, buildVase, buildKirby, buildCards, buildBee,
  buildGlobe, buildFloppyCaddy, buildSSCCertificate
} from './models/Props.js'
import { profile } from '../content.js'
import { buildBackdrop } from './models/Wall.js'
import { buildLabels } from './models/Labels.js'

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

export class Scene {
  constructor(canvas, actions) {
    this.canvas = canvas
    this.actions = actions
    this.isMobile = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x141416)

    this.camera = new THREE.PerspectiveCamera(28, innerWidth / innerHeight, 0.1, 200)

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, this.isMobile ? 2 : 2))
    this.renderer.setSize(innerWidth, innerHeight)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    this.renderer.outputColorSpace = THREE.SRGBColorSpace

    this.animators = []
    this.clickables = []
    this.raycaster = new THREE.Raycaster()
    this.pointer = new THREE.Vector2()
    this.parallax = new THREE.Vector2()
    this.orbit = new THREE.Vector2()      // drag-orbit offsets (rad)
    this.orbitTarget = new THREE.Vector2()

    // Camera state
    this.mode = 'overview' // overview | zooming | zoomed | unzooming
    this.tween = null
    this.overviewTarget = new THREE.Vector3(0, 3.3, 0.6)
    this.overviewDist = 21.5
    this.overviewPolar = { theta: 0.32, phi: 1.23 } // azimuth, inclination

    this.buildLights()
    this.buildWorld()
    this.bindInput()
    this.resize()

    addEventListener('resize', () => this.resize())

    this.clock = new THREE.Clock()
    this.onSettled = null
    this.firstFrame = false
    this.renderer.setAnimationLoop(() => this.tick())
  }

  buildLights() {
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x2c2c33, 0.85))

    const key = new THREE.DirectionalLight(0xfff1dd, 2.0)
    key.position.set(7, 13, 9)
    key.castShadow = true
    key.shadow.mapSize.set(this.isMobile ? 1024 : 2048, this.isMobile ? 1024 : 2048)
    key.shadow.camera.left = -12
    key.shadow.camera.right = 12
    key.shadow.camera.top = 12
    key.shadow.camera.bottom = -12
    key.shadow.camera.far = 40
    key.shadow.radius = 6
    key.shadow.bias = -0.0004
    this.scene.add(key)

    const fill = new THREE.PointLight(0x9db8ff, 14, 40)
    fill.position.set(-8, 6, 8)
    this.scene.add(fill)
  }

  buildWorld() {
    const backdrop = buildBackdrop()
    this.scene.add(backdrop.group)

    // The WWDC polaroid links to the LinkedIn post about it
    backdrop.polaroid.userData.hoverScale = 1.06
    this.registerClickable(backdrop.polaroid, {
      onClick: () => {
        this.actions.sfx?.('click')
        window.open('https://www.linkedin.com/feed/update/urn:li:activity:7474822960382472193/', '_blank', 'noopener')
      },
      root: backdrop.polaroid
    })

    // Mac
    const mac = buildMac()
    mac.group.rotation.y = -0.22
    this.scene.add(mac.group)
    this.mac = mac
    this.registerClickable(mac.body, { onClick: () => this.actions.openApp(null) })

    // Clicking a baked icon on the little screen opens that app directly
    this.registerClickable(mac.screen, {
      onClick: (hit) => {
        if (!this.screenOn) { this.toggleScreen(); return }
        const uv = hit?.uv
        const region = uv && mac.screenRegions.find(
          (r) => uv.x >= r.u0 && uv.x <= r.u1 && uv.y >= r.v0 && uv.y <= r.v1
        )
        this.actions.openApp(region ? region.app : null)
      }
    })

    // Brightness dial: CRT on/off. Floppy slot: eject/insert the disk.
    this.screenOn = true
    this.registerClickable(mac.dial, { onClick: () => this.toggleScreen() })
    this.registerClickable(mac.dialMark, { onClick: () => this.toggleScreen() })

    this.floppyOut = false
    this.floppyAnim = null
    const toggleFloppy = () => {
      this.floppyOut = !this.floppyOut
      this.floppyAnim = { target: this.floppyOut ? 1.75 : 1.1 } // local z
      this.actions.sfx?.('pop')
    }
    this.registerClickable(mac.slot, { onClick: toggleFloppy })
    this.registerClickable(mac.slotLip, { onClick: toggleFloppy })
    mac.floppy.children.forEach((m) => this.registerClickable(m, { onClick: toggleFloppy }))
    this.animators.push((t, dt) => {
      if (!this.floppyAnim) return
      const z = mac.floppy.position.z
      const nz = z + (this.floppyAnim.target - z) * Math.min(1, dt * 6)
      mac.floppy.position.z = nz
      if (Math.abs(nz - this.floppyAnim.target) < 0.005) this.floppyAnim = null
    })

    // Keyboard + mouse + cables
    const keyboard = buildKeyboard()
    keyboard.group.position.set(0.4, 0, 4.1)
    keyboard.group.rotation.y = -0.1
    this.scene.add(keyboard.group)

    const mouse = buildMouse()
    mouse.group.position.set(3.4, 0, 4.5)
    mouse.group.rotation.y = 0.3
    this.scene.add(mouse.group)

    this.scene.add(buildCable(new THREE.Vector3(-1.6, 0.4, 4.1), new THREE.Vector3(-1.4, 0.6, 1.4)))
    this.scene.add(buildCable(new THREE.Vector3(3.4, 0.2, 3.9), new THREE.Vector3(2.4, 0.4, 4.15), 0xb9b3a4))

    // Props — each clickable for a playful bounce
    const addProp = (obj, x, z, yaw = 0) => {
      obj.position.set(x, 0, z)
      obj.rotation.y = yaw
      this.scene.add(obj)
      obj.traverse((o) => {
        if (o.isMesh) this.registerClickable(o, { onClick: () => this.bounce(obj), root: obj })
      })
      return obj
    }
    // Mug bounces AND opens the X post
    const mug = buildMug(this.animators)
    mug.position.set(-3.6, 0, 2.4)
    mug.rotation.y = 0.4
    mug.userData.hoverScale = 1.07
    this.scene.add(mug)
    mug.traverse((o) => {
      if (o.isMesh) this.registerClickable(o, {
        onClick: () => {
          this.bounce(mug)
          window.open('https://x.com/MarkockiAdam/status/2064075460561055904', '_blank', 'noopener')
        },
        root: mug
      })
    })

    // The Maluch bounces AND takes you somewhere
    const maluch = buildMaluch(this.animators)
    maluch.group.position.set(-4.1, 0, -0.9)
    maluch.group.rotation.y = -0.6
    maluch.group.userData.hoverScale = 1.07
    this.scene.add(maluch.group)
    maluch.group.traverse((o) => {
      if (o.isMesh) this.registerClickable(o, {
        onClick: () => {
          maluch.ping.visible = false
          this.bounce(maluch.group)
          window.open('https://youtu.be/0sS3m1QKbM4', '_blank', 'noopener')
        },
        root: maluch.group
      })
    })

    // Swift Student Challenge winner certificate — opens the announcement
    // Pocket between globe (front-left) and Maluch (back), clear of the mug.
    const cert = buildSSCCertificate(this.animators)
    cert.group.position.set(-5.2, 0, 0.15)
    cert.group.rotation.set(-0.22, 0.35, 0.02)
    cert.group.userData.hoverScale = 1.06
    this.scene.add(cert.group)
    cert.group.traverse((o) => {
      if (o.isMesh) this.registerClickable(o, {
        onClick: () => {
          cert.ping.visible = false
          this.bounce(cert.group)
          window.open('https://x.com/MarkockiAdam/status/2037284222788935795', '_blank', 'noopener')
        },
        root: cert.group
      })
    })

    const vase = addProp(buildVase(this.animators), 3.9, -1.0, 0)
    addProp(buildKirby(), 5.9, 1.1, 0.1)
    addProp(buildCards(), 3.6, 3.7, 0.2)

    // Social links live on floppy disks in a caddy
    const caddy = buildFloppyCaddy(this.registerClickable.bind(this), {
      mail: `mailto:${profile.email}`,
      github: profile.github,
      linkedin: profile.linkedin,
      x: profile.x
    })
    caddy.position.set(3.4, 0, 2.0)
    caddy.rotation.y = 0.3
    this.scene.add(caddy)
    this.scene.add(buildBee(this.animators, vase.position))

    // Terra Cracovianum desk globe — click opens the think tank's website
    const globe = buildGlobe(this.animators)
    globe.group.position.set(-5.5, 0, 3.1)
    globe.group.userData.hoverScale = 1.07
    this.scene.add(globe.group)
    globe.group.traverse((o) => {
      if (o.isMesh) this.registerClickable(o, {
        onClick: () => {
          globe.ping.visible = false
          globe.state.speed = 6
          this.actions.sfx?.('pop')
          window.open('https://terracracovianum.org', '_blank', 'noopener')
        },
        root: globe.group
      })
    })

    // Labels
    const labels = buildLabels(this.registerClickable.bind(this), this.actions)
    this.scene.add(labels.group)
    this.animators.push(labels.animate)
  }

  registerClickable(mesh, handlers) {
    mesh.userData.handlers = handlers
    this.clickables.push(mesh)
  }

  toggleScreen() {
    this.screenOn = !this.screenOn
    this.mac.screen.material.color.set(this.screenOn ? 0xffffff : 0x0c0c10)
    this.mac.dial.rotation.z = this.screenOn ? 0 : Math.PI / 3
    this.actions.sfx?.('click')
  }

  bounce(obj) {
    if (obj.userData.bouncing) return
    obj.userData.bouncing = true
    const start = performance.now()
    const baseY = obj.position.y
    const step = () => {
      const t = (performance.now() - start) / 550
      if (t >= 1) {
        obj.position.y = baseY
        obj.scale.setScalar(1)
        obj.userData.bouncing = false
        return
      }
      const k = Math.sin(t * Math.PI)
      obj.position.y = baseY + k * 0.5
      obj.scale.setScalar(1 + k * 0.06)
      requestAnimationFrame(step)
    }
    step()
    this.actions.sfx?.('pop')
  }

  // ── Input ────────────────────────────────────────
  bindInput() {
    let down = null
    let moved = 0

    this.canvas.addEventListener('pointermove', (e) => {
      this.pointer.set((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1)
      if (down && this.mode === 'overview') {
        this.orbitTarget.x = THREE.MathUtils.clamp(this.orbitTarget.x - (e.clientX - down.x) * 0.002, -0.35, 0.35)
        this.orbitTarget.y = THREE.MathUtils.clamp(this.orbitTarget.y - (e.clientY - down.y) * 0.001, -0.12, 0.18)
        moved += Math.abs(e.clientX - down.x) + Math.abs(e.clientY - down.y)
        down.x = e.clientX
        down.y = e.clientY
      }
      if (this.mode === 'overview') this.updateHover(e)
    })

    this.canvas.addEventListener('pointerdown', (e) => {
      down = { x: e.clientX, y: e.clientY }
      moved = 0
    })

    this.canvas.addEventListener('pointerup', (e) => {
      down = null
      if (moved > 10 || this.mode !== 'overview') return
      const hit = this.raycast(e)
      hit?.object.userData.handlers?.onClick?.(hit)
    })

    this.canvas.addEventListener('pointercancel', () => { down = null })
  }

  raycast(e) {
    const ndc = new THREE.Vector2(
      (e.clientX / innerWidth) * 2 - 1,
      -(e.clientY / innerHeight) * 2 + 1
    )
    this.raycaster.setFromCamera(ndc, this.camera)
    const hits = this.raycaster.intersectObjects(this.clickables, false)
    return hits.length ? hits[0] : null
  }

  updateHover(e) {
    const hit = this.raycast(e)?.object ?? null
    this.canvas.style.cursor = hit ? 'pointer' : 'grab'
    const target = hit?.userData.handlers?.root || hit
    if (this.hovered && this.hovered !== target) {
      this.hovered.userData.hoverT = 0
      if (!this.hovered.userData.bouncing) this.hovered.scale.setScalar(1)
    }
    this.hovered = target && target.userData.hoverScale !== undefined ? target : null
  }

  // ── Camera poses ─────────────────────────────────
  overviewPose(out) {
    const { theta, phi } = this.overviewPolar
    const th = theta + this.orbit.x + this.parallax.x * 0.06
    const ph = phi + this.orbit.y + this.parallax.y * 0.03
    const d = this.overviewDist * (this.aspectScale ?? 1)
    out.pos.set(
      this.overviewTarget.x + d * Math.sin(ph) * Math.sin(th),
      this.overviewTarget.y + d * Math.cos(ph),
      this.overviewTarget.z + d * Math.sin(ph) * Math.cos(th)
    )
    out.look.copy(this.overviewTarget)
    return out
  }

  zoomPose(out) {
    const screen = this.mac.screen
    const center = new THREE.Vector3()
    screen.getWorldPosition(center)
    const normal = new THREE.Vector3(0, 0, 1)
      .applyQuaternion(this.mac.group.quaternion)

    const fov = THREE.MathUtils.degToRad(this.camera.fov)
    const halfH = Math.tan(fov / 2)
    const halfW = halfH * this.camera.aspect
    const narrow = this.camera.aspect < 1
    const dH = (1.71 / 2) / (halfH * 0.66)
    const dW = (2.56 / 2) / (halfW * (narrow ? 0.95 : 0.86))
    const d = Math.max(dH, dW)

    out.pos.copy(center).addScaledVector(normal, d)
    out.look.copy(center)
    return out
  }

  // Project the CRT display quad to CSS pixel rect
  screenRect() {
    this.camera.updateMatrixWorld(true)
    const screen = this.mac.screen
    screen.updateWorldMatrix(true, false)
    const w = 2.56 / 2
    const h = 1.71 / 2
    const corners = [
      new THREE.Vector3(-w, h, 0),
      new THREE.Vector3(w, -h, 0)
    ].map((v) => {
      screen.localToWorld(v)
      v.project(this.camera)
      return {
        x: (v.x * 0.5 + 0.5) * innerWidth,
        y: (-v.y * 0.5 + 0.5) * innerHeight
      }
    })
    return {
      left: corners[0].x,
      top: corners[0].y,
      width: corners[1].x - corners[0].x,
      height: corners[1].y - corners[0].y
    }
  }

  // ── Zoom transitions ─────────────────────────────
  startTween(toPose, mode, done) {
    const from = { pos: this.camera.position.clone(), look: this.lookAt?.clone() || this.overviewTarget.clone() }
    this.tween = {
      from,
      to: toPose,
      start: performance.now(),
      dur: 1350,
      done
    }
    this.mode = mode
  }

  zoomIn(done) {
    if (this.mode === 'zoomed' || this.mode === 'zooming') { done?.(); return }
    if (!this.screenOn) this.toggleScreen()
    const pose = this.zoomPose({ pos: new THREE.Vector3(), look: new THREE.Vector3() })
    this.startTween(pose, 'zooming', () => {
      this.mode = 'zoomed'
      done?.()
    })
  }

  zoomOut(done) {
    if (this.mode === 'overview' || this.mode === 'unzooming') { done?.(); return }
    const pose = this.overviewPose({ pos: new THREE.Vector3(), look: new THREE.Vector3() })
    this.startTween(pose, 'unzooming', () => {
      this.mode = 'overview'
      done?.()
    })
  }

  resize() {
    this.camera.aspect = innerWidth / innerHeight
    // Pull back on tall/narrow screens so the desk always fits
    this.aspectScale = Math.max(1, 1.45 / this.camera.aspect)
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(innerWidth, innerHeight)
    if (this.mode === 'zoomed') {
      const pose = this.zoomPose({ pos: new THREE.Vector3(), look: new THREE.Vector3() })
      this.camera.position.copy(pose.pos)
      this.camera.lookAt(pose.look)
      this.lookAt = pose.look
      this.actions.onZoomRectChanged?.()
    }
  }

  tick() {
    const dt = Math.min(this.clock.getDelta(), 0.05)
    const t = this.clock.elapsedTime

    this.parallax.x += (this.pointer.x - this.parallax.x) * Math.min(1, dt * 2.5)
    this.parallax.y += (this.pointer.y - this.parallax.y) * Math.min(1, dt * 2.5)
    this.orbit.x += (this.orbitTarget.x - this.orbit.x) * Math.min(1, dt * 5)
    this.orbit.y += (this.orbitTarget.y - this.orbit.y) * Math.min(1, dt * 5)

    for (const a of this.animators) a(t, dt)

    // Hover ease
    if (this.hovered && !this.hovered.userData.bouncing) {
      const s = this.hovered.scale.x + (this.hovered.userData.hoverScale - this.hovered.scale.x) * Math.min(1, dt * 10)
      this.hovered.scale.setScalar(s)
    }

    const pose = { pos: new THREE.Vector3(), look: new THREE.Vector3() }

    if (this.tween) {
      const tw = this.tween
      const tt = (performance.now() - tw.start) / tw.dur
      const k = easeInOutCubic(Math.min(1, tt))
      pose.pos.lerpVectors(tw.from.pos, tw.to.pos, k)
      pose.look.lerpVectors(tw.from.look, tw.to.look, k)
      this.camera.position.copy(pose.pos)
      this.camera.lookAt(pose.look)
      this.lookAt = pose.look.clone()
      if (tt >= 1) {
        this.tween = null
        tw.done?.()
      }
    } else if (this.mode === 'overview') {
      this.overviewPose(pose)
      this.camera.position.lerp(pose.pos, Math.min(1, dt * 4))
      const look = this.lookAt || pose.look.clone()
      look.lerp(pose.look, Math.min(1, dt * 4))
      this.camera.lookAt(look)
      this.lookAt = look
    }

    this.renderer.render(this.scene, this.camera)

    if (!this.firstFrame) {
      this.firstFrame = true
      this.actions.onFirstFrame?.()
    }
  }
}
