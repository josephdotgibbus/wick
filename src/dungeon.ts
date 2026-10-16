import { mulberry32 } from './rng.ts'
import type { Dir, Door, EventId, Kind, Room, Spawn, TileId } from './types.ts'
import { TILE } from './types.ts'
import { rollUpgrade } from './upgrades.ts'

const OPPOSITE: Record<Dir, Dir> = { n: 's', s: 'n', e: 'w', w: 'e' }
const STEP: Record<Dir, { x: number; y: number }> = {
  n: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  e: { x: 1, y: 0 },
  w: { x: -1, y: 0 },
}

export interface FloorPlan {
  event: EventId | null
  rooms: Room[]
}

export function buildFloor(seed: number, dungeon: number): FloorPlan {
  const rng = mulberry32((seed ^ Math.imul(dungeon, 0x9e3779b1)) >>> 0)
  const event = dungeon > 1 && rng() < 0.5 ? rollEvent(rng) : null
  const combatCount = 3 + Math.min(4, dungeon)
  const rooms: Room[] = []
  const cell = new Map<string, number>()

  addRoom(rooms, cell, makeRoom(rng, dungeon, event, 'start', 0, 0))

  let cx = 0
  let cy = 0
  let from: Dir = 'w'
  const branches = combatCount >= 5 ? 2 : 1
  const spine = Math.max(2, combatCount - branches)
  for (let i = 0; i < spine; i++) {
    const placed = stepFrom(rng, cell, cx, cy, from)
    if (!placed) break
    addRoom(rooms, cell, makeRoom(rng, dungeon, event, 'combat', placed.x, placed.y))
    link(rooms, cell, cx, cy, placed.dir, placed.x, placed.y)
    cx = placed.x
    cy = placed.y
    from = OPPOSITE[placed.dir]
  }
  for (let i = 0; i < branches; i++) attachBranch(rng, rooms, cell, dungeon, event)

  const bossStep = stepFrom(rng, cell, cx, cy, from)
  if (bossStep) {
    addRoom(rooms, cell, makeRoom(rng, dungeon, event, 'boss', bossStep.x, bossStep.y))
    link(rooms, cell, cx, cy, bossStep.dir, bossStep.x, bossStep.y)
  } else if (rooms.length > 1) {
    const last = rooms[rooms.length - 1]!
    last.kind = 'boss'
    last.spawns = bossSpawn(last)
    last.chest = null
    last.cleared = false
    last.spawned = false
  }

  const branch = sideCell(rng, cell, rooms.filter((room) => room.kind === 'combat'))
  if (branch) {
    const treasure = makeRoom(rng, dungeon, event, 'treasure', branch.x, branch.y)
    stockTreasure(rng, treasure)
    addRoom(rooms, cell, treasure)
    link(rooms, cell, branch.fromX, branch.fromY, branch.dir, branch.x, branch.y)
  }

  for (const room of rooms) carveDoors(room)
  return { event, rooms }
}

export function entryOf(room: Room, dir: Dir): { x: number; y: number } {
  const door = room.doors.find((item) => item.dir === dir)
  if (!door) return { x: (room.w * TILE) / 2, y: (room.h * TILE) / 2 }
  const at = doorCenter(door)
  const inset = TILE * 1.35
  if (dir === 'n') return { x: at.x, y: at.y + inset }
  if (dir === 's') return { x: at.x, y: at.y - inset }
  if (dir === 'w') return { x: at.x + inset, y: at.y }
  return { x: at.x - inset, y: at.y }
}

export function roomOffset(from: Room, to: Room, dir: Dir): { x: number; y: number } {
  const leave = from.doors.find((item) => item.dir === dir)
  const arrive = to.doors.find((item) => item.dir === OPPOSITE[dir])
  if (!leave || !arrive) {
    if (dir === 'e') return { x: from.w * TILE, y: 0 }
    if (dir === 'w') return { x: -to.w * TILE, y: 0 }
    if (dir === 's') return { x: 0, y: from.h * TILE }
    return { x: 0, y: -to.h * TILE }
  }
  const a = doorCenter(leave)
  const b = doorCenter(arrive)
  return { x: a.x - b.x, y: a.y - b.y }
}

