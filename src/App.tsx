import { useState, useCallback } from 'react'
import GameCanvas from './game/GameCanvas.tsx'
import styles from './App.module.css'

export default function App() {
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

  const isNewBest = score > 0 && score >= bestScore && phase === 'dead'

  return (
    <div className={styles.container}>
      <div className={styles.gameWrapper}>
        <GameCanvas
          onScoreChange={handleScoreChange}
          onPhaseChange={handlePhaseChange}
        />

        {phase === 'idle' && (
          <div className={styles.overlay}>
            <div className={styles.title}>SNAKE</div>
            <div className={styles.subtitle}>
              {bestScore > 0 ? `Best: ${bestScore}` : 'Classic Snake Game'}
            </div>
            <div className={styles.features}>
              <span className={styles.featureTag}>Combo System</span>
              <span className={styles.featureTag}>Golden Star</span>
              <span className={styles.featureTag}>Speed Bolt</span>
            </div>
            <div className={styles.controls}>
              Arrow Keys / WASD / Swipe
            </div>
            <div className={styles.tapHint}>PRESS ANY KEY TO START</div>
          </div>
        )}

        {phase === 'dead' && (
          <div className={styles.overlay}>
            <div className={styles.gameOverPanel}>
              <div className={styles.gameOverTitle}>GAME OVER</div>
              <div className={styles.scoreRow}>
                <span className={styles.scoreLabel}>SCORE</span>
                <span className={styles.scoreValue}>{score}</span>
              </div>
              <div className={styles.divider} />
              <div className={styles.scoreRow}>
                <span className={styles.scoreLabel}>BEST</span>
                <span className={`${styles.scoreValue} ${styles.bestValue}`}>{bestScore}</span>
              </div>
              {isNewBest && <div className={styles.newBest}>NEW BEST!</div>}
              <div className={styles.divider} />
              <button className={styles.restartBtn}>TAP TO RETRY</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
