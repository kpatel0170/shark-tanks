// Web Audio API sound engine — synthesized tones, no audio files.
// AudioContext is created lazily on first use to satisfy browser autoplay policy.

let ctx: AudioContext | null = null
let muted = false

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === "suspended") ctx.resume()
  return ctx
}

export function toggleMute(): boolean {
  muted = !muted
  return muted
}

export function isMuted(): boolean {
  return muted
}

// Core: schedule a short synthesized tone
function tone(
  freq: number,
  type: OscillatorType,
  duration: number,
  gainPeak: number,
  freqEnd?: number,
  delayStart = 0,
) {
  if (muted || typeof window === "undefined") return
  const c = getCtx()
  const t = c.currentTime + delayStart

  const osc  = c.createOscillator()
  const gain = c.createGain()

  osc.connect(gain)
  gain.connect(c.destination)

  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 0.01), t + duration)
  }

  gain.gain.setValueAtTime(gainPeak, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration)

  osc.start(t)
  osc.stop(t + duration + 0.01)
}

// ─── Public sounds ────────────────────────────────────────────────────────────

// Short punchy click — tank fires
export function playShoot() {
  tone(280, "square", 0.07, 0.18)
}

// Dull thud — bullet lands on a tank
export function playHit() {
  tone(90, "sine", 0.14, 0.28)
}

// Low rumbling sweep down — tank is destroyed
export function playDeath() {
  tone(80, "sawtooth", 0.45, 0.3, 18)
}

// Two-note upbeat chime — player joins
export function playJoin() {
  tone(440, "triangle", 0.12, 0.14)
  tone(880, "triangle", 0.12, 0.14, undefined, 0.12)
}

// Ascending arpeggio — round ends, winner announced
export function playRoundEnd() {
  tone(523, "triangle", 0.1, 0.18)               // C5
  tone(659, "triangle", 0.1, 0.18, undefined, 0.1) // E5
  tone(784, "triangle", 0.15, 0.18, undefined, 0.2) // G5
}
