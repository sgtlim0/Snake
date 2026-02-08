import { useRef, useEffect, useCallback } from 'react'
import { useSnake } from './useSnake.ts'
import { render } from './renderer.ts'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './types.ts'
import type { Direction } from './types.ts'

interface Props {
  readonly onScoreChange?: (score: number, best: number) => void
  readonly onPhaseChange?: (phase: string) => void
}

export default function GameCanvas({ onScoreChange, onPhaseChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { state, frame, setDirection, restart } = useSnake(onScoreChange, onPhaseChange)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

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
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        if (state.current.phase === 'dead') restart()
        else if (state.current.phase === 'idle') setDirection('right')
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [setDirection, restart, state])

  // Touch controls (swipe)
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

    // Minimum swipe distance
    if (absDx < 15 && absDy < 15) {
      // Tap - start game or restart
      if (state.current.phase === 'dead') restart()
      else if (state.current.phase === 'idle') setDirection('right')
      return
    }

    let dir: Direction
    if (absDx > absDy) {
      dir = dx > 0 ? 'right' : 'left'
    } else {
      dir = dy > 0 ? 'down' : 'up'
    }
    setDirection(dir)
  }, [setDirection, restart, state])

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
      }}
    />
  )
}
