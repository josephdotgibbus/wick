import '@fontsource-variable/fraunces/wght.css'
import '@fontsource-variable/fraunces/wght-italic.css'
import '@fontsource-variable/outfit'
import './style.css'
import { Sound } from './audio.ts'
import { render } from './render.ts'
import { dailySeed, parseSeed, randomSeed } from './rng.ts'
import {
  chooseUpgrade,
  confirmControl,
  createGame,
  endRun,
  enterMenu,
  queueRun,
  tick,
  toggleLoadout,
  togglePause,
} from './sim.ts'
import {
  allowedBlessing,
  commitRun,
  loadSave,
  setBlessing,
  setControl,
  setMuted,
  todayBest,
  type Save,
} from './storage.ts'
import type { FrameInput, Game, Mode } from './types.ts'
import { mount, showError, sync, type Session } from './ui.ts'

const view = document.getElementById('view')
if (!(view instanceof HTMLCanvasElement)) {
  throw new Error('Missing canvas')
}
const canvas: HTMLCanvasElement = view
const ctx = canvas.getContext('2d')
if (!ctx) {
  showError()
  throw new Error('Canvas unsupported')
}

const sound = new Sound()
const save = loadSave()
sound.setMuted(save.muted)
const game = createGame()
const session: Session = { fresh: [], record: false, dailyRecord: false }
let committed = -1

const keys = new Set<string>()
let burstQueued = false
let steerId: number | null = null
let originX = 0
let originY = 0
let touchX = 0
let touchY = 0
let mouseX = window.innerWidth / 2
let mouseY = window.innerHeight / 2
let mouseSeen = false
let padBurstWas = false
let viewW = window.innerWidth
let viewH = window.innerHeight
let dpr = Math.min(2, window.devicePixelRatio || 1)

function resize(): void {
  dpr = Math.min(2, window.devicePixelRatio || 1)
  viewW = window.innerWidth
  viewH = window.innerHeight
  canvas.width = Math.max(1, Math.round(viewW * dpr))
  canvas.height = Math.max(1, Math.round(viewH * dpr))
}

resize()
window.addEventListener('resize', resize)

function queueBurst(): void {
  burstQueued = true
}

function takeBurst(): boolean {
  const had = burstQueued
  burstQueued = false
  return had
}

function typing(): boolean {
  const el = document.activeElement
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
}

function onCanvas(event: Event): boolean {
  return event.target === canvas
}

mount({
  play: () => begin('endless', randomSeed()),
  daily: () => begin('daily', dailySeed()),
  seed: (raw) => {
    const seed = parseSeed(raw)
    if (seed === null) return
    begin('seed', seed)
  },
  again: () => begin(game.mode, game.seed),
  fresh: () => begin('endless', randomSeed()),
  menu: () => {
    enterMenu(game)
    session.fresh = []
    session.record = false
    session.dailyRecord = false
  },
  pick: (index) => {
    const serial = game.offerSerial
    chooseUpgrade(game, index)
    if (game.offerSerial !== serial || game.state !== 'levelup') sound.pick()
  },
  resume: () => {
    if (game.state === 'playing' || game.state === 'paused') togglePause(game)
  },
  giveUp: () => endRun(game),
  toggleMute: () => {
    setMuted(save, !save.muted)
    sound.setMuted(save.muted)
    sound.unlock()
  },
  blessing: (id) => setBlessing(save, id),
  burst: () => {
    if (game.state === 'playing') queueBurst()
  },
  steer: (mode) => {
    sound.unlock()
    sound.ui()
    setControl(save, mode)
    game.control = mode
    confirmControl(game, mode)
  },
  loadout: () => toggleLoadout(game),
})
function begin(mode: Mode, seed: number): void {
  sound.unlock()
  sound.ui()
  mouseSeen = false
  burstQueued = false
  const blessing = allowedBlessing(save)
  const bestAtStart = mode === 'daily' ? todayBest(save) : save.bestRound
  session.fresh = []
  session.record = false
  session.dailyRecord = false
  game.control = save.control
  queueRun(game, {
    mode,
    seed,
    blessing,
    bestAtStart,
    tutor: save.runs < 2,
  })
}

