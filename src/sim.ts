import {
  BOSS_NAMES,
  ENEMIES,
  eulogyFor,
  lightOf,
  modsFrom,
  ranksForBlessing,
  rollOffers,
  xpFor,
} from './content.ts'
import { formatSeed, mulberry32 } from './rng.ts'
import type {
  Arc,
  Beam,
  Bullet,
  Ember,
  Enemy,
  FrameInput,
  Game,
  Kind,
  Mode,
  Nova,
  OfferId,
  Particle,
} from './types.ts'

const TAU = Math.PI * 2
const PLAYER_R = 11
const PLAYER_SPEED = 200
const BURST_SPEED = 690
const BURST_TIME = 0.12
const BURST_COST = 4
const BURST_IFRAME = 0.26
const HIT_IFRAME = 0.62
const COLLECT_R = 20
const EMBER_HEAT = 6.2
const EMBER_LIFE = 9
const ENEMY_CAP = 56

export interface RunOptions {
  mode: Mode
  seed: number
  blessing: string
  bestAtStart: number
  tutor: boolean
}

export function createGame(): Game {
  const ranks = ranksForBlessing('bare')
  const g: Game = {
    state: 'menu',
    mode: 'endless',
    seed: 1,
    seedLabel: '',
    rng: mulberry32(1),
    runSerial: 0,
    time: 0,
    menuT: 0,
    score: 0,
    bestAtStart: 0,
    beatBest: false,
    combo: 0,
    comboBest: 0,
    lastCollect: -10,
    blaze: 0,
    inferno: 0,
    heat: 92,
    xp: 0,
    xpNext: xpFor(1),
    level: 1,
    kills: 0,
    bossKills: 0,
    ranks,
    mods: modsFrom(ranks),
    blessingId: 'bare',
    player: { x: 0, y: 0, vx: 0, vy: 0 },
    facing: -Math.PI / 2,
    iframes: 0,
    burstCd: 0,
    burstT: 0,
    burstAng: 0,
    burstHits: [],
    stillness: 0,
    beamCd: 0,
    sparkCd: [0],
    orbit: 0,
    enemies: [],
    bullets: [],
    embers: [],
    patches: [],
    rings: [],
    particles: [],
    floaters: [],
    beams: [],
    arcs: [],
    novas: [],
    decor: [],
    spawnAcc: 0,
    nextBoss: 52,
    bossIndex: 0,
    nextId: 1,
    offers: [],
    offerSerial: 0,
    pickLock: 0,
    banner: null,
    hint: '',
    tutor: false,
    shadeHint: false,
    lastBlow: '',
    lastHurt: -10,
    dying: 0,
    snuff: 1,
    shake: 0,
    hitstop: 0,
    hurtFlash: 0,
    events: [],
    eulogy: '',
  }
  for (let i = 0; i < 16; i++) {
    g.decor.push({
      spin: Math.random() * TAU,
      dist: 26 + Math.random() * 88,
      size: 2.2 + Math.random() * 2.4,
      speed: 0.18 + Math.random() * 0.28,
      yScale: 0.62 + Math.random() * 0.3,
    })
  }
  return g
}

export function enterMenu(g: Game): void {
  clearCombat(g)
  g.state = 'menu'
  g.heat = 92
  g.inferno = 0
  g.banner = null
  g.shake = 0
  g.snuff = 1
  g.player.x = 0
  g.player.y = 0
  g.player.vx = 0
  g.player.vy = 0
  g.mods = modsFrom(ranksForBlessing('bare'))
  g.hint = ''
}

export function startRun(g: Game, opts: RunOptions): void {
  clearCombat(g)
  const ranks = ranksForBlessing(opts.blessing)
  g.runSerial += 1
  g.state = 'playing'
  g.mode = opts.mode
  g.seed = opts.seed >>> 0
  g.seedLabel = formatSeed(g.seed)
  g.rng = mulberry32(g.seed)
  g.time = 0
  g.score = 0
  g.bestAtStart = opts.bestAtStart
  g.beatBest = false
  g.combo = 0
  g.comboBest = 0
  g.lastCollect = -10
  g.blaze = 0
  g.inferno = 0
  g.ranks = ranks
  g.mods = modsFrom(ranks)
  g.blessingId = opts.blessing
  g.heat = g.mods.maxHeat
  g.xp = 0
  g.level = 1
  g.xpNext = xpFor(1)
  g.kills = 0
  g.bossKills = 0
  g.player.x = 0
  g.player.y = 0
  g.player.vx = 0
  g.player.vy = 0
  g.facing = -Math.PI / 2
  g.iframes = 0
  g.burstCd = 0
  g.burstT = 0
  g.burstHits = []
  g.stillness = 0
  g.beamCd = 0
  g.sparkCd = []
  for (let i = 0; i < g.mods.wisps; i++) g.sparkCd.push(i * 0.16)
  g.orbit = 0
  g.spawnAcc = 0.72
  g.nextBoss = 52
  g.bossIndex = 0
  g.nextId = 1
  g.offers = []
  g.pickLock = 0
  g.tutor = opts.tutor
  g.shadeHint = false
  g.lastBlow = ''
  g.lastHurt = -10
  g.dying = 0
  g.snuff = 1
  g.shake = 0
  g.hitstop = 0
  g.hurtFlash = 0
  g.eulogy = ''
  g.hint = opts.tutor ? 'Mouse or WASD moves. Space bursts.' : ''
  g.banner = {
    title: 'Keep it lit',
    sub: opts.tutor ? 'Feed the wick. Don\'t let it starve.' : '',
    life: 1.8,
  }
}

