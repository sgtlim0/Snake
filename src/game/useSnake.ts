import { useRef, useCallback, useEffect } from 'react'
import type { GameState, Direction, Position, Food, Particle, FoodKind } from './types.ts'
import { COLS, ROWS, GRID_SIZE, BASE_SPEED, MIN_SPEED, SPEED_INCREMENT } from './types.ts'
import { playEat, playGolden, playSpeedFood, playDie, playTurn } from './sound.ts'

const BEST_SCORE_KEY = 'snake-best-score'
const COMBO_TIMEOUT = 3000

function loadBestScore(): number {
  try { return Number(localStorage.getItem(BEST_SCORE_KEY)) || 0 }
  catch { return 0 }
}

function saveBestScore(score: number) {
  try { localStorage.setItem(BEST_SCORE_KEY, String(score)) }
  catch { /* ignore */ }
}

function randomPos(exclude: readonly Position[]): Position {
  const occupied = new Set(exclude.map(p => `${p.x},${p.y}`))
  let pos: Position
  do {
    pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }
  } while (occupied.has(`${pos.x},${pos.y}`))
  return pos
}

function randomFoodKind(): FoodKind {
  const r = Math.random()
  if (r < 0.1) return 'golden'
  if (r < 0.2) return 'speed'
  return 'apple'
}

function spawnFood(snake: readonly Position[]): Food {
  return { pos: randomPos(snake), kind: randomFoodKind() }
}

function oppositeDirection(d: Direction): Direction {
  const map: Record<Direction, Direction> = { up: 'down', down: 'up', left: 'right', right: 'left' }
  return map[d]
}

function moveHead(head: Position, dir: Direction): Position {
  const dx: Record<Direction, number> = { left: -1, right: 1, up: 0, down: 0 }
  const dy: Record<Direction, number> = { left: 0, right: 0, up: -1, down: 1 }
  return {
    x: head.x + dx[dir],
    y: head.y + dy[dir],
  }
}

function checkWallCollision(head: Position): boolean {
  return head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS
}

function checkSelfCollision(head: Position, body: readonly Position[]): boolean {
  return body.some(seg => seg.x === head.x && seg.y === head.y)
}

function createEatParticles(pos: Position, kind: FoodKind): Particle[] {
  const colorMap: Record<FoodKind, string[]> = {
    apple: ['#FF5252', '#FF8A80', '#fff', '#FF1744'],
    golden: ['#FFD700', '#FFC107', '#FFE082', '#fff'],
    speed: ['#64B5F6', '#42A5F5', '#90CAF9', '#fff'],
  }
  const colors = colorMap[kind]
  return Array.from({ length: 12 }, () => ({
    x: pos.x * GRID_SIZE + GRID_SIZE / 2,
    y: pos.y * GRID_SIZE + GRID_SIZE / 2,
    vx: (Math.random() - 0.5) * 7,
    vy: (Math.random() - 0.5) * 7,
    life: 1,
    maxLife: 1,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 2 + Math.random() * 5,
  }))
}

function createDeathParticles(snake: readonly Position[]): Particle[] {
  const particles: Particle[] = []
  for (const seg of snake.slice(0, 20)) {
    particles.push(...Array.from({ length: 3 }, () => ({
      x: seg.x * GRID_SIZE + GRID_SIZE / 2,
      y: seg.y * GRID_SIZE + GRID_SIZE / 2,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      life: 1,
      maxLife: 1,
      color: ['#4CAF50', '#8BC34A', '#fff', '#FF5252'][Math.floor(Math.random() * 4)],
      size: 2 + Math.random() * 5,
    })))
  }
  return particles
}

function updateParticles(particles: readonly Particle[]): Particle[] {
  return particles
    .map(p => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + 0.12,
      life: p.life - 0.025,
    }))
    .filter(p => p.life > 0)
}

function createInitialState(): GameState {
  const center = { x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) }
  const snake: Position[] = [
    center,
    { x: center.x - 1, y: center.y },
    { x: center.x - 2, y: center.y },
  ]
  return {
    snake,
    direction: 'right',
    nextDirection: 'right',
    food: spawnFood(snake),
    score: 0,
    bestScore: loadBestScore(),
    phase: 'idle',
    speed: BASE_SPEED,
    particles: [],
    gridFlash: null,
    combo: 0,
    lastFoodTime: 0,
    shake: 0,
    eatScale: 0,
  }
}

export interface SnakeAPI {
  readonly state: React.RefObject<GameState>
  readonly frame: React.RefObject<number>
  readonly start: () => void
  readonly setDirection: (dir: Direction) => void
  readonly restart: () => void
  readonly togglePause: () => void
}