window.addEventListener('keydown', (event) => {
  if (typing()) return
  sound.unlock()
  if (game.state === 'playing' && (event.code === 'Space' || event.code.startsWith('Arrow'))) event.preventDefault()
  keys.add(event.code)
  if (event.repeat) return
  if (event.code === 'Space' && game.state === 'playing') queueBurst()
  if (event.code === 'KeyM') {
    setMuted(save, !save.muted)
    sound.setMuted(save.muted)
  }
  if (event.code === 'Escape' || event.code === 'KeyP') {
    if (game.state === 'playing' || game.state === 'paused') togglePause(game)
    else if (game.state === 'dead' && event.code === 'Escape') enterMenu(game)
  }
  if (event.code === 'KeyR' && game.state === 'dead') begin(game.mode, game.seed)
  if (event.code === 'Enter' && game.state === 'menu' && !(event.target instanceof HTMLButtonElement)) {
    event.preventDefault()
    begin('endless', randomSeed())
  }
  if (game.state === 'steer' && !event.repeat) {
    if (event.code === 'Digit1' || event.code === 'Numpad1') {
      setControl(save, 'mouse')
      confirmControl(game, 'mouse')
    }
    if (event.code === 'Digit2' || event.code === 'Numpad2') {
      setControl(save, 'keys')
      confirmControl(game, 'keys')
    }
  }
  if (game.state === 'levelup') {
    const index = { Digit1: 0, Numpad1: 0, Digit2: 1, Numpad2: 1, Digit3: 2, Numpad3: 2 }[event.code]
    if (index !== undefined) {
      const serial = game.offerSerial
      chooseUpgrade(game, index)
      if (game.offerSerial !== serial || game.state !== 'levelup') sound.pick()
    }
  }
})

window.addEventListener('keyup', (event) => {
  keys.delete(event.code)
})

window.addEventListener('blur', () => {
  keys.clear()
  steerId = null
  if (game.state === 'playing') togglePause(game)
})

document.addEventListener('visibilitychange', () => {
  if (document.hidden && game.state === 'playing') togglePause(game)
})

window.addEventListener('pointermove', (event) => {
  if (event.pointerType === 'touch' || event.pointerType === 'pen') {
    if (event.pointerId !== steerId) return
    touchX = event.clientX
    touchY = event.clientY
    return
  }
  mouseX = event.clientX
  mouseY = event.clientY
  mouseSeen = true
})

window.addEventListener('pointerdown', (event) => {
  sound.unlock()
  if (event.pointerType === 'touch' || event.pointerType === 'pen') {
    if (!onCanvas(event)) return
    if (steerId !== null) {
      if (game.state === 'playing') queueBurst()
      return
    }
    steerId = event.pointerId
    originX = touchX = event.clientX
    originY = touchY = event.clientY
    return
  }
  if (event.button === 0 && onCanvas(event) && game.state === 'playing') queueBurst()
})

window.addEventListener('pointerup', (event) => {
  if (event.pointerId === steerId) steerId = null
})
window.addEventListener('pointercancel', (event) => {
  if (event.pointerId === steerId) steerId = null
})

canvas.addEventListener('contextmenu', (event) => event.preventDefault())

