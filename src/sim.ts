import { applyUpgrade, baseStats, eulogyFor, EVENT_COPY, lightOf } from './content.ts'
import { buildFloor, entryOf } from './dungeon.ts'
import { formatSeed, mulberry32 } from './rng.ts'
import type {
  Active,
  ControlMode,
  Dir,
  Enemy,
  FrameInput,
  Game,
  Kind,
  Mode,
  Pickup,
  Room,
  SpikeSlot,
} from './types.ts'
import { SLIDE_TIME, TILE } from './types.ts'
import { rollUpgrade, upgradeById, type UpgradeDef } from './upgrades.ts'

const TAU = Math.PI * 2

export interface RunOptions {
  mode: Mode
  seed: number
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
    dungeon: 1,
    bestAtStart: 0,
    heat: 50,
    maxHeat: 50,
    rekindle: 0,
    rekindleMax: 0,
    light: 168,
    coins: 0,
    kills: 0,
    bossKills: 0,
    stats: baseStats(),
    passives: [],
    active: null,
    control: 'mouse',
    pending: null,
    loadoutOpen: false,
    event: null,
    slip: false,
    rooms: [],
    roomIndex: 0,
    slide: null,
    player: { x: 0, y: 0, vx: 0, vy: 0 },
    facing: -Math.PI / 2,
    iframes: 0,
    burstCd: 0,
    burstT: 0,
    burstAng: 0,
    fireCd: 0.25,
    doorHold: 0,
    brambleCd: 0,
    enemies: [],
    bullets: [],
    pickups: [],
    particles: [],
    floaters: [],
    beams: [],
    warnings: [],
    decor: [],
    nextId: 1,
    near: null,
    nearId: null,
    banner: null,
    hint: '',
    tutor: false,
    lastBlow: 'the dark',
    dying: 0,
    snuff: 1,
    shake: 0,
    hurtFlash: 0,
    whiteFlash: 0,
    whiteFlashMax: 0,
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
  g.banner = null
  g.enemies = []
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
  g.rng = mulberry32((g.seed || 1) ^ 0x51ed)
  g.bestAtStart = opts.bestAtStart
  g.tutor = opts.tutor
  g.stats = baseStats()
  g.maxHeat = 50
  g.heat = g.maxHeat
  g.state = 'playing'
  g.dungeon = 1
  g.hint = opts.tutor ? 'Shots fire on their own.' : ''
  beginDungeon(g, false)
}

export function togglePause(g: Game): void {
  if (g.state === 'playing') g.state = 'paused'
  else if (g.state === 'paused') g.state = 'playing'
}

export function toggleLoadout(g: Game): void {
  if (g.state === 'playing' || g.state === 'paused') g.loadoutOpen = !g.loadoutOpen
}

export function endRun(g: Game): void {
  if (g.state === 'playing' || g.state === 'paused') beginDeath(g, 'you let go')
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
  if (g.state === 'paused' || g.state === 'dead') return
  if (g.state === 'dying') {
    g.dying += dt
    g.snuff = Math.max(0, 1 - g.dying / 0.85)
    stepCosmetics(g, dt)
    if (g.dying >= 0.85) {
      g.state = 'dead'
      g.eulogy = eulogyFor(g.lastBlow)
    }
    return
  }

  if (g.slide) {
    stepSlide(g, dt)
    stepRekindle(g, dt)
    stepRoomFx(g, dt)
    stepCosmetics(g, dt)
    return
  }

  g.slip = g.event === 'slip'
  g.light = lightOf(g.heat, g.maxHeat, g.event === 'fog' ? 160 : 240)
  g.time += dt
  g.iframes = Math.max(0, g.iframes - dt)
  g.burstCd = Math.max(0, g.burstCd - dt)
  g.doorHold = Math.max(0, g.doorHold - dt)
  g.brambleCd = Math.max(0, g.brambleCd - dt)
  g.shake = Math.max(0, g.shake - dt * 28)
  g.hurtFlash = Math.max(0, g.hurtFlash - dt)
  stepRoomFx(g, dt)
  if (g.dungeon > 1) g.hint = ''

  stepPlayer(g, input, dt)
  stepHazards(g, dt)
  stepPickups(g, dt)
  if (g.rekindle <= 0) starve(g, dt)
  if (g.state !== 'playing') {
    stepCosmetics(g, dt)
    return
  }
  if (input.use) useActive(g)
  if (input.interact) interact(g)
  senseNear(g)
  stepShots(g, dt)
  stepBullets(g, dt)
  stepEnemies(g, dt)
  resolveDeaths(g)
  watchClear(g)
  tryDoor(g)
  stepRekindle(g, dt)
  g.light = lightOf(g.heat, g.maxHeat, g.event === 'fog' ? 160 : 240)
  stepCosmetics(g, dt)
}

function beginDungeon(g: Game, stair: boolean): void {
  const plan = buildFloor(g.seed || 1, g.dungeon)
  g.rooms = plan.rooms
  g.event = plan.event
  g.roomIndex = 0
  g.slide = null
  g.rekindle = 0
  g.rekindleMax = 0
  g.enemies = []
  g.bullets = []
  g.beams = []
  g.warnings = []
  const here = room(g)
  here.visited = true
  g.pickups = here.coins
  const mid = center(here)
  g.player.x = mid.x
  g.player.y = mid.y
  g.doorHold = 0.4
  const twist = g.event ? ` ${EVENT_COPY[g.event].title}: ${EVENT_COPY[g.event].sub}` : ''
  g.banner = {
    title: `Dungeon ${g.dungeon}`,
    sub: stair
      ? `The stair let you down. Clear each room to open its doors.${twist}`
      : `Clear each room to open its doors. The last room is the Briar.${twist}`,
    life: 3.6,
  }
  g.events.push({ type: 'level' })
}