export function doorCenter(door: Door): { x: number; y: number } {
  const across = door.dir === 'n' || door.dir === 's'
  const x = (door.tx + (across ? 1 : 0.5)) * TILE
  const y = (door.ty + (across ? 0.5 : 1)) * TILE
  return { x, y }
}

export function roomOf(rooms: Room[], id: number): Room {
  return rooms[id] ?? rooms[0]!
}

function rollEvent(rng: () => number): EventId {
  const events: EventId[] = ['strong', 'slip', 'rubble', 'haste', 'starve', 'fog', 'vents', 'surge']
  return events[Math.floor(rng() * events.length)] ?? 'strong'
}

function addRoom(rooms: Room[], cell: Map<string, number>, room: Room): void {
  room.id = rooms.length
  rooms.push(room)
  cell.set(`${room.gx},${room.gy}`, room.id)
}

const DIRS: Dir[] = ['n', 'e', 's', 'w']

function stepFrom(
  rng: () => number,
  cell: Map<string, number>,
  x: number,
  y: number,
  from: Dir,
): { x: number; y: number; dir: Dir } | null {
  const forward = OPPOSITE[from]
  const open: { dir: Dir; weight: number }[] = []
  for (const dir of DIRS) {
    if (dir === from) continue
    if (cell.has(key(x + STEP[dir].x, y + STEP[dir].y))) continue
    open.push({ dir, weight: dir === forward ? 2 : 5 })
  }
  if (!open.length) {
    const back = from
    if (cell.has(key(x + STEP[back].x, y + STEP[back].y))) return null
    return { x: x + STEP[back].x, y: y + STEP[back].y, dir: back }
  }
  const dir = weightedDir(rng, open)
  return { x: x + STEP[dir].x, y: y + STEP[dir].y, dir }
}

function attachBranch(
  rng: () => number,
  rooms: Room[],
  cell: Map<string, number>,
  dungeon: number,
  event: EventId | null,
): void {
  const hosts = shuffle(
    rng,
    rooms.filter((room) => room.kind === 'combat' || room.kind === 'start'),
  )
  for (const host of hosts) {
    const dirs = shuffle(
      rng,
      DIRS.filter((dir) => !cell.has(key(host.gx + STEP[dir].x, host.gy + STEP[dir].y))),
    )
    const dir = dirs[0]
    if (!dir) continue
    const x = host.gx + STEP[dir].x
    const y = host.gy + STEP[dir].y
    addRoom(rooms, cell, makeRoom(rng, dungeon, event, 'combat', x, y))
    link(rooms, cell, host.gx, host.gy, dir, x, y)
    return
  }
}

function sideCell(
  rng: () => number,
  cell: Map<string, number>,
  hosts: Room[],
): { x: number; y: number; dir: Dir; fromX: number; fromY: number } | null {
  for (const host of shuffle(rng, hosts)) {
    for (const dir of shuffle(rng, DIRS)) {
      const x = host.gx + STEP[dir].x
      const y = host.gy + STEP[dir].y
      if (cell.has(key(x, y))) continue
      return { x, y, dir, fromX: host.gx, fromY: host.gy }
    }
  }
  return null
}

function key(x: number, y: number): string {
  return `${x},${y}`
}

function weightedDir(rng: () => number, open: { dir: Dir; weight: number }[]): Dir {
  let total = 0
  for (const item of open) total += item.weight
  let roll = rng() * total
  for (const item of open) {
    roll -= item.weight
    if (roll < 0) return item.dir
  }
  return open[0]!.dir
}

function shuffle<T>(rng: () => number, items: readonly T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const swap = out[i]!
    out[i] = out[j]!
    out[j] = swap
  }
  return out
}

function link(rooms: Room[], cell: Map<string, number>, x: number, y: number, dir: Dir, nx: number, ny: number): void {
  const from = rooms[cell.get(`${x},${y}`)!]!
  const to = rooms[cell.get(`${nx},${ny}`)!]!
  from.doors.push(socket(from, dir, to.id))
  to.doors.push(socket(to, OPPOSITE[dir], from.id))
}

function socket(room: Room, dir: Dir, to: number): Door {
  if (dir === 'n' || dir === 's') {
    const tx = Math.max(2, Math.floor(room.w / 2) - 1)
    return { dir, to, tx, ty: dir === 'n' ? 0 : room.h - 1 }
  }
  const ty = Math.max(2, Math.floor(room.h / 2) - 1)
  return { dir, to, tx: dir === 'w' ? 0 : room.w - 1, ty }
}

