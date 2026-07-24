// 1-bit Snake, Macintosh style. Arrows / WASD / swipe.
export function snakeApp({ sfx }) {
  const el = document.createElement('div')
  el.className = 'app-snake'

  const CELL = 12
  const N = 17
  const SIZE = CELL * N

  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  canvas.style.width = `${SIZE}px`
  canvas.style.height = `${SIZE}px`
  const hud = document.createElement('div')
  hud.className = 'hud'
  el.append(canvas, hud)

  const ctx = canvas.getContext('2d')
  let snake, dir, nextDir, food, score, dead, timer
  let high = +(localStorage.getItem('am-snake-high') || 0)

  const rndFood = () => {
    while (true) {
      const f = { x: (Math.random() * N) | 0, y: (Math.random() * N) | 0 }
      if (!snake.some((s) => s.x === f.x && s.y === f.y)) return f
    }
  }

  const reset = () => {
    snake = [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }]
    dir = { x: 1, y: 0 }
    nextDir = dir
    score = 0
    dead = false
    food = rndFood()
  }

  const draw = () => {
    ctx.fillStyle = '#e9e9e6'
    ctx.fillRect(0, 0, SIZE, SIZE)
    // dither border
    ctx.fillStyle = '#111'
    for (let i = 0; i < N; i++) {
      if (i % 2 === 0) {
        ctx.fillRect(i * CELL, 0, 2, 2)
        ctx.fillRect(i * CELL, SIZE - 2, 2, 2)
      }
    }
    // food
    ctx.fillStyle = '#111'
    ctx.beginPath()
    ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2)
    ctx.fill()
    // snake
    snake.forEach((s, i) => {
      ctx.fillStyle = '#111'
      ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2)
      if (i === 0) {
        ctx.fillStyle = '#e9e9e6'
        ctx.fillRect(s.x * CELL + 4, s.y * CELL + 4, 2, 2)
        ctx.fillRect(s.x * CELL + 7, s.y * CELL + 4, 2, 2)
      }
    })
    if (dead) {
      ctx.fillStyle = 'rgba(233,233,230,0.82)'
      ctx.fillRect(0, SIZE / 2 - 34, SIZE, 68)
      ctx.fillStyle = '#111'
      ctx.fillRect(0, SIZE / 2 - 34, SIZE, 2)
      ctx.fillRect(0, SIZE / 2 + 34, SIZE, 2)
      ctx.font = '600 16px "Pixelify Sans", monospace'
      ctx.textAlign = 'center'
      ctx.fillText('GAME OVER', SIZE / 2, SIZE / 2 - 8)
      ctx.font = '600 10px "Pixelify Sans", monospace'
      ctx.fillText('tap or press space to retry', SIZE / 2, SIZE / 2 + 14)
    }
    hud.innerHTML = `<span>SCORE ${score}</span><span>HIGH ${high}</span>`
  }

  const step = () => {
    if (dead) return
    dir = nextDir
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y }
    if (
      head.x < 0 || head.y < 0 || head.x >= N || head.y >= N ||
      snake.some((s) => s.x === head.x && s.y === head.y)
    ) {
      dead = true
      high = Math.max(high, score)
      localStorage.setItem('am-snake-high', high)
      sfx?.('over')
      draw()
      return
    }
    snake.unshift(head)
    if (head.x === food.x && head.y === food.y) {
      score += 10
      food = rndFood()
      sfx?.('eat')
    } else {
      snake.pop()
    }
    draw()
  }

  const setDir = (x, y) => {
    if (dead) return
    if (x === -dir.x && y === -dir.y) return
    nextDir = { x, y }
  }

  const onKey = (e) => {
    const k = e.key.toLowerCase()
    const map = {
      arrowup: [0, -1], w: [0, -1],
      arrowdown: [0, 1], s: [0, 1],
      arrowleft: [-1, 0], a: [-1, 0],
      arrowright: [1, 0], d: [1, 0]
    }
    if (map[k]) {
      e.preventDefault()
      setDir(...map[k])
    } else if (k === ' ' && dead) {
      e.preventDefault()
      reset()
    }
  }
  window.addEventListener('keydown', onKey)

  // Swipe + tap
  let touch = null
  canvas.addEventListener('pointerdown', (e) => { touch = { x: e.clientX, y: e.clientY } })
  canvas.addEventListener('pointerup', (e) => {
    if (!touch) return
    const dx = e.clientX - touch.x
    const dy = e.clientY - touch.y
    touch = null
    if (dead && Math.hypot(dx, dy) < 12) { reset(); return }
    if (Math.hypot(dx, dy) < 12) return
    if (Math.abs(dx) > Math.abs(dy)) setDir(Math.sign(dx), 0)
    else setDir(0, Math.sign(dy))
  })

  reset()
  draw()
  timer = setInterval(step, 130)

  return {
    el,
    dispose: () => {
      clearInterval(timer)
      window.removeEventListener('keydown', onKey)
    }
  }
}