function room(g: Game): Room {
  return g.rooms[g.roomIndex] ?? g.rooms[0]!
}

function center(r: Room): { x: number; y: number } {
  return { x: (r.w * TILE) / 2, y: (r.h * TILE) / 2 }
}

function goTo(g: Game, index: number, from: Dir): void {
  g.roomIndex = index
  const here = room(g)
  const first = !here.visited
  here.visited = true
  g.enemies = []
  g.bullets = []
  g.beams = []
  g.warnings = []
  g.pickups = here.coins
  if (!here.spawned) {
    here.spawned = true
    for (const spawn of here.spawns) g.enemies.push(makeEnemy(g, spawn.kind, spawn.x, spawn.y))
    if (here.kind === 'boss') g.events.push({ type: 'boss' })
  }
  const at = entryOf(here, from)
  g.player.x = at.x
  g.player.y = at.y
  g.player.vx = 0
  g.player.vy = 0
  shoveEnemies(g)
  g.doorHold = 0.45
  noticePedestals(here)
  if (first && here.kind === 'boss') {
    g.banner = {
      title: 'The Briar',
      sub: 'Spikes on its body spin, slow, then fire across the room. Clear it, then take the stair.',
      life: 3.4,
    }
  }
}

function stepPlayer(g: Game, input: FrameInput, dt: number): void {
  let speed = 170 * g.stats.speed
  if (input.burst && g.burstCd <= 0 && g.heat > 9) {
    const ang = Math.hypot(input.ax, input.ay) > 0.2 ? Math.atan2(input.ay, input.ax) : g.facing
    g.burstT = 0.12
    g.burstCd = 1.15
    g.burstAng = ang
    g.facing = ang
    g.heat = Math.max(1, g.heat - 5)
    g.iframes = Math.max(g.iframes, 0.18)
    g.events.push({ type: 'burst' })
    puff(g, g.player.x, g.player.y, 'rgba(255,186,90,0.9)', 8, 90, 0.35, 2.2)
    strikeBurst(g)
  }
  if (g.burstT > 0) {
    g.burstT -= dt
    g.player.vx = Math.cos(g.burstAng) * 640
    g.player.vy = Math.sin(g.burstAng) * 640
  } else if (g.slip) {
    g.player.vx += input.ax * speed * 3.1 * dt
    g.player.vy += input.ay * speed * 3.1 * dt
    g.player.vx *= Math.exp(-1.15 * dt)
    g.player.vy *= Math.exp(-1.15 * dt)
    const mag = Math.hypot(g.player.vx, g.player.vy)
    const cap = speed * 1.15
    if (mag > cap) {
      g.player.vx = (g.player.vx / mag) * cap
      g.player.vy = (g.player.vy / mag) * cap
    }
  } else {
    g.player.vx = input.ax * speed
    g.player.vy = input.ay * speed
  }
  if (Math.hypot(g.player.vx, g.player.vy) > 20) g.facing = Math.atan2(g.player.vy, g.player.vx)
  const here = room(g)
  moveCircle(here, g.player, 11, dt)
}

function strikeBurst(g: Game): void {
  const reach = 78
  const x2 = g.player.x + Math.cos(g.burstAng) * reach
  const y2 = g.player.y + Math.sin(g.burstAng) * reach
  for (const e of g.enemies) {
    if (e.dead) continue
    if (distToSeg(e.x, e.y, g.player.x, g.player.y, x2, y2) > e.r + 16) continue
    damageEnemy(e, g.stats.damage * 4)
  }
}

function stepHazards(g: Game, dt: number): void {
  const here = room(g)
  const tile = tileAt(here, g.player.x, g.player.y)
  if (tile === 3) {
    g.heat = Math.max(0, g.heat - (8 + g.dungeon) * dt)
    if (g.heat <= 0) beginDeath(g, 'a pit')
  } else if (tile === 4 && g.brambleCd <= 0) {
    g.brambleCd = 0.55
    hurt(g, 9, 'bramble')
  }
}

function stepPickups(g: Game, dt: number): void {
  const here = room(g)
  const reach = 28 + g.stats.magnet
  for (const item of g.pickups) {
    if (item.taken) continue
    if (item.kind === 'spark') {
      const d = Math.hypot(item.x - g.player.x, item.y - g.player.y)
      if (d < reach && d > 0) {
        const tug = d < 16 ? 1 : (140 * dt) / Math.max(16, d)
        item.x += (g.player.x - item.x) * Math.min(1, tug)
        item.y += (g.player.y - item.y) * Math.min(1, tug)
      }
      if (d < 16) takePickup(g, item)
    } else {
      coast(here, item, 6, dt)
      if (Math.hypot(item.x - g.player.x, item.y - g.player.y) < 14) takePickup(g, item)
    }
  }
  if (here.chest) coast(here, here.chest, 14, dt)
}

function takePickup(g: Game, item: Pickup): void {
  if (item.taken) return
  item.taken = true
  if (item.kind === 'coin') {
    g.coins += 1
    floater(g, item.x, item.y - 12, '+1', '#f0b45a')
    shine(g, item.x, item.y)
  } else {
    g.heat = Math.min(g.maxHeat, g.heat + 7)
    floater(g, item.x, item.y - 12, '+7 heat', '#ffb15a')
    puff(g, item.x, item.y, 'rgba(255,190,80,0.9)', 5, 40, 0.3, 1.6)
  }
  g.events.push({ type: 'collect' })
}