export function togglePause(g: Game): void {
  if (g.state === 'playing') g.state = 'paused'
  else if (g.state === 'paused') g.state = 'playing'
}

export function endRun(g: Game): void {
  if (g.state !== 'playing' && g.state !== 'paused') return
  g.lastBlow = 'quit'
  beginDeath(g)
}

export function chooseUpgrade(g: Game, index: number): void {
  if (g.state !== 'levelup' || g.pickLock > 0) return
  const offer = g.offers[index]
  if (!offer) return
  g.pickLock = 0.22
  applyOffer(g, offer)
  if (g.xp >= g.xpNext && g.heat > 0) levelUp(g)
  else {
    g.state = 'playing'
    g.offers = []
  }
}

export function tick(g: Game, input: FrameInput, dt: number): void {
  g.events.length = 0
  if (g.state === 'menu') {
    g.menuT += dt
    return
  }
  if (g.state === 'dead') return
  if (g.state === 'levelup' || g.state === 'paused') {
    g.pickLock = Math.max(0, g.pickLock - dt)
    return
  }
  if (g.state === 'dying') {
    g.dying -= dt
    g.snuff = Math.max(0, g.dying / 0.9)
    g.hurtFlash = Math.max(0, g.hurtFlash - dt)
    stepCosmetics(g, dt)
    if (g.dying <= 0) g.state = 'dead'
    return
  }

  const step = g.hitstop > 0 ? dt * 0.22 : dt
  g.hitstop = Math.max(0, g.hitstop - dt)
  g.time += step
  g.menuT += dt
  g.iframes = Math.max(0, g.iframes - step)
  g.burstCd = Math.max(0, g.burstCd - step)
  g.beamCd = Math.max(0, g.beamCd - step)
  g.hurtFlash = Math.max(0, g.hurtFlash - step)
  if (g.inferno > 0) g.inferno = Math.max(0, g.inferno - step)
  if (g.banner) {
    g.banner.life -= step
    if (g.banner.life <= 0) g.banner = null
  }
  if (g.tutor && g.time < 8) g.hint = 'Mouse or WASD moves. Space bursts.'
  else if (g.hint && g.time >= 8) g.hint = ''

  const light = lightOf(g.heat, g.mods.maxHeat, g.mods.light, g.inferno > 0)
  const prevX = g.player.x
  const prevY = g.player.y
  stepPlayer(g, input, step)
  if (g.burstT > 0) strikeBurst(g, prevX, prevY)
  stepSparks(g, step, light)
  stepHush(g, step)
  stepBullets(g, step)
  stepPatches(g, step)
  stepRings(g, step)
  stepEnemies(g, step, light)
  stepEmbers(g, step)
  resolveDeaths(g)
  starve(g, step)

  if (g.heat <= 0) {
    if (g.time - g.lastHurt > 1.25 && g.lastBlow !== 'quit') g.lastBlow = 'starved'
    beginDeath(g)
    stepCosmetics(g, step)
    return
  }

  if (!g.beatBest && g.bestAtStart > 0 && g.score > g.bestAtStart) {
    g.beatBest = true
    g.banner = { title: g.mode === 'daily' ? 'Daily best' : 'New best', sub: '', life: 1.4 }
    g.events.push({ type: 'best' })
  }

  maybeShadeHint(g)
  if (g.xp >= g.xpNext) {
    levelUp(g)
    stepCosmetics(g, step)
    g.shake *= Math.exp(-3.2 * step)
    return
  }
  stepSpawns(g, step)
  stepCosmetics(g, step)
  g.shake *= Math.exp(-3.2 * step)
}

function clearCombat(g: Game): void {
  g.enemies.length = 0
  g.bullets.length = 0
  g.embers.length = 0
  g.patches.length = 0
  g.rings.length = 0
  g.particles.length = 0
  g.floaters.length = 0
  g.beams.length = 0
  g.arcs.length = 0
  g.novas.length = 0
  g.events.length = 0
}

