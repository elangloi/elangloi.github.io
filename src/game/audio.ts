/* All sound is synthesized with the Web Audio API — no sample files. The
   ambience is a slow, procedurally wandering marimba over a pentatonic scale,
   in the spirit of a village hourly theme. Browsers won't start audio until
   the user interacts, so start() is called from the first key or pointer. */

import type { SoundEvent } from './types'

export interface Sounds {
  /** Creates/resumes the AudioContext; safe to call repeatedly. */
  start(): void
  play(event: SoundEvent): void
  setMuted(muted: boolean): void
  destroy(): void
}

const MASTER_VOL = 0.5
const BGM_VOL = 0.16
const SFX_VOL = 0.5

/* ---------- ambience ---------- */
const BPM = 82
const STEP = 60 / BPM / 2 // eighth notes
const LOOKAHEAD_SEC = 0.35
const TICK_MS = 100
/** C major pentatonic across two octaves, C4 up to A5. */
const SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0]
/** Bass roots, one per two bars: C – G – A – F, an octave and a half down. */
const BASS = [65.41, 98.0, 110.0, 87.31]
const STEPS_PER_CHORD = 16
const MELODY_DENSITY = 0.52 // chance an eighth note sounds

function pluck(
  ctx: AudioContext,
  out: AudioNode,
  freq: number,
  at: number,
  dur: number,
  vol: number,
  type: OscillatorType = 'sine',
): void {
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0, at)
  gain.gain.linearRampToValueAtTime(vol, at + 0.006)
  gain.gain.exponentialRampToValueAtTime(0.0008, at + dur)
  gain.connect(out)

  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(freq, at)
  osc.connect(gain)
  osc.start(at)
  osc.stop(at + dur + 0.05)

  // A quiet upper partial gives the sine a woody, mallet-like edge.
  const partial = ctx.createOscillator()
  const partialGain = ctx.createGain()
  partialGain.gain.setValueAtTime(vol * 0.18, at)
  partialGain.gain.exponentialRampToValueAtTime(0.0008, at + dur * 0.45)
  partial.frequency.setValueAtTime(freq * 3, at)
  partial.connect(partialGain)
  partialGain.connect(out)
  partial.start(at)
  partial.stop(at + dur)
}