function makeRoom(rng: () => number, dungeon: number, event: EventId | null, kind: RoomKindOf, gx: number, gy: number): Room {
  const shape = kind === 'boss' ? 'arena' : kind === 'treasure' ? 'chapel' : kind === 'start' ? 'hearth' : pickShape(rng)
  const { w, h, tiles } = stamp(shape)
  const room: Room = {
    id: 0,
    kind,
    gx,
    gy,
    w,
    h,
    tiles,
    doors: [],
    spawns: [],
    spawned: kind === 'start' || kind === 'treasure',
    coins: [],
    chest: null,
    pedestals: [],
    treasureTaken: false,
    clearDrop: null,
    dropGiven: kind !== 'combat',
    cleared: kind === 'start' || kind === 'treasure',
    visited: false,
    stair: false,
  }
  room.id = gx * 100 + gy
  if (event === 'rubble' && kind === 'combat') sprinkle(rng, room, 2, 4)
  if (event === 'vents' && kind !== 'treasure') sprinkle(rng, room, 3, 2)
  if (event === 'vents' && kind !== 'treasure') sprinkle(rng, room, 4, 2)
  if (kind === 'combat') {
    const extra = event === 'surge' ? 2 : 0
    const count = Math.min(8, 2 + Math.floor(dungeon / 2) + extra + (shape === 'wide' ? 1 : 0))
    room.spawns = enemySpawns(rng, room, dungeon, count)
    if (rng() < 0.55) {
      const kind = rng() < 0.72 ? 'coin' : 'spark'
      room.coins = coinSpawns(rng, room, 1 + Math.floor(rng() * 3), kind)
    }
    if (rng() < 0.08) room.chest = chestAt(rng, room)
  }
  if (kind === 'boss') room.spawns = bossSpawn(room)
  if (kind === 'start') {
    room.coins = coinSpawns(rng, room, 1, 'spark')
    if (rng() < 0.5) room.coins.push(...coinSpawns(rng, room, 1, 'coin'))
  }
  return room
}

type RoomKindOf = Room['kind']
type Shape = 'plain' | 'ell' | 'pillars' | 'hall' | 'island' | 'wide' | 'arena' | 'chapel' | 'hearth'

function pickShape(rng: () => number): Shape {
  const shapes: Shape[] = ['plain', 'ell', 'pillars', 'hall', 'island', 'wide']
  return shapes[Math.floor(rng() * shapes.length)] ?? 'plain'
}

function stamp(shape: Shape): { w: number; h: number; tiles: TileId[] } {
  if (shape === 'hall') return boxed(20, 10, () => {})
  if (shape === 'wide') return boxed(18, 11, () => {})
  if (shape === 'arena') return boxed(26, 18, () => {})
  if (shape === 'chapel') return boxed(16, 12, () => {})
  if (shape === 'hearth') return boxed(15, 11, () => {})
  if (shape === 'ell') {
    return boxed(17, 14, (tiles, w, h) => {
      for (let y = Math.floor(h * 0.55); y < h - 1; y++) {
        for (let x = Math.floor(w * 0.58); x < w - 1; x++) tiles[y * w + x] = 1
      }
    })
  }
  if (shape === 'pillars') {
    return boxed(17, 13, (tiles, w, h) => {
      for (const [x, y] of [
        [4, 3],
        [9, 3],
        [4, 7],
        [9, 7],
      ]) {
        if (y < h - 1 && x < w - 1) tiles[y * w + x] = 2
      }
    })
  }
  if (shape === 'island') {
    return boxed(18, 14, (tiles, w, h) => {
      const x0 = Math.floor(w / 2) - 1
      const y0 = Math.floor(h / 2) - 1
      for (let y = y0; y < y0 + 3; y++) for (let x = x0; x < x0 + 3; x++) tiles[y * w + x] = 1
    })
  }
  return boxed(16, 12, () => {})
}

function boxed(w: number, h: number, paint: (tiles: TileId[], w: number, h: number) => void): { w: number; h: number; tiles: TileId[] } {
  const tiles = Array.from({ length: w * h }, () => 0 as TileId)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) tiles[y * w + x] = 1
    }
  }
  paint(tiles, w, h)
  return { w, h, tiles }
}