function levelUp(g: Game): void {
  while (g.xp >= g.xpNext) {
    g.xp -= g.xpNext
    g.level += 1
    g.xpNext = xpFor(g.level)
    break
  }
  g.heat = Math.min(g.mods.maxHeat, g.heat + 4)
  g.offers = rollOffers(g.rng, g.ranks)
  g.offerSerial += 1
  g.state = 'levelup'
  g.events.push({ type: 'level' })
}

function applyOffer(g: Game, offer: { id: OfferId; name: string }): void {
  if (offer.id === 'gulp') {
    const amount = offer.name === 'Deep gulp' ? 44 : 30
    g.heat = Math.min(g.mods.maxHeat, g.heat + amount)
    puff(g, g.player.x, g.player.y, '#fff1d4', 10, 80, 0.4, 2.4)
    return
  }
  if (offer.id === 'cache') {
    g.score += 160 + g.level * 28
    floater(g, g.player.x, g.player.y - 20, 'Cache', '#ffe7c2')
    return
  }
  const id = offer.id
  g.ranks[id] += 1
  g.mods = modsFrom(g.ranks)
  while (g.sparkCd.length < g.mods.wisps) g.sparkCd.push(0.08)
  if (id === 'heart') g.heat = Math.min(g.mods.maxHeat, g.heat + 18)
  if (g.heat > g.mods.maxHeat) g.heat = g.mods.maxHeat
}

function beginDeath(g: Game): void {
  if (g.state === 'dying' || g.state === 'dead') return
  g.heat = 0
  g.state = 'dying'
  g.dying = 0.9
  g.snuff = 1
  const cause = g.lastBlow || 'starved'
  g.eulogy = eulogyFor(cause, g.time, g.comboBest, g.bossKills)
  g.events.push({ type: 'die' })
  g.shake = Math.max(g.shake, 16)
  puff(g, g.player.x, g.player.y, '#ffb15a', 28, 160, 0.7, 3)
  puff(g, g.player.x, g.player.y, '#9fd4e8', 16, 90, 0.8, 2.4)
}

function stepPlayer(g: Game, input: FrameInput, dt: number): void {
  const ax = input.ax
  const ay = input.ay
  if (input.burst && g.burstCd <= 0 && g.heat > 0 && g.burstT <= 0) {
    let ang = g.facing
    if (Math.hypot(ax, ay) > 0.12) ang = Math.atan2(ay, ax)
    else if (Math.hypot(g.player.vx, g.player.vy) > 30) ang = Math.atan2(g.player.vy, g.player.vx)
    g.burstAng = ang
    g.burstT = BURST_TIME
    g.burstCd = g.mods.burstCd
    g.burstHits = []
    g.heat = Math.max(0.4, g.heat - BURST_COST)
    g.iframes = Math.max(g.iframes, BURST_IFRAME)
    g.facing = ang
    if (g.mods.trailRanks > 0) dropPatch(g, g.player.x, g.player.y)
    g.events.push({ type: 'burst' })
    g.shake += 4
    puff(g, g.player.x, g.player.y, '#ffd7a8', 12, 140, 0.35, 2.2)
  }

  const maxV = PLAYER_SPEED * g.mods.speed
  let tx = ax * maxV
  let ty = ay * maxV
  if (g.burstT > 0) {
    tx = Math.cos(g.burstAng) * BURST_SPEED
    ty = Math.sin(g.burstAng) * BURST_SPEED
    g.burstT -= dt
    if (g.burstT <= 0 && g.mods.trailRanks > 0) dropPatch(g, g.player.x, g.player.y)
  }
  const k = g.burstT > 0 ? 20 : 11
  const blend = 1 - Math.exp(-k * dt)
  g.player.vx += (tx - g.player.vx) * blend
  g.player.vy += (ty - g.player.vy) * blend
  g.player.x += g.player.vx * dt
  g.player.y += g.player.vy * dt
  if (Math.hypot(ax, ay) > 0.2) g.facing = Math.atan2(ay, ax)
  else if (Math.hypot(g.player.vx, g.player.vy) > 24) g.facing = Math.atan2(g.player.vy, g.player.vx)

  if (Math.random() < dt * 10) {
    puff(g, g.player.x, g.player.y - 8, g.inferno > 0 ? '#fff6e4' : '#ffb15a', 1, 24, 0.45, 1.6)
  }
}

function dropPatch(g: Game, x: number, y: number): void {
  const life = 1.15 + g.mods.trailRanks * 0.25
  g.patches.push({
    x,
    y,
    r: 34 + g.mods.trailRanks * 10,
    life,
    max: life,
    dps: g.mods.trailDps,
  })
}

