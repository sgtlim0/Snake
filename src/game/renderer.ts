import type { GameState, Position } from './types.ts'
import { GRID_SIZE, COLS, ROWS, CANVAS_WIDTH, CANVAS_HEIGHT } from './types.ts'

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function drawGrid(ctx: CanvasRenderingContext2D) {
  // Dark background
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // Dark checkerboard pattern
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if ((x + y) % 2 === 0) {
        ctx.fillStyle = '#16213e'
        ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE)
      }
    }
  }

  // Subtle grid lines
  ctx.strokeStyle = 'rgba(0, 210, 255, 0.06)'
  ctx.lineWidth = 0.5
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath()
    ctx.moveTo(x * GRID_SIZE, 0)
    ctx.lineTo(x * GRID_SIZE, CANVAS_HEIGHT)
    ctx.stroke()
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath()
    ctx.moveTo(0, y * GRID_SIZE)
    ctx.lineTo(CANVAS_WIDTH, y * GRID_SIZE)
    ctx.stroke()
  }

  // Border with glow
  ctx.shadowColor = '#0f3460'
  ctx.shadowBlur = 8
  ctx.strokeStyle = '#0f3460'
  ctx.lineWidth = 3
  ctx.strokeRect(1.5, 1.5, CANVAS_WIDTH - 3, CANVAS_HEIGHT - 3)
  ctx.shadowBlur = 0
}

