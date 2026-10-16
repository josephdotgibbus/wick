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
  for (let i = 0; i < combatCount; i++) {
    const placed = stepFrom(rng, cell, cx, cy, from)
    if (!placed) break
    addRoom(rooms, cell, makeRoom(rng, dungeon, event, 'combat', placed.x, placed.y))
    link(rooms, cell, cx, cy, placed.dir, placed.x, placed.y)
    cx = placed.x
    cy = placed.y
    from = OPPOSITE[placed.dir]
  }

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

function stepFrom(
  rng: () => number,
  cell: Map<string, number>,
  x: number,
  y: number,
  from: Dir,
): { x: number; y: number; dir: Dir } | null {
  const rank = (dir: Dir) => (dir === OPPOSITE[from] ? 0 : dir === from ? 2 : 1)
  const ordered = (['n', 'e', 's', 'w'] as Dir[]).sort((a, b) => rank(a) - rank(b) || rng() - 0.5)
  for (const dir of ordered) {
    const nextX = x + STEP[dir].x
    const nextY = y + STEP[dir].y
    if (cell.has(`${nextX},${nextY}`)) continue
    return { x: nextX, y: nextY, dir }
  }
  return null
}

function sideCell(
  rng: () => number,
  cell: Map<string, number>,
  hosts: Room[],
): { x: number; y: number; dir: Dir; fromX: number; fromY: number } | null {
  const order = [...hosts].sort(() => rng() - 0.5)
  for (const host of order) {
    const dirs: Dir[] = ['n', 'e', 's', 'w']
    for (const dir of dirs.sort(() => rng() - 0.5)) {
      const x = host.gx + STEP[dir].x
      const y = host.gy + STEP[dir].y
      if (cell.has(`${x},${y}`)) continue
      return { x, y, dir, fromX: host.gx, fromY: host.gy }
    }
  }
  return null
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
  if (shape === 'hall') return boxed(18, 7, () => {})
  if (shape === 'wide') return boxed(16, 8, () => {})
  if (shape === 'arena') return boxed(24, 16, () => {})
  if (shape === 'chapel') return boxed(13, 10, () => {})
  if (shape === 'hearth') return boxed(12, 9, () => {})
  if (shape === 'ell') {
    return boxed(14, 12, (tiles, w, h) => {
      for (let y = Math.floor(h * 0.55); y < h - 1; y++) {
        for (let x = Math.floor(w * 0.58); x < w - 1; x++) tiles[y * w + x] = 1
      }
    })
  }
  if (shape === 'pillars') {
    return boxed(14, 11, (tiles, w, h) => {
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
    return boxed(15, 12, (tiles, w, h) => {
      const x0 = Math.floor(w / 2) - 1
      const y0 = Math.floor(h / 2) - 1
      for (let y = y0; y < y0 + 3; y++) for (let x = x0; x < x0 + 3; x++) tiles[y * w + x] = 1
    })
  }
  return boxed(13, 10, () => {})
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