function strikeBurst(g: Game, prevX: number, prevY: number): void {
  const df = g.inferno > 0 ? 1.7 : 1
  const dmg = (2.2 + g.mods.sparkDamage) * df
  for (const e of g.enemies) {
    if (e.dead || g.burstHits.includes(e.id)) continue
    const d = distToSeg(e.x, e.y, prevX, prevY, g.player.x, g.player.y)
    if (d < e.r + PLAYER_R + 6) {
      g.burstHits.push(e.id)
      damageEnemy(e, dmg, true)
    }
  }
}

function stepSparks(g: Game, dt: number, light: number): void {
  g.orbit += dt * g.mods.orbit
  const df = g.inferno > 0 ? 1.7 : 1
  const interval = g.mods.sparkInterval * (g.inferno > 0 ? 0.72 : 1)
  const range = light * 2.15 + 36
  while (g.sparkCd.length < g.mods.wisps) g.sparkCd.push(0.05)
  for (let i = 0; i < g.mods.wisps; i++) {
    g.sparkCd[i] = (g.sparkCd[i] ?? 0) - dt
    if ((g.sparkCd[i] ?? 0) > 0) continue
    const ang = g.orbit + (i / g.mods.wisps) * TAU
    const x = g.player.x + Math.cos(ang) * 34
    const y = g.player.y + Math.sin(ang) * 34
    const target = nearest(g, x, y, range)
    if (!target) {
      g.sparkCd[i] = 0.12
      continue
    }
    g.sparkCd[i] = interval
    const a = Math.atan2(target.y - y, target.x - x)
    const speed = 460
    const bullet: Bullet = {
      x,
      y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      life: 0.68,
      damage: g.mods.sparkDamage * df,
      pierce: g.mods.pierce,
      r: 3.4,
      hit: [],
    }
    g.bullets.push(bullet)
  }
}

function stepHush(g: Game, dt: number): void {
  if (!g.mods.hush) {
    g.stillness = 0
    return
  }
  const moving = Math.hypot(g.player.vx, g.player.vy) > 34 || g.burstT > 0
  if (moving) g.stillness = 0
  else g.stillness += dt
  if (g.stillness >= g.mods.hushTime && g.beamCd <= 0) {
    fireBeam(g)
    g.stillness = 0
    g.beamCd = 0.38
  }
}

function fireBeam(g: Game): void {
  const ang = g.facing
  const len = g.mods.beamLen
  const width = 18
  const df = g.inferno > 0 ? 1.7 : 1
  const x2 = g.player.x + Math.cos(ang) * len
  const y2 = g.player.y + Math.sin(ang) * len
  for (const e of g.enemies) {
    if (e.dead) continue
    if (distToSeg(e.x, e.y, g.player.x, g.player.y, x2, y2) < width + e.r * 0.35) {
      damageEnemy(e, g.mods.beamDamage * df, true)
    }
  }
  const beam: Beam = { x: g.player.x, y: g.player.y, ang, len, width, life: 0.12, max: 0.12 }
  g.beams.push(beam)
  g.events.push({ type: 'beam' })
  g.shake += 3
}

function stepBullets(g: Game, dt: number): void {
  for (const b of g.bullets) {
    b.life -= dt
    b.x += b.vx * dt
    b.y += b.vy * dt
    for (const e of g.enemies) {
      if (e.dead || b.hit.includes(e.id)) continue
      if (Math.hypot(e.x - b.x, e.y - b.y) < e.r + b.r) {
        b.hit.push(e.id)
        damageEnemy(e, b.damage, true)
        g.shake += 0.45
        if (b.hit.length > b.pierce) {
          b.life = 0
          break
        }
      }
    }
  }
  compact(g.bullets, (b) => b.life <= 0)
}

function stepPatches(g: Game, dt: number): void {
  const df = g.inferno > 0 ? 1.7 : 1
  for (const p of g.patches) {
    p.life -= dt
    for (const e of g.enemies) {
      if (e.dead) continue
      if (Math.hypot(e.x - p.x, e.y - p.y) < p.r + e.r * 0.4) damageEnemy(e, p.dps * df * dt, false)
    }
  }
  compact(g.patches, (p) => p.life <= 0)
}

function stepRings(g: Game, dt: number): void {
  for (const ring of g.rings) {
    ring.r += ring.speed * dt
    ring.life -= dt
    if (ring.hit || g.iframes > 0) continue
    const d = Math.hypot(g.player.x - ring.x, g.player.y - ring.y)
    if (Math.abs(d - ring.r) < ring.thick * 0.5 + PLAYER_R) {
      ring.hit = true
      g.heat -= 18
      g.iframes = 0.55
      g.lastBlow = 'cold'
      g.lastHurt = g.time
      g.hurtFlash = 0.16
      g.shake += 7
      g.events.push({ type: 'hurt' })
      puff(g, g.player.x, g.player.y, '#b7e4f2', 14, 120, 0.4, 2.2)
    }
  }
  compact(g.rings, (r) => r.life <= 0 || r.r > 640)
}