function shine(g: Game, x: number, y: number): void {
  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * TAU + g.rng() * 0.25
    const mag = 70 + g.rng() * 110
    g.particles.push({
      x,
      y,
      vx: Math.cos(ang) * mag,
      vy: Math.sin(ang) * mag,
      life: 0.34,
      max: 0.34,
      size: i % 3 === 0 ? 2.6 : 1.35,
      color: i % 2 === 0 ? 'rgba(255,248,230,0.95)' : 'rgba(255,206,96,0.92)',
      grav: 0,
    })
  }
}

function coast(
  r: Room,
  body: { x: number; y: number; vx: number; vy: number },
  radius: number,
  dt: number,
): void {
  body.vx *= Math.exp(-3.2 * dt)
  body.vy *= Math.exp(-3.2 * dt)
  if (Math.hypot(body.vx, body.vy) < 4) {
    body.vx = 0
    body.vy = 0
  }
  const nx = body.x + body.vx * dt
  if (!hitsSolid(r, nx, body.y, radius)) body.x = nx
  else body.vx *= -0.45
  const ny = body.y + body.vy * dt
  if (!hitsSolid(r, body.x, ny, radius)) body.y = ny
  else body.vy *= -0.45
}

function starve(g: Game, dt: number): void {
  const rate = (0.85 + Math.min(1.8, (g.dungeon - 1) * 0.09)) * (g.event === 'starve' ? 1.5 : 1)
  g.heat = Math.max(0, g.heat - rate * dt)
  if (g.heat <= 0) beginDeath(g, 'hunger')
}

function useActive(g: Game): void {
  if (!g.active) {
    floater(g, g.player.x, g.player.y - 18, 'No active item', '#d9cfc4')
    return
  }
  if (g.active.charge < g.active.charges) {
    floater(g, g.player.x, g.player.y - 18, `${g.active.charge}/${g.active.charges}`, '#d9cfc4')
    return
  }
  g.active.charge = 0
  floater(g, g.player.x, g.player.y - 18, g.active.name, '#ffe1a3')
  if (g.active.use === 'blue') {
    g.heat = Math.min(g.maxHeat, g.heat + 6)
    puff(g, g.player.x, g.player.y, 'rgba(158,183,216,0.9)', 10, 80, 0.35, 2.2)
    return
  }
  if (g.active.use === 'dawn') {
    g.heat = Math.min(g.maxHeat, g.heat + 12)
    puff(g, g.player.x, g.player.y, 'rgba(255,250,242,0.95)', 14, 110, 0.45, 2.4)
    return
  }
  puff(g, g.player.x, g.player.y, 'rgba(255,225,163,0.8)', 8, 70, 0.3, 2)
}

function interact(g: Game): void {
  const here = room(g)
  const pedestal = nearestPedestal(g, 42)
  if (pedestal && pedestal.upgradeId && !pedestal.taken) {
    if (here.treasureTaken) {
      floater(g, pedestal.x, pedestal.y - 28, 'You already chose', '#d9cfc4')
      return
    }
    const def = upgradeById(pedestal.upgradeId)
    if (!def) return
    here.treasureTaken = true
    for (const item of here.pedestals) item.taken = true
    if (def.kind === 'active') equipActive(g, def, pedestal.x, pedestal.y)
    else grantPassive(g, def)
    floater(g, pedestal.x, pedestal.y - 28, def.name, '#ffe1a3')
    g.events.push({ type: 'collect' })
    return
  }
  const chest = here.chest
  if (chest && !chest.opened && Math.hypot(chest.x - g.player.x, chest.y - g.player.y) < 42) {
    openChest(g, chest.x, chest.y)
    chest.opened = true
    return
  }
  if (here.stair && Math.hypot(center(here).x - g.player.x, center(here).y + 70 - g.player.y) < 42) {
    if (g.rekindle > 0) g.heat = g.maxHeat
    g.rekindle = 0
    g.dungeon += 1
    beginDungeon(g, true)
  }
}

function grantPassive(g: Game, def: UpgradeDef): void {
  applyUpgrade(g.stats, def)
  if (def.maxHeat) {
    g.maxHeat += def.maxHeat
    g.heat = Math.min(g.maxHeat, g.heat + def.maxHeat)
  }
  g.passives.push(def.id)
}

function equipActive(g: Game, def: UpgradeDef, x: number, y: number): void {
  const previous = g.active
  const active: Active = {
    id: def.id,
    name: def.name,
    description: def.description,
    charges: Math.max(1, def.charges ?? 3),
    charge: 0,
    use: def.use ?? '',
  }
  g.active = active
  if (previous && previous.id !== def.id) floater(g, x, y - 46, `Swapped out ${previous.name}`, '#d9cfc4')
}