function carveDoors(room: Room): void {
  const inward: Record<Dir, { x: number; y: number }> = {
    n: { x: 0, y: 1 },
    s: { x: 0, y: -1 },
    e: { x: -1, y: 0 },
    w: { x: 1, y: 0 },
  }
  for (const door of room.doors) {
    const across = door.dir === 'n' || door.dir === 's'
    const step = inward[door.dir]
    for (let i = 0; i < 2; i++) {
      for (let depth = 0; depth < 3; depth++) {
        const x = door.tx + (across ? i : 0) + step.x * depth
        const y = door.ty + (across ? 0 : i) + step.y * depth
        if (x <= 0 || y <= 0 || x >= room.w - 1 || y >= room.h - 1) {
          if (depth === 0) {
            const index = y * room.w + x
            if (index >= 0 && index < room.tiles.length) room.tiles[index] = 0
          }
          continue
        }
        room.tiles[y * room.w + x] = 0
      }
    }
  }
}

function sprinkle(rng: () => number, room: Room, tile: TileId, count: number): void {
  const open = openTiles(room)
  for (let i = 0; i < count && open.length; i++) {
    const pick = open.splice(Math.floor(rng() * open.length), 1)[0]!
    room.tiles[pick] = tile
  }
}

function openTiles(room: Room): number[] {
  const out: number[] = []
  for (let y = 2; y < room.h - 2; y++) {
    for (let x = 2; x < room.w - 2; x++) {
      if (room.tiles[y * room.w + x] === 0) out.push(y * room.w + x)
    }
  }
  return out
}

function tileCenter(room: Room, index: number): { x: number; y: number } {
  const x = index % room.w
  const y = Math.floor(index / room.w)
  return { x: (x + 0.5) * TILE, y: (y + 0.5) * TILE }
}

function enemySpawns(rng: () => number, room: Room, dungeon: number, count: number): Spawn[] {
  const open = openTiles(room)
  const spawns: Spawn[] = []
  for (let i = 0; i < count && open.length; i++) {
    const pick = open.splice(Math.floor(rng() * open.length), 1)[0]!
    const at = tileCenter(room, pick)
    const cinder = dungeon >= 2 && rng() < Math.min(0.4, 0.12 + dungeon * 0.05)
    spawns.push({ kind: cinder ? 'cinder' : 'wisp', x: at.x, y: at.y })
  }
  return spawns
}

function bossSpawn(room: Room): Spawn[] {
  return [{ kind: 'boss' as Kind, x: (room.w * TILE) / 2, y: (room.h * TILE) / 2 }]
}

function coinSpawns(rng: () => number, room: Room, count: number, kind: 'coin' | 'spark'): Room['coins'] {
  const open = openTiles(room)
  const coins: Room['coins'] = []
  for (let i = 0; i < count && open.length; i++) {
    const at = tileCenter(room, open.splice(Math.floor(rng() * open.length), 1)[0]!)
    const ang = rng() * Math.PI * 2
    const speed = kind === 'coin' ? 36 + rng() * 70 : 0
    coins.push({
      x: at.x,
      y: at.y,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      kind,
      taken: false,
    })
  }
  return coins
}

function chestAt(rng: () => number, room: Room): Room['chest'] {
  const open = openTiles(room)
  if (!open.length) return null
  const at = tileCenter(room, open[Math.floor(rng() * open.length)]!)
  const ang = rng() * Math.PI * 2
  const speed = 28 + rng() * 40
  return { x: at.x, y: at.y, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, opened: false, coins: 0, upgradeId: null }
}

function stockTreasure(rng: () => number, room: Room): void {
  const spots = [
    { x: room.w * 0.28, y: room.h * 0.42 },
    { x: room.w * 0.5, y: room.h * 0.34 },
    { x: room.w * 0.72, y: room.h * 0.42 },
  ]
  const avoid = new Set<string>()
  for (const spot of spots) {
    const def = rollUpgrade(rng, avoid)
    if (def) avoid.add(def.id)
    room.pedestals.push({
      x: spot.x * TILE,
      y: spot.y * TILE,
      upgradeId: def?.id ?? null,
      taken: false,
      seen: false,
      reveal: 0,
    })
  }
}
