import { workApp } from './apps/work.js'
import { resumeApp } from './apps/resume.js'
import { chatApp } from './apps/chat.js'
import { snakeApp } from './apps/snake.js'
import { wallpaperURL } from '../scene/textures.js'

const ICONS = {
  work: `<svg viewBox="0 0 34 34"><rect x="3" y="10" width="28" height="19" rx="2" fill="#fff" stroke="#111" stroke-width="2.5"/><path d="M3 12 L7 6 H15 L18 10" fill="#fff" stroke="#111" stroke-width="2.5" stroke-linejoin="round"/></svg>`,
  snake: `<svg viewBox="0 0 34 34"><rect x="4" y="4" width="26" height="26" rx="3" fill="#fff" stroke="#111" stroke-width="2.5"/><rect x="9" y="9" width="5" height="5" fill="#111"/><rect x="14" y="9" width="5" height="5" fill="#111"/><rect x="19" y="9" width="5" height="5" fill="#111"/><rect x="19" y="14" width="5" height="5" fill="#111"/><rect x="19" y="19" width="5" height="5" fill="#111"/><rect x="9" y="21" width="4" height="4" fill="#111" rx="2"/></svg>`,
  resume: `<svg viewBox="0 0 34 34"><path d="M8 3 H21 L27 9 V31 H8 Z" fill="#fff" stroke="#111" stroke-width="2.5" stroke-linejoin="round"/><path d="M21 3 V9 H27" fill="none" stroke="#111" stroke-width="2.5"/><line x1="12" y1="15" x2="23" y2="15" stroke="#111" stroke-width="2"/><line x1="12" y1="20" x2="23" y2="20" stroke="#111" stroke-width="2"/><line x1="12" y1="25" x2="19" y2="25" stroke="#111" stroke-width="2"/></svg>`,
  chat: `<svg viewBox="0 0 34 34"><rect x="3" y="7" width="28" height="20" rx="2" fill="#fff" stroke="#111" stroke-width="2.5"/><path d="M4 9 L17 19 L30 9" fill="none" stroke="#111" stroke-width="2.5" stroke-linejoin="round"/></svg>`,
  trash: `<svg viewBox="0 0 34 34"><path d="M8 10 H26 L24 30 H10 Z" fill="#fff" stroke="#111" stroke-width="2.5" stroke-linejoin="round"/><rect x="6" y="6" width="22" height="4" rx="1" fill="#fff" stroke="#111" stroke-width="2.5"/><rect x="13" y="3" width="8" height="3" fill="#fff" stroke="#111" stroke-width="2"/><line x1="13" y1="14" x2="14" y2="26" stroke="#111" stroke-width="2"/><line x1="17" y1="14" x2="17" y2="26" stroke="#111" stroke-width="2"/><line x1="21" y1="14" x2="20" y2="26" stroke="#111" stroke-width="2"/></svg>`
}

const APPS = {
  work: { title: 'my_projects', icon: 'work', w: 262, h: 252, x: 24, y: 20, build: workApp },
  snake: { title: 'snake.bin', icon: 'snake', w: 236, h: 288, x: 140, y: 14, build: snakeApp },
  resume: { title: 'resume.doc', icon: 'resume', w: 268, h: 232, x: 56, y: 44, build: resumeApp },
  chat: { title: 'chat.app', icon: 'chat', w: 232, h: 214, x: 92, y: 60, build: chatApp },
  trash: {
    title: 'trash',
    icon: 'trash',
    w: 190,
    h: 90,
    x: 150,
    y: 110,
    build: () => {
      const el = document.createElement('div')
      el.style.padding = '14px'
      el.style.textAlign = 'center'
      el.textContent = 'nothing here... yet ;)'
      return { el }
    }
  }
}

export class Desktop {
  constructor({ sfx, onShutDown }) {
    this.sfx = sfx
    this.onShutDown = onShutDown
    this.root = document.getElementById('os-root')
    this.scaleEl = document.getElementById('os-scale')
    this.inner = document.getElementById('os-inner')
    this.desktop = document.getElementById('os-desktop')
    this.windowsEl = document.getElementById('os-windows')
    this.bootEl = document.getElementById('os-boot')
    this.windows = new Map()
    this.z = 10
    this.scale = 1
    this.booted = false

    // Same hill wallpaper as the 3D screen, so front & side views match
    this.inner.style.backgroundImage = `url(${wallpaperURL()})`
    this.inner.style.backgroundSize = 'cover'
    this.inner.style.backgroundPosition = 'center'

    this.buildIcons()
    this.buildMenus()
    this.startClock()
  }

  buildIcons() {
    const order = ['work', 'snake', 'resume', 'chat', 'trash']
    order.forEach((id, i) => {
      const app = APPS[id]
      const icon = document.createElement('div')
      icon.className = 'os-icon'
      icon.style.right = '10px'
      icon.style.top = `${8 + i * 58}px`
      icon.innerHTML = `${ICONS[app.icon]}<span>${app.title}</span>`
      icon.addEventListener('click', () => this.open(id))
      this.desktop.appendChild(icon)
    })
  }