function openChest(g: Game, x: number, y: number): void {
  const coins = 2 + Math.floor(g.rng() * 3)
  for (let i = 0; i < coins; i++) {
    const ang = g.rng() * TAU + i * 0.7
    const speed = 70 + g.rng() * 90
    room(g).coins.push({
      x: x + Math.cos(ang) * 10,
      y: y + Math.sin(ang) * 10,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      kind: 'coin',
      taken: false,
    })
  }
  const chance = Math.min(0.45, 0.08 + Math.max(0, g.stats.luck) * 0.03)
  const def = g.rng() < chance ? rollUpgrade(g.rng) : null
  if (def) {
    if (def.kind === 'active') equipActive(g, def, x, y)
    else grantPassive(g, def)
    floater(g, x, y - 28, def.name, '#ffe1a3')
  } else {
    floater(g, x, y - 22, `${coins} coins`, '#f0b45a')
  }
  g.events.push({ type: 'collect' })
}

function nearestPedestal(g: Game, reach: number) {
  let best: Room['pedestals'][number] | null = null
  let dist = reach
  for (const pedestal of room(g).pedestals) {
    const d = Math.hypot(pedestal.x - g.player.x, pedestal.y - g.player.y)
    if (d < dist) {
      dist = d
      best = pedestal
    }
  }
  return best
}

function senseNear(g: Game): void {
  g.near = null
  g.nearId = null
  const pedestal = nearestPedestal(g, 78)
  if (pedestal) {
    g.near = 'pedestal'
    g.nearId = pedestal.upgradeId
    return
  }
  const here = room(g)
  if (here.chest && !here.chest.opened && Math.hypot(here.chest.x - g.player.x, here.chest.y - g.player.y) < 56) {
    g.near = 'chest'
    return
  }
  const stair = { x: center(here).x, y: center(here).y + 70 }
  if (here.stair && Math.hypot(stair.x - g.player.x, stair.y - g.player.y) < 56) g.near = 'stair'
}

function stepShots(g: Game, dt: number): void {
  g.fireCd -= dt
  if (g.fireCd > 0) return
  const target = nearest(g, g.player.x, g.player.y, 460)
  if (!target) return
  g.fireCd = 1 / g.stats.tears
  const ang = Math.atan2(target.y - g.player.y, target.x - g.player.x)
  g.facing = ang
  const speed = 150 * g.stats.shotSpeed
  const life = (g.stats.range * 28) / speed
  g.bullets.push({
    x: g.player.x + Math.cos(ang) * 14,
    y: g.player.y + Math.sin(ang) * 14,
    vx: Math.cos(ang) * speed,
    vy: Math.sin(ang) * speed,
    life,
    max: life,
    damage: g.stats.damage,
    hearts: 0,
    pierce: 1,
    r: 3.2 + Math.min(3, g.stats.damage * 0.25),
    hit: [],
    friendly: true,
    child: false,
    fade: 0,
  })
}

function stepBullets(g: Game, dt: number): void {
  const here = room(g)
  for (const b of g.bullets) {
    if (b.fade > 0) {
      b.fade -= dt
      if (b.fade <= 0) b.life = 0
      continue
    }
    b.life -= dt
    b.x += b.vx * dt
    b.y += b.vy * dt
    if (solidAt(here, b.x, b.y, false)) {
      const mag = Math.hypot(b.vx, b.vy) || 1
      b.x -= (b.vx / mag) * 8
      b.y -= (b.vy / mag) * 8
      b.fade = 0.14
      continue
    }
    if (!b.friendly) {
      if (Math.hypot(b.x - g.player.x, b.y - g.player.y) < b.r + 11) {
        b.life = 0
        hurt(g, 12, 'a spike')
      }
      continue
    }
    for (const e of g.enemies) {
      if (e.dead || b.hit.includes(e.id)) continue
      if (Math.hypot(b.x - e.x, b.y - e.y) > b.r + e.r) continue
      b.hit.push(e.id)
      b.pierce -= 1
      damageEnemy(e, b.damage)
      puff(g, b.x, b.y, 'rgba(255,210,140,0.85)', 3, 50, 0.22, 1.4)
      if (b.pierce <= 0) {
        b.life = 0
        break
      }
    }
  }
  compact(g.bullets, (b) => b.life <= 0)
}

function stepEnemies(g: Game, dt: number): void {
  const here = room(g)
  const haste = g.event === 'haste' ? 1.22 : 1
  for (const e of g.enemies) {
    if (e.dead) continue
    e.flash = Math.max(0, e.flash - dt)
    if (e.arrive < 1) e.arrive = Math.min(1, e.arrive + dt / 0.5)
    if (e.arrive < 1) {
      e.vx = 0
      e.vy = 0
      continue
    }
    if (e.kind === 'boss') stepBoss(g, e, dt)
    else if (e.kind === 'cinder') stepCinder(g, e, dt, haste)
    else stepWisp(g, e, dt, haste)
    if (e.kind !== 'boss') moveCircle(here, e, e.r, dt)
    else moveCircle(here, e, e.r * 0.8, dt)
    if (e.arrive >= 0.85 && Math.hypot(e.x - g.player.x, e.y - g.player.y) < e.r + 12) hurt(g, e.touch, e.name)
  }
  separateEnemies(g)
  unstick(g)
  for (const e of g.enemies) {
    if (!e.dead) leaveTrail(g, e)
  }
  for (const w of g.warnings) w.life -= dt
  compact(g.warnings, (w) => w.life <= 0)
  for (const beam of g.beams) beam.life -= dt
  compact(g.beams, (b) => b.life <= 0)
}

function stepWisp(g: Game, e: Enemy, dt: number, haste: number): void {
  chase(g, e, dt, e.speed * haste)
}

