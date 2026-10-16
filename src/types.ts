export const TILE = 32

export type Kind = 'wisp' | 'cinder' | 'boss'

export type Dir = 'n' | 'e' | 's' | 'w'

export type EventId = 'strong' | 'slip' | 'rubble' | 'haste' | 'starve' | 'fog' | 'vents' | 'surge'

export type ControlMode = 'mouse' | 'keys'

export type Mode = 'endless' | 'daily' | 'seed'

export type State = 'menu' | 'steer' | 'playing' | 'paused' | 'dying' | 'dead'

export type RoomKind = 'start' | 'combat' | 'treasure' | 'boss'

export type PickupKind = 'coin' | 'spark'

export type NearKind = 'pedestal' | 'chest' | 'stair'

/** 0 floor, 1 wall, 2 rock, 3 pit, 4 bramble */
export type TileId = 0 | 1 | 2 | 3 | 4

export interface Stats {
  damage: number
  tears: number
  speed: number
  range: number
  shotSpeed: number
  luck: number
  /** Extra distance, in pixels, at which sparks start dragging toward you. */
  magnet: number
}

export interface Active {
  id: string
  name: string
  description: string
  charges: number
  charge: number
  use: string
}

export interface Door {
  dir: Dir
  to: number
  tx: number
  ty: number
}

export interface Pedestal {
  x: number
  y: number
  upgradeId: string | null
  taken: boolean
}

export interface Chest {
  x: number
  y: number
  vx: number
  vy: number
  opened: boolean
  coins: number
  upgradeId: string | null
}

export interface Pickup {
  x: number
  y: number
  vx: number
  vy: number
  kind: PickupKind
  taken: boolean
}

export interface Spawn {
  kind: Kind
  x: number
  y: number
}

export interface Room {
  id: number
  kind: RoomKind
  gx: number
  gy: number
  w: number
  h: number
  tiles: TileId[]
  doors: Door[]
  spawns: Spawn[]
  spawned: boolean
  coins: Pickup[]
  chest: Chest | null
  pedestals: Pedestal[]
  treasureTaken: boolean
  clearDrop: Pickup | null
  dropGiven: boolean
  cleared: boolean
  visited: boolean
  stair: boolean
}

export interface SpikeSlot {
  cool: number
  warn: number
  ang: number
  from: number
  show: number
}

export interface Player {
  x: number
  y: number
  vx: number
  vy: number
}

export interface Enemy {
  id: number
  kind: Kind
  name: string
  x: number
  y: number
  vx: number
  vy: number
  hp: number
  maxHp: number
  r: number
  speed: number
  touch: number
  flash: number
  arrive: number
  dead: boolean
  resolved: boolean
  mode: number
  timer: number
  aim: number
  didHit: boolean
  eyes: number
  nextEye: number
  spikes: SpikeSlot[]
  trail: number
  prevX: number
  prevY: number
  bossRank: number
}

export interface Bullet {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  damage: number
  hearts: number
  pierce: number
  r: number
  hit: number[]
  friendly: boolean
  child: boolean
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  size: number
  color: string
  grav: number
  behind?: boolean
}

export interface Floater {
  x: number
  y: number
  vy: number
  text: string
  life: number
  max: number
  color: string
}

export interface Beam {
  x: number
  y: number
  ang: number
  len: number
  width: number
  life: number
  max: number
  color: string
}

export interface Warning {
  x: number
  y: number
  ang: number
  len: number
  life: number
  max: number
  thin: boolean
}

export interface Decor {
  spin: number
  dist: number
  size: number
  speed: number
  yScale: number
}

export interface Banner {
  title: string
  sub: string
  life: number
}

export const SLIDE_TIME = 0.62

export interface Slide {
  from: number
  to: number
  dir: Dir
  t: number
  /** True for the last frame, so the view can settle before the room swap. */
  settled: boolean
}

export type GameEvent =
  | { type: 'hurt' }
  | { type: 'collect' }
  | { type: 'level' }
  | { type: 'die' }
  | { type: 'burst' }
  | { type: 'boss' }
  | { type: 'bossdead' }
  | { type: 'beam' }

export interface FrameInput {
  ax: number
  ay: number
  burst: boolean
  use: boolean
  interact: boolean
}

export interface PendingRun {
  mode: Mode
  seed: number
  blessing: string
  bestRound: number
  tutor: boolean
}

export interface Game {
  state: State
  mode: Mode
  seed: number
  seedLabel: string
  rng: () => number
  runSerial: number
  time: number
  menuT: number
  dungeon: number
  bestAtStart: number
  heat: number
  maxHeat: number
  /** Seconds left in the boss-kill heat refill. */
  rekindle: number
  rekindleMax: number
  light: number
  coins: number
  kills: number
  bossKills: number
  stats: Stats
  passives: string[]
  active: Active | null
  blessingId: string
  control: ControlMode
  pending: PendingRun | null
  loadoutOpen: boolean
  event: EventId | null
  slip: boolean
  rooms: Room[]
  roomIndex: number
  slide: Slide | null
  player: Player
  facing: number
  iframes: number
  burstCd: number
  burstT: number
  burstAng: number
  fireCd: number
  doorHold: number
  brambleCd: number
  enemies: Enemy[]
  bullets: Bullet[]
  pickups: Pickup[]
  particles: Particle[]
  floaters: Floater[]
  beams: Beam[]
  warnings: Warning[]
  decor: Decor[]
  nextId: number
  near: NearKind | null
  nearId: string | null
  banner: Banner | null
  hint: string
  tutor: boolean
  lastBlow: string
  dying: number
  snuff: number
  shake: number
  hurtFlash: number
  events: GameEvent[]
  eulogy: string
}
