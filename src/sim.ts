import {
  EVENT_COPY,
  emptyCurses,
  emptyRanks,
  eulogyFor,
  isCurse,
  isUpgrade,
  lightOf,
  modsFrom,
  ranksForBlessing,
  rollEvent,
  rollOffers,
} from './content.ts'
import { formatSeed, mulberry32 } from './rng.ts'
import type {
  Chunk,
  ControlMode,
  Enemy,
  FrameInput,
  Game,
  Hazard,
  Kind,
  Mode,
  Obstacle,
  Spark,
  SpikeSlot,
} from './types.ts'

const TAU = Math.PI * 2
const CHUNK = 720

export interface RunOptions {
  mode: Mode
  seed: number
  blessing: string
  bestAtStart: number
  tutor: boolean
}

export function createGame(): Game {
  return {
    state: 'menu',
    mode: 'endless',
    seed: 1,
    seedLabel: formatSeed(1),
    rng: mulberry32(1),
    runSerial: 0,
    time: 0,
    menuT: 0,
    round: 1,
    bestAtStart: 0,
    heat: 100,
    kills: 0,
    bossKills: 0,
    ranks: emptyRanks(),
    curses: emptyCurses(),
    mods: modsFrom(emptyRanks(), emptyCurses()),
    blessingId: 'bare',
    control: 'mouse',
    pending: null,
    loadoutOpen: false,
    event: null,
    slip: false,
    player: { x: 0, y: 0, vx: 0, vy: 0 },
    facing: -Math.PI / 2,
    iframes: 0,
    burstCd: 0,
    burstT: 0,
    burstAng: 0,
    fireCd: 0.2,
    shotN: 0,
    coalSpent: false,
    orbitAng: 0,
    trailCd: 0,
    brambleCd: 0,
    enemies: [],
    incoming: [],
    bullets: [],
    sparks: [],
    patches: [],
    particles: [],
    floaters: [],
    beams: [],
    warnings: [],
    chunks: new Map(),
    extras: [],
    extraHazards: [],
    decor: [],
    nextId: 1,
    offers: [],
    offerSerial: 0,
    pickLock: 0,
    clearT: -1,
    banner: null,
    hint: '',
    tutor: false,
    lastBlow: 'the dark',
    dying: 0,
    snuff: 1,
    shake: 0,
    hurtFlash: 0,
    events: [],
    eulogy: '',
  }
}

export function enterMenu(g: Game): void {
  g.state = 'menu'
  g.pending = null
  g.loadoutOpen = false
  g.player.x = 0
  g.player.y = 0
  g.player.vx = 0
  g.player.vy = 0
  g.heat = g.mods.maxHeat || 100
  g.banner = null
  g.enemies = []
  g.incoming = []
  g.bullets = []
  if (g.decor.length === 0) {
    for (let i = 0; i < 14; i++) {
      g.decor.push({
        spin: Math.random() * TAU,
        dist: 26 + Math.random() * 88,
        size: 1.2 + Math.random() * 2.2,
        speed: 0.15 + Math.random() * 0.45,
        yScale: 0.35 + Math.random() * 0.4,
      })
    }
  }
}

export function queueRun(g: Game, opts: RunOptions): void {
  g.pending = {
    mode: opts.mode,
    seed: opts.seed,
    blessing: opts.blessing,
    bestRound: opts.bestAtStart,
    tutor: opts.tutor,
  }
  g.state = 'steer'
  g.loadoutOpen = false
}

export function confirmControl(g: Game, control: ControlMode): void {
  if (g.state !== 'steer' || !g.pending) return
  g.control = control
  const pending = g.pending
  g.pending = null
  startRun(g, {
    mode: pending.mode,
    seed: pending.seed,
    blessing: pending.blessing,
    bestAtStart: pending.bestRound,
    tutor: pending.tutor,
  })
}

export function startRun(g: Game, opts: RunOptions): void {
  const serial = g.runSerial + 1
  const control = g.control
  const decor = g.decor
  const fresh = createGame()
  Object.assign(g, fresh)
  g.decor = decor
  g.control = control
  g.runSerial = serial
  g.mode = opts.mode
  g.seed = opts.seed >>> 0
  g.seedLabel = formatSeed(g.seed)
  g.rng = mulberry32(g.seed || 1)
  g.blessingId = opts.blessing
  g.bestAtStart = opts.bestAtStart
  g.tutor = opts.tutor
  g.ranks = ranksForBlessing(opts.blessing)
  g.curses = emptyCurses()
  g.mods = modsFrom(g.ranks, g.curses)
  g.heat = g.mods.maxHeat
  g.state = 'playing'
  g.round = 1
  g.hint = opts.tutor ? 'Clear the wisps. Sparks on the ground feed the wick.' : ''
  beginRound(g)
}

export function togglePause(g: Game): void {
  if (g.state === 'playing') g.state = 'paused'
  else if (g.state === 'paused') g.state = 'playing'
}

export function toggleLoadout(g: Game): void {
  if (g.state === 'playing' || g.state === 'paused') g.loadoutOpen = !g.loadoutOpen
}

export function endRun(g: Game): void {
  if (g.state === 'playing' || g.state === 'paused' || g.state === 'levelup') beginDeath(g, 'you let go')
}

