import { applyBlessing, applyUpgrade, baseStats, eulogyFor, EVENT_COPY, heatBonus, lightOf } from './content.ts'
import { buildFloor, doorCenter } from './dungeon.ts'
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
  Room,
  SpikeSlot,
} from './types.ts'
import { TILE } from './types.ts'
import { UPGRADES, upgradeById, type UpgradeDef } from './upgrades.ts'

const TAU = Math.PI * 2

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
    dungeon: 1,
    bestAtStart: 0,
    heat: 100,
    maxHeat: 100,
    light: 168,
    coins: 0,
    kills: 0,
    bossKills: 0,
    stats: baseStats(),
    passives: [],
    active: null,
    blessingId: 'bare',
    control: 'mouse',
    pending: null,
    loadoutOpen: false,
    event: null,
    slip: false,
    rooms: [],
    roomIndex: 0,
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
  g.rng = mulberry32((g.seed || 1) ^ 0x51ed)
  g.blessingId = opts.blessing
  g.bestAtStart = opts.bestAtStart
  g.tutor = opts.tutor
  g.stats = baseStats()
  applyBlessing(g.stats, opts.blessing)
  g.maxHeat = 100 + heatBonus(opts.blessing)
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

  g.slip = g.event === 'slip'
  g.light = lightOf(g.heat, g.maxHeat, g.event === 'fog' ? 108 : 168)
  g.time += dt
  g.iframes = Math.max(0, g.iframes - dt)
  g.burstCd = Math.max(0, g.burstCd - dt)
  g.doorHold = Math.max(0, g.doorHold - dt)
  g.brambleCd = Math.max(0, g.brambleCd - dt)
  g.shake = Math.max(0, g.shake - dt * 28)
  g.hurtFlash = Math.max(0, g.hurtFlash - dt)
  if (g.dungeon > 1) g.hint = ''

  stepPlayer(g, input, dt)
  stepHazards(g, dt)
  stepPickups(g)
  starve(g, dt)
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
  stepCosmetics(g, dt)
}

function beginDungeon(g: Game, stair: boolean): void {
  const plan = buildFloor(g.seed || 1, g.dungeon)
  g.rooms = plan.rooms
  g.event = plan.event
  g.roomIndex = 0
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
  const door = here.doors.find((item) => item.dir === from)
  if (door) {
    const at = doorCenter(door)
    const inset = TILE * 1.35
    if (from === 'n') g.player.y = at.y + inset
    if (from === 's') g.player.y = at.y - inset
    if (from === 'w') g.player.x = at.x + inset
    if (from === 'e') g.player.x = at.x - inset
    if (from === 'n' || from === 's') g.player.x = at.x
    if (from === 'e' || from === 'w') g.player.y = at.y
  } else {
    const mid = center(here)
    g.player.x = mid.x
    g.player.y = mid.y
  }
  g.player.vx = 0
  g.player.vy = 0
  g.doorHold = 0.45
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

function stepPickups(g: Game): void {
  for (const item of g.pickups) {
    if (item.taken) continue
    if (Math.hypot(item.x - g.player.x, item.y - g.player.y) > 16) continue
    item.taken = true
    if (item.kind === 'coin') {
      g.coins += 1
      floater(g, item.x, item.y - 12, '+1', '#f0b45a')
    } else {
      g.heat = Math.min(g.maxHeat, g.heat + 7)
      floater(g, item.x, item.y - 12, '+7 heat', '#ffb15a')
    }
    g.events.push({ type: 'collect' })
  }
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
    if (def.kind === 'active') equipActive(g, def.id, def.name, def.description, def.charges ?? 3, def.use ?? '')
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

function equipActive(g: Game, id: string, name: string, description: string, charges: number, use: string): void {
  const active: Active = { id, name, description, charges: Math.max(1, charges), charge: 0, use }
  g.active = active
}

function openChest(g: Game, x: number, y: number): void {
  const coins = 2 + Math.floor(g.rng() * 3)
  for (let i = 0; i < coins; i++) {
    room(g).coins.push({
      x: x + (i - 1) * 14,
      y: y + 10,
      kind: 'coin',
      taken: false,
    })
  }
  const chance = Math.min(0.45, 0.08 + Math.max(0, g.stats.luck) * 0.03)
  if (UPGRADES.length && g.rng() < chance) {
    const def = UPGRADES[Math.floor(g.rng() * UPGRADES.length)]!
    if (def.kind === 'active') equipActive(g, def.id, def.name, def.description, def.charges ?? 3, def.use ?? '')
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
  })
}

function stepBullets(g: Game, dt: number): void {
  const here = room(g)
  for (const b of g.bullets) {
    b.life -= dt
    b.x += b.vx * dt
    b.y += b.vy * dt
    if (solidAt(here, b.x, b.y, false)) b.life = 0
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
    if (e.kind === 'boss') stepBoss(g, e, dt)
    else if (e.kind === 'cinder') stepCinder(g, e, dt, haste)
    else stepWisp(g, e, dt, haste)
    if (e.kind !== 'boss') moveCircle(here, e, e.r, dt)
    else moveCircle(here, e, e.r * 0.8, dt)
    if (Math.hypot(e.x - g.player.x, e.y - g.player.y) < e.r + 12) hurt(g, e.touch, e.name)
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
      for (const slot of e.spikes) {
        if (slot.cool > 0) continue
        slot.ang = g.rng() * TAU
        slot.warn = 0.42
        g.warnings.push({
          x: e.x,
          y: e.y,
          ang: slot.ang,
          len: SPIKE_SPEED * SPIKE_LIFE,
          life: 0.42,
          max: 0.42,
          thin: false,
        })
      }
    }
  } else {
    let pending = false
    for (const slot of e.spikes) {
      if (slot.warn <= 0) continue
      pending = true
      slot.warn -= dt
      if (slot.warn > 0) continue
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
      ? { hp: (14 + rank * 3) * strong, r: 11, speed: 58, touch: 11, name: 'Cinder wisp' }
      : kind === 'boss'
        ? { hp: (120 + rank * 48) * strong, r: 36, speed: 34 + rank, touch: 16, name: 'The Briar' }
        : { hp: (8 + rank * 2) * strong, r: 9, speed: 72, touch: 9, name: 'Wisp' }
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
    spikes: kind === 'boss' ? Array.from({ length: 8 }, () => ({ cool: 0, warn: 0, ang: 0 }) satisfies SpikeSlot) : [],
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
    } else {
      room(g).coins.push({ x: e.x, y: e.y, kind: 'spark', taken: false })
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
      here.coins.push({ x: g.player.x + 18, y: g.player.y, kind, taken: false })
    }
  }
  if (here.kind === 'boss') {
    here.stair = true
    here.chest = {
      x: center(here).x + 54,
      y: center(here).y + 36,
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
    goTo(g, door.to, opposite(door.dir))
    return
  }
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
        a.x -= nx * push
        a.y -= ny * push
        b.x += nx * push
        b.y += ny * push
      }
    }
  }
}

function unstick(g: Game): void {
  const here = room(g)
  const mid = center(here)
  for (const e of g.enemies) {
    if (e.dead || !hitsSolid(here, e.x, e.y, Math.max(6, e.r * 0.45))) continue
    const ang = Math.atan2(mid.y - e.y, mid.x - e.x)
    e.x += Math.cos(ang) * 6
    e.y += Math.sin(ang) * 6
  }
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