function readInput(): { input: FrameInput; steer: { ox: number; oy: number; ax: number; ay: number } | null } {
  const keysOn = game.control === 'keys'
  let ax = 0
  let ay = 0
  if (keysOn) {
    if (keys.has('KeyA') || keys.has('ArrowLeft')) ax -= 1
    if (keys.has('KeyD') || keys.has('ArrowRight')) ax += 1
    if (keys.has('KeyW') || keys.has('ArrowUp')) ay -= 1
    if (keys.has('KeyS') || keys.has('ArrowDown')) ay += 1
    if (ax !== 0 || ay !== 0) {
      const m = Math.hypot(ax, ay)
      return { input: { ax: ax / m, ay: ay / m, burst: takeBurst() }, steer: null }
    }
  }

  const pad = readPad()
  if (keysOn && pad && (Math.hypot(pad.x, pad.y) > 0.22 || pad.burst)) {
    const m = Math.hypot(pad.x, pad.y)
    const mag = m < 0.22 ? 0 : Math.min(1, (m - 0.22) / 0.7)
    return {
      input: { ax: m === 0 ? 0 : (pad.x / m) * mag, ay: m === 0 ? 0 : (pad.y / m) * mag, burst: takeBurst() || pad.burst },
      steer: null,
    }
  }

  if (!keysOn && steerId !== null && game.state === 'playing') {
    const dx = touchX - originX
    const dy = touchY - originY
    const d = Math.hypot(dx, dy)
    const mag = d < 12 ? 0 : Math.min(1, (d - 12) / 48)
    const nx = d === 0 ? 0 : (dx / d) * mag
    const ny = d === 0 ? 0 : (dy / d) * mag
    return {
      input: { ax: nx, ay: ny, burst: takeBurst() },
      steer: { ox: originX, oy: originY, ax: nx, ay: ny },
    }
  }

  if (!keysOn && mouseSeen && game.state === 'playing' && !pointerOverUi(mouseX, mouseY)) {
    const dx = mouseX - viewW / 2
    const dy = mouseY - viewH / 2
    const d = Math.hypot(dx, dy)
    const mag = d < 22 ? 0 : Math.min(1, (d - 22) / 120)
    return {
      input: { ax: d === 0 ? 0 : (dx / d) * mag, ay: d === 0 ? 0 : (dy / d) * mag, burst: takeBurst() },
      steer: null,
    }
  }

  return { input: { ax: 0, ay: 0, burst: takeBurst() }, steer: null }
}

function pointerOverUi(x: number, y: number): boolean {
  const el = document.elementFromPoint(x, y)
  return el instanceof Element && Boolean(el.closest('button, a, input, label, .panel'))
}

function readPad(): { x: number; y: number; burst: boolean } | null {
  const pads = navigator.getGamepads?.()
  if (!pads) return null
  for (const pad of pads) {
    if (!pad) continue
    const pressed = Boolean(pad.buttons[0]?.pressed || pad.buttons[7]?.pressed)
    const burst = pressed && !padBurstWas
    padBurstWas = pressed
    return { x: pad.axes[0] ?? 0, y: pad.axes[1] ?? 0, burst }
  }
  padBurstWas = false
  return null
}

function playEvents(g: Game): void {
  for (const event of g.events) {
    if (event.type === 'collect') sound.collect(1)
    else if (event.type === 'hurt') sound.hurt()
    else if (event.type === 'burst') sound.burst()
    else if (event.type === 'level') sound.level()
    else if (event.type === 'die') sound.die()
    else if (event.type === 'boss') sound.boss()
    else if (event.type === 'bossdead') sound.bossdead()
    else if (event.type === 'beam') sound.beam()
  }
}

function settle(g: Game, current: Save): void {
  if (g.state !== 'dead' || committed === g.runSerial) return
  committed = g.runSerial
  const result = commitRun(current, {
    round: g.round,
    time: g.time,
    bossKills: g.bossKills,
    seedLabel: g.seedLabel,
    mode: g.mode,
  })
  session.fresh = result.fresh
  session.record = result.record
  session.dailyRecord = result.dailyRecord
}

let last = performance.now()
function frame(now: number): void {
  const dt = Math.min(0.033, (now - last) / 1000)
  last = now
  const { input, steer } = readInput()
  if (ctx) {
    tick(game, input, dt)
    playEvents(game)
    settle(game, save)
    const heat = game.mods.maxHeat <= 0 ? 0 : Math.max(0, game.heat) / game.mods.maxHeat
    const boss = game.enemies.some((e) => e.kind === 'boss' && !e.dead)
    sound.mood(heat, false, boss, game.state === 'playing' || game.state === 'dying')
    render(ctx, game, { wall: now / 1000, dpr, width: viewW, height: viewH, steer })
    sync(game, save, session)
  }
  requestAnimationFrame(frame)
}

requestAnimationFrame(frame)