  buildMenus() {
    const menus = {
      file: [
        ['New Folder', null],
        ['Open...', null],
        ['sep'],
        ['Close Window', () => this.closeTop()]
      ],
      edit: [
        ['Undo', null],
        ['sep'],
        ['Cut', null],
        ['Copy', null],
        ['Paste', null]
      ],
      special: [
        ['Clean Up Desktop', () => this.sfx('click')],
        ['Empty Trash...', null],
        ['sep'],
        ['Shut Down', () => this.onShutDown()]
      ]
    }

    let openMenu = null
    const closeMenu = () => {
      openMenu?.el.remove()
      openMenu?.item.classList.remove('open')
      openMenu = null
    }

    document.querySelectorAll('.mb-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        e.stopPropagation()
        const id = item.dataset.menu
        if (openMenu?.id === id) { closeMenu(); return }
        closeMenu()
        const el = document.createElement('div')
        el.className = 'os-menu'
        el.style.left = `${item.offsetLeft}px`
        menus[id].forEach(([label, fn]) => {
          const row = document.createElement('div')
          if (label === 'sep') { row.className = 'sep'; el.appendChild(row); return }
          row.textContent = label
          if (!fn) row.className = 'dis'
          else row.addEventListener('click', () => { closeMenu(); this.sfx('click'); fn() })
          el.appendChild(row)
        })
        this.inner.appendChild(el)
        item.classList.add('open')
        openMenu = { id, el, item }
        this.sfx('click')
      })
    })
    this.inner.addEventListener('click', closeMenu)
  }

  startClock() {
    const el = document.getElementById('mb-clock')
    const tickClock = () => {
      const d = new Date()
      el.textContent = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
    }
    tickClock()
    setInterval(tickClock, 20000)
  }

  setRect({ left, top, width, height }) {
    this.root.style.left = `${left}px`
    this.root.style.top = `${top}px`
    this.root.style.width = `${width}px`
    this.root.style.height = `${height}px`
    this.scale = width / 512
    this.scaleEl.style.transform = `scale(${this.scale})`
  }

  boot(done) {
    if (this.booted) { done?.(); return }
    this.booted = true
    this.bootEl.classList.add('active')
    this.sfx('boot')
    setTimeout(() => this.bootEl.classList.add('welcome'), 900)
    setTimeout(() => {
      this.bootEl.classList.remove('active', 'welcome')
      done?.()
    }, 2100)
  }

  open(id) {
    if (!id) return
    this.sfx('click')
    const existing = this.windows.get(id)
    if (existing) {
      existing.el.style.zIndex = ++this.z
      return
    }
    const app = APPS[id]
    const win = document.createElement('div')
    win.className = 'os-window'
    win.style.left = `${app.x}px`
    win.style.top = `${app.y}px`
    win.style.width = `${app.w}px`
    win.style.height = `${app.h}px`
    win.style.zIndex = ++this.z

    const bar = document.createElement('div')
    bar.className = 'os-window__bar'
    bar.innerHTML = `<b>${app.title}</b>`
    const close = document.createElement('button')
    close.className = 'os-window__close'
    close.setAttribute('aria-label', 'Close')
    bar.prepend(close)

    const body = document.createElement('div')
    body.className = 'os-window__body'
    const built = app.build({ sfx: this.sfx })
    body.appendChild(built.el)

    win.append(bar, body)
    this.windowsEl.appendChild(win)
    this.windows.set(id, { el: win, dispose: built.dispose })

    close.addEventListener('click', (e) => {
      e.stopPropagation()
      this.close(id)
    })
    win.addEventListener('pointerdown', () => { win.style.zIndex = ++this.z })
    this.makeDraggable(win, bar)
  }

  close(id) {
    const w = this.windows.get(id)
    if (!w) return
    w.dispose?.()
    w.el.remove()
    this.windows.delete(id)
    this.sfx('click')
  }

  closeTop() {
    let top = null
    for (const [id, w] of this.windows) {
      if (!top || +w.el.style.zIndex > +this.windows.get(top).el.style.zIndex) top = id
    }
    if (top) this.close(top)
  }

  closeAll() {
    for (const id of [...this.windows.keys()]) this.close(id)
  }

  makeDraggable(win, bar) {
    let drag = null
    bar.addEventListener('pointerdown', (e) => {
      // The close box must receive its own click — don't capture from it
      if (e.target.closest('.os-window__close')) return
      drag = {
        x: e.clientX,
        y: e.clientY,
        left: parseFloat(win.style.left),
        top: parseFloat(win.style.top)
      }
      bar.setPointerCapture(e.pointerId)
    })
    bar.addEventListener('pointermove', (e) => {
      if (!drag) return
      const dx = (e.clientX - drag.x) / this.scale
      const dy = (e.clientY - drag.y) / this.scale
      win.style.left = `${Math.max(-40, Math.min(470, drag.left + dx))}px`
      win.style.top = `${Math.max(0, Math.min(300, drag.top + dy))}px`
    })
    const end = () => { drag = null }
    bar.addEventListener('pointerup', end)
    bar.addEventListener('pointercancel', end)
  }
}
