import { Scene } from './scene/Scene.js'
import { Desktop } from './os/Desktop.js'

// ── Tiny WebAudio synth (no audio files) ─────────
let audioCtx = null
// Sound defaults ON; the top-right button mutes it (persisted)
let soundOn = localStorage.getItem('am-sound') !== 'off'
if (soundOn) document.body.classList.add('sound-on')

// Optional licensed ambience file: drop audio at src/assets/ambience.{mp3,ogg,m4a}
// and it replaces the synthesized soundscape automatically.
const ambienceFiles = import.meta.glob('./assets/ambience.{mp3,ogg,m4a}', {
  eager: true,
  query: '?url',
  import: 'default'
})
const AMBIENCE_URL = Object.values(ambienceFiles)[0] || null

function sfx(kind) {
  if (!soundOn) return
  audioCtx ??= new (window.AudioContext || window.webkitAudioContext)()
  const t0 = audioCtx.currentTime
  const beep = (freq, start, dur, type = 'square', vol = 0.04) => {
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = type
    osc.frequency.value = freq
    gain.gain.setValueAtTime(vol, t0 + start)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + start + dur)
    osc.connect(gain).connect(audioCtx.destination)
    osc.start(t0 + start)
    osc.stop(t0 + start + dur)
  }
  if (kind === 'click') beep(1400, 0, 0.05)
  else if (kind === 'pop') { beep(520, 0, 0.07, 'sine', 0.06); beep(760, 0.05, 0.08, 'sine', 0.05) }
  else if (kind === 'boot') { beep(392, 0, 0.4, 'sine', 0.07); beep(523, 0.05, 0.5, 'sine', 0.06); beep(659, 0.1, 0.6, 'sine', 0.05) }
  else if (kind === 'eat') beep(880, 0, 0.06)
  else if (kind === 'over') { beep(300, 0, 0.15); beep(220, 0.14, 0.25) }
}

// ── Ambient soundscape: soft rain + slow original chord pads ─────
// Fully synthesized (seamless infinite loop). If a licensed audio file
// exists at src/assets/ambience.*, it is looped instead.
let ambience = null

function startAmbience() {
  if (!soundOn || ambience) return
  audioCtx ??= new (window.AudioContext || window.webkitAudioContext)()
  if (audioCtx.state === 'suspended') audioCtx.resume()

  const master = audioCtx.createGain()
  master.gain.setValueAtTime(0.0001, audioCtx.currentTime)
  master.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 4)
  master.connect(audioCtx.destination)
  ambience = { master, nodes: [], timer: null }

  if (AMBIENCE_URL) {
    fetch(AMBIENCE_URL)
      .then((r) => r.arrayBuffer())
      .then((buf) => audioCtx.decodeAudioData(buf))
      .then((audio) => {
        if (!ambience) return
        const src = audioCtx.createBufferSource()
        src.buffer = audio
        src.loop = true
        const vol = audioCtx.createGain()
        vol.gain.value = 0.18 // background level: present but never in the way
        src.connect(vol).connect(ambience.master)
        src.start()
        ambience.nodes.push(src)
      })
    return
  }

  // Rain: two layers of looped filtered noise
  const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 2, audioCtx.sampleRate)
  const data = noiseBuffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1

  const rainLayer = (freq, gainVal) => {
    const src = audioCtx.createBufferSource()
    src.buffer = noiseBuffer
    src.loop = true
    const filter = audioCtx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = freq
    const vol = audioCtx.createGain()
    vol.gain.value = gainVal
    src.connect(filter).connect(vol).connect(ambience.master)
    src.start()
    ambience.nodes.push(src)
  }
  rainLayer(3200, 0.028) // patter
  rainLayer(420, 0.05)   // distant rumble

  // Pad: soft detuned sines cycling through gentle original chords
  const chords = [
    [130.81, 196.0, 329.63, 293.66], // Cadd9-ish
    [110.0, 164.81, 261.63, 246.94], // Am add9-ish
    [174.61, 220.0, 261.63, 329.63], // Fmaj7-ish
    [98.0, 196.0, 246.94, 293.66]    // G add4-ish
  ]
  const padGain = audioCtx.createGain()
  padGain.gain.value = 0.0
  padGain.connect(ambience.master)
  const oscs = chords[0].map((f) => {
    const osc = audioCtx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = f
    const g = audioCtx.createGain()
    g.gain.value = 0.011
    osc.connect(g).connect(padGain)
    osc.start()
    ambience.nodes.push(osc)
    return osc
  })
  // Slow swell in
  padGain.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 8)

  let chordIndex = 0
  ambience.timer = setInterval(() => {
    if (!ambience) return
    chordIndex = (chordIndex + 1) % chords.length
    const t = audioCtx.currentTime
    padGain.gain.cancelScheduledValues(t)
    padGain.gain.setValueAtTime(padGain.gain.value, t)
    padGain.gain.linearRampToValueAtTime(0.15, t + 4)
    oscs.forEach((osc, i) => {
      osc.frequency.linearRampToValueAtTime(chords[chordIndex][i], t + 4.2)
    })
    padGain.gain.linearRampToValueAtTime(1, t + 9)
  }, 22000)
}