function drawSnake(ctx: CanvasRenderingContext2D, snake: readonly Position[], frame: number, eatScale: number) {
  const len = snake.length

  for (let i = snake.length - 1; i >= 0; i--) {
    const seg = snake[i]
    const px = seg.x * GRID_SIZE
    const py = seg.y * GRID_SIZE
    const t = i / Math.max(len - 1, 1)

    // Cyan/blue gradient: head = bright cyan, tail = deeper blue
    const r = Math.round(0 + t * 20)
    const g = Math.round(242 - t * 100)
    const b = Math.round(254 - t * 50)

    let padding = i === 0 ? 1 : 2
    let size = GRID_SIZE - padding * 2

    // Head pulse on eat
    if (i === 0 && eatScale > 0) {
      const scale = 1 + eatScale * 0.15
      const extra = (GRID_SIZE * scale - GRID_SIZE) / 2
      padding -= extra
      size += extra * 2
    }

    // Body glow for head
    if (i === 0) {
      ctx.shadowColor = '#00f2fe'
      ctx.shadowBlur = 10
    } else if (i < 3) {
      ctx.shadowColor = '#4facfe'
      ctx.shadowBlur = 4
    }

    // Body
    ctx.fillStyle = `rgb(${r},${g},${b})`
    drawRoundedRect(ctx, px + padding, py + padding, size, size, 5)
    ctx.fill()

    // Border
    ctx.strokeStyle = i === 0 ? 'rgba(0,212,255,0.6)' : 'rgba(0,102,255,0.4)'
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.shadowBlur = 0

    // Highlight on top
    ctx.fillStyle = `rgba(255,255,255,${0.35 - t * 0.25})`
    drawRoundedRect(ctx, px + padding + 1, py + padding + 1, size - 2, size * 0.35, 4)
    ctx.fill()

    // Head details
    if (i === 0) {
      const dir = snake.length > 1
        ? { x: seg.x - snake[1].x, y: seg.y - snake[1].y }
        : { x: 1, y: 0 }

      const dx = Math.max(-1, Math.min(1, dir.x))
      const dy = Math.max(-1, Math.min(1, dir.y))

      const cx = px + GRID_SIZE / 2
      const cy = py + GRID_SIZE / 2

      const eyeOffsetX = dx === 0 ? 4 : dx > 0 ? 5 : -1
      const eyeOffsetY = dy === 0 ? 4 : dy > 0 ? 5 : -1
      const eyeSpreadX = dx === 0 ? 1 : 0
      const eyeSpreadY = dy === 0 ? 1 : 0

      // Left eye
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(cx + eyeOffsetX - eyeSpreadX * 4, cy + eyeOffsetY - eyeSpreadY * 4, 3.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(0,212,255,0.4)'
      ctx.lineWidth = 0.5
      ctx.stroke()

      // Right eye
      ctx.beginPath()
      ctx.arc(cx + eyeOffsetX + eyeSpreadX * 4, cy + eyeOffsetY + eyeSpreadY * 4, 3.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      // Pupils
      const pupilShift = Math.sin(frame * 0.05) * 0.5
      ctx.fillStyle = '#0a0a2e'
      ctx.beginPath()
      ctx.arc(cx + eyeOffsetX - eyeSpreadX * 4 + dx * 1.5 + pupilShift, cy + eyeOffsetY - eyeSpreadY * 4 + dy * 1.5, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx + eyeOffsetX + eyeSpreadX * 4 + dx * 1.5 + pupilShift, cy + eyeOffsetY + eyeSpreadY * 4 + dy * 1.5, 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function drawFood(ctx: CanvasRenderingContext2D, food: GameState['food'], frame: number) {
  const px = food.pos.x * GRID_SIZE
  const py = food.pos.y * GRID_SIZE
  const cx = px + GRID_SIZE / 2
  const cy = py + GRID_SIZE / 2
  const bob = Math.sin(frame * 0.08) * 1.5
  const pulse = 1 + Math.sin(frame * 0.1) * 0.06

  ctx.save()
  ctx.translate(cx, cy + bob)
  ctx.scale(pulse, pulse)

  if (food.kind === 'apple') {
    // Glowing red apple
    ctx.shadowColor = '#ff6b6b'
    ctx.shadowBlur = 8

    ctx.fillStyle = 'rgba(0,0,0,0.15)'
    ctx.beginPath()
    ctx.arc(1, 3, 7.5, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#ff6b6b'
    ctx.beginPath()
    ctx.arc(0, 1, 7.5, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#ff8a80'
    ctx.beginPath()
    ctx.arc(-2.5, -2, 3.5, 0, Math.PI * 2)
    ctx.fill()

    // Stem
    ctx.shadowBlur = 0
    ctx.strokeStyle = '#8d6e63'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, -6)
    ctx.quadraticCurveTo(2, -10, 4, -8)
    ctx.stroke()

    // Leaf
    ctx.fillStyle = '#66BB6A'
    ctx.beginPath()
    ctx.ellipse(3.5, -8, 3.5, 2, 0.4, 0, Math.PI * 2)
    ctx.fill()
  } else if (food.kind === 'golden') {
    const glow = 10 + Math.sin(frame * 0.15) * 4
    ctx.shadowColor = '#FFD700'
    ctx.shadowBlur = glow
    ctx.fillStyle = '#FFD700'
    drawStar(ctx, 0, 0, 5, 9, 4)
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.beginPath()
    ctx.arc(-1.5, -2.5, 3, 0, Math.PI * 2)
    ctx.fill()
  } else {
    ctx.fillStyle = '#42A5F5'
    ctx.shadowColor = '#42A5F5'
    ctx.shadowBlur = 8
    ctx.beginPath()
    ctx.moveTo(-3, -8)
    ctx.lineTo(3, -1)
    ctx.lineTo(0, -1)
    ctx.lineTo(3, 8)
    ctx.lineTo(-3, 1)
    ctx.lineTo(0, 1)
    ctx.closePath()
    ctx.fill()
    ctx.shadowBlur = 0
  }

  ctx.restore()
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerR: number, innerR: number) {
  ctx.beginPath()
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR
    const angle = (i * Math.PI) / spikes - Math.PI / 2
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: readonly GameState['particles'][number][]) {
  for (const p of particles) {
    ctx.globalAlpha = p.life / p.maxLife
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

function drawGridFlash(ctx: CanvasRenderingContext2D, pos: Position | null, alpha: number) {
  if (!pos) return
  const r = 3
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const nx = pos.x + dx
      const ny = pos.y + dy
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > r) continue
      const a = alpha * 0.3 * (1 - dist / r)
      ctx.fillStyle = `rgba(0,210,255,${a})`
      ctx.fillRect(nx * GRID_SIZE, ny * GRID_SIZE, GRID_SIZE, GRID_SIZE)
    }
  }
}

function drawHUD(ctx: CanvasRenderingContext2D, state: GameState) {
  // Score badge top-left with glow
  ctx.fillStyle = 'rgba(0,0,0,0.6)'
  drawRoundedRect(ctx, 6, 6, 80, 24, 6)
  ctx.fill()
  ctx.strokeStyle = 'rgba(0,210,255,0.3)'
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.font = 'bold 13px "Segoe UI", sans-serif'
  ctx.textAlign = 'left'
  ctx.fillStyle = '#00f2fe'
  ctx.fillText(`${state.score}`, 14, 23)

  // Length badge
  ctx.fillStyle = 'rgba(0,102,255,0.4)'
  drawRoundedRect(ctx, 6, 34, 52, 20, 5)
  ctx.fill()
  ctx.font = '11px "Segoe UI", sans-serif'
  ctx.fillStyle = '#90caf9'
  ctx.fillText(`x${state.snake.length}`, 14, 48)

  // Combo
  if (state.combo > 1) {
    ctx.textAlign = 'center'
    const comboAlpha = 0.7 + Math.sin(Date.now() * 0.008) * 0.3
    ctx.shadowColor = '#ff9800'
    ctx.shadowBlur = 6
    ctx.fillStyle = `rgba(255,152,0,${comboAlpha})`
    ctx.font = 'bold 14px "Segoe UI", sans-serif'
    ctx.fillText(`COMBO x${state.combo}`, CANVAS_WIDTH / 2, 22)
    ctx.shadowBlur = 0
  }

  // Best score badge top-right
  if (state.bestScore > 0) {
    ctx.fillStyle = 'rgba(255,193,7,0.3)'
    const w = 70
    drawRoundedRect(ctx, CANVAS_WIDTH - w - 6, 6, w, 24, 6)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,215,0,0.3)'
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.textAlign = 'right'
    ctx.font = 'bold 12px "Segoe UI", sans-serif'
    ctx.fillStyle = '#ffd700'
    ctx.fillText(`BEST ${state.bestScore}`, CANVAS_WIDTH - 12, 23)
  }
}

function drawPauseOverlay(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)'
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Pause icon
  ctx.fillStyle = '#00f2fe'
  ctx.shadowColor = '#00f2fe'
  ctx.shadowBlur = 15
  const barW = 14
  const barH = 40
  const gap = 10
  const cx = CANVAS_WIDTH / 2
  const cy = CANVAS_HEIGHT / 2 - 20
  drawRoundedRect(ctx, cx - gap - barW, cy - barH / 2, barW, barH, 4)
  ctx.fill()
  drawRoundedRect(ctx, cx + gap, cy - barH / 2, barW, barH, 4)
  ctx.fill()
  ctx.shadowBlur = 0

  // Text
  ctx.font = 'bold 18px "Segoe UI", sans-serif'
  ctx.fillStyle = '#e0e0e0'
  ctx.fillText('\uC77C\uC2DC\uC815\uC9C0', cx, cy + 45)

  ctx.font = '13px "Segoe UI", sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.fillText('\uC2A4\uD398\uC774\uC2A4\uBC14\uB85C \uACC4\uC18D', cx, cy + 68)
  ctx.textBaseline = 'alphabetic'
}

export function render(ctx: CanvasRenderingContext2D, state: GameState, frame: number) {
  ctx.save()

  // Screen shake
  if (state.shake > 0) {
    const intensity = state.shake * 4
    ctx.translate(
      (Math.random() - 0.5) * intensity,
      (Math.random() - 0.5) * intensity,
    )
  }

  drawGrid(ctx)
  drawGridFlash(ctx, state.gridFlash, 0.15)
  drawFood(ctx, state.food, frame)
  drawSnake(ctx, state.snake, frame, state.eatScale)
  drawParticles(ctx, state.particles as GameState['particles'][number][])
  drawHUD(ctx, state)

  if (state.phase === 'paused') {
    drawPauseOverlay(ctx)
  }

  ctx.restore()
}
