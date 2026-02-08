import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { useSnake } from './useSnake.ts'
import { render } from './renderer.ts'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './types.ts'
import type { Direction } from './types.ts'

interface Props {
  readonly onScoreChange?: (score: number, best: number) => void
  readonly onPhaseChange?: (phase: string) => void
}

export interface GameCanvasHandle {
  readonly setDirection: (dir: Direction) => void
  readonly restart: () => void
  readonly togglePause: () => void
  readonly getPhase: () => string
}

const GameCanvas = forwardRef<GameCanvasHandle, Props>(({ onScoreChange, onPhaseChange }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { state, frame, setDirection, restart, togglePause } = useSnake(onScoreChange, onPhaseChange)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  useImperativeHandle(ref, () => ({
    setDirection,
    restart,
    togglePause,
    getPhase: () => state.current.phase,
  }), [setDirection, restart, togglePause, state])

  // Draw loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let rafId = 0
    const draw = () => {
      render(ctx, state.current, frame.current)
      rafId = requestAnimationFrame(draw)
    }
    rafId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafId)
  }, [state, frame])

  // Keyboard controls
  useEffect(() => {
    const keyMap: Record<string, Direction> = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      w: 'up', s: 'down', a: 'left', d: 'right',
      W: 'up', S: 'down', A: 'left', D: 'right',
    }
    const handleKey = (e: KeyboardEvent) => {
      const dir = keyMap[e.key]
      if (dir) {
        e.preventDefault()
        setDirection(dir)
      } else if (e.key === ' ') {
        e.preventDefault()
        const phase = state.current.phase
        if (phase === 'playing' || phase === 'paused') {
          togglePause()
        } else if (phase === 'dead') {
          restart()
        } else if (phase === 'idle') {
          setDirection('right')
        }
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (state.current.phase === 'dead') restart()
        else if (state.current.phase === 'idle') setDirection('right')
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [setDirection, restart, togglePause, state])

  // Touch controls (swipe on canvas)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return
    const touch = e.changedTouches[0]
    const dx = touch.clientX - touchStartRef.current.x
    const dy = touch.clientY - touchStartRef.current.y
    touchStartRef.current = null

    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)

    if (absDx < 15 && absDy < 15) {
      if (state.current.phase === 'dead') restart()
      else if (state.current.phase === 'idle') setDirection('right')
      else if (state.current.phase === 'playing' || state.current.phase === 'paused') togglePause()
      return
    }

    let dir: Direction
    if (absDx > absDy) {
      dir = dx > 0 ? 'right' : 'left'
    } else {
      dir = dy > 0 ? 'down' : 'up'
    }
    setDirection(dir)
  }, [setDirection, restart, togglePause, state])

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={() => {
        if (state.current.phase === 'dead') restart()
        else if (state.current.phase === 'idle') setDirection('right')
      }}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        touchAction: 'none',
        borderRadius: '12px',
      }}
    />
  )
})

GameCanvas.displayName = 'GameCanvas'
export default GameCanvas