export function chooseUpgrade(g: Game, index: number): void {
  if (g.state !== 'levelup' || g.pickLock > 0) return
  const offer = g.offers[index]
  if (!offer) return
  g.pickLock = 0.18
  if (isUpgrade(offer.id)) g.ranks[offer.id] += 1
  if (isCurse(offer.id)) g.curses[offer.id] += 1
  g.mods = modsFrom(g.ranks, g.curses)
  if (offer.kind === 'upgrade' && offer.id === 'hearth') g.heat = Math.min(g.mods.maxHeat, g.heat + 18)
  g.round += 1
  g.state = 'playing'
  g.offers = []
  beginRound(g)
}

export function tick(g: Game, input: FrameInput, dt: number): void {
  g.events = []
  g.menuT += dt
  if (g.banner) {
    g.banner.life -= dt
    if (g.banner.life <= 0) g.banner = null
  }
  if (g.state === 'menu' || g.state === 'steer') {
    for (const d of g.decor) d.spin += d.speed * dt
    return
  }
  if (g.state === 'paused' || g.state === 'levelup' || g.state === 'dead') return
  if (g.state === 'dying') {
    g.dying += dt
    g.snuff = Math.max(0, 1 - g.dying / 0.85)
    stepCosmetics(g, dt)
    if (g.dying >= 0.85) {
      g.state = 'dead'
      g.eulogy = eulogyFor(g.round, g.bossKills)
    }
    return
  }

  g.mods = modsFrom(g.ranks, g.curses)
  applyEvent(g)
  g.time += dt
  g.pickLock = Math.max(0, g.pickLock - dt)
  g.iframes = Math.max(0, g.iframes - dt)
  g.burstCd = Math.max(0, g.burstCd - dt)
  g.shake = Math.max(0, g.shake - dt * 28)
  g.hurtFlash = Math.max(0, g.hurtFlash - dt)
  if (g.hint) {
    /* hint stays until round 2 */
  }

  ensureChunks(g)
  stepPlayer(g, input, dt)
  stepHazards(g, dt)
  stepSparks(g, dt)
  starve(g, dt)
  if (g.state !== 'playing') {
    stepCosmetics(g, dt)
    return
  }
  stepShots(g, dt)
  stepBullets(g, dt)
  stepPatches(g, dt)
  stepOrbit(g, dt)
  stepIncoming(g, dt)
  stepEnemies(g, dt)
  resolveDeaths(g)
  watchClear(g, dt)
  stepCosmetics(g, dt)
}

function applyEvent(g: Game): void {
  g.slip = g.event === 'slip'
  if (g.event === 'fog') g.mods.light *= 0.68
  if (g.event === 'starve') g.mods.decayMult *= 1.48
}

function beginRound(g: Game): void {
  g.event = null
  g.clearT = -1
  g.enemies = g.enemies.filter((e) => !e.dead)
  if (g.round > 5 && g.rng() < 0.5) {
    g.event = rollEvent(g.rng)
    const copy = EVENT_COPY[g.event]
    g.banner = { title: copy.title, sub: copy.sub, life: 3.2 }
    g.events.push({ type: 'level' })
  } else if (g.round % 5 === 0) {
    g.banner = { title: 'The Briar', sub: 'Spikes ride its body, then tear loose.', life: 3.2 }
  } else if (g.round === 1) {
    g.banner = { title: 'Round 1', sub: 'Wisps with red eyes. Do not let the wick go out.', life: 2.8 }
  } else {
    g.banner = { title: `Round ${g.round}`, sub: 'Shadows arrive slowly. Clear every one.', life: 2.2 }
    g.events.push({ type: 'level' })
  }
  if (g.round > 1) g.hint = ''
  scatterTerrain(g)
  g.coalSpent = false
  g.incoming = []

  if (g.round % 5 === 0) {
    spawnBoss(g)
    g.events.push({ type: 'boss' })
    return
  }
  const count = Math.min(42, 7 + g.round * 3 + g.mods.extraSpawns + (g.event === 'surge' ? 4 : 0))
  const gap = Math.max(0.62, 1.15 - g.round * 0.035)
  for (let i = 0; i < count; i++) {
    const cinder = g.round >= 4 && g.rng() < Math.min(0.34, 0.12 + (g.round - 3) * 0.025)
    g.incoming.push({ kind: cinder ? 'cinder' : 'wisp', wait: i === 0 ? 0.6 : gap })
  }
}

function stepIncoming(g: Game, dt: number): void {
  const next = g.incoming[0]
  if (!next) return
  next.wait -= dt
  if (next.wait > 0) return
  g.incoming.shift()
  spawnKind(g, next.kind, 260 + g.rng() * 140)
}

function scatterTerrain(g: Game): void {
  const stones = Math.floor(g.round / 3) + (g.event === 'rubble' ? 6 : 0)
  const vents = Math.floor((g.round - 1) / 2) + (g.event === 'vents' ? 5 : 0)
  for (let i = 0; i < stones; i++) g.extras.push(placeRing(g, 34 + g.rng() * 16, 160))
  for (let i = 0; i < vents; i++) {
    g.extraHazards.push({
      x: g.player.x + Math.cos(g.rng() * TAU) * (150 + g.rng() * 280),
      y: g.player.y + Math.sin(g.rng() * TAU) * (150 + g.rng() * 280),
      r: 26 + g.rng() * 18,
      dps: 5 + g.round * 0.7,
      kind: g.rng() < 0.55 ? 'pit' : 'bramble',
      tick: 0,
    })
  }
}