function stepEnemies(g: Game, dt: number, light: number): void {
  const df = g.inferno > 0 ? 1.7 : 1
  for (const e of g.enemies) {
    if (e.dead) continue
    const dx = g.player.x - e.x
    const dy = g.player.y - e.y
    const dist = Math.hypot(dx, dy) || 0.0001
    const nx = dx / dist
    const ny = dy / dist
    const inLight = dist < light + e.r
    let spd = e.speed
    if (e.kind === 'shade') spd *= inLight ? 0.34 : 1.18
    else if (inLight && e.kind !== 'boss') spd *= 1.12

    if (e.kind === 'boss') {
      const prefer = dist > 210 ? 1 : dist < 150 ? -0.55 : 0.15
      const strafe = Math.sin(g.time * 0.8 + e.phase)
      const tx = nx * prefer - ny * strafe * 0.85
      const ty = ny * prefer + nx * strafe * 0.85
      e.vx += (tx * spd - e.vx) * Math.min(1, dt * 2.2)
      e.vy += (ty * spd - e.vy) * Math.min(1, dt * 2.2)
      e.nextRing -= dt
      if (e.nextRing <= 0) {
        e.nextRing = Math.max(0.95, 1.85 - e.bossIndex * 0.14)
        g.rings.push({
          x: e.x,
          y: e.y,
          r: 16,
          speed: 98 + e.bossIndex * 16,
          thick: 18,
          hit: false,
          life: 4.6,
        })
      }
    } else if (e.kind === 'leech') {
      const ang = e.phase + g.time * e.side * 1.6
      const tx = g.player.x + Math.cos(ang) * 36 - e.x
      const ty = g.player.y + Math.sin(ang) * 36 - e.y
      e.vx += tx * dt * 3.4
      e.vy += ty * dt * 3.4
      clampVel(e, spd * 1.35)
    } else {
      if (e.kind === 'ashling') {
        e.phase -= dt
        if (e.phase <= 0) {
          e.phase = 2.15
          e.vx += nx * 300
          e.vy += ny * 300
        }
      }
      e.vx += nx * spd * dt * 4.2
      e.vy += ny * spd * dt * 4.2
      clampVel(e, spd * (e.kind === 'ashling' ? 2.2 : 1.05))
    }

    e.x += e.vx * dt
    e.y += e.vy * dt
    e.flash = Math.max(0, e.flash - dt)

    const ndx = g.player.x - e.x
    const ndy = g.player.y - e.y
    const nd = Math.hypot(ndx, ndy) || 0.0001
    if (nd < light + e.r * 0.2) damageEnemy(e, g.mods.auraDps * df * dt, false)

    if (e.kind === 'leech' && nd < PLAYER_R + e.r + 6) {
      g.heat -= e.sap * dt * (g.iframes > 0 ? 0.35 : 1)
      g.lastBlow = 'leech'
      g.lastHurt = g.time
    } else if (nd < PLAYER_R + e.r && g.iframes <= 0 && g.burstT <= 0 && e.kind !== 'leech') {
      g.heat -= e.touch
      g.iframes = HIT_IFRAME
      g.lastBlow = e.kind === 'boss' ? 'boss' : e.kind
      g.lastHurt = g.time
      g.hurtFlash = 0.16
      g.shake += e.kind === 'boss' ? 9 : 5
      const knx = ndx / nd
      const kny = ndy / nd
      g.player.vx -= knx * 170
      g.player.vy -= kny * 170
      e.vx -= knx * 240
      e.vy -= kny * 240
      g.events.push({ type: 'hurt' })
      puff(g, g.player.x, g.player.y, '#d7ecf5', 8, 90, 0.3, 2)
    }
  }

  for (let i = 0; i < g.enemies.length; i++) {
    const a = g.enemies[i]
    if (!a || a.dead) continue
    for (let j = i + 1; j < g.enemies.length; j++) {
      const b = g.enemies[j]
      if (!b || b.dead) continue
      const dx = b.x - a.x
      const dy = b.y - a.y
      const d = Math.hypot(dx, dy)
      const min = a.r + b.r + 2
      if (d > 0.001 && d < min) {
        const push = ((min - d) / d) * 40
        a.vx -= dx * push * dt
        a.vy -= dy * push * dt
        b.vx += dx * push * dt
        b.vy += dy * push * dt
      }
    }
  }
}