function stepCinder(g: Game, e: Enemy, dt: number, haste: number): void {
  e.timer -= dt
  const reach = 200
  if (e.mode === 0) {
    chase(g, e, dt, e.speed * haste * 0.92)
    if (e.timer <= 0 && Math.hypot(e.x - g.player.x, e.y - g.player.y) < 280) {
      e.mode = 1
      e.timer = 0.7
      e.aim = Math.atan2(g.player.y - e.y, g.player.x - e.x)
      e.didHit = false
      g.warnings.push({ x: e.x, y: e.y, ang: e.aim, len: reach, life: 0.7, max: 0.7, thin: true })
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
      len: reach,
      width: 3,
      life: 0.18,
      max: 0.18,
      color: 'rgba(255, 70, 48, 0.9)',
    })
    g.events.push({ type: 'beam' })
  }
  e.vx = 0
  e.vy = 0
  if (
    !e.didHit &&
    distToSeg(g.player.x, g.player.y, e.x, e.y, e.x + Math.cos(e.aim) * reach, e.y + Math.sin(e.aim) * reach) < 8
  ) {
    e.didHit = true
    hurt(g, 14, 'a red glare')
  }
  if (e.timer <= 0) {
    e.mode = 0
    e.timer = 2.4 + g.rng() * 0.8
  }
}

const SPIKE_SPIN = 2.4
const SPIKE_LIFE = 1.15
const SPIKE_SPEED = 280
const SPIKE_AIM = 0.62

function stepBoss(g: Game, e: Enemy, dt: number): void {
  if (e.mode === 2) {
    e.vx = 0
    e.vy = 0
  } else chase(g, e, dt, e.speed * (e.mode === 1 ? 0.45 : 1))
  for (const slot of e.spikes) if (slot.cool > 0) slot.cool = Math.max(0, slot.cool - dt)
  if (e.mode === 0) {
    e.aim += SPIKE_SPIN * dt
    e.timer -= dt
    if (e.timer <= 0) {
      e.mode = 1
      e.timer = 1.05
    }
  } else if (e.mode === 1) {
    e.aim += SPIKE_SPIN * Math.max(0, e.timer / 1.05) * dt
    e.timer -= dt
    if (e.timer <= 0) {
      e.mode = 2
      e.vx = 0
      e.vy = 0
      const n = Math.max(1, e.spikes.length)
      e.spikes.forEach((slot, i) => {
        const spin = e.aim + (i / n) * TAU
        slot.show = spin
        if (slot.cool > 0) return
        slot.from = spin
        slot.ang = g.rng() * TAU
        slot.warn = SPIKE_AIM
        g.warnings.push({
          x: e.x,
          y: e.y,
          ang: slot.ang,
          len: SPIKE_SPEED * SPIKE_LIFE,
          life: SPIKE_AIM,
          max: SPIKE_AIM,
          thin: false,
        })
      })
    }
  } else {
    let pending = false
    for (const slot of e.spikes) {
      if (slot.warn <= 0) continue
      pending = true
      slot.warn -= dt
      const along = 1 - Math.max(0, slot.warn) / SPIKE_AIM
      const eased = along * along * (3 - 2 * along)
      slot.show = lerpAngle(slot.from, slot.ang, Math.min(1, eased))
      if (slot.warn > 0) continue
      slot.show = slot.ang
      g.bullets.push({
        x: e.x + Math.cos(slot.ang) * e.r,
        y: e.y + Math.sin(slot.ang) * e.r,
        vx: Math.cos(slot.ang) * SPIKE_SPEED,
        vy: Math.sin(slot.ang) * SPIKE_SPEED,
        life: SPIKE_LIFE,
        max: SPIKE_LIFE,
        damage: 0,
        hearts: 0,
        pierce: 1,
        r: 5,
        hit: [],
        friendly: false,
        child: false,
        fade: 0,
      })
      slot.cool = 1.4
      slot.warn = 0
    }
    if (!pending) {
      e.mode = 0
      e.timer = 2.1
    }
  }
}

function chase(g: Game, e: Enemy, dt: number, speed: number): void {
  const ang = Math.atan2(g.player.y - e.y, g.player.x - e.x)
  e.vx = Math.cos(ang) * speed
  e.vy = Math.sin(ang) * speed
  void dt
}

function makeEnemy(g: Game, kind: Kind, x: number, y: number): Enemy {
  const strong = g.event === 'strong' ? 1.28 : 1
  const rank = g.dungeon
  const base =
    kind === 'cinder'
      ? { hp: (14 + rank * 3) * strong * (2 / 3), r: 11, speed: 58, touch: 11, name: 'Cinder wisp' }
      : kind === 'boss'
        ? { hp: (120 + rank * 48) * strong * (2 / 3), r: 36, speed: 34 + rank, touch: 16, name: 'The Briar' }
        : { hp: (8 + rank * 2) * strong * (2 / 3), r: 9, speed: 72, touch: 9, name: 'Wisp' }
  return {
    id: g.nextId++,
    kind,
    name: base.name,
    x,
    y,
    vx: 0,
    vy: 0,
    hp: base.hp,
    maxHp: base.hp,
    r: base.r,
    speed: base.speed,
    touch: base.touch,
    flash: 0,
    arrive: 0,
    dead: false,
    resolved: false,
    mode: 0,
    timer: kind === 'boss' ? 1.8 : 1.2 + g.rng(),
    aim: g.rng() * TAU,
    didHit: false,
    eyes: 0,
    nextEye: 99,
    spikes:
      kind === 'boss'
        ? Array.from({ length: 8 }, () => ({ cool: 0, warn: 0, ang: 0, from: 0, show: 0 }) satisfies SpikeSlot)
        : [],
    trail: 0,
    prevX: x,
    prevY: y,
    bossRank: rank,
  }
}

