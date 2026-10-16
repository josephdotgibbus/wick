type Osc = OscillatorType

export class Sound {
  muted = false
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private drone: GainNode | null = null
  private oscA: OscillatorNode | null = null
  private oscB: OscillatorNode | null = null
  private lastCollect = 0

  unlock(): void {
    if (this.ctx) {
      void this.ctx.resume()
      return
    }
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    const ctx = new Ctor()
    this.ctx = ctx
    const master = ctx.createGain()
    master.gain.value = this.muted ? 0 : 0.42
    master.connect(ctx.destination)
    this.master = master

    const drone = ctx.createGain()
    drone.gain.value = 0
    drone.connect(master)
    this.drone = drone

    const a = ctx.createOscillator()
    const b = ctx.createOscillator()
    a.type = 'sine'
    b.type = 'triangle'
    a.frequency.value = 73
    b.frequency.value = 110
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 420
    a.connect(filter)
    b.connect(filter)
    filter.connect(drone)
    a.start()
    b.start()
    this.oscA = a
    this.oscB = b
    const now = ctx.currentTime
    drone.gain.setValueAtTime(0, now)
    drone.gain.linearRampToValueAtTime(0.028, now + 0.9)
    void ctx.resume()
  }

  setMuted(muted: boolean): void {
    this.muted = muted
    if (!this.master || !this.ctx) return
    this.master.gain.setTargetAtTime(muted ? 0 : 0.42, this.ctx.currentTime, 0.04)
  }

  mood(heat: number, inferno: boolean, boss: boolean, active: boolean): void {
    if (!this.ctx || !this.drone || !this.oscA || !this.oscB) return
    const now = this.ctx.currentTime
    const h = Math.max(0, Math.min(1, heat))
    const gain = !active ? 0.02 : inferno ? 0.06 : 0.026 + (1 - h) * 0.028
    this.drone.gain.setTargetAtTime(gain, now, 0.25)
    const f = boss ? 49 : inferno ? 96 : 68 + h * 12
    this.oscA.frequency.setTargetAtTime(f, now, 0.35)
    this.oscB.frequency.setTargetAtTime(f * 1.498, now, 0.35)
  }

  collect(combo: number): void {
    if (!this.ctx) return
    const now = this.ctx.currentTime
    if (now - this.lastCollect < 0.045) return
    this.lastCollect = now
    const freq = 540 + Math.min(24, combo) * 26
    this.tone(freq, 0.07, 'sine', 0.045, freq * 1.35)
  }

  hurt(): void {
    this.noise(0.16, 0.08, 900)
    this.tone(140, 0.12, 'sawtooth', 0.03, 60)
  }

  burst(): void {
    this.noise(0.12, 0.05, 1400)
    this.tone(220, 0.1, 'triangle', 0.04, 90)
  }

  level(): void {
    this.tone(523, 0.1, 'sine', 0.05)
    window.setTimeout(() => this.tone(659, 0.1, 'sine', 0.05), 90)
    window.setTimeout(() => this.tone(784, 0.16, 'sine', 0.05), 180)
  }

  pick(): void {
    this.tone(660, 0.06, 'sine', 0.04, 880)
  }

  die(): void {
    this.noise(0.35, 0.09, 500)
    this.tone(220, 0.4, 'sawtooth', 0.04, 55)
  }

  inferno(): void {
    this.tone(196, 0.25, 'triangle', 0.05)
    this.tone(247, 0.25, 'sine', 0.04)
    this.tone(392, 0.3, 'sine', 0.035)
  }

  boss(): void {
    this.tone(55, 0.4, 'sine', 0.07, 40)
    this.noise(0.25, 0.05, 300)
  }

  bossdead(): void {
    this.tone(330, 0.12, 'sine', 0.05)
    window.setTimeout(() => this.tone(494, 0.18, 'sine', 0.05), 90)
    window.setTimeout(() => this.tone(659, 0.26, 'sine', 0.04), 200)
    window.setTimeout(() => this.tone(880, 0.4, 'triangle', 0.03), 340)
  }

  beam(): void {
    this.tone(880, 0.09, 'square', 0.02, 440)
  }

  nova(): void {
    this.noise(0.18, 0.06, 1600)
    this.tone(180, 0.16, 'triangle', 0.04, 90)
  }

  best(): void {
    this.tone(880, 0.08, 'sine', 0.04)
    window.setTimeout(() => this.tone(1175, 0.14, 'sine', 0.04), 80)
  }

  ui(): void {
    this.tone(620, 0.05, 'sine', 0.03)
  }

  private tone(freq: number, dur: number, type: Osc, gain: number, slide?: number): void {
    if (!this.ctx || !this.master) return
    const ctx = this.ctx
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const amp = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(Math.max(40, freq), now)
    if (slide && slide > 0) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slide), now + dur)
    amp.gain.setValueAtTime(gain, now)
    amp.gain.exponentialRampToValueAtTime(0.0001, now + dur)
    osc.connect(amp)
    amp.connect(this.master)
    osc.start(now)
    osc.stop(now + dur + 0.02)
  }

  private noise(dur: number, gain: number, cutoff: number): void {
    if (!this.ctx || !this.master) return
    const ctx = this.ctx
    const length = Math.max(1, Math.floor(ctx.sampleRate * dur))
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length)
    const src = ctx.createBufferSource()
    src.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = cutoff
    const amp = ctx.createGain()
    amp.gain.value = gain
    src.connect(filter)
    filter.connect(amp)
    amp.connect(this.master)
    src.start()
  }
}