function stepEmbers(g: Game, dt: number): void {
  for (const em of g.embers) {
    em.age += dt
    em.life -= dt
    em.vx *= Math.exp(-1.6 * dt)
    em.vy *= Math.exp(-1.6 * dt)
    const dx = g.player.x - em.x
    const dy = g.player.y - em.y
    const d = Math.hypot(dx, dy) || 0.0001
    if (em.age > 0.14 && d < g.mods.magnet) {
      const pull = 520 * (1 - d / g.mods.magnet)
      em.vx += (dx / d) * pull * dt
      em.vy += (dy / d) * pull * dt
    }
    em.x += em.vx * dt
    em.y += em.vy * dt
    if (d < COLLECT_R + 6) collectEmber(g, em)
  }
  compact(g.embers, (em) => em.life <= 0 || em.value <= 0)
}

function collectEmber(g: Game, em: Ember): void {
  if (em.value <= 0) return
  const grace = g.mods.comboGrace
  if (g.time - g.lastCollect <= grace) g.combo += 1
  else g.combo = 1
  g.lastCollect = g.time
  if (g.combo > g.comboBest) g.comboBest = g.combo
  const mult = Math.min(10, 1 + (g.combo - 1) * 0.18)
  const gained = Math.round(em.value * mult)
  g.score += gained
  g.heat = Math.min(g.mods.maxHeat, g.heat + EMBER_HEAT + g.mods.feastHeat)
  em.life = 0
  em.value = 0
  g.events.push({ type: 'collect', combo: g.combo })
  if (g.combo >= 3 && g.combo % 5 === 0) floater(g, g.player.x, g.player.y - 28, `×${g.combo}`, '#fff1d6')
  if (g.combo >= 3) {
    g.blaze += 0.036 + Math.min(0.022, g.combo * 0.0016)
    if (g.blaze >= 1) startInferno(g)
  }
  if (Math.random() < 0.7) puff(g, em.x, em.y, '#ffc27a', 2, 40, 0.25, 1.4)
}

function startInferno(g: Game): void {
  g.blaze = 0
  g.inferno = 4.3
  g.heat = Math.min(g.mods.maxHeat, g.heat + 8)
  g.banner = { title: 'Inferno', sub: 'Decay quiets. The wick bites.', life: 1.25 }
  g.events.push({ type: 'inferno' })
  g.shake += 6
  g.hitstop = 0.05
  puff(g, g.player.x, g.player.y, '#fff6e8', 18, 150, 0.45, 2.6)
}

function starve(g: Game, dt: number): void {
  const base = 1.2 + Math.min(3.2, g.time * 0.012)
  const rate = base * g.mods.decayMult * (g.inferno > 0 ? 0.2 : 1)
  g.heat -= rate * dt
}

function maybeShadeHint(g: Game): void {
  if (!g.tutor || g.shadeHint || g.banner) return
  if (!g.enemies.some((e) => e.kind === 'shade' && !e.dead)) return
  g.shadeHint = true
  g.banner = {
    title: 'Shades',
    sub: 'They sprint in the dark and stumble in your light.',
    life: 3.1,
  }
}

function stepSpawns(g: Game, dt: number): void {
  const bossAlive = g.enemies.some((e) => e.kind === 'boss' && !e.dead)
  if (!bossAlive && g.time >= g.nextBoss) {
    spawnBoss(g)
    g.nextBoss = g.time + 72
  }
  g.spawnAcc += dt
  const every = Math.max(0.32, 0.92 - g.time * 0.0042)
  let guard = 0
  while (g.spawnAcc >= every && guard++ < 4) {
    g.spawnAcc -= every
    if (g.enemies.length >= ENEMY_CAP) continue
    const count = g.time > 95 && g.rng() < 0.38 ? 2 : 1
    for (let n = 0; n < count && g.enemies.length < ENEMY_CAP; n++) spawnMinion(g)
  }
}

function spawnMinion(g: Game): void {
  const kind = pickKind(g)
  const elite = g.time > 40 && g.rng() < Math.min(0.2, (g.time - 40) / 520)
  const ang = g.rng() * TAU
  const dist = (g.time < 7 ? 150 : 250) + Math.min(210, g.time * 6) + g.rng() * 100
  g.enemies.push(makeEnemy(g, kind, elite, dist, ang))
}

function pickKind(g: Game): Exclude<Kind, 'boss'> {
  const t = g.time
  const bag: Exclude<Kind, 'boss'>[] = ['mote', 'mote']
  if (t > 14) bag.push('ashling')
  if (t > 26) bag.push('mote', 'ashling')
  if (t > 36) bag.push('shade')
  if (t > 48) bag.push('warden', 'ashling')
  if (t > 62) bag.push('leech', 'popper')
  if (t > 85) bag.push('shade', 'popper', 'warden')
  if (t > 120) bag.push('leech', 'ashling', 'shade')
  return bag[Math.floor(g.rng() * bag.length)] ?? 'mote'
}

