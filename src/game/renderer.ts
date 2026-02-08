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

function drawGrid(ctx: CanvasRenderingContext2D, frame: number) {
  // Background
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.04)'
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

  // Subtle border
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.lineWidth = 2
  ctx.strokeRect(1, 1, CANVAS_WIDTH - 2, CANVAS_HEIGHT - 2)

  void frame
}

function drawSnake(ctx: CanvasRenderingContext2D, snake: readonly Position[], frame: number) {
  const len = snake.length

  for (let i = snake.length - 1; i >= 0; i--) {
    const seg = snake[i]
    const px = seg.x * GRID_SIZE
    const py = seg.y * GRID_SIZE
    const t = i / Math.max(len - 1, 1)

    // Color gradient: head is bright green, tail fades to teal
    const r = Math.round(46 + (0 - 46) * t)
    const g = Math.round(204 + (150 - 204) * t)
    const b = Math.round(113 + (136 - 113) * t)

    const padding = i === 0 ? 1 : 2
    const size = GRID_SIZE - padding * 2

    ctx.fillStyle = `rgb(${r},${g},${b})`
    drawRoundedRect(ctx, px + padding, py + padding, size, size, 4)
    ctx.fill()

    // Highlight on top
    ctx.fillStyle = `rgba(255,255,255,${0.2 - t * 0.15})`
    drawRoundedRect(ctx, px + padding, py + padding, size, size * 0.4, 4)
    ctx.fill()

    // Head details
    if (i === 0) {
      const dir = snake.length > 1
        ? { x: seg.x - snake[1].x, y: seg.y - snake[1].y }
        : { x: 1, y: 0 }

      // Eyes
      const eyeOffsetX = dir.x === 0 ? 4 : dir.x > 0 ? 5 : -1
      const eyeOffsetY = dir.y === 0 ? 4 : dir.y > 0 ? 5 : -1
      const eyeSpreadX = dir.x === 0 ? 1 : 0
      const eyeSpreadY = dir.y === 0 ? 1 : 0

      const cx = px + GRID_SIZE / 2
      const cy = py + GRID_SIZE / 2

      // Left eye
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(cx + eyeOffsetX - eyeSpreadX * 4, cy + eyeOffsetY - eyeSpreadY * 4, 3.5, 0, Math.PI * 2)
      ctx.fill()
      // Right eye
      ctx.beginPath()
      ctx.arc(cx + eyeOffsetX + eyeSpreadX * 4, cy + eyeOffsetY + eyeSpreadY * 4, 3.5, 0, Math.PI * 2)
      ctx.fill()

      // Pupils
      const pupilShift = Math.sin(frame * 0.05) * 0.5
      ctx.fillStyle = '#000'
      ctx.beginPath()
      ctx.arc(cx + eyeOffsetX - eyeSpreadX * 4 + dir.x * 1.2 + pupilShift, cy + eyeOffsetY - eyeSpreadY * 4 + dir.y * 1.2, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx + eyeOffsetX + eyeSpreadX * 4 + dir.x * 1.2 + pupilShift, cy + eyeOffsetY + eyeSpreadY * 4 + dir.y * 1.2, 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function drawFood(ctx: CanvasRenderingContext2D, food: GameState['food'], frame: number) {
  const px = food.pos.x * GRID_SIZE
  const py = food.pos.y * GRID_SIZE
  const cx = px + GRID_SIZE / 2
  const cy = py + GRID_SIZE / 2
  const bob = Math.sin(frame * 0.08) * 2
  const pulse = 1 + Math.sin(frame * 0.1) * 0.08

  ctx.save()
  ctx.translate(cx, cy + bob)
  ctx.scale(pulse, pulse)

  if (food.kind === 'apple') {
    // Red apple
    ctx.fillStyle = '#FF5252'
    ctx.beginPath()
    ctx.arc(0, 1, 7, 0, Math.PI * 2)
    ctx.fill()
    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.beginPath()
    ctx.arc(-2, -2, 3, 0, Math.PI * 2)
    ctx.fill()
    // Stem
    ctx.strokeStyle = '#4CAF50'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(0, -6)
    ctx.quadraticCurveTo(3, -9, 5, -7)
    ctx.stroke()
    // Leaf
    ctx.fillStyle = '#4CAF50'
    ctx.beginPath()
    ctx.ellipse(4, -7, 3, 1.5, 0.5, 0, Math.PI * 2)
    ctx.fill()
  } else if (food.kind === 'golden') {
    // Golden star
    const glow = 6 + Math.sin(frame * 0.15) * 2
    ctx.shadowColor = '#FFD700'
    ctx.shadowBlur = glow
    ctx.fillStyle = '#FFD700'
    drawStar(ctx, 0, 0, 5, 8, 4)
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.beginPath()
    ctx.arc(-1, -2, 2.5, 0, Math.PI * 2)
    ctx.fill()
  } else {
    // Speed bolt
    ctx.fillStyle = '#64B5F6'
    ctx.shadowColor = '#64B5F6'
    ctx.shadowBlur = 5
    ctx.beginPath()
    ctx.moveTo(-2, -8)
    ctx.lineTo(3, -1)
    ctx.lineTo(0, -1)
    ctx.lineTo(2, 8)
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
  ctx.fillStyle = `rgba(255,255,255,${alpha})`
  ctx.fillRect(pos.x * GRID_SIZE, pos.y * GRID_SIZE, GRID_SIZE, GRID_SIZE)
}

function drawHUD(ctx: CanvasRenderingContext2D, score: number, bestScore: number, speed: number, combo: number) {
  ctx.font = 'bold 14px "Courier New", monospace'
  ctx.textAlign = 'left'

  // Score
  ctx.fillStyle = '#fff'
  ctx.fillText(`Score: ${score}`, 8, 18)

  // Best
  ctx.fillStyle = '#FFD54F'
  ctx.fillText(`Best: ${bestScore}`, 8, 34)

  // Speed indicator
  ctx.textAlign = 'right'
  const speedLevel = Math.round((1 - (speed - 70) / 80) * 10)
  ctx.fillStyle = '#64B5F6'
  ctx.fillText(`Speed: ${Math.min(speedLevel, 10)}`, CANVAS_WIDTH - 8, 18)

  // Combo
  if (combo > 1) {
    ctx.textAlign = 'center'
    ctx.fillStyle = '#FF9800'
    ctx.font = 'bold 12px "Courier New", monospace'
    ctx.fillText(`Combo x${combo}`, CANVAS_WIDTH / 2, 18)
  }
}

export function render(ctx: CanvasRenderingContext2D, state: GameState, frame: number) {
  drawGrid(ctx, frame)
  drawGridFlash(ctx, state.gridFlash, 0.15)
  drawFood(ctx, state.food, frame)
  drawSnake(ctx, state.snake, frame)
  drawParticles(ctx, state.particles as GameState['particles'][number][])
  drawHUD(ctx, state.score, state.bestScore, state.speed, state.combo)
}
