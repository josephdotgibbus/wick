export type Kind = 'mote' | 'ashling' | 'warden' | 'leech' | 'popper' | 'shade' | 'boss'

export type UpgradeId =
  | 'reach'
  | 'hunger'
  | 'wisp'
  | 'temper'
  | 'fan'
  | 'trail'
  | 'bellows'
  | 'wick'
  | 'heart'
  | 'arc'
  | 'glass'
  | 'emberheart'
  | 'nova'
  | 'drift'
  | 'hush'
  | 'feast'

export type OfferId = UpgradeId | 'gulp' | 'cache'

export type Mode = 'endless' | 'daily' | 'seed'

export type State = 'menu' | 'playing' | 'levelup' | 'paused' | 'dying' | 'dead'

export interface Ranks {
  reach: number
  hunger: number
  wisp: number
  temper: number
  fan: number
  trail: number
  bellows: number
  wick: number
  heart: number
  arc: number
  glass: number
  emberheart: number
  nova: number
  drift: number
  hush: number
  feast: number
}

export interface Mods {
  light: number
  auraDps: number
  magnet: number
  wisps: number
  sparkDamage: number
  sparkInterval: number
  pierce: number
  trailRanks: number
  trailDps: number
  burstCd: number
  decayMult: number
  maxHeat: number
  chain: number
  chainRange: number
  chainFrac: number
  damageMult: number
  comboGrace: number
  novaEvery: number
  speed: number
  hush: boolean
  hushTime: number
  beamLen: number
  beamDamage: number
  feastHeat: number
  orbit: number
}

export interface Offer {
  id: OfferId
  name: string
  rarity: 'common' | 'rare' | 'legend' | 'boon'
  text: string
  hint: string | null
  rank: number
  max: number
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
  xp: number
  emberN: number
  emberValue: number
  sap: number
  phase: number
  side: number
  flash: number
  elite: boolean
  dead: boolean
  resolved: boolean
  bossIndex: number
  nextRing: number
}

export interface Bullet {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  damage: number
  pierce: number
  r: number
  hit: number[]
}

export interface Ember {
  x: number
  y: number
  vx: number
  vy: number
  value: number
  life: number
  age: number
}

export interface Patch {
  x: number
  y: number
  r: number
  life: number
  max: number
  dps: number
}

export interface Ring {
  x: number
  y: number
  r: number
  speed: number
  thick: number
  hit: boolean
  life: number
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
}

export interface Arc {
  x1: number
  y1: number
  x2: number
  y2: number
  life: number
  max: number
}

export interface Nova {
  x: number
  y: number
  r: number
  life: number
  max: number
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
  | { type: 'collect'; combo: number }
  | { type: 'level' }
  | { type: 'die' }
  | { type: 'burst' }
  | { type: 'inferno' }
  | { type: 'boss' }
  | { type: 'bossdead' }
  | { type: 'beam' }
  | { type: 'nova' }
  | { type: 'best' }

export interface FrameInput {
  ax: number
  ay: number
  burst: boolean
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
  score: number
  bestAtStart: number
  beatBest: boolean
  combo: number
  comboBest: number
  lastCollect: number
  blaze: number
  inferno: number
  heat: number
  xp: number
  xpNext: number
  level: number
  kills: number
  bossKills: number
  ranks: Ranks
  mods: Mods
  blessingId: string
  player: Player
  facing: number
  iframes: number
  burstCd: number
  burstT: number
  burstAng: number
  burstHits: number[]
  stillness: number
  beamCd: number
  sparkCd: number[]
  orbit: number
  enemies: Enemy[]
  bullets: Bullet[]
  embers: Ember[]
  patches: Patch[]
  rings: Ring[]
  particles: Particle[]
  floaters: Floater[]
  beams: Beam[]
  arcs: Arc[]
  novas: Nova[]
  decor: Decor[]
  spawnAcc: number
  nextBoss: number
  bossIndex: number
  nextId: number
  offers: Offer[]
  offerSerial: number
  pickLock: number
  banner: Banner | null
  hint: string
  tutor: boolean
  shadeHint: boolean
  lastBlow: string
  lastHurt: number
  dying: number
  snuff: number
  shake: number
  hitstop: number
  hurtFlash: number
  events: GameEvent[]
  eulogy: string
}
