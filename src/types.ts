export type Kind = 'wisp' | 'cinder' | 'boss'

export type UpgradeId =
  | 'kindling'
  | 'split'
  | 'moth'
  | 'orbit'
  | 'pop'
  | 'leech'
  | 'brand'
  | 'pierce'
  | 'back'
  | 'nova'
  | 'glass'
  | 'hearth'
  | 'step'
  | 'slowburn'
  | 'halo'
  | 'coal'
  | 'lure'

export type CurseId = 'heavy' | 'thin' | 'hungry' | 'brittle' | 'dim' | 'sluggish' | 'swarm' | 'short'

export type EventId = 'strong' | 'slip' | 'rubble' | 'haste' | 'starve' | 'fog' | 'vents' | 'surge'

export type OfferId = UpgradeId | CurseId

export type ControlMode = 'mouse' | 'keys'

export type Mode = 'endless' | 'daily' | 'seed'

export type State = 'menu' | 'steer' | 'playing' | 'levelup' | 'paused' | 'dying' | 'dead'

export type Ranks = Record<UpgradeId, number>
export type Curses = Record<CurseId, number>

export interface Mods {
  shotDamage: number
  shotSpeed: number
  shotLife: number
  pierce: number
  forks: number
  forkFrac: number
  fireInterval: number
  maxHeat: number
  decayMult: number
  magnet: number
  speed: number
  touchMult: number
  light: number
  burstCd: number
  burstCost: number
  sparkValue: number
  extraSpawns: number
  homing: number
  orbit: number
  orbitDmg: number
  pop: boolean
  popFrac: number
  popCount: number
  popPatch: boolean
  brand: boolean
  brandForks: boolean
  leech: number
  back: boolean
  backFrac: number
  backSplits: boolean
  novaEvery: number
  novaFrac: number
  haloDps: number
  haloSlow: number
  lastCoal: boolean
  coalRing: boolean
  collectRing: number
}

export interface Offer {
  id: OfferId
  kind: 'upgrade' | 'curse'
  name: string
  text: string
  hint: string | null
  rank: number
  max: number
  icon: string
}

export interface Player {
  x: number
  y: number
  vx: number
  vy: number
}

export interface SpikeSlot {
  cool: number
  warn: number
  ang: number
}

export interface Incoming {
  kind: Kind
  wait: number
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
  dead: boolean
  resolved: boolean
  mode: number
  timer: number
  aim: number
  didHit: boolean
  eyes: number
  nextEye: number
  spawnLeft: number
  spawnAcc: number
  spikes: SpikeSlot[]
  trail: number
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
  pierce: number
  r: number
  hit: number[]
  friendly: boolean
  brand: boolean
  child: boolean
}

export interface Spark {
  x: number
  y: number
  value: number
  life: number
  taken: boolean
}

export interface Obstacle {
  x: number
  y: number
  r: number
}

export interface Hazard {
  x: number
  y: number
  r: number
  dps: number
  kind: 'pit' | 'bramble'
  tick: number
}

export interface Chunk {
  obstacles: Obstacle[]
  hazards: Hazard[]
  sparks: Spark[]
}

export interface Patch {
  x: number
  y: number
  r: number
  life: number
  max: number
  dps: number
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
  round: number
  bestAtStart: number
  heat: number
  kills: number
  bossKills: number
  ranks: Ranks
  curses: Curses
  mods: Mods
  blessingId: string
  control: ControlMode
  pending: PendingRun | null
  loadoutOpen: boolean
  event: EventId | null
  slip: boolean
  player: Player
  facing: number
  iframes: number
  burstCd: number
  burstT: number
  burstAng: number
  fireCd: number
  shotN: number
  coalSpent: boolean
  orbitAng: number
  trailCd: number
  brambleCd: number
  enemies: Enemy[]
  incoming: Incoming[]
  bullets: Bullet[]
  sparks: Spark[]
  patches: Patch[]
  particles: Particle[]
  floaters: Floater[]
  beams: Beam[]
  warnings: Warning[]
  chunks: Map<string, Chunk>
  extras: Obstacle[]
  extraHazards: Hazard[]
  decor: Decor[]
  nextId: number
  offers: Offer[]
  offerSerial: number
  pickLock: number
  clearT: number
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