function makeEnemy(g: Game, kind: Exclude<Kind, 'boss'>, elite: boolean, dist: number, ang: number): Enemy {
  const s = ENEMIES[kind]
  const scale = 1 + g.time * 0.011 + g.bossKills * 0.12
  const hp = s.hp * scale * (elite ? 1.65 : 1)
  return {
    id: g.nextId++,
    kind,
    name: '',
    x: g.player.x + Math.cos(ang) * dist,
    y: g.player.y + Math.sin(ang) * dist,
    vx: 0,
    vy: 0,
    hp,
    maxHp: hp,
    r: s.r * (elite ? 1.22 : 1),
    speed: s.speed * (1 + Math.min(0.28, g.time * 0.0014)) * (elite ? 1.05 : 1),
    touch: s.touch,
    xp: Math.round(s.xp * (elite ? 2 : 1)),
    emberN: s.emberN,
    emberValue: s.emberValue,
    sap: s.sap,
    phase: 0.45 + g.rng() * 1.5,
    side: g.rng() < 0.5 ? -1 : 1,
    flash: 0,
    elite,
    dead: false,
    resolved: false,
    bossIndex: 0,
    nextRing: 1.5,
  }
}

function spawnBoss(g: Game): void {
  const name = BOSS_NAMES[Math.min(g.bossIndex, BOSS_NAMES.length - 1)] ?? 'The Hearthless'
  const ang = g.rng() * TAU
  const dist = 540
  const hp = 55 + g.bossIndex * 36
  const index = g.bossIndex
  g.bossIndex += 1
  const boss: Enemy = {
    id: g.nextId++,
    kind: 'boss',
    name,
    x: g.player.x + Math.cos(ang) * dist,
    y: g.player.y + Math.sin(ang) * dist,
    vx: 0,
    vy: 0,
    hp,
    maxHp: hp,
    r: 30,
    speed: 32 + index * 3,
    touch: 26,
    xp: 30,
    emberN: 16,
    emberValue: 18,
    sap: 0,
    phase: g.rng() * TAU,
    side: 1,
    flash: 0,
    elite: false,
    dead: false,
    resolved: false,
    bossIndex: index,
    nextRing: 1.3,
  }
  g.enemies.push(boss)
  g.banner = { title: name, sub: 'Cold rings. Slip the gaps.', life: 2.5 }
  g.events.push({ type: 'boss' })
  g.shake += 8
}

function damageEnemy(e: Enemy, amount: number, punch: boolean): void {
  if (e.dead || amount <= 0) return
  e.hp -= amount
  if (punch) e.flash = 0.09
  else if (e.flash <= 0) e.flash = 0.035
  if (e.hp <= 0) {
    e.hp = 0
    e.dead = true
  }
}

function resolveDeaths(g: Game): void {
  let guard = 0
  while (guard++ < 80) {
    const e = g.enemies.find((en) => en.dead && !en.resolved)
    if (!e) break
    e.resolved = true
    resolveDeath(g, e)
  }
  compact(g.enemies, (e) => e.dead)
}

function resolveDeath(g: Game, e: Enemy): void {
  g.kills += 1
  g.xp += e.xp
  if (e.kind === 'boss') {
    g.bossKills += 1
    g.score += 400 * g.bossKills
    g.banner = { title: 'The dark recedes', sub: e.name, life: 1.7 }
    g.events.push({ type: 'bossdead' })
    g.shake += 11
    g.blaze = Math.min(1, g.blaze + 0.4)
    g.hitstop = 0.06
  }
  const value = e.elite ? e.emberValue * 2 : e.emberValue
  for (let i = 0; i < e.emberN; i++) {
    const a = g.rng() * TAU
    const s = 46 + g.rng() * 120
    const ember: Ember = {
      x: e.x,
      y: e.y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      value,
      life: EMBER_LIFE,
      age: 0,
    }
    g.embers.push(ember)
  }
  puff(g, e.x, e.y, e.kind === 'shade' ? '#9eb4cc' : '#ffb15a', e.kind === 'boss' ? 22 : 7, 90, 0.35, e.kind === 'boss' ? 3 : 1.8)

  if (g.mods.novaEvery > 0 && g.kills % g.mods.novaEvery === 0) novaBlast(g, e.x, e.y)
  if (g.mods.chain > 0) chainFrom(g, e, g.mods.chain)
  if (e.kind === 'popper') popperBlast(g, e)
}

