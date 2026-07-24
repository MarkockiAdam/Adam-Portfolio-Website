import * as THREE from 'three'

function canvas(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

function toTexture(c, { srgb = true } = {}) {
  const t = new THREE.CanvasTexture(c)
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

// Background grid (shared by wall + floor)
export function gridTexture() {
  const c = canvas(256, 256)
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#161619'
  ctx.fillRect(0, 0, 256, 256)
  ctx.strokeStyle = '#232329'
  ctx.lineWidth = 2
  ctx.strokeRect(0, 0, 256, 256)
  const t = toTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

// Stylized hill wallpaper, shared by the CRT texture and the OS desktop
export function drawWallpaper(ctx, W, H) {
  // Sky
  const sky = ctx.createLinearGradient(0, 44, 0, H)
  sky.addColorStop(0, '#8ec9f2')
  sky.addColorStop(0.45, '#b9e0f7')
  sky.addColorStop(1, '#d8ecfa')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, W, H)

  // Cloud
  ctx.fillStyle = 'rgba(255,255,255,0.95)'
  const cloud = (x, y, s) => {
    ctx.beginPath()
    ctx.ellipse(x, y, 60 * s, 26 * s, 0, 0, Math.PI * 2)
    ctx.ellipse(x - 44 * s, y + 8 * s, 36 * s, 18 * s, 0, 0, Math.PI * 2)
    ctx.ellipse(x + 48 * s, y + 10 * s, 40 * s, 20 * s, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  cloud(560, 160, 1)

  // Hill
  const hill = ctx.createLinearGradient(0, 220, 0, H)
  hill.addColorStop(0, '#69b04b')
  hill.addColorStop(1, '#3c7a34')
  ctx.fillStyle = hill
  ctx.beginPath()
  ctx.moveTo(-40, H)
  ctx.bezierCurveTo(140, 300, 420, 210, 620, 300)
  ctx.bezierCurveTo(800, 380, 960, 420, 1064, 430)
  ctx.lineTo(1064, H)
  ctx.closePath()
  ctx.fill()

  // Meadow strip
  ctx.fillStyle = '#8ec45f'
  ctx.beginPath()
  ctx.moveTo(-40, H)
  ctx.bezierCurveTo(300, 560, 700, 540, 1064, 600)
  ctx.lineTo(1064, H)
  ctx.closePath()
  ctx.fill()

  // Road
  ctx.fillStyle = '#b8a6c9'
  ctx.beginPath()
  ctx.moveTo(430, 268)
  ctx.bezierCurveTo(400, 380, 520, 440, 460, 540)
  ctx.bezierCurveTo(430, 600, 470, 650, 460, H)
  ctx.lineTo(620, H)
  ctx.bezierCurveTo(600, 600, 560, 540, 560, 470)
  ctx.bezierCurveTo(560, 380, 470, 350, 452, 268)
  ctx.closePath()
  ctx.fill()

  // Tiny flowers
  ctx.fillStyle = '#f7e26b'
  for (let i = 0; i < 46; i++) {
    const x = (i * 137) % W
    const y = H * 0.877 + ((i * 53) % (H * 0.108))
    ctx.fillRect(x, y, 5, 5)
  }
}

// Wallpaper as a data URL for the HTML OS desktop background
let wallpaperCache = null
export function wallpaperURL() {
  if (wallpaperCache) return wallpaperCache
  const c = canvas(1024, 684)
  drawWallpaper(c.getContext('2d'), 1024, 684)
  wallpaperCache = c.toDataURL('image/png')
  return wallpaperCache
}

// Rounded-corner CRT screen: wallpaper + desktop chrome.
// Returns { texture, regions } — regions are clickable icon rects in UV space.
export function screenTexture() {
  const W = 1024
  const H = 684
  const c = canvas(W, H)
  const ctx = c.getContext('2d')

  ctx.beginPath()
  ctx.roundRect(0, 0, W, H, 56)
  ctx.clip()

  drawWallpaper(ctx, W, H)

  // Menu bar
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, 44)
  ctx.fillStyle = '#111111'
  ctx.fillRect(0, 44, W, 4)
  ctx.font = '600 24px "Pixelify Sans", monospace'
  ctx.fillStyle = '#111'
  ctx.fillText('File    Edit    Special', 96, 31)
  ctx.textAlign = 'right'
  ctx.font = '28px "VT323", monospace'
  ctx.fillText('12:12', W - 24, 31)
  ctx.textAlign = 'left'
  // Rainbow mini logo
  const stripes = ['#61bb46', '#fdb827', '#f5821f', '#e03a3e', '#963d97', '#009ddc']
  stripes.forEach((s, i) => {
    ctx.fillStyle = s
    ctx.fillRect(28, 8 + i * 5, 40, 5)
  })

  // Desktop icons (right column) — labels match the real OS
  const regions = []
  const icon = (y, label, app) => {
    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = '#111'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.roundRect(W - 122, y, 56, 46, 6)
    ctx.fill()
    ctx.stroke()
    ctx.font = '600 19px "Pixelify Sans", monospace'
    ctx.textAlign = 'center'
    const tw = ctx.measureText(label).width
    ctx.fillStyle = '#fff'
    ctx.fillRect(W - 94 - tw / 2 - 4, y + 56, tw + 8, 24)
    ctx.fillStyle = '#111'
    ctx.fillText(label, W - 94, y + 73)
    ctx.textAlign = 'left'
    // Clickable region in UV space (v measured from bottom)
    regions.push({
      app,
      u0: (W - 134) / W,
      u1: (W - 44) / W,
      v0: 1 - (y + 84) / H,
      v1: 1 - (y - 6) / H
    })
  }
  icon(78, 'my_projects', 'work')
  icon(196, 'snake.bin', 'snake')
  icon(314, 'resume.doc', 'resume')
  icon(432, 'chat.app', 'chat')
  icon(550, 'trash', 'trash')

  return { texture: toTexture(c), regions }
}

// Text label plane for the 3D scene (drawn after fonts load; call redraw)
export function makeLabel(draw, wUnits, pxPerUnit = 120) {
  const wPx = Math.round(wUnits * pxPerUnit)
  let hPx = 0
  const measure = canvas(8, 8).getContext('2d')
  const meta = draw(measure, true) || { h: 0.3 }
  hPx = Math.round(meta.h * pxPerUnit)

  const c = canvas(wPx, hPx)
  const render = () => {
    const ctx = c.getContext('2d')
    ctx.clearRect(0, 0, wPx, hPx)
    ctx.save()
    draw(ctx, false, wPx, hPx)
    ctx.restore()
    texture.needsUpdate = true
  }
  const texture = toTexture(c)
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(wUnits, meta.h), material)
  render()
  mesh.userData.redraw = render
  return mesh
}

export function textLabel(text, {
  size = 0.6,
  color = '#ececf1',
  font = '900 ITALIC',
  letterSpacing = 0,
  align = 'left',
  skew = -0.18
} = {}) {
  const fontFor = (px) => font === '900 ITALIC'
    ? `italic 900 ${px}px "Unbounded", sans-serif`
    : `${font} ${px}px "Unbounded", sans-serif`

  const px = 96
  const m = canvas(8, 8).getContext('2d')
  m.font = fontFor(px)
  let textW = m.measureText(text).width
  if (letterSpacing) textW += letterSpacing * px * (text.length - 1)
  const unitW = (textW / px) * size * 1.15 + size * 0.4

  return makeLabel((ctx, measureOnly, wPx, hPx) => {
    if (measureOnly) return { h: size * 1.5 }
    const fontPx = hPx * 0.62
    ctx.font = fontFor(fontPx)
    ctx.textBaseline = 'middle'
    ctx.textAlign = align
    if (letterSpacing) ctx.letterSpacing = `${letterSpacing * fontPx}px`
    ctx.transform(1, 0, skew, 1, 0, 0)
    ctx.shadowColor = 'rgba(0,0,0,0.55)'
    ctx.shadowBlur = 6
    ctx.shadowOffsetY = 3
    ctx.fillStyle = color
    const x = align === 'left' ? hPx * 0.25 : align === 'right' ? wPx - hPx * 0.25 : wPx / 2
    ctx.fillText(text, x, hPx * 0.54)
  }, unitW)
}

// Service glyph drawn centered in an s×s box at (x, y)
function drawGlyph(ctx, kind, x, y, s, color = '#26262a') {
  ctx.save()
  ctx.translate(x, y)
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = s * 0.055
  ctx.lineJoin = ctx.lineCap = 'round'
  if (kind === 'mail') {
    ctx.lineWidth = s * 0.07
    ctx.strokeRect(s * 0.14, s * 0.24, s * 0.72, s * 0.52)
    ctx.beginPath()
    ctx.moveTo(s * 0.14, s * 0.27)
    ctx.lineTo(s * 0.5, s * 0.56)
    ctx.lineTo(s * 0.86, s * 0.27)
    ctx.stroke()
  } else if (kind === 'github') {
    // Official GitHub octocat mark (16x16 viewBox path)
    const mark = new Path2D('M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z')
    const scale = (s * 0.86) / 16
    ctx.translate(s * 0.07, s * 0.07)
    ctx.scale(scale, scale)
    ctx.fill(mark)
  } else if (kind === 'x') {
    ctx.lineWidth = s * 0.12
    ctx.beginPath()
    ctx.moveTo(s * 0.22, s * 0.22)
    ctx.lineTo(s * 0.78, s * 0.78)
    ctx.moveTo(s * 0.78, s * 0.22)
    ctx.lineTo(s * 0.22, s * 0.78)
    ctx.stroke()
  } else {
    ctx.font = `900 ${s * 0.72}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('in', s * 0.5, s * 0.56)
  }
  ctx.restore()
}

// 3.5" floppy front: colored shell, metal shutter, big label with hero logo
export function floppyLabelTexture(kind, name, shellColor) {
  const S = 256
  const c = canvas(S, S)
  const ctx = c.getContext('2d')

  ctx.fillStyle = shellColor
  ctx.beginPath()
  ctx.roundRect(0, 0, S, S, 14)
  ctx.fill()

  // Shutter (top)
  ctx.fillStyle = '#b9b3a4'
  ctx.fillRect(S * 0.28, 6, S * 0.5, S * 0.16)
  ctx.fillStyle = shellColor
  ctx.fillRect(S * 0.34, 12, S * 0.16, S * 0.12)

  // Corner notch
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.fillRect(10, 10, 12, 12)

  // Big label sticker — the logo is the hero
  ctx.save()
  ctx.translate(S * 0.5, S * 0.62)
  ctx.rotate(-0.012)
  ctx.fillStyle = '#f7f5ef'
  ctx.beginPath()
  ctx.roundRect(-S * 0.42, -S * 0.36, S * 0.84, S * 0.7, 8)
  ctx.fill()
  ctx.strokeStyle = 'rgba(0,0,0,0.18)'
  ctx.lineWidth = 2
  ctx.stroke()

  const g = S * 0.42 // glyph box size
  if (kind === 'linkedin') {
    // Recognizable blue tile with white "in"
    ctx.fillStyle = '#0a66c2'
    ctx.beginPath()
    ctx.roundRect(-g / 2, -S * 0.31, g, g, 12)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.font = `900 ${g * 0.62}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('in', 0, -S * 0.31 + g * 0.56)
  } else {
    drawGlyph(ctx, kind, -g / 2, -S * 0.31, g, '#1c1c20')
  }

  ctx.fillStyle = '#26262a'
  ctx.font = `600 ${S * 0.13}px "Pixelify Sans", monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(name, 0, S * 0.28)
  ctx.restore()

  return toTexture(c)
}

// Sticky note
export function stickyTexture(text, color, doodle) {
  const c = canvas(256, 256)
  const ctx = c.getContext('2d')
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 256, 256)
  const shade = ctx.createLinearGradient(0, 0, 256, 256)
  shade.addColorStop(0, 'rgba(255,255,255,0.25)')
  shade.addColorStop(1, 'rgba(0,0,0,0.12)')
  ctx.fillStyle = shade
  ctx.fillRect(0, 0, 256, 256)

  ctx.strokeStyle = 'rgba(20,20,25,0.85)'
  ctx.fillStyle = 'rgba(20,20,25,0.85)'
  ctx.lineWidth = 7
  ctx.lineJoin = ctx.lineCap = 'round'
  // Doodle
  if (doodle === 'folder') {
    ctx.strokeRect(88, 52, 80, 52)
    ctx.beginPath()
    ctx.moveTo(88, 52)
    ctx.lineTo(112, 36)
    ctx.lineTo(140, 36)
    ctx.lineTo(148, 52)
    ctx.stroke()
  } else if (doodle === 'camera') {
    ctx.strokeRect(84, 48, 88, 60)
    ctx.beginPath()
    ctx.arc(128, 78, 18, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillRect(96, 38, 24, 12)
  } else {
    ctx.strokeRect(92, 44, 72, 48)
    ctx.beginPath()
    ctx.moveTo(104, 92)
    ctx.lineTo(104, 112)
    ctx.moveTo(152, 92)
    ctx.lineTo(152, 112)
    ctx.stroke()
  }

  ctx.font = '600 34px "Pixelify Sans", cursive'
  ctx.textAlign = 'center'
  const lines = text.split('\n')
  lines.forEach((line, i) => ctx.fillText(line, 128, 158 + i * 40))
  return toTexture(c)
}

// Swift Student Challenge winner certificate (code-style card)
const sscCertificateImages = import.meta.glob('../assets/ssc-certificate.png', {
  eager: true,
  query: '?url',
  import: 'default'
})

export function sscCertificateTexture() {
  const url = Object.values(sscCertificateImages)[0]
  const t = new THREE.TextureLoader().load(url)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

// Polaroid photo. Drop a photo at src/assets/wwdc.{jpg,png,webp} and it
// replaces the placeholder art automatically.
const polaroidPhotos = import.meta.glob('../assets/wwdc.{jpg,jpeg,png,webp}', {
  eager: true,
  query: '?url',
  import: 'default'
})

export function polaroidTexture() {
  const c = canvas(256, 300)
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#f4f2ec'
  ctx.fillRect(0, 0, 256, 300)
  // photo area
  const px = 20, py = 20, pw = 216, ph = 200
  const sky = ctx.createLinearGradient(0, py, 0, py + ph)
  sky.addColorStop(0, '#ffd9a0')
  sky.addColorStop(1, '#ff9d76')
  ctx.fillStyle = sky
  ctx.fillRect(px, py, pw, ph)
  ctx.fillStyle = '#e8734f'
  ctx.beginPath()
  ctx.arc(px + pw / 2, py + 92, 34, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#5b4a6b'
  ctx.beginPath()
  ctx.moveTo(px, py + ph)
  ctx.lineTo(px + 60, py + 120)
  ctx.lineTo(px + 120, py + ph)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(px + 90, py + ph)
  ctx.lineTo(px + 165, py + 100)
  ctx.lineTo(px + pw, py + ph)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#2a2a30'
  ctx.font = 'italic 600 26px "Pixelify Sans", cursive'
  ctx.textAlign = 'center'
  ctx.fillText('WWDC someday!', 128, 266)

  const texture = toTexture(c)

  // Swap in the real photo if one is bundled
  const photoURL = Object.values(polaroidPhotos)[0]
  if (photoURL) {
    const img = new Image()
    img.onload = () => {
      const scale = Math.max(pw / img.width, ph / img.height)
      const sw = pw / scale
      const sh = ph / scale
      ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, px, py, pw, ph)
      ctx.fillStyle = '#f4f2ec'
      ctx.fillRect(0, py + ph + 2, 256, 300 - ph - py - 2)
      ctx.fillStyle = '#2a2a30'
      ctx.font = 'italic 600 26px "Pixelify Sans", cursive'
      ctx.fillText('WWDC26!', 128, 266)
      texture.needsUpdate = true
    }
    img.src = photoURL
  }

  return texture
}

// Round sticker for the Mac's side
export function stickerTexture(kind) {
  const c = canvas(256, 256)
  const ctx = c.getContext('2d')
  ctx.beginPath()
  ctx.arc(128, 128, 120, 0, Math.PI * 2)
  ctx.clip()
  if (kind === 'ball') {
    ctx.fillStyle = '#ee4444'
    ctx.fillRect(0, 0, 256, 128)
    ctx.fillStyle = '#f4f2ec'
    ctx.fillRect(0, 128, 256, 128)
    ctx.fillStyle = '#26262a'
    ctx.fillRect(0, 116, 256, 24)
    ctx.beginPath()
    ctx.arc(128, 128, 40, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#f4f2ec'
    ctx.beginPath()
    ctx.arc(128, 128, 24, 0, Math.PI * 2)
    ctx.fill()
  } else if (kind === 'heart') {
    ctx.fillStyle = '#f7e6ee'
    ctx.fillRect(0, 0, 256, 256)
    ctx.fillStyle = '#e03a5e'
    const px = 16
    const rows = ['0110110', '1111111', '1111111', '0111110', '0011100', '0001000']
    rows.forEach((row, ry) => {
      ;[...row].forEach((v, rx) => {
        if (v === '1') ctx.fillRect(72 + rx * px, 80 + ry * px, px - 2, px - 2)
      })
    })
  } else {
    ctx.fillStyle = '#fdf3c9'
    ctx.fillRect(0, 0, 256, 256)
    ctx.fillStyle = '#2a2a30'
    ctx.font = '600 44px "Pixelify Sans", monospace'
    ctx.textAlign = 'center'
    ctx.fillText(':^)', 128, 118)
    ctx.font = '600 30px "Pixelify Sans", monospace'
    ctx.fillText('hello', 128, 168)
  }
  return toTexture(c)
}

// Rainbow apple decal for the porcelain mug
export function mugAppleTexture() {
  const c = canvas(256, 256)
  const ctx = c.getContext('2d')
  ctx.clearRect(0, 0, 256, 256)

  const applePath = () => {
    ctx.beginPath()
    ctx.moveTo(124, 78)
    ctx.bezierCurveTo(104, 58, 64, 63, 49, 93)
    ctx.bezierCurveTo(29, 133, 49, 193, 89, 213)
    ctx.bezierCurveTo(104, 220, 114, 216, 124, 213)
    ctx.bezierCurveTo(134, 216, 144, 220, 159, 213)
    ctx.bezierCurveTo(199, 193, 219, 133, 199, 93)
    ctx.bezierCurveTo(184, 63, 144, 58, 124, 78)
    ctx.closePath()
  }

  // Striped body
  ctx.save()
  applePath()
  ctx.clip()
  const stripes = ['#61bb46', '#fdb827', '#f5821f', '#e03a3e', '#963d97', '#009ddc']
  const top = 58
  const bandH = (220 - top) / 6
  stripes.forEach((s, i) => {
    ctx.fillStyle = s
    ctx.fillRect(30, top + i * bandH, 200, bandH + 1)
  })
  ctx.restore()

  // Bite on the right
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.arc(216, 130, 40, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalCompositeOperation = 'source-over'

  // Leaf
  ctx.fillStyle = '#61bb46'
  ctx.save()
  ctx.translate(140, 46)
  ctx.rotate(-0.6)
  ctx.beginPath()
  ctx.ellipse(0, 0, 26, 14, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  return toTexture(c)
}

// Nameplate strip on the Mac chin
export function nameplateTexture(text) {
  const c = canvas(512, 80)
  const ctx = c.getContext('2d')
  ctx.clearRect(0, 0, 512, 80)
  ctx.font = 'italic 42px "Pixelify Sans", sans-serif'
  ctx.fillStyle = 'rgba(70,64,52,0.9)'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 8, 44)
  return toTexture(c)
}

// Rainbow AM badge
export function badgeTexture() {
  const c = canvas(128, 160)
  const ctx = c.getContext('2d')
  const stripes = ['#61bb46', '#fdb827', '#f5821f', '#e03a3e', '#963d97', '#009ddc']
  ctx.beginPath()
  ctx.roundRect(0, 0, 128, 160, 24)
  ctx.clip()
  stripes.forEach((s, i) => {
    ctx.fillStyle = s
    ctx.fillRect(0, i * (160 / 6), 128, 160 / 6 + 1)
  })
  ctx.fillStyle = 'rgba(30,26,20,0.78)'
  ctx.font = '900 52px "Unbounded", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('AM', 64, 84)
  return toTexture(c)
}

// Tap-indicator sprites (AR-style ping)
export function pingDotTexture() {
  const c = canvas(128, 128)
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 60)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.9)')
  g.addColorStop(0.5, 'rgba(255,255,255,0.25)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  return toTexture(c, { srgb: false })
}

export function pingRingTexture() {
  const c = canvas(128, 128)
  const ctx = c.getContext('2d')
  ctx.strokeStyle = 'rgba(255,255,255,0.95)'
  ctx.lineWidth = 5
  ctx.shadowColor = 'rgba(255,255,255,0.8)'
  ctx.shadowBlur = 6
  ctx.beginPath()
  ctx.arc(64, 64, 52, 0, Math.PI * 2)
  ctx.stroke()
  return toTexture(c, { srgb: false })
}

// Stylized equirectangular earth for the desk globe
export function globeTexture() {
  const W = 512
  const H = 256
  const c = canvas(W, H)
  const ctx = c.getContext('2d')

  // Ocean
  const sea = ctx.createLinearGradient(0, 0, 0, H)
  sea.addColorStop(0, '#4586c9')
  sea.addColorStop(0.5, '#3a7abf')
  sea.addColorStop(1, '#4586c9')
  ctx.fillStyle = sea
  ctx.fillRect(0, 0, W, H)

  // Continents — soft rounded blobs
  ctx.fillStyle = '#6fbf6a'
  const blob = (pts) => {
    ctx.beginPath()
    ctx.moveTo(pts[0][0], pts[0][1])
    for (let i = 1; i < pts.length; i++) {
      const [x, y] = pts[i]
      const [px, py] = pts[i - 1]
      ctx.quadraticCurveTo(px, py, (px + x) / 2, (py + y) / 2)
    }
    ctx.closePath()
    ctx.fill()
  }
  // Americas
  blob([[96, 60], [120, 52], [132, 76], [122, 100], [138, 124], [128, 160], [110, 196], [100, 150], [88, 110], [80, 80]])
  // Europe + Africa
  blob([[250, 58], [278, 52], [292, 72], [280, 92], [296, 120], [288, 168], [268, 196], [252, 160], [246, 116], [240, 84]])
  // Asia + Oceania
  blob([[320, 50], [380, 46], [420, 64], [430, 92], [400, 110], [360, 104], [332, 88], [316, 68]])
  blob([[418, 150], [446, 146], [452, 168], [430, 176], [412, 166]])
  // Greenland-ish
  blob([[150, 34], [176, 30], [182, 48], [162, 56], [146, 46]])

  // Polar caps
  ctx.fillStyle = 'rgba(240, 246, 250, 0.9)'
  ctx.fillRect(0, 0, W, 14)
  ctx.fillRect(0, H - 16, W, 16)

  // Faint graticule
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)'
  ctx.lineWidth = 1
  for (let x = 0; x <= W; x += W / 12) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
  }
  for (let y = 0; y <= H; y += H / 6) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
  }

  return toTexture(c)
}

// Playing-card top texture
export function cardTexture() {
  const c = canvas(256, 356)
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#59d6e4'
  ctx.beginPath()
  ctx.roundRect(0, 0, 256, 356, 22)
  ctx.fill()
  const g = ctx.createLinearGradient(0, 0, 256, 356)
  g.addColorStop(0, 'rgba(255,255,255,0.35)')
  g.addColorStop(1, 'rgba(30,30,80,0.25)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.roundRect(0, 0, 256, 356, 22)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.roundRect(12, 12, 232, 332, 16)
  ctx.stroke()
  ctx.fillStyle = '#123a56'
  ctx.font = '600 30px "Pixelify Sans", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('memory', 128, 160)
  ctx.fillText('lane', 128, 196)
  ctx.font = '24px "Pixelify Sans", sans-serif'
  ctx.fillText('♦ ♣ ♥ ♠', 128, 250)
  return toTexture(c)
}