export function useSnake(
  onScoreChange?: (score: number, best: number) => void,
  onPhaseChange?: (phase: string) => void,
): SnakeAPI {
  const stateRef = useRef<GameState>(createInitialState())
  const frameRef = useRef(0)
  const animFrameRef = useRef(0)
  const lastTickRef = useRef(0)

  const tick = useCallback(() => {
    const state = stateRef.current
    if (state.phase !== 'playing') return

    const now = performance.now()
    if (now - lastTickRef.current < state.speed) return
    lastTickRef.current = now

    const dir = state.nextDirection
    const head = state.snake[0]
    const newHead = moveHead(head, dir)

    // Wall or self collision → death
    if (checkWallCollision(newHead) || checkSelfCollision(newHead, state.snake)) {
      playDie()
      const best = Math.max(state.score, state.bestScore)
      saveBestScore(best)
      const deathParticles = [...state.particles, ...createDeathParticles(state.snake)]
      stateRef.current = {
        ...state,
        phase: 'dead',
        bestScore: best,
        particles: deathParticles,
        direction: dir,
        shake: 1,
      }
      onScoreChange?.(state.score, best)
      onPhaseChange?.('dead')
      return
    }

    // Check food
    const ateFood = newHead.x === state.food.pos.x && newHead.y === state.food.pos.y
    const newSnake = ateFood
      ? [newHead, ...state.snake]
      : [newHead, ...state.snake.slice(0, -1)]

    let newScore = state.score
    let newSpeed = state.speed
    let newParticles = updateParticles(state.particles)
    let newCombo = state.combo
    let newLastFoodTime = state.lastFoodTime
    let newFood = state.food
    let gridFlash: Position | null = null
    let shake = Math.max(state.shake - 0.08, 0)
    let eatScale = Math.max(state.eatScale - 0.1, 0)

    if (ateFood) {
      const timeSince = now - state.lastFoodTime
      if (state.lastFoodTime > 0 && timeSince < COMBO_TIMEOUT) {
        newCombo = state.combo + 1
      } else {
        newCombo = 1
      }
      newLastFoodTime = now

      const comboMultiplier = Math.min(newCombo, 5)
      const basePoints: Record<FoodKind, number> = { apple: 10, golden: 30, speed: 15 }
      newScore += basePoints[state.food.kind] * comboMultiplier

      if (state.food.kind === 'golden') {
        playGolden()
        shake = 0.5
      } else if (state.food.kind === 'speed') {
        playSpeedFood()
        newSpeed = Math.max(MIN_SPEED, newSpeed - SPEED_INCREMENT * 3)
      } else {
        playEat()
      }

      newSpeed = Math.max(MIN_SPEED, newSpeed - SPEED_INCREMENT)
      newParticles = [...newParticles, ...createEatParticles(state.food.pos, state.food.kind)]
      gridFlash = state.food.pos
      newFood = spawnFood(newSnake)
      eatScale = 1
      shake = Math.max(shake, 0.3)
    } else {
      if (now - state.lastFoodTime > COMBO_TIMEOUT) {
        newCombo = 0
      }
    }

    const newBest = Math.max(newScore, state.bestScore)

    stateRef.current = {
      ...state,
      snake: newSnake,
      direction: dir,
      nextDirection: dir,
      food: newFood,
      score: newScore,
      bestScore: newBest,
      speed: newSpeed,
      particles: newParticles,
      gridFlash,
      combo: newCombo,
      lastFoodTime: newLastFoodTime,
      shake,
      eatScale,
    }

    onScoreChange?.(newScore, newBest)
  }, [onScoreChange, onPhaseChange])

  const loop = useCallback(() => {
    frameRef.current++
    tick()

    // Decay effects even when dead
    const state = stateRef.current
    if (state.phase === 'dead' || state.shake > 0 || state.eatScale > 0) {
      stateRef.current = {
        ...state,
        particles: updateParticles(state.particles),
        gridFlash: null,
        shake: Math.max(state.shake - 0.03, 0),
        eatScale: Math.max(state.eatScale - 0.06, 0),
      }
    }

    animFrameRef.current = requestAnimationFrame(loop)
  }, [tick])

  const start = useCallback(() => {
    if (stateRef.current.phase !== 'idle') return
    stateRef.current = { ...stateRef.current, phase: 'playing' }
    lastTickRef.current = performance.now()
    onPhaseChange?.('playing')
  }, [onPhaseChange])

  const setDirection = useCallback((dir: Direction) => {
    const state = stateRef.current
    if (state.phase === 'idle') {
      start()
    }
    if (state.phase !== 'playing' && state.phase !== 'idle') return
    if (dir === oppositeDirection(state.direction)) return
    if (dir !== state.nextDirection) {
      playTurn()
    }
    stateRef.current = { ...stateRef.current, nextDirection: dir }
  }, [start])

  const togglePause = useCallback(() => {
    const state = stateRef.current
    if (state.phase === 'playing') {
      stateRef.current = { ...state, phase: 'paused' }
      onPhaseChange?.('paused')
    } else if (state.phase === 'paused') {
      stateRef.current = { ...state, phase: 'playing' }
      lastTickRef.current = performance.now()
      onPhaseChange?.('playing')
    }
  }, [onPhaseChange])

  const restart = useCallback(() => {
    stateRef.current = {
      ...createInitialState(),
      bestScore: stateRef.current.bestScore,
    }
    lastTickRef.current = 0
    onPhaseChange?.('idle')
  }, [onPhaseChange])

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [loop])

  return { state: stateRef, frame: frameRef, start, setDirection, restart, togglePause }
}