function placeRing(g: Game, r: number, minDist: number): Obstacle {
  const ang = g.rng() * TAU
  const dist = minDist + g.rng() * 260
  return { x: g.player.x + Math.cos(ang) * dist, y: g.player.y + Math.sin(ang) * dist, r }
}

function watchClear(g: Game, dt: number): void {
  if (g.incoming.length > 0 || g.enemies.some((e) => !e.dead)) {
    g.clearT = -1
    return
  }
  if (g.enemies.some((e) => !e.dead && e.spawnLeft > 0)) return
  if (g.clearT < 0) g.clearT = 0.55
  else g.clearT -= dt
  if (g.clearT > 0) return
  const kind = g.round % 5 === 0 ? 'curse' : 'upgrade'
  g.offers = rollOffers(g.rng, g.ranks, g.curses, kind)
  g.offerSerial += 1
  g.state = 'levelup'
  g.loadoutOpen = false
  g.banner = null
}

function stepPlayer(g: Game, input: FrameInput, dt: number): void {
  const speed = g.mods.speed
  if (input.burst && g.burstCd <= 0 && g.heat > g.mods.burstCost + 1) {
    const ang = Math.hypot(input.ax, input.ay) > 0.2 ? Math.atan2(input.ay, input.ax) : g.facing
    g.burstT = 0.12
    g.burstCd = g.mods.burstCd
    g.burstAng = ang
    g.facing = ang
    g.heat = Math.max(1, g.heat - g.mods.burstCost)
    g.iframes = Math.max(g.iframes, 0.22)
    g.events.push({ type: 'burst' })
    puff(g, g.player.x, g.player.y, 'rgba(255,186,90,0.9)', 8, 90, 0.35, 2.2)
    strikeBurst(g)
  }
  if (g.burstT > 0) {
    g.burstT -= dt
    g.player.vx = Math.cos(g.burstAng) * 680
    g.player.vy = Math.sin(g.burstAng) * 680
  } else if (g.slip) {
    g.player.vx += input.ax * speed * 3.1 * dt
    g.player.vy += input.ay * speed * 3.1 * dt
    const drag = Math.exp(-1.15 * dt)
    g.player.vx *= drag
    g.player.vy *= drag
    const m = Math.hypot(g.player.vx, g.player.vy)
    const cap = speed * 1.2
    if (m > cap) {
      g.player.vx = (g.player.vx / m) * cap
      g.player.vy = (g.player.vy / m) * cap
    }
  } else {
    g.player.vx = input.ax * speed
    g.player.vy = input.ay * speed
  }
  if (Math.hypot(g.player.vx, g.player.vy) > 20) g.facing = Math.atan2(g.player.vy, g.player.vx)
  g.player.x += g.player.vx * dt
  g.player.y += g.player.vy * dt
  separateCircle(g.player, 12, obstaclesNear(g, g.player.x, g.player.y))
}

function strikeBurst(g: Game): void {
  const x2 = g.player.x + Math.cos(g.burstAng) * 86
  const y2 = g.player.y + Math.sin(g.burstAng) * 86
  for (const e of g.enemies) {
    if (e.dead) continue
    if (distToSeg(e.x, e.y, g.player.x, g.player.y, x2, y2) > e.r + 18) continue
    damageEnemy(e, 18)
  }
}

function stepHazards(g: Game, dt: number): void {
  g.brambleCd = Math.max(0, g.brambleCd - dt)
  for (const h of hazardsNear(g, g.player.x, g.player.y)) {
    const d = Math.hypot(h.x - g.player.x, h.y - g.player.y)
    if (d > h.r + 10) continue
    if (h.kind === 'pit') {
      g.heat = Math.max(0, g.heat - h.dps * dt)
      if (g.heat <= 0) trySnuff(g, 'a pit')
    } else if (g.brambleCd <= 0) {
      g.brambleCd = 0.55
      hurt(g, 7 + g.round * 0.25, 'bramble')
    }
  }
}

function stepSparks(g: Game, dt: number): void {
  const reach = 18 + g.mods.magnet
  const pools = [...sparksNear(g, g.player.x, g.player.y), ...g.sparks]
  for (const s of pools) {
    if (s.taken) continue
    if (s.life > 0) {
      s.life -= dt
      if (s.life <= 0) s.taken = true
    }
    const d = Math.hypot(s.x - g.player.x, s.y - g.player.y)
    if (d < reach) {
      const pull = d < 16 ? 1 : 140 * dt / Math.max(16, d)
      s.x += (g.player.x - s.x) * Math.min(1, pull)
      s.y += (g.player.y - s.y) * Math.min(1, pull)
    }
    if (d < 16) {
      s.taken = true
      g.heat = Math.min(g.mods.maxHeat, g.heat + s.value)
      g.events.push({ type: 'collect' })
      puff(g, s.x, s.y, 'rgba(255,190,80,0.9)', 5, 40, 0.3, 1.6)
      if (g.mods.collectRing > 0) scorch(g, s.x, s.y, g.mods.collectRing, 8 + s.value)
    }
  }
  compact(g.sparks, (s) => s.taken || s.life <= 0)
}

