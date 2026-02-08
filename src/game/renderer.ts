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
  // Light background
  ctx.fillStyle = '#e8f5e9'
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // Checkerboard pattern
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if ((x + y) % 2 === 0) {
        ctx.fillStyle = '#c8e6c9'
        ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE)
      }
    }
  }

  // Border
  ctx.strokeStyle = '#4CAF50'
  ctx.lineWidth = 3
  ctx.strokeRect(1.5, 1.5, CANVAS_WIDTH - 3, CANVAS_HEIGHT - 3)
}

function drawSnake(ctx: CanvasRenderingContext2D, snake: readonly Position[], frame: number, eatScale: number) {
  const len = snake.length

  for (let i = snake.length - 1; i >= 0; i--) {
    const seg = snake[i]
    const px = seg.x * GRID_SIZE
    const py = seg.y * GRID_SIZE
    const t = i / Math.max(len - 1, 1)

    // Color gradient: head = bright green, tail = darker
    const r = Math.round(76 - t * 30)
    const g = Math.round(175 + (1 - t) * 30)
    const b = Math.round(80 - t * 30)

    let padding = i === 0 ? 1 : 2
    let size = GRID_SIZE - padding * 2

    // Head pulse on eat
    if (i === 0 && eatScale > 0) {
      const scale = 1 + eatScale * 0.15
      const extra = (GRID_SIZE * scale - GRID_SIZE) / 2
      padding -= extra
      size += extra * 2
    }

    // Body
    ctx.fillStyle = `rgb(${r},${g},${b})`
    drawRoundedRect(ctx, px + padding, py + padding, size, size, 5)
    ctx.fill()

    // Border
    ctx.strokeStyle = `rgba(0,0,0,0.15)`
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Highlight on top
    ctx.fillStyle = `rgba(255,255,255,${0.3 - t * 0.2})`
    drawRoundedRect(ctx, px + padding + 1, py + padding + 1, size - 2, size * 0.35, 4)
    ctx.fill()

    // Head details
    if (i === 0) {
      const dir = snake.length > 1
        ? { x: seg.x - snake[1].x, y: seg.y - snake[1].y }
        : { x: 1, y: 0 }

      // Clamp for wrap-around edge cases
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
      ctx.strokeStyle = 'rgba(0,0,0,0.2)'
      ctx.lineWidth = 0.5
      ctx.stroke()

      // Right eye
      ctx.beginPath()
      ctx.arc(cx + eyeOffsetX + eyeSpreadX * 4, cy + eyeOffsetY + eyeSpreadY * 4, 3.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      // Pupils
      const pupilShift = Math.sin(frame * 0.05) * 0.5
      ctx.fillStyle = '#1a1a1a'
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
    // Red apple with shadow
    ctx.fillStyle = 'rgba(0,0,0,0.1)'
    ctx.beginPath()
    ctx.arc(1, 3, 7.5, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#FF5252'
    ctx.beginPath()
    ctx.arc(0, 1, 7.5, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#FF8A80'
    ctx.beginPath()
    ctx.arc(-2.5, -2, 3.5, 0, Math.PI * 2)
    ctx.fill()

    // Stem
    ctx.strokeStyle = '#5D4037'
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
    const glow = 8 + Math.sin(frame * 0.15) * 3
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
    ctx.shadowBlur = 6
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
  ctx.fillStyle = `rgba(255,255,100,${alpha * 0.4})`
  const r = 3
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const nx = pos.x + dx
      const ny = pos.y + dy
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > r) continue
      const a = alpha * 0.3 * (1 - dist / r)
      ctx.fillStyle = `rgba(255,255,100,${a})`
      ctx.fillRect(nx * GRID_SIZE, ny * GRID_SIZE, GRID_SIZE, GRID_SIZE)
    }
  }
}

function drawHUD(ctx: CanvasRenderingContext2D, state: GameState) {
  // Score badge top-left
  ctx.fillStyle = 'rgba(0,0,0,0.5)'
  drawRoundedRect(ctx, 6, 6, 80, 24, 6)
  ctx.fill()
  ctx.font = 'bold 13px "Segoe UI", sans-serif'
  ctx.textAlign = 'left'
  ctx.fillStyle = '#fff'
  ctx.fillText(`${state.score}`, 14, 23)

  // Length badge
  ctx.fillStyle = 'rgba(76,175,80,0.6)'
  drawRoundedRect(ctx, 6, 34, 52, 20, 5)
  ctx.fill()
  ctx.font = '11px "Segoe UI", sans-serif'
  ctx.fillStyle = '#fff'
  ctx.fillText(`x${state.snake.length}`, 14, 48)

  // Combo
  if (state.combo > 1) {
    ctx.textAlign = 'center'
    const comboAlpha = 0.7 + Math.sin(Date.now() * 0.008) * 0.3
    ctx.fillStyle = `rgba(255,152,0,${comboAlpha})`
    ctx.font = 'bold 14px "Segoe UI", sans-serif'
    ctx.fillText(`COMBO x${state.combo}`, CANVAS_WIDTH / 2, 22)
  }

  // Best score badge top-right
  if (state.bestScore > 0) {
    ctx.fillStyle = 'rgba(255,193,7,0.6)'
    const w = 70
    drawRoundedRect(ctx, CANVAS_WIDTH - w - 6, 6, w, 24, 6)
    ctx.fill()
    ctx.textAlign = 'right'
    ctx.font = 'bold 12px "Segoe UI", sans-serif'
    ctx.fillStyle = '#fff'
    ctx.fillText(`BEST ${state.bestScore}`, CANVAS_WIDTH - 12, 23)
  }
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

  ctx.restore()
}