function chainFrom(g: Game, source: Enemy, jumps: number): void {
  if (jumps <= 0) return
  let best: Enemy | null = null
  let bestD = g.mods.chainRange
  for (const o of g.enemies) {
    if (o.dead || o.id === source.id) continue
    const d = Math.hypot(o.x - source.x, o.y - source.y)
    if (d < bestD) {
      bestD = d
      best = o
    }
  }
  if (!best) return
  const df = g.inferno > 0 ? 1.7 : 1
  damageEnemy(best, g.mods.sparkDamage * g.mods.chainFrac * df, true)
  const arc: Arc = { x1: source.x, y1: source.y, x2: best.x, y2: best.y, life: 0.12, max: 0.12 }
  g.arcs.push(arc)
  if (best.dead) chainFrom(g, best, jumps - 1)
}

function novaBlast(g: Game, x: number, y: number): void {
  const df = g.inferno > 0 ? 1.7 : 1
  const dmg = 7 * g.mods.damageMult * df
  for (const o of g.enemies) {
    if (o.dead) continue
    if (Math.hypot(o.x - x, o.y - y) < 110 + o.r) damageEnemy(o, dmg, true)
  }
  const nova: Nova = { x, y, r: 110, life: 0.28, max: 0.28 }
  g.novas.push(nova)
  g.events.push({ type: 'nova' })
  g.shake += 5
}

function popperBlast(g: Game, e: Enemy): void {
  const r = 74
  const d = Math.hypot(g.player.x - e.x, g.player.y - e.y)
  if (d < r && g.iframes <= 0) {
    g.heat -= 15 * (1 - d / r)
    g.iframes = Math.max(g.iframes, 0.28)
    g.lastBlow = 'popper'
    g.lastHurt = g.time
    g.hurtFlash = 0.12
    g.shake += 5
    g.events.push({ type: 'hurt' })
  }
  const dmg = 4.5 * g.mods.damageMult
  for (const o of g.enemies) {
    if (o.dead || o.id === e.id) continue
    if (Math.hypot(o.x - e.x, o.y - e.y) < r + o.r * 0.3) damageEnemy(o, dmg, true)
  }
  const nova: Nova = { x: e.x, y: e.y, r: 74, life: 0.18, max: 0.18 }
  g.novas.push(nova)
  puff(g, e.x, e.y, '#f2c14e', 12, 130, 0.35, 2.2)
}

function stepCosmetics(g: Game, dt: number): void {
  for (const p of g.particles) {
    p.life -= dt
    p.vy += p.grav * dt
    p.x += p.vx * dt
    p.y += p.vy * dt
  }
  compact(g.particles, (p) => p.life <= 0)
  for (const f of g.floaters) {
    f.life -= dt
    f.y += f.vy * dt
  }
  compact(g.floaters, (f) => f.life <= 0)
  for (const b of g.beams) b.life -= dt
  compact(g.beams, (b) => b.life <= 0)
  for (const a of g.arcs) a.life -= dt
  compact(g.arcs, (a) => a.life <= 0)
  for (const n of g.novas) n.life -= dt
  compact(g.novas, (n) => n.life <= 0)
  if (g.embers.length > 180) g.embers.splice(0, g.embers.length - 180)
}

function puff(g: Game, x: number, y: number, color: string, n: number, speed: number, life: number, size: number): void {
  for (let i = 0; i < n; i++) {
    if (g.particles.length > 420) return
    const a = Math.random() * TAU
    const s = speed * (0.35 + Math.random())
    const particle: Particle = {
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: life * (0.6 + Math.random() * 0.5),
      max: life,
      size: size * (0.55 + Math.random()),
      color,
      grav: -30 - Math.random() * 50,
    }
    particle.max = particle.life
    g.particles.push(particle)
  }
}

function floater(g: Game, x: number, y: number, text: string, color: string): void {
  if (g.floaters.length > 24) g.floaters.shift()
  g.floaters.push({ x, y, vy: -28, text, life: 0.7, max: 0.7, color })
}

function nearest(g: Game, x: number, y: number, range: number): Enemy | null {
  let best: Enemy | null = null
  let bestD = range
  for (const e of g.enemies) {
    if (e.dead) continue
    const d = Math.hypot(e.x - x, e.y - y)
    if (d < bestD) {
      bestD = d
      best = e
    }
  }
  return best
}

function clampVel(e: Enemy, max: number): void {
  const v = Math.hypot(e.vx, e.vy)
  if (v > max) {
    e.vx = (e.vx / v) * max
    e.vy = (e.vy / v) * max
  }
}

function distToSeg(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const abx = bx - ax
  const aby = by - ay
  const denom = abx * abx + aby * aby || 1
  const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / denom))
  return Math.hypot(px - (ax + abx * t), py - (ay + aby * t))
}

function compact<T>(arr: T[], remove: (item: T) => boolean): void {
  let w = 0
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i]
    if (item === undefined || remove(item)) continue
    arr[w++] = item
  }
  arr.length = w
}