function damageEnemy(e: Enemy, amount: number): void {
  if (e.dead || amount <= 0) return
  e.hp -= amount
  e.flash = 0.08
  if (e.hp <= 0) e.dead = true
}

function resolveDeaths(g: Game): void {
  for (const e of g.enemies) {
    if (!e.dead || e.resolved) continue
    e.resolved = true
    g.kills += 1
    if (e.kind === 'boss') {
      g.bossKills += 1
      g.events.push({ type: 'bossdead' })
      g.shake = 10
      puff(g, e.x, e.y, 'rgba(255,220,180,0.9)', 16, 110, 0.45, 3)
      beginRekindle(g, e.x, e.y)
    } else {
      room(g).coins.push({ x: e.x, y: e.y, vx: 0, vy: 0, kind: 'spark', taken: false })
      puff(g, e.x, e.y, e.kind === 'cinder' ? 'rgba(255,80,50,0.8)' : 'rgba(40,32,34,0.9)', 6, 50, 0.35, 2)
    }
  }
  compact(g.enemies, (e) => e.resolved)
}

function watchClear(g: Game): void {
  const here = room(g)
  if (here.cleared || !here.spawned) return
  if (g.enemies.some((e) => !e.dead)) return
  here.cleared = true
  floater(g, g.player.x, g.player.y - 26, 'Doors open', '#f6efe4')
  if (g.active) g.active.charge = Math.min(g.active.charges, g.active.charge + (here.kind === 'boss' ? 2 : 1))
  if (here.kind === 'combat' && !here.dropGiven) {
    here.dropGiven = true
    const chance = Math.min(0.9, 0.38 + Math.max(0, g.stats.luck) * 0.06)
    if (g.rng() < chance) {
      const roll = g.rng()
      const kind = roll < 0.7 ? 'coin' : 'spark'
      const ang = g.rng() * TAU
      const speed = kind === 'coin' ? 70 + g.rng() * 90 : 0
      here.coins.push({
        x: g.player.x + Math.cos(ang) * 18,
        y: g.player.y + Math.sin(ang) * 18,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        kind,
        taken: false,
      })
    }
  }
  if (here.kind === 'boss') {
    here.stair = true
    const ang = g.rng() * TAU
    const speed = 36 + g.rng() * 40
    here.chest = {
      x: center(here).x + 54,
      y: center(here).y + 36,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      opened: false,
      coins: 0,
      upgradeId: null,
    }
  }
}

function tryDoor(g: Game): void {
  if (g.doorHold > 0) return
  const here = room(g)
  if (!here.cleared) return
  const tx = Math.floor(g.player.x / TILE)
  const ty = Math.floor(g.player.y / TILE)
  for (const door of here.doors) {
    const across = door.dir === 'n' || door.dir === 's'
    const on =
      (tx === door.tx && ty === door.ty) ||
      (across && tx === door.tx + 1 && ty === door.ty) ||
      (!across && tx === door.tx && ty === door.ty + 1)
    if (!on) continue
    const dest = g.rooms[door.to]
    if (dest && roomHasUnseenTier4(dest)) {
      g.whiteFlash = 0.7
      g.whiteFlashMax = 0.7
    }
    g.slide = { from: g.roomIndex, to: door.to, dir: door.dir, t: 0, settled: false }
    return
  }
}

const REVEAL_FOR_TIER: Partial<Record<UpgradeDef['tier'], number>> = {
  2: 0.9,
  3: 1.5,
  4: 2,
}

function roomHasUnseenTier4(here: Room): boolean {
  return here.pedestals.some((pedestal) => {
    if (pedestal.seen || pedestal.taken || !pedestal.upgradeId) return false
    return upgradeById(pedestal.upgradeId)?.tier === 4
  })
}

function noticePedestals(here: Room): void {
  for (const pedestal of here.pedestals) {
    if (pedestal.seen || pedestal.taken || !pedestal.upgradeId) continue
    const def = upgradeById(pedestal.upgradeId)
    pedestal.seen = true
    const reveal = def ? REVEAL_FOR_TIER[def.tier] : 0
    if (reveal) pedestal.reveal = reveal
  }
}

function stepRoomFx(g: Game, dt: number): void {
  g.whiteFlash = Math.max(0, g.whiteFlash - dt)
  for (const here of g.rooms) {
    for (const pedestal of here.pedestals) {
      if (pedestal.reveal > 0) pedestal.reveal = Math.max(0, pedestal.reveal - dt)
    }
  }
}

function stepSlide(g: Game, dt: number): void {
  const slide = g.slide
  if (!slide) return
  if (slide.settled) {
    const dir = slide.dir
    const to = slide.to
    g.slide = null
    goTo(g, to, opposite(dir))
    return
  }
  slide.t = Math.min(SLIDE_TIME, slide.t + dt)
  if (slide.t >= SLIDE_TIME) slide.settled = true
}

