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

  const handleTogglePause = useCallback(() => {
    gameRef.current?.togglePause()
  }, [])

  const handleStart = useCallback(() => {
    gameRef.current?.setDirection('right')
  }, [])

  const isNewBest = score > 0 && score >= bestScore && phase === 'dead'

  return (
    <div className={styles.container}>
      <div className={styles.gameArea}>
        <h1 className={styles.title}>
          <span className={styles.wiggle}>{'\uD83D\uDC0D'}</span>
          {' \uC2A4\uB124\uC774\uD06C \uAC8C\uC784 '}
          <span className={styles.wiggle}>{'\uD83D\uDC0D'}</span>
        </h1>
        <p className={styles.subtitle}>React + Vite</p>

        <div className={styles.scoreBoard}>
          <div className={styles.scoreCard}>
            <span className={styles.scoreLabel}>{'\uC810\uC218'}</span>
            <span className={styles.scoreNum}>{score}</span>
          </div>
          <div className={`${styles.scoreCard} ${styles.bestCard}`}>
            <span className={styles.scoreLabel}>{'\uCD5C\uACE0 \uC810\uC218'}</span>
            <span className={`${styles.scoreNum} ${styles.bestNum}`}>{bestScore}</span>
          </div>
          {(phase === 'playing' || phase === 'paused') && (
            <div className={styles.statusIndicator}>
              <span className={styles.statusDot} />
              <span className={styles.statusText}>
                {phase === 'paused' ? '\uC77C\uC2DC\uC815\uC9C0' : '\uAC8C\uC784 \uC9C4\uD589 \uC911'}
              </span>
            </div>
          )}
        </div>

        <div className={styles.canvasWrap}>
          <GameCanvas
            ref={gameRef}
            onScoreChange={handleScoreChange}
            onPhaseChange={handlePhaseChange}
          />

          {phase === 'idle' && (
            <div className={styles.overlay}>
              <div className={styles.startPanel}>
                <div className={styles.startTitle}>{'\uD83D\uDC0D'} SNAKE</div>
                <div className={styles.startSub}>
                  {bestScore > 0 ? `\uD83C\uDFC6 \uCD5C\uACE0: ${bestScore}` : '\uC0AC\uACFC\uB97C \uBA39\uACE0 \uBF40\uC744 \uD0A4\uC6B0\uC138\uC694!'}
                </div>
                <div className={styles.startHint}>{'\u2B06\uFE0F\u2B07\uFE0F\u2B05\uFE0F\u27A1\uFE0F \uBC29\uD5A5\uD0A4 / \uC2A4\uC640\uC774\uD504'}</div>
                <div className={styles.tapStart}>TAP TO START</div>
              </div>
            </div>
          )}

          {phase === 'dead' && (
            <div className={styles.overlay}>
              <div className={styles.gameOverModal}>
                <div className={styles.skullIcon}>{'\uD83D\uDC80'}</div>
                <div className={styles.gameOverTitle}>{'\uAC8C\uC784 \uC624\uBC84!'}</div>
                <div className={styles.finalScore}>
                  <span className={styles.finalLabel}>{'\uCD5C\uC885 \uC810\uC218'}</span>
                  <span className={styles.finalValue}>{score}</span>
                </div>
                {isNewBest && (
                  <div className={styles.newBest}>{'\uD83C\uDFC6 \uC2E0\uAE30\uB85D \uB2EC\uC131! \uD83C\uDFC6'}</div>
                )}
                <div className={styles.divider} />
                <div className={styles.bestRow}>
                  <span>{'\uCD5C\uACE0 \uC810\uC218'}</span>
                  <span className={styles.bestValue}>{bestScore}</span>
                </div>
                <button className={styles.restartModalBtn} onClick={handleRestart}>
                  {'\uD83D\uDD04 \uB2E4\uC2DC \uB3C4\uC804\uD558\uAE30'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.controls}>
          {phase === 'idle' && (
            <button className={`${styles.controlBtn} ${styles.startBtn}`} onClick={handleStart}>
              {'\uD83C\uDFAE \uAC8C\uC784 \uC2DC\uC791'}
            </button>
          )}
          {phase === 'dead' && (
            <button className={`${styles.controlBtn} ${styles.restartBtn}`} onClick={handleRestart}>
              {'\uD83D\uDD04 \uB2E4\uC2DC \uC2DC\uC791'}
            </button>
          )}
          {(phase === 'playing' || phase === 'paused') && (
            <button className={`${styles.controlBtn} ${styles.pauseBtn}`} onClick={handleTogglePause}>
              {phase === 'paused' ? '\u25B6\uFE0F \uACC4\uC18D\uD558\uAE30' : '\u23F8\uFE0F \uC77C\uC2DC\uC815\uC9C0'}
            </button>
          )}
        </div>

        {(phase === 'playing' || phase === 'paused') && (
          <div className={styles.dpad}>
            <button
              className={`${styles.dpadBtn} ${styles.dpadUp}`}
              onTouchStart={(e) => { e.preventDefault(); handleDpad('up') }}
              onMouseDown={() => handleDpad('up')}
            >{'\u25B2'}</button>
            <button
              className={`${styles.dpadBtn} ${styles.dpadLeft}`}
              onTouchStart={(e) => { e.preventDefault(); handleDpad('left') }}
              onMouseDown={() => handleDpad('left')}
            >{'\u25C0'}</button>
            <button
              className={`${styles.dpadBtn} ${styles.dpadRight}`}
              onTouchStart={(e) => { e.preventDefault(); handleDpad('right') }}
              onMouseDown={() => handleDpad('right')}
            >{'\u25B6'}</button>
            <button
              className={`${styles.dpadBtn} ${styles.dpadDown}`}
              onTouchStart={(e) => { e.preventDefault(); handleDpad('down') }}
              onMouseDown={() => handleDpad('down')}
            >{'\u25BC'}</button>
          </div>
        )}

        <div className={styles.instructions}>
          <p>{'\uD83C\uDFAE \uD654\uC0B4\uD45C \uD0A4 \uB610\uB294 WASD\uB85C \uC870\uC791'}</p>
          <p>{'\u23F8\uFE0F \uC2A4\uD398\uC774\uC2A4\uBC14\uB85C \uC77C\uC2DC\uC815\uC9C0'}</p>
          <p>{'\uD83C\uDF4E \uC0AC\uACFC\uB97C \uBA39\uACE0 \uC810\uC218\uB97C \uC62C\uB9AC\uC138\uC694!'}</p>
        </div>

        <footer className={styles.footer}>
          Made with {'\u2764\uFE0F'} using React + Vite
        </footer>
      </div>
    </div>
  )
}