function stopAmbience() {
  if (!ambience) return
  const { master, nodes, timer } = ambience
  ambience = null
  if (timer) clearInterval(timer)
  const t = audioCtx.currentTime
  master.gain.cancelScheduledValues(t)
  master.gain.setValueAtTime(master.gain.value, t)
  master.gain.linearRampToValueAtTime(0.0001, t + 0.8)
  setTimeout(() => {
    nodes.forEach((n) => { try { n.stop() } catch {} })
    master.disconnect()
  }, 900)
}

// Browsers require a user gesture before audio — start on the first one
const kickAmbience = () => { if (soundOn) startAmbience() }
window.addEventListener('pointerdown', kickAmbience, { once: true })
window.addEventListener('keydown', kickAmbience, { once: true })

// ── Wiring ───────────────────────────────────────
const canvas = document.getElementById('webgl')
let scene = null
let desktop = null
let zoomed = false

function syncOsRect() {
  if (!zoomed) return
  desktop.setRect(scene.screenRect())
}

function zoomIn(appId) {
  if (zoomed) {
    if (appId) desktop.open(appId)
    return
  }
  zoomed = true
  document.body.classList.add('zoomed')
  scene.zoomIn(() => {
    syncOsRect()
    document.body.classList.add('os-active')
    desktop.boot(() => {
      if (appId) desktop.open(appId)
    })
  })
}

function zoomOut() {
  if (!zoomed) return
  zoomed = false
  document.body.classList.remove('zoomed', 'os-active')
  desktop.closeAll()
  scene.zoomOut()
}

const actions = {
  openApp: (appId) => zoomIn(appId),
  sfx,
  onZoomRectChanged: () => syncOsRect(),
  onFirstFrame: () => {
    // Reveal once the first frame has rendered
    requestAnimationFrame(() => {
      document.getElementById('loader').classList.add('hidden')
      document.body.classList.add('ready')
    })
  }
}

scene = new Scene(canvas, actions)
desktop = new Desktop({
  sfx,
  onShutDown: () => zoomOut()
})

// Debug/testing hook
window.__AM = { scene, desktop }

// Buttons
document.getElementById('zoom-btn').addEventListener('click', () => {
  sfx('click')
  zoomed ? zoomOut() : zoomIn(null)
})

document.getElementById('sound-btn').addEventListener('click', () => {
  soundOn = !soundOn
  localStorage.setItem('am-sound', soundOn ? 'on' : 'off')
  document.body.classList.toggle('sound-on', soundOn)
  if (soundOn) startAmbience()
  else stopAmbience()
  sfx('pop')
})

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') zoomOut()
})

// Hide hint after first zoom
const hint = document.getElementById('hint')
const hideHint = () => { hint.style.display = 'none' }
document.getElementById('zoom-btn').addEventListener('click', hideHint, { once: true })
canvas.addEventListener('pointerup', () => { if (zoomed) hideHint() })