function starve(g: Game, dt: number): void {
  const rate = (0.72 + Math.min(2.4, g.round * 0.055)) * g.mods.decayMult
  g.heat = Math.max(0, g.heat - rate * dt)
  if (g.heat <= 0) trySnuff(g, 'hunger')
}

function stepShots(g: Game, dt: number): void {
  g.fireCd -= dt
  if (g.fireCd > 0) return
  const target = nearest(g, g.player.x, g.player.y, 520)
  if (!target) return
  g.fireCd = g.mods.fireInterval
  g.shotN += 1
  const ang = Math.atan2(target.y - g.player.y, target.x - g.player.x)
  g.facing = ang
  const damage = g.mods.shotDamage
  const branded = g.mods.brand
  fireSpark(g, ang, damage, branded)
  if (g.mods.back) {
    fireSpark(g, ang + Math.PI, damage * g.mods.backFrac, g.mods.brandForks)
    if (g.mods.backSplits) {
      fireSpark(g, ang + Math.PI + 0.42, damage * 0.5, g.mods.brandForks)
      fireSpark(g, ang + Math.PI - 0.42, damage * 0.5, g.mods.brandForks)
    }
  }
  for (let i = 0; i < g.mods.forks; i++) {
    const side = i % 2 === 0 ? 1 : -1
    fireSpark(g, ang + side * (0.38 + i * 0.08), damage * g.mods.forkFrac, g.mods.brandForks)
  }
  if (g.mods.novaEvery > 0 && g.shotN % g.mods.novaEvery === 0) {
    for (let i = 0; i < 8; i++) {
      fireSpark(g, ang + (i / 8) * TAU, damage * g.mods.novaFrac, g.mods.brandForks, false, 0.85)
    }
  }
}

function fireSpark(g: Game, ang: number, damage: number, brand: boolean, child = false, lifeScale = 1): void {
  const speed = g.mods.shotSpeed
  const life = g.mods.shotLife * lifeScale
  g.bullets.push({
    x: g.player.x + Math.cos(ang) * 14,
    y: g.player.y + Math.sin(ang) * 14,
    vx: Math.cos(ang) * speed,
    vy: Math.sin(ang) * speed,
    life,
    max: life,
    damage,
    pierce: g.mods.pierce + 1,
    r: shotRadius(damage),
    hit: [],
    friendly: true,
    brand,
    child,
  })
}

function shotRadius(damage: number): number {
  return Math.min(9.5, 2.5 + Math.sqrt(Math.max(1, damage)) * 0.72)
}

function stepBullets(g: Game, dt: number): void {
  const dying: typeof g.bullets = []
  for (const b of g.bullets) {
    if (b.friendly && g.mods.homing > 0) steerSpark(g, b, dt)
    b.life -= dt
    b.x += b.vx * dt
    b.y += b.vy * dt
    if (!b.friendly) {
      if (Math.hypot(b.x - g.player.x, b.y - g.player.y) < b.r + 12) {
        b.life = 0
        hurt(g, b.damage, 'a spike')
      }
      continue
    }
    for (const e of g.enemies) {
      if (e.dead || b.hit.includes(e.id)) continue
      if (Math.hypot(b.x - e.x, b.y - e.y) > b.r + e.r) continue
      b.hit.push(e.id)
      b.pierce -= 1
      damageEnemy(e, b.damage)
      if (b.brand) g.patches.push({ x: e.x, y: e.y, r: 28, life: 0.8, max: 0.8, dps: b.damage * 0.5 })
      puff(g, b.x, b.y, 'rgba(255,210,140,0.85)', 3, 50, 0.22, 1.4)
      if (b.pierce <= 0) {
        b.life = 0
        break
      }
    }
    if (b.life <= 0 && !b.child && g.mods.pop) dying.push(b)
  }
  for (const b of dying) popSpark(g, b)
  compact(g.bullets, (b) => b.life <= 0)
}

function steerSpark(g: Game, b: { x: number; y: number; vx: number; vy: number }, dt: number): void {
  const target = nearest(g, b.x, b.y, 480)
  if (!target) return
  const speed = Math.hypot(b.vx, b.vy) || 1
  const desired = Math.atan2(target.y - b.y, target.x - b.x)
  let current = Math.atan2(b.vy, b.vx)
  let diff = desired - current
  if (diff > Math.PI) diff -= TAU
  if (diff < -Math.PI) diff += TAU
  current += Math.max(-g.mods.homing * dt, Math.min(g.mods.homing * dt, diff))
  b.vx = Math.cos(current) * speed
  b.vy = Math.sin(current) * speed
}

function popSpark(g: Game, b: { x: number; y: number; damage: number; r: number }): void {
  const n = g.mods.popCount
  for (let i = 0; i < n; i++) {
    const ang = (i / Math.max(1, n)) * TAU + g.rng() * 0.4
    const life = 0.34
    const speed = 250
    g.bullets.push({
      x: b.x,
      y: b.y,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      life,
      max: life,
      damage: b.damage * g.mods.popFrac,
      pierce: 1,
      r: Math.max(2.1, b.r * 0.55),
      hit: [],
      friendly: true,
      brand: false,
      child: true,
    })
  }
  if (g.mods.popPatch) g.patches.push({ x: b.x, y: b.y, r: 30, life: 0.7, max: 0.7, dps: b.damage * 0.55 })
  puff(g, b.x, b.y, 'rgba(255,160,70,0.9)', 6, 80, 0.28, 1.8)
}