export function createSounds(): Sounds {
  let ctx: AudioContext | null = null
  let master: GainNode | null = null
  let bgm: GainNode | null = null
  let sfx: GainNode | null = null
  let muted = false

  let timer = 0
  let nextStepAt = 0
  let step = 0
  let degree = 4 // start mid-scale; the melody random-walks from here

  function scheduleStep(at: number): void {
    if (!ctx || !bgm) return
    if (step % STEPS_PER_CHORD === 0) {
      const root = BASS[(step / STEPS_PER_CHORD) % BASS.length]
      pluck(ctx, bgm, root, at, STEP * 7, 0.9, 'triangle')
    }
    // Melody sits on the beat more often than off it.
    const onBeat = step % 2 === 0
    if (Math.random() < MELODY_DENSITY * (onBeat ? 1.25 : 0.6)) {
      const move = Math.round((Math.random() - 0.5) * 4) // -2..2 scale steps
      degree = Math.max(0, Math.min(SCALE.length - 1, degree + move))
      const dur = STEP * (onBeat ? 3.2 : 2)
      pluck(ctx, bgm, SCALE[degree], at, dur, 0.7)
    }
    step++
  }

  function tick(): void {
    if (!ctx) return
    while (nextStepAt < ctx.currentTime + LOOKAHEAD_SEC) {
      scheduleStep(nextStepAt)
      nextStepAt += STEP
    }
  }

  function applyMute(): void {
    if (!master || !ctx) return
    master.gain.setTargetAtTime(muted ? 0 : MASTER_VOL, ctx.currentTime, 0.02)
  }

  function start(): void {
    if (ctx) {
      if (ctx.state === 'suspended') void ctx.resume()
      return
    }
    ctx = new AudioContext()
    master = ctx.createGain()
    master.gain.value = muted ? 0 : MASTER_VOL
    master.connect(ctx.destination)

    bgm = ctx.createGain()
    bgm.gain.value = BGM_VOL
    // Soften the top end so the loop sits in the background.
    const tone = ctx.createBiquadFilter()
    tone.type = 'lowpass'
    tone.frequency.value = 2400
    bgm.connect(tone)
    tone.connect(master)

    sfx = ctx.createGain()
    sfx.gain.value = SFX_VOL
    sfx.connect(master)

    nextStepAt = ctx.currentTime + 0.1
    timer = window.setInterval(tick, TICK_MS)
  }

  let noise: AudioBuffer | null = null

  /** One second of white noise, built once and reused for every crunch. */
  function noiseBuffer(): AudioBuffer {
    if (noise) return noise
    const buf = ctx!.createBuffer(1, ctx!.sampleRate, ctx!.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    noise = buf
    return buf
  }

  /** A short burst of band-passed noise: one bite's worth of crunch. */
  function crunch(at: number, freq: number, dur: number, vol: number): void {
    if (!ctx || !sfx) return
    const src = ctx.createBufferSource()
    src.buffer = noiseBuffer()
    const band = ctx.createBiquadFilter()
    band.type = 'bandpass'
    band.frequency.setValueAtTime(freq, at)
    band.frequency.exponentialRampToValueAtTime(freq * 0.8, at + dur)
    band.Q.value = 2.2
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, at)
    gain.gain.linearRampToValueAtTime(vol, at + 0.004)
    gain.gain.exponentialRampToValueAtTime(0.001, at + dur)
    src.connect(band)
    band.connect(gain)
    gain.connect(sfx)
    src.start(at)
    src.stop(at + dur + 0.02)
  }

  /**
   * One bite: a cluster of tiny noise grains, each at a slightly random pitch
   * and time, so it crackles instead of sweeping. A short triangle thump
   * underneath gives it a bit of body.
   */
  function bite(at: number, hz: number, vol: number): void {
    if (!ctx || !sfx) return
    const grains = 6
    for (let i = 0; i < grains; i++) {
      const gAt = at + i * 0.013 + Math.random() * 0.007
      const gHz = hz * (0.7 + Math.random() * 0.6)
      const gDur = 0.018 + Math.random() * 0.014
      crunch(gAt, gHz, gDur, vol * (1 - i * 0.1) * (0.7 + Math.random() * 0.3))
    }

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, at)
    gain.gain.linearRampToValueAtTime(vol * 0.45, at + 0.004)
    gain.gain.exponentialRampToValueAtTime(0.001, at + 0.05)
    gain.connect(sfx)
    const thump = ctx.createOscillator()
    thump.type = 'triangle'
    thump.frequency.setValueAtTime(hz * 0.45, at)
    thump.frequency.exponentialRampToValueAtTime(hz * 0.4, at + 0.05)
    thump.connect(gain)
    thump.start(at)
    thump.stop(at + 0.07)
  }

  /**
   * Munch: high-med, high-med, med-low. About half the time it's the plain
   * version; otherwise the whole thing sits a little higher.
   */
  function munch(): void {
    if (!ctx || !sfx) return
    const t = ctx.currentTime
    const lift = Math.random() < 0.5 ? 1 : 1.12 + Math.random() * 0.13 // up to ~+25%
    bite(t, 1500 * lift, 0.85)
    bite(t + 0.13, 1400 * lift, 0.8)
    bite(t + 0.27, 900 * lift, 0.8)
  }

  /** Two slow notes going down, each drooping a little. */
  function sad(): void {
    if (!ctx || !sfx) return
    const t = ctx.currentTime
    for (const [freq, at, dur] of [
      [392, 0, 0.32], // G4
      [311.1, 0.3, 0.55], // Eb4
    ]) {
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0, t + at)
      gain.gain.linearRampToValueAtTime(0.5, t + at + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0008, t + at + dur)
      gain.connect(sfx)
      const osc = ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, t + at)
      osc.frequency.exponentialRampToValueAtTime(freq * 0.94, t + at + dur)
      osc.connect(gain)
      osc.start(t + at)
      osc.stop(t + at + dur + 0.05)
    }
  }

  return {
    start,
    play(event) {
      if (event === 'snack') munch()
      else sad()
    },
    setMuted(next) {
      muted = next
      applyMute()
    },
    destroy() {
      window.clearInterval(timer)
      void ctx?.close()
      ctx = null
    },
  }
}
