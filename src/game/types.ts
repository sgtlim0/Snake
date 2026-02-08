export interface Position {
  readonly x: number
  readonly y: number
}

export type Direction = 'up' | 'down' | 'left' | 'right'

export type FoodKind = 'apple' | 'golden' | 'speed'

export interface Food {
  readonly pos: Position
  readonly kind: FoodKind
}

export interface Particle {
  readonly x: number
  readonly y: number
  readonly vx: number
  readonly vy: number
  readonly life: number
  readonly maxLife: number
  readonly color: string
  readonly size: number
}

export interface GameState {
  readonly snake: readonly Position[]
  readonly direction: Direction
  readonly nextDirection: Direction
  readonly food: Food
  readonly score: number
  readonly bestScore: number
  readonly phase: 'idle' | 'playing' | 'paused' | 'dead'
  readonly speed: number
  readonly particles: readonly Particle[]
  readonly gridFlash: Position | null
  readonly combo: number
  readonly lastFoodTime: number
  readonly shake: number
  readonly eatScale: number
}

export const GRID_SIZE = 20
export const COLS = 20
export const ROWS = 20
export const CANVAS_WIDTH = GRID_SIZE * COLS
export const CANVAS_HEIGHT = GRID_SIZE * ROWS
export const BASE_SPEED = 140
export const MIN_SPEED = 65
export const SPEED_INCREMENT = 2
