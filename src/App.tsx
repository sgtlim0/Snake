import { useState, useCallback, useRef } from 'react'
import GameCanvas from './game/GameCanvas.tsx'
import type { GameCanvasHandle } from './game/GameCanvas.tsx'
import type { Direction } from './game/types.ts'
import styles from './App.module.css'

export default function App() {
  const gameRef = useRef<GameCanvasHandle>(null)
  const [phase, setPhase] = useState('idle')
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)

  const handleScoreChange = useCallback((s: number, best: number) => {
    setScore(s)
    setBestScore(best)
  }, [])

  const handlePhaseChange = useCallback((p: string) => {
    setPhase(p)
  }, [])

  const handleDpad = useCallback((dir: Direction) => {
    gameRef.current?.setDirection(dir)
  }, [])

  const handleRestart = useCallback(() => {
    gameRef.current?.restart()
  }, [])

  const isNewBest = score > 0 && score >= bestScore && phase === 'dead'

  return (
    <div className={styles.container}>
      <div className={styles.gameArea}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.scoreCard}>
            <span className={styles.scoreIcon}>{'\\u{1F34E}'}</span>
            <span className={styles.scoreNum}>{score}</span>
          </div>
          <h1 className={styles.title}>SNAKE</h1>
          <div className={`${styles.scoreCard} ${styles.bestCard}`}>
            <span className={styles.scoreIcon}>{'\\u{1F3C6}'}</span>
            <span className={styles.scoreNum}>{bestScore}</span>
          </div>
        </div>

        {/* Canvas */}
        <div className={styles.canvasWrap}>
          <GameCanvas
            ref={gameRef}
            onScoreChange={handleScoreChange}
            onPhaseChange={handlePhaseChange}
          />

          {phase === 'idle' && (
            <div className={styles.overlay}>
              <div className={styles.startPanel}>
                <div className={styles.startTitle}>{'\\u{1F40D}'} SNAKE</div>
                <div className={styles.startSub}>
                  {bestScore > 0 ? `\\u{1F3C6} \\uCD5C\\uACE0: ${bestScore}` : '\\uC0AC\\uACFC\\uB97C \\uBA39\\uACE0 \\uBF40\\uC744 \\uD0A4\\uC6B0\\uC138\\uC694!'}
                </div>
                <div className={styles.startHint}>{'\\u2B06\\uFE0F\\u2B07\\uFE0F\\u2B05\\uFE0F\\u27A1\\uFE0F \\uBC29\\uD5A5\\uD0A4 / \\uC2A4\\uC640\\uC774\\uD504'}</div>
                <div className={styles.tapStart}>TAP TO START</div>
              </div>
            </div>
          )}

          {phase === 'dead' && (
            <div className={styles.overlay}>
              <div className={styles.gameOverPanel}>
                <div className={styles.gameOverTitle}>GAME OVER</div>
                <div className={styles.finalScore}>
                  <span className={styles.finalLabel}>{'\uCD5C\uC885 \uC810\uC218'}</span>
                  <span className={styles.finalValue}>{score}</span>
                </div>
                {isNewBest && <div className={styles.newBest}>{'\uC2E0\uAE30\uB85D!'} NEW BEST!</div>}
                <div className={styles.divider} />
                <div className={styles.bestRow}>
                  <span>{'\uCD5C\uACE0 \uC810\uC218'}</span>
                  <span className={styles.bestValue}>{bestScore}</span>
                </div>
                <button className={styles.restartBtn} onClick={handleRestart}>
                  {'\uB2E4\uC2DC \uC2DC\uC791'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* D-pad */}
        {phase === 'playing' && (
          <div className={styles.dpad}>
            <button
              className={`${styles.dpadBtn} ${styles.dpadUp}`}
              onTouchStart={(e) => { e.preventDefault(); handleDpad('up') }}
              onMouseDown={() => handleDpad('up')}
            >{'\\u25B2'}</button>
            <button
              className={`${styles.dpadBtn} ${styles.dpadLeft}`}
              onTouchStart={(e) => { e.preventDefault(); handleDpad('left') }}
              onMouseDown={() => handleDpad('left')}
            >{'\\u25C0'}</button>
            <button
              className={`${styles.dpadBtn} ${styles.dpadRight}`}
              onTouchStart={(e) => { e.preventDefault(); handleDpad('right') }}
              onMouseDown={() => handleDpad('right')}
            >{'\\u25B6'}</button>
            <button
              className={`${styles.dpadBtn} ${styles.dpadDown}`}
              onTouchStart={(e) => { e.preventDefault(); handleDpad('down') }}
              onMouseDown={() => handleDpad('down')}
            >{'\\u25BC'}</button>
          </div>
        )}
      </div>
    </div>
  )
}