function stepOrbit(g: Game, dt: number): void {
  const n = g.mods.orbit
  if (n <= 0) return
  g.orbitAng += dt * 2.6
  const radius = 40
  for (let i = 0; i < n; i++) {
    const ang = g.orbitAng + (i / n) * TAU
    const x = g.player.x + Math.cos(ang) * radius
    const y = g.player.y + Math.sin(ang) * radius
    for (const e of g.enemies) {
      if (e.dead) continue
      if (Math.hypot(e.x - x, e.y - y) < e.r + 8) damageEnemy(e, g.mods.orbitDmg * dt)
    }
  }
}

function scorch(g: Game, x: number, y: number, radius: number, amount: number): void {
  for (const e of g.enemies) {
    if (e.dead) continue
    if (Math.hypot(e.x - x, e.y - y) < radius + e.r) damageEnemy(e, amount)
  }
  puff(g, x, y, 'rgba(255,120,40,0.8)', 7, 70, 0.3, 2)
}

function stepPatches(g: Game, dt: number): void {
  for (const p of g.patches) {
    p.life -= dt
    for (const e of g.enemies) {
      if (e.dead) continue
      if (Math.hypot(p.x - e.x, p.y - e.y) < p.r + e.r * 0.4) damageEnemy(e, p.dps * dt)
    }
  }
  compact(g.patches, (p) => p.life <= 0)
}

function stepEnemies(g: Game, dt: number): void {
  const strong = g.event === 'strong' ? 1.22 : 1
  const haste = g.event === 'haste' ? 1.22 : 1
  const light = g.mods.haloDps > 0 || g.mods.haloSlow < 1 ? lightOf(g.heat, g.mods.maxHeat, g.mods.light) : 0
  for (const e of g.enemies) {
    if (e.dead) continue
    e.flash = Math.max(0, e.flash - dt)
    let slow = 1
    if (light > 0 && Math.hypot(e.x - g.player.x, e.y - g.player.y) < light) {
      slow = g.mods.haloSlow
      if (g.mods.haloDps > 0) damageEnemy(e, g.mods.haloDps * dt)
    }
    if (e.dead) continue
    if (e.kind === 'boss') stepBoss(g, e, dt, strong, slow)
    else if (e.kind === 'cinder') stepCinder(g, e, dt, haste * slow, strong)
    else stepWisp(g, e, dt, haste * slow, strong)
    e.trail -= dt
    if (e.kind !== 'boss' && e.trail <= 0) {
      e.trail = 0.07
      g.particles.push({
        x: e.x,
        y: e.y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 0.7,
        max: 0.7,
        size: e.kind === 'cinder' ? 7 : 9,
        color: e.kind === 'cinder' ? 'rgba(90, 18, 14, 0.45)' : 'rgba(28, 24, 26, 0.55)',
        grav: 0,
      })
    }
    if (Math.hypot(e.x - g.player.x, e.y - g.player.y) < e.r + 12) hurt(g, e.touch * strong, e.name)
  }
  for (const w of g.warnings) w.life -= dt
  compact(g.warnings, (w) => w.life <= 0)
  for (const beam of g.beams) beam.life -= dt
  compact(g.beams, (b) => b.life <= 0)
}

function stepWisp(g: Game, e: Enemy, dt: number, haste: number, strong: number): void {
  chase(g, e, dt, e.speed * haste)
  e.touch = 7 * strong
}

function stepCinder(g: Game, e: Enemy, dt: number, haste: number, strong: number): void {
  e.timer -= dt
  if (e.mode === 0) {
    chase(g, e, dt, e.speed * haste * 0.92)
    if (e.timer <= 0 && Math.hypot(e.x - g.player.x, e.y - g.player.y) < 420) {
      e.mode = 1
      e.timer = 0.7
      e.aim = Math.atan2(g.player.y - e.y, g.player.x - e.x)
      e.didHit = false
      g.warnings.push({ x: e.x, y: e.y, ang: e.aim, len: 360, life: 0.7, max: 0.7, thin: true })
    }
    return
  }
  if (e.mode === 1) {
    e.vx = 0
    e.vy = 0
    if (e.timer > 0) return
    e.mode = 2
    e.timer = 0.18
    e.didHit = false
    g.beams.push({
      x: e.x,
      y: e.y,
      ang: e.aim,
      len: 360,
      width: 3,
      life: 0.18,
      max: 0.18,
      color: 'rgba(255, 70, 48, 0.9)',
    })
    g.events.push({ type: 'beam' })
  }
  e.vx = 0
  e.vy = 0
  const reach = 360
  if (
    !e.didHit &&
    distToSeg(g.player.x, g.player.y, e.x, e.y, e.x + Math.cos(e.aim) * reach, e.y + Math.sin(e.aim) * reach) < 8
  ) {
    e.didHit = true
    hurt(g, 12 * strong, 'a red glare')
  }
  if (e.timer <= 0) {
    e.mode = 0
    e.timer = 2.4 + g.rng() * 0.8
  }
}