function shoveEnemies(g: Game): void {
  const here = room(g)
  for (const e of g.enemies) {
    let dx = e.x - g.player.x
    let dy = e.y - g.player.y
    let dist = Math.hypot(dx, dy)
    if (dist >= 110) continue
    if (dist < 0.001) {
      const mid = center(here)
      dx = mid.x - g.player.x || 1
      dy = mid.y - g.player.y
      dist = Math.hypot(dx, dy) || 1
    }
    const nx = dx / dist
    const ny = dy / dist
    let x = g.player.x + nx * 110
    let y = g.player.y + ny * 110
    for (let step = 0; step < 6 && hitsSolid(here, x, y, e.r); step++) {
      x += nx * 18
      y += ny * 18
    }
    if (hitsSolid(here, x, y, Math.min(e.r, 12))) {
      const spot = nearestOpen(here, e.x, e.y, Math.min(e.r, 12))
      if (spot) {
        x = spot.x
        y = spot.y
      }
    }
    e.x = x
    e.y = y
    e.prevX = x
    e.prevY = y
  }
}

function lerpAngle(from: number, to: number, t: number): number {
  let delta = (to - from) % TAU
  if (delta > Math.PI) delta -= TAU
  if (delta < -Math.PI) delta += TAU
  return from + delta * t
}

function opposite(dir: Dir): Dir {
  if (dir === 'n') return 's'
  if (dir === 's') return 'n'
  if (dir === 'e') return 'w'
  return 'e'
}

function hurt(g: Game, amount: number, cause: string): void {
  if (g.state !== 'playing' || g.iframes > 0 || amount <= 0) return
  const spent = amount * (g.event === 'strong' ? 1.25 : 1)
  g.heat = Math.max(0, g.heat - spent)
  g.iframes = 0.4
  g.hurtFlash = 0.28
  g.shake = Math.max(g.shake, 5)
  g.lastBlow = cause
  g.events.push({ type: 'hurt' })
  if (g.heat <= 0) beginDeath(g, cause)
}

function leaveTrail(g: Game, e: Enemy): void {
  const dx = e.x - e.prevX
  const dy = e.y - e.prevY
  e.prevX = e.x
  e.prevY = e.y
  if (e.kind === 'boss' || e.arrive < 1) return
  const moved = Math.hypot(dx, dy)
  if (moved < 0.8) return
  const size = e.kind === 'cinder' ? 6.5 : 8
  const back = e.r + size * 0.55
  g.particles.push({
    x: e.x - (dx / moved) * back,
    y: e.y - (dy / moved) * back,
    vx: 0,
    vy: 0,
    life: 0.22,
    max: 0.22,
    size,
    color: e.kind === 'cinder' ? 'rgba(90, 18, 14, 0.45)' : 'rgba(28, 24, 26, 0.55)',
    grav: 0,
    behind: true,
  })
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

function tileAt(r: Room, x: number, y: number): number {
  const tx = Math.floor(x / TILE)
  const ty = Math.floor(y / TILE)
  if (tx < 0 || ty < 0 || tx >= r.w || ty >= r.h) return 1
  return r.tiles[ty * r.w + tx] ?? 1
}

function isDoor(r: Room, tx: number, ty: number): boolean {
  for (const door of r.doors) {
    const across = door.dir === 'n' || door.dir === 's'
    if (tx === door.tx && ty === door.ty) return true
    if (across && tx === door.tx + 1 && ty === door.ty) return true
    if (!across && tx === door.tx && ty === door.ty + 1) return true
  }
  return false
}

function solidAt(r: Room, x: number, y: number, forBody: boolean): boolean {
  const tx = Math.floor(x / TILE)
  const ty = Math.floor(y / TILE)
  if (tx < 0 || ty < 0 || tx >= r.w || ty >= r.h) return true
  if (!r.cleared && isDoor(r, tx, ty)) return true
  const tile = r.tiles[ty * r.w + tx] ?? 1
  if (!forBody && (tile === 3 || tile === 4)) return false
  return tile === 1 || tile === 2
}

function hitsSolid(r: Room, x: number, y: number, radius: number): boolean {
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * TAU
    if (solidAt(r, x + Math.cos(ang) * radius, y + Math.sin(ang) * radius, true)) return true
  }
  return solidAt(r, x, y, true)
}

function moveCircle(r: Room, body: { x: number; y: number; vx: number; vy: number }, radius: number, dt: number): void {
  const nx = body.x + body.vx * dt
  if (!hitsSolid(r, nx, body.y, radius)) body.x = nx
  else body.vx = 0
  const ny = body.y + body.vy * dt
  if (!hitsSolid(r, body.x, ny, radius)) body.y = ny
  else body.vy = 0
}

function separateEnemies(g: Game): void {
  const live = g.enemies.filter((e) => !e.dead)
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < live.length; i++) {
      const a = live[i]!
      for (let j = i + 1; j < live.length; j++) {
        const b = live[j]!
        let dx = b.x - a.x
        let dy = b.y - a.y
        let dist = Math.hypot(dx, dy)
        const min = a.r + b.r
        if (dist >= min) continue
        if (dist < 0.001) {
          dx = 1
          dy = 0
          dist = 1
        }
        const push = (min - dist) / 2
        const nx = dx / dist
        const ny = dy / dist
        const ax = a.x - nx * push
        const ay = a.y - ny * push
        const bx = b.x + nx * push
        const by = b.y + ny * push
        const here = room(g)
        if (!solidAt(here, ax, ay, true)) {
          a.x = ax
          a.y = ay
        }
        if (!solidAt(here, bx, by, true)) {
          b.x = bx
          b.y = by
        }
      }
    }
  }
}

function unstick(g: Game): void {
  const here = room(g)
  for (const e of g.enemies) {
    if (e.dead || !solidAt(here, e.x, e.y, true)) continue
    const spot = nearestOpen(here, e.x, e.y, Math.min(e.r, 12))
    if (!spot) continue
    e.x = spot.x
    e.y = spot.y
    e.prevX = spot.x
    e.prevY = spot.y
  }
}

