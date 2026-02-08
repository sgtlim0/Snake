let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new (window.AudioContext || (window as unknown as Record<string, unknown>).webkitAudioContext)()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function playTone(freq: number, duration: number, type: OscillatorType = 'square', volume = 0.08) {
  const c = getCtx()
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, c.currentTime)
  gain.gain.setValueAtTime(volume, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(c.currentTime)
  osc.stop(c.currentTime + duration)
}

export function vibrate(ms: number) {
  if (navigator.vibrate) navigator.vibrate(ms)
}

export function playEat() {
  playTone(880, 0.08, 'square', 0.06)
  setTimeout(() => playTone(1100, 0.1, 'square', 0.05), 50)
  vibrate(15)
}

export function playGolden() {
  playTone(1047, 0.08, 'square', 0.07)
  setTimeout(() => playTone(1319, 0.08, 'square', 0.06), 60)
  setTimeout(() => playTone(1568, 0.12, 'square', 0.06), 120)
  vibrate(30)
}

export function playSpeedFood() {
  playTone(660, 0.06, 'sawtooth', 0.05)
  setTimeout(() => playTone(880, 0.06, 'sawtooth', 0.05), 40)
  vibrate(20)
}

export function playDie() {
  playTone(440, 0.15, 'square', 0.08)
  setTimeout(() => playTone(330, 0.15, 'square', 0.07), 100)
  setTimeout(() => playTone(220, 0.25, 'triangle', 0.06), 200)
  vibrate(100)
}

export function playTurn() {
  playTone(300, 0.02, 'sine', 0.015)
  vibrate(5)
}