const SPIKE_SPIN = 2.8
const SPIKE_CRUISE = 2.4
const SPIKE_DECEL = 1.15
const SPIKE_WARN = 0.48
const SPIKE_LIFE = 3.8
const SPIKE_SPEED = 460

function stepBoss(g: Game, e: Enemy, dt: number, strong: number, pace = 1): void {
  e.eyes = Math.max(0, e.eyes - dt)
  e.nextEye -= dt
  if (e.eyes > 0) {
    e.vx *= 0.9
    e.vy *= 0.9
    chase(g, e, dt, e.speed * 0.35 * pace)
    e.spawnAcc -= dt
    if (e.spawnLeft > 0 && e.spawnAcc <= 0) {
      e.spawnAcc = 0.12
      e.spawnLeft -= 1
      const ang = g.rng() * TAU
      const baby = makeEnemy(g, 'wisp', e.x + Math.cos(ang) * (e.r + 8), e.y + Math.sin(ang) * (e.r + 8))
      baby.vx = Math.cos(ang) * 80
      baby.vy = Math.sin(ang) * 80
      g.enemies.push(baby)
    }
    e.touch = (14 + e.bossRank * 2) * strong
    return
  }

  if (e.mode === 2) {
    e.vx = 0
    e.vy = 0
  } else {
    const drag = e.mode === 1 ? 0.45 : 1
    chase(g, e, dt, e.speed * drag * pace)
  }

  for (const slot of e.spikes) {
    if (slot.cool > 0) slot.cool = Math.max(0, slot.cool - dt)
  }

  if (e.mode === 0) {
    e.aim += SPIKE_SPIN * dt
    e.timer -= dt
    if (e.timer <= 0) {
      e.mode = 1
      e.timer = SPIKE_DECEL
    }
  } else if (e.mode === 1) {
    e.aim += SPIKE_SPIN * Math.max(0, e.timer / SPIKE_DECEL) * dt
    e.timer -= dt
    if (e.timer <= 0) looseSpikes(g, e)
  } else {
    let pending = false
    for (const slot of e.spikes) {
      if (slot.warn <= 0) continue
      pending = true
      slot.warn -= dt
      if (slot.warn > 0) continue
      const speed = SPIKE_SPEED + e.bossRank * 14
      g.bullets.push({
        x: e.x + Math.cos(slot.ang) * e.r,
        y: e.y + Math.sin(slot.ang) * e.r,
        vx: Math.cos(slot.ang) * speed,
        vy: Math.sin(slot.ang) * speed,
        life: SPIKE_LIFE,
        max: SPIKE_LIFE,
        damage: (9 + e.bossRank) * strong,
        pierce: 1,
        r: 5.2,
        hit: [],
        friendly: false,
        brand: false,
        child: false,
      })
      slot.cool = Math.max(1.2, 1.85 - e.bossRank * 0.08)
      slot.warn = 0
    }
    if (!pending) {
      e.mode = 0
      e.timer = Math.max(1.35, SPIKE_CRUISE - e.bossRank * 0.12)
    }
  }
  if (e.mode !== 2 && e.eyes <= 0 && e.nextEye <= 0) {
    e.eyes = 5
    e.nextEye = 11 + g.rng() * 4
    e.spawnLeft = 10
    e.spawnAcc = 0.05
    floater(g, e.x, e.y - e.r, 'Eyes shut', '#f0b45a')
  }
  e.touch = (14 + e.bossRank * 2) * strong
}

function looseSpikes(g: Game, e: Enemy): void {
  e.mode = 2
  e.timer = SPIKE_WARN
  e.vx = 0
  e.vy = 0
  for (const slot of e.spikes) {
    if (slot.cool > 0) continue
    slot.ang = g.rng() * TAU
    slot.warn = SPIKE_WARN
    g.warnings.push({
      x: e.x,
      y: e.y,
      ang: slot.ang,
      len: (SPIKE_SPEED + e.bossRank * 14) * SPIKE_LIFE,
      life: SPIKE_WARN,
      max: SPIKE_WARN,
      thin: false,
    })
  }
}

function chase(g: Game, e: Enemy, dt: number, speed: number): void {
  const ang = Math.atan2(g.player.y - e.y, g.player.x - e.x)
  e.vx = Math.cos(ang) * speed
  e.vy = Math.sin(ang) * speed
  e.x += e.vx * dt
  e.y += e.vy * dt
  if (e.kind !== 'boss') separateCircle(e, e.r, obstaclesNear(g, e.x, e.y))
}

function spawnKind(g: Game, kind: Kind, dist: number): void {
  const ang = g.rng() * TAU
  let x = g.player.x + Math.cos(ang) * dist
  let y = g.player.y + Math.sin(ang) * dist
  for (let i = 0; i < 6; i++) {
    if (!blocked(g, x, y, 18)) break
    const a = g.rng() * TAU
    x = g.player.x + Math.cos(a) * dist
    y = g.player.y + Math.sin(a) * dist
  }
  g.enemies.push(makeEnemy(g, kind, x, y))
}