function nearestOpen(room: Room, x: number, y: number, radius: number): { x: number; y: number } | null {
  const clear = (px: number, py: number) => !hitsSolid(room, px, py, radius)
  if (clear(x, y)) return { x, y }
  for (let dist = 10; dist <= 240; dist += 10) {
    const steps = 12 + Math.floor(dist / 16)
    for (let i = 0; i < steps; i++) {
      const ang = (i / steps) * TAU
      const px = x + Math.cos(ang) * dist
      const py = y + Math.sin(ang) * dist
      if (clear(px, py)) return { x: px, y: py }
    }
  }
  for (let ty = 1; ty < room.h - 1; ty++) {
    for (let tx = 1; tx < room.w - 1; tx++) {
      const px = (tx + 0.5) * TILE
      const py = (ty + 0.5) * TILE
      if (clear(px, py)) return { x: px, y: py }
    }
  }
  return null
}

function nearest(g: Game, x: number, y: number, range: number): Enemy | null {
  let best: Enemy | null = null
  let dist = range
  for (const e of g.enemies) {
    if (e.dead) continue
    const d = Math.hypot(e.x - x, e.y - y)
    if (d < dist) {
      dist = d
      best = e
    }
  }
  return best
}

const REKINDLE = 1.2

function beginRekindle(g: Game, x: number, y: number): void {
  g.rekindle = REKINDLE
  g.rekindleMax = REKINDLE
  g.floaters.push({
    x: g.player.x,
    y: g.player.y - 64,
    vy: -10,
    text: 'Heat restored',
    life: 1.35,
    max: 1.35,
    color: '#fff6e4',
  })
  pourEmbers(g, x, y)
  for (let i = 0; i < 18; i++) {
    const ang = (i / 18) * TAU
    g.particles.push({
      x: g.player.x,
      y: g.player.y,
      vx: Math.cos(ang) * 150,
      vy: Math.sin(ang) * 150,
      life: 0.48,
      max: 0.48,
      size: 2.1,
      color: 'rgba(255, 236, 206, 0.9)',
      grav: 0,
    })
  }
}

function pourEmbers(g: Game, x: number, y: number): void {
  for (let i = 0; i < 28; i++) {
    const ang = (i / 28) * TAU + g.rng() * 0.2
    const jitter = 6 + g.rng() * 18
    const px = x + Math.cos(ang) * jitter
    const py = y + Math.sin(ang) * jitter
    const dx = g.player.x - px
    const dy = g.player.y - py
    const dist = Math.hypot(dx, dy) || 1
    const speed = dist / (0.42 + g.rng() * 0.38)
    const side = (i % 2 === 0 ? 1 : -1) * (36 + g.rng() * 54)
    g.particles.push({
      x: px,
      y: py,
      vx: (dx / dist) * speed + (-dy / dist) * side * 0.45,
      vy: (dy / dist) * speed + (dx / dist) * side * 0.45,
      life: 0.95,
      max: 0.95,
      size: i % 4 === 0 ? 2.8 : 1.5,
      color: i % 3 === 0 ? 'rgba(255, 250, 236, 0.96)' : 'rgba(255, 168, 64, 0.92)',
      grav: 0,
    })
  }
}

function stepRekindle(g: Game, dt: number): void {
  if (g.rekindle <= 0) return
  if (g.state !== 'playing') {
    g.rekindle = 0
    return
  }
  const prev = g.rekindle
  g.rekindle = Math.max(0, g.rekindle - dt)
  const gap = g.maxHeat - g.heat
  if (gap > 0) {
    const portion = Math.min(1, dt / Math.max(dt, prev))
    const surge = 1.15 + 0.9 * (1 - prev / Math.max(0.001, g.rekindleMax))
    g.heat = Math.min(g.maxHeat, g.heat + gap * portion * surge)
  }
  if (g.rekindle <= 0) g.heat = g.maxHeat
  if (g.rng() < dt * 22) {
    const ang = g.rng() * TAU
    g.particles.push({
      x: g.player.x + Math.cos(ang) * (4 + g.rng() * 8),
      y: g.player.y - 6,
      vx: Math.cos(ang) * 14,
      vy: -48 - g.rng() * 46,
      life: 0.55,
      max: 0.55,
      size: 1.45,
      color: 'rgba(255, 246, 226, 0.95)',
      grav: 0,
    })
  }
}

function stepCosmetics(g: Game, dt: number): void {
  for (const p of g.particles) {
    p.life -= dt
    p.x += p.vx * dt
    p.y += p.vy * dt
  }
  compact(g.particles, (p) => p.life <= 0)
  for (const f of g.floaters) {
    f.life -= dt
    f.y += f.vy * dt
  }
  compact(g.floaters, (f) => f.life <= 0)
}

function puff(g: Game, x: number, y: number, color: string, n: number, speed: number, life: number, size: number): void {
  for (let i = 0; i < n; i++) {
    const ang = Math.random() * TAU
    const mag = speed * (0.3 + Math.random())
    g.particles.push({
      x,
      y,
      vx: Math.cos(ang) * mag,
      vy: Math.sin(ang) * mag,
      life,
      max: life,
      size,
      color,
      grav: 0,
    })
  }
}

function floater(g: Game, x: number, y: number, text: string, color: string): void {
  g.floaters.push({ x, y, vy: -18, text, life: 0.9, max: 0.9, color })
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