function spawnBoss(g: Game): void {
  const ang = g.rng() * TAU
  const dist = 300
  const rank = Math.floor(g.round / 5)
  const e = makeEnemy(g, 'boss', g.player.x + Math.cos(ang) * dist, g.player.y + Math.sin(ang) * dist)
  e.bossRank = rank
  e.name = 'The Briar'
  e.r = 42 + Math.min(10, rank * 2)
  e.hp = e.maxHp = 260 + rank * 90 + (g.event === 'strong' ? 40 : 0)
  e.speed = 46 + rank * 4
  e.aim = g.rng() * TAU
  e.mode = 0
  e.timer = 2.1
  e.spikes = Array.from({ length: 8 }, () => ({ cool: 0, warn: 0, ang: 0 }) satisfies SpikeSlot)
  e.nextEye = 8
  g.enemies.push(e)
}

function makeEnemy(g: Game, kind: Kind, x: number, y: number): Enemy {
  const strong = g.event === 'strong' ? 1.25 : 1
  const base =
    kind === 'cinder'
      ? { hp: 54, r: 11, speed: 62, touch: 8, name: 'Cinder wisp' }
      : kind === 'boss'
        ? { hp: 260, r: 42, speed: 48, touch: 14, name: 'The Briar' }
        : { hp: 42, r: 9, speed: 74, touch: 7, name: 'Wisp' }
  return {
    id: g.nextId++,
    kind,
    name: base.name,
    x,
    y,
    vx: 0,
    vy: 0,
    hp: base.hp * strong,
    maxHp: base.hp * strong,
    r: base.r,
    speed: base.speed,
    touch: base.touch,
    flash: 0,
    dead: false,
    resolved: false,
    mode: 0,
    timer: 1.6 + g.rng(),
    aim: 0,
    didHit: false,
    eyes: 0,
    nextEye: 8,
    spawnLeft: 0,
    spawnAcc: 0,
    spikes: [],
    trail: 0,
    bossRank: 1,
  }
}

function damageEnemy(e: Enemy, amount: number): void {
  if (e.dead) return
  e.hp -= amount
  e.flash = 0.08
  if (e.hp <= 0) e.dead = true
}

function resolveDeaths(g: Game): void {
  for (const e of g.enemies) {
    if (!e.dead || e.resolved) continue
    e.resolved = true
    g.kills += 1
    if (g.mods.leech > 0) {
      const sip = e.kind === 'boss' ? g.mods.leech * 4 : g.mods.leech
      g.heat = Math.min(g.mods.maxHeat, g.heat + sip)
    }
    if (e.kind === 'boss') {
      g.bossKills += 1
      g.events.push({ type: 'bossdead' })
      g.shake = 10
      puff(g, e.x, e.y, 'rgba(255,220,180,0.9)', 18, 120, 0.5, 3)
    } else {
      g.sparks.push({ x: e.x, y: e.y, value: 5.5, life: 11, taken: false })
      puff(g, e.x, e.y, e.kind === 'cinder' ? 'rgba(255,80,50,0.8)' : 'rgba(40,32,34,0.9)', 6, 50, 0.35, 2)
    }
  }
  compact(g.enemies, (e) => e.resolved)
}

function hurt(g: Game, amount: number, cause: string): void {
  if (g.state !== 'playing' || g.iframes > 0) return
  const lost = amount * g.mods.touchMult
  g.heat = Math.max(0, g.heat - lost)
  g.iframes = 0.46
  g.hurtFlash = 0.28
  g.shake = Math.max(g.shake, 5)
  g.lastBlow = cause
  g.events.push({ type: 'hurt' })
  if (g.heat <= 0) trySnuff(g, cause)
}

function trySnuff(g: Game, cause: string): void {
  if (g.heat > 0 || g.state !== 'playing') return
  if (g.mods.lastCoal && !g.coalSpent) {
    g.coalSpent = true
    g.heat = Math.max(18, g.mods.maxHeat * 0.22)
    g.iframes = Math.max(g.iframes, 0.9)
    g.shake = 8
    floater(g, g.player.x, g.player.y - 28, 'The coal cracks', '#f0b45a')
    puff(g, g.player.x, g.player.y, 'rgba(255,180,80,0.95)', 12, 90, 0.4, 2.4)
    if (g.mods.coalRing) {
      for (let i = 0; i < 10; i++) fireSpark(g, (i / 10) * TAU, g.mods.shotDamage * 0.8, false, true, 0.75)
    }
    return
  }
  beginDeath(g, cause)
}

function beginDeath(g: Game, cause: string): void {
  if (g.state === 'dying' || g.state === 'dead') return
  g.lastBlow = cause
  g.state = 'dying'
  g.dying = 0
  g.snuff = 1
  g.loadoutOpen = false
  g.events.push({ type: 'die' })
}

function ensureChunks(g: Game): void {
  const cx = Math.floor(g.player.x / CHUNK)
  const cy = Math.floor(g.player.y / CHUNK)
  for (let x = cx - 1; x <= cx + 1; x++) {
    for (let y = cy - 1; y <= cy + 1; y++) {
      const key = `${x},${y}`
      if (!g.chunks.has(key)) g.chunks.set(key, buildChunk(g.seed, x, y))
    }
  }
}

function buildChunk(seed: number, cx: number, cy: number): Chunk {
  const rng = mulberry32((seed ^ Math.imul(cx, 374761393) ^ Math.imul(cy, 668265263)) >>> 0)
  const obstacles: Obstacle[] = []
  const hazards: Hazard[] = []
  const sparks: Spark[] = []
  const stones = 1 + (rng() < 0.45 ? 1 : 0)
  for (let i = 0; i < stones; i++) {
    obstacles.push({
      x: cx * CHUNK + 80 + rng() * (CHUNK - 160),
      y: cy * CHUNK + 80 + rng() * (CHUNK - 160),
      r: 26 + rng() * 18,
    })
  }
  if (rng() < 0.4) {
    hazards.push({
      x: cx * CHUNK + 100 + rng() * (CHUNK - 200),
      y: cy * CHUNK + 100 + rng() * (CHUNK - 200),
      r: 30 + rng() * 16,
      dps: 6,
      kind: rng() < 0.6 ? 'pit' : 'bramble',
      tick: 0,
    })
  }
  if (rng() < 0.42) {
    sparks.push({
      x: cx * CHUNK + 60 + rng() * (CHUNK - 120),
      y: cy * CHUNK + 60 + rng() * (CHUNK - 120),
      value: 0,
      life: 0,
      taken: false,
    })
  }
  return { obstacles, hazards, sparks }
}

function obstaclesNear(g: Game, x: number, y: number): Obstacle[] {
  const found: Obstacle[] = []
  const cx = Math.floor(x / CHUNK)
  const cy = Math.floor(y / CHUNK)
  for (let ix = cx - 1; ix <= cx + 1; ix++) {
    for (let iy = cy - 1; iy <= cy + 1; iy++) {
      const chunk = g.chunks.get(`${ix},${iy}`)
      if (chunk) found.push(...chunk.obstacles)
    }
  }
  for (const extra of g.extras) {
    if (Math.hypot(extra.x - x, extra.y - y) < 240) found.push(extra)
  }
  return found
}

function hazardsNear(g: Game, x: number, y: number): Hazard[] {
  const found: Hazard[] = [...g.extraHazards]
  const cx = Math.floor(x / CHUNK)
  const cy = Math.floor(y / CHUNK)
  for (let ix = cx - 1; ix <= cx + 1; ix++) {
    for (let iy = cy - 1; iy <= cy + 1; iy++) {
      const chunk = g.chunks.get(`${ix},${iy}`)
      if (chunk) found.push(...chunk.hazards)
    }
  }
  return found
}

function sparksNear(g: Game, x: number, y: number): Spark[] {
  const found: Spark[] = []
  const cx = Math.floor(x / CHUNK)
  const cy = Math.floor(y / CHUNK)
  for (let ix = cx - 1; ix <= cx + 1; ix++) {
    for (let iy = cy - 1; iy <= cy + 1; iy++) {
      const chunk = g.chunks.get(`${ix},${iy}`)
      if (!chunk) continue
      for (const spark of chunk.sparks) {
        if (spark.value === 0) spark.value = g.mods.sparkValue
        found.push(spark)
      }
    }
  }
  return found
}

function blocked(g: Game, x: number, y: number, r: number): boolean {
  return obstaclesNear(g, x, y).some((o) => Math.hypot(o.x - x, o.y - y) < o.r + r)
}

function separateCircle(body: { x: number; y: number; vx?: number; vy?: number }, r: number, obstacles: Obstacle[]): void {
  for (const o of obstacles) {
    let dx = body.x - o.x
    let dy = body.y - o.y
    let d = Math.hypot(dx, dy)
    const min = r + o.r
    if (d >= min) continue
    if (d < 0.001) {
      dx = min
      dy = 0
      d = min
    }
    const push = (min - d) / d
    body.x += dx * push
    body.y += dy * push
    if (body.vx !== undefined && body.vy !== undefined) {
      const nx = dx / d
      const ny = dy / d
      const vn = body.vx * nx + body.vy * ny
      if (vn < 0) {
        body.vx -= vn * nx
        body.vy -= vn * ny
      }
    }
  }
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

function stepCosmetics(g: Game, dt: number): void {
  for (const p of g.particles) {
    p.life -= dt
    p.vy += p.grav * dt
    p.x += p.vx * dt
    p.y += p.vy * dt
  }
  compact(g.particles, (p) => p.life <= 0)
  if (g.particles.length > 420) g.particles.splice(0, g.particles.length - 420)
  for (const f of g.floaters) {
    f.life -= dt
    f.y += f.vy * dt
  }
  compact(g.floaters, (f) => f.life <= 0)
  for (const d of g.decor) d.spin += d.speed * dt
}

function puff(g: Game, x: number, y: number, color: string, n: number, speed: number, life: number, size: number): void {
  for (let i = 0; i < n; i++) {
    const ang = Math.random() * TAU
    const sp = speed * (0.3 + Math.random())
    g.particles.push({
      x,
      y,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp,
      life: life * (0.6 + Math.random() * 0.5),
      max: life,
      size: size * (0.6 + Math.random()),
      color,
      grav: 0,
    })
  }
}

function floater(g: Game, x: number, y: number, text: string, color: string): void {
  g.floaters.push({ x, y, vy: -18, text, life: 1.1, max: 1.1, color })
}

function distToSeg(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const abx = bx - ax
  const aby = by - ay
  const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / (abx * abx + aby * aby || 1)))
  return Math.hypot(px - (ax + abx * t), py - (ay + aby * t))
}

function compact<T>(arr: T[], remove: (item: T) => boolean): void {
  let write = 0
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i]!
    if (remove(item)) continue
    arr[write++] = item
  }
  arr.length = write
}
