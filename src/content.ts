import type { Curses, CurseId, EventId, Kind, Mods, Offer, OfferId, Ranks, UpgradeId } from './types.ts'

export const UPGRADES: UpgradeId[] = [
  'kindling',
  'split',
  'lance',
  'hearth',
  'slowburn',
  'lure',
  'step',
  'ward',
  'bellows',
  'thorn',
  'tell',
  'trail',
  'twin',
  'glass',
  'coal',
  'pierce',
]

export const CURSES: CurseId[] = ['heavy', 'thin', 'hungry', 'brittle', 'dim', 'sluggish', 'swarm', 'short']

export const EVENTS: EventId[] = ['strong', 'slip', 'rubble', 'haste', 'starve', 'fog', 'vents', 'surge']

const MAX_UP: Record<UpgradeId, number> = {
  kindling: 3,
  split: 2,
  lance: 3,
  hearth: 2,
  slowburn: 2,
  lure: 2,
  step: 2,
  ward: 2,
  bellows: 2,
  thorn: 2,
  tell: 2,
  trail: 2,
  twin: 1,
  glass: 1,
  coal: 1,
  pierce: 2,
}

const MAX_CURSE = 2

const WEIGHT: Record<UpgradeId, number> = {
  kindling: 10,
  lance: 9,
  hearth: 9,
  slowburn: 9,
  lure: 8,
  step: 8,
  ward: 7,
  bellows: 7,
  pierce: 7,
  split: 5,
  thorn: 5,
  tell: 5,
  trail: 5,
  coal: 4,
  twin: 3.2,
  glass: 2.4,
}

export function emptyRanks(): Ranks {
  return {
    kindling: 0,
    split: 0,
    lance: 0,
    hearth: 0,
    slowburn: 0,
    lure: 0,
    step: 0,
    ward: 0,
    bellows: 0,
    thorn: 0,
    tell: 0,
    trail: 0,
    twin: 0,
    glass: 0,
    coal: 0,
    pierce: 0,
  }
}

export function emptyCurses(): Curses {
  return { heavy: 0, thin: 0, hungry: 0, brittle: 0, dim: 0, sluggish: 0, swarm: 0, short: 0 }
}

export function iconFor(id: string): string {
  const ink = '#f6efe4'
  const ember = '#ff6a2c'
  const gold = '#f0b45a'
  const curse = '#e15a5a'
  const body: Record<string, string> = {
    kindling: `<circle cx="32" cy="36" r="8" fill="${ember}"/><path d="M32 8 L36 22 H28 Z" fill="${gold}"/>`,
    split: `<path d="M32 50 L32 30" stroke="${ink}" stroke-width="3"/><path d="M32 30 L18 14 M32 30 L46 14" stroke="${ember}" stroke-width="3"/>`,
    lance: `<path d="M12 32 H44" stroke="${gold}" stroke-width="3"/><path d="M40 24 L54 32 L40 40" fill="${ember}"/>`,
    hearth: `<rect x="16" y="28" width="32" height="20" rx="3" fill="none" stroke="${ink}" stroke-width="3"/><path d="M32 40 V18" stroke="${ember}" stroke-width="3"/>`,
    slowburn: `<circle cx="32" cy="32" r="16" fill="none" stroke="${gold}" stroke-width="3" stroke-dasharray="4 4"/>`,
    lure: `<circle cx="32" cy="32" r="6" fill="${ember}"/><circle cx="32" cy="32" r="16" fill="none" stroke="${gold}" stroke-width="2"/>`,
    step: `<path d="M14 40 L28 24 L36 34 L50 16" fill="none" stroke="${ink}" stroke-width="3"/>`,
    ward: `<path d="M32 10 L50 18 V34 C50 46 32 54 32 54 C32 54 14 46 14 34 V18 Z" fill="none" stroke="${gold}" stroke-width="3"/>`,
    bellows: `<path d="M16 40 L28 20 H44 L52 40 Z" fill="none" stroke="${ember}" stroke-width="3"/>`,
    thorn: `<circle cx="32" cy="32" r="8" fill="#2a201c"/><path d="M32 8 L36 20 L28 20 Z M32 56 L36 44 L28 44 Z M8 32 L20 28 L20 36 Z M56 32 L44 28 L44 36 Z" fill="${ink}"/>`,
    tell: `<circle cx="24" cy="28" r="4" fill="${curse}"/><circle cx="40" cy="28" r="4" fill="${curse}"/><path d="M18 42 Q32 52 46 42" fill="none" stroke="${ink}" stroke-width="3"/>`,
    trail: `<circle cx="16" cy="40" r="4" fill="${ember}" opacity="0.5"/><circle cx="30" cy="32" r="5" fill="${ember}" opacity="0.75"/><circle cx="46" cy="22" r="6" fill="${gold}"/>`,
    twin: `<circle cx="24" cy="32" r="7" fill="${ember}"/><circle cx="42" cy="28" r="5" fill="${gold}"/>`,
    glass: `<path d="M32 10 L48 50 H16 Z" fill="none" stroke="${ink}" stroke-width="3"/>`,
    coal: `<circle cx="32" cy="34" r="12" fill="#2a201c" stroke="${gold}" stroke-width="3"/>`,
    pierce: `<path d="M10 32 H54" stroke="${ink}" stroke-width="3"/><circle cx="22" cy="32" r="4" fill="${ember}"/><circle cx="40" cy="32" r="4" fill="${ember}"/>`,
    heavy: `<rect x="18" y="26" width="28" height="18" fill="${curse}"/>`,
    thin: `<path d="M32 12 V52" stroke="${curse}" stroke-width="2"/>`,
    hungry: `<path d="M16 36 Q32 18 48 36 Q32 28 16 36" fill="${curse}"/>`,
    brittle: `<path d="M32 14 L36 30 L50 32 L38 40 L42 52 L32 44 L22 52 L26 40 L14 32 L28 30 Z" fill="none" stroke="${curse}" stroke-width="2"/>`,
    dim: `<circle cx="32" cy="32" r="10" fill="none" stroke="${curse}" stroke-width="3" opacity="0.7"/>`,
    sluggish: `<circle cx="32" cy="34" r="8" fill="${curse}" opacity="0.8"/>`,
    swarm: `<circle cx="22" cy="34" r="5" fill="${curse}"/><circle cx="36" cy="28" r="5" fill="${curse}"/><circle cx="42" cy="40" r="4" fill="${curse}"/>`,
    short: `<path d="M18 24 H46 L40 46 H24 Z" fill="none" stroke="${curse}" stroke-width="3"/>`,
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#1a1411"/>${body[id] ?? ''}</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

interface Blurb {
  name: string
  text: (rank: number) => string
}

const UPGRADE_COPY: Record<UpgradeId, Blurb> = {
  kindling: { name: 'Kindling', text: (n) => `Sparks hit harder. Rank ${n}. The mote grows with the wound it can make.` },
  split: { name: 'Split wick', text: (n) => `Each spark sheds a smaller sister. Rank ${n}.` },
  lance: { name: 'Lance', text: (n) => `Sparks fly faster and live longer. Rank ${n}.` },
  hearth: { name: 'Hearth', text: (n) => `A deeper well of heat, restored a little now. Rank ${n}.` },
  slowburn: { name: 'Slow burn', text: (n) => `The wick starves more slowly. Rank ${n}.` },
  lure: { name: 'Ember lure', text: (n) => `Map sparks pull from farther and feed more. Rank ${n}.` },
  step: { name: 'Cinderstep', text: (n) => `The flame moves quicker. Rank ${n}.` },
  ward: { name: 'Ash ward', text: (n) => `Touches from the dark take less heat. Rank ${n}.` },
  bellows: { name: 'Bellows', text: (n) => `Burst returns sooner and spends less. Rank ${n}.` },
  thorn: { name: 'Thornbreak', text: (n) => `Sparks bite bosses harder. Rank ${n}.` },
  tell: { name: 'Open eye', text: (n) => `Telegraphs and a shut briar take extra pain. Rank ${n}.` },
  trail: { name: 'Ash trail', text: (n) => `Moving leaves a short burn on the ground. Rank ${n}.` },
  twin: { name: 'Twin spark', text: () => 'A second spark leaves at a slight angle.' },
  glass: { name: 'Glass wick', text: () => 'Sparks hit much harder. The wick starves faster.' },
  coal: { name: 'Round coal', text: () => 'Clearing a round gives a lump of heat back.' },
  pierce: { name: 'Pierce', text: (n) => `Sparks pass through another body. Rank ${n}.` },
}

const CURSE_COPY: Record<CurseId, Blurb> = {
  heavy: { name: 'Heavy ash', text: (n) => `The flame drags. Rank ${n}.` },
  thin: { name: 'Thin wick', text: (n) => `The well of heat is shallower. Rank ${n}.` },
  hungry: { name: 'Hungry dark', text: (n) => `Heat leaves faster. Rank ${n}.` },
  brittle: { name: 'Brittle flame', text: (n) => `Touches take more. Rank ${n}.` },
  dim: { name: 'Dim wick', text: (n) => `The light pulls in. Rank ${n}.` },
  sluggish: { name: 'Sluggish spark', text: (n) => `Sparks are slower and weaker. Rank ${n}.` },
  swarm: { name: 'Longer dark', text: (n) => `Later rounds bring more wisps. Rank ${n}.` },
  short: { name: 'Short breath', text: (n) => `Burst is slower and hungrier. Rank ${n}.` },
}

const PARTNERS: Partial<Record<UpgradeId, UpgradeId[]>> = {
  kindling: ['split', 'lance', 'twin'],
  split: ['kindling', 'pierce'],
  lance: ['kindling'],
  hearth: ['slowburn', 'glass'],
  slowburn: ['hearth', 'lure'],
  lure: ['slowburn'],
  step: ['trail'],
  trail: ['step'],
  bellows: ['thorn'],
  thorn: ['bellows', 'tell'],
  tell: ['thorn'],
  twin: ['kindling'],
  glass: ['hearth'],
  pierce: ['split'],
}

export interface Synergy {
  name: string
  a: UpgradeId
  b: UpgradeId
}

export const SYNERGIES: Synergy[] = [
  { name: 'Scatter', a: 'kindling', b: 'split' },
  { name: 'Brand', a: 'kindling', b: 'lance' },
  { name: 'Kiln', a: 'hearth', b: 'slowburn' },
  { name: 'Kept ember', a: 'lure', b: 'slowburn' },
  { name: 'Wildfire', a: 'step', b: 'trail' },
  { name: 'Constellation', a: 'twin', b: 'kindling' },
  { name: 'Banked glass', a: 'glass', b: 'hearth' },
  { name: 'Split rib', a: 'bellows', b: 'thorn' },
  { name: 'Through ash', a: 'pierce', b: 'split' },
  { name: 'Open ribs', a: 'tell', b: 'thorn' },
]

export function activeSynergies(ranks: Ranks): string[] {
  return SYNERGIES.filter((s) => ranks[s.a] > 0 && ranks[s.b] > 0).map((s) => s.name)
}

export function modsFrom(ranks: Ranks, curses: Curses): Mods {
  const mods: Mods = {
    shotDamage: 8 + ranks.kindling * 3.4,
    shotSpeed: 320 + ranks.lance * 70,
    shotLife: 0.52 + ranks.lance * 0.12,
    pierce: ranks.pierce,
    forks: ranks.split,
    forkFrac: 0.55,
    twin: ranks.twin > 0,
    twinFrac: 0.7,
    fireInterval: 0.46,
    maxHeat: 100 + ranks.hearth * 18,
    decayMult: 1,
    magnet: 28 + ranks.lure * 36,
    speed: 198 + ranks.step * 30,
    touchMult: Math.pow(0.84, ranks.ward),
    light: 86,
    burstCd: Math.max(0.45, 1.15 - ranks.bellows * 0.22),
    burstCost: Math.max(1, 4 - ranks.bellows * 0.6),
    trail: ranks.trail > 0,
    trailDps: 5 + ranks.trail * 4,
    bossBonus: 1 + ranks.thorn * 0.32,
    tellBonus: 1 + ranks.tell * 0.4,
    roundHeal: ranks.coal > 0 ? 16 : 0,
    sparkValue: 7 + ranks.lure * 2,
    extraSpawns: 0,
    brand: false,
    burstBoss: 1,
  }
  mods.decayMult *= Math.pow(0.84, ranks.slowburn)
  if (ranks.glass > 0) {
    mods.shotDamage *= 1.7
    mods.decayMult *= 1.5
  }
  if (ranks.kindling > 0 && ranks.split > 0) mods.forkFrac = 0.88
  if (ranks.kindling > 0 && ranks.lance > 0) mods.brand = true
  if (ranks.hearth > 0 && ranks.slowburn > 0) {
    mods.decayMult *= 0.82
    mods.roundHeal += 6
  }
  if (ranks.lure > 0 && ranks.slowburn > 0) mods.sparkValue += 3
  if (ranks.step > 0 && ranks.trail > 0) mods.trailDps *= 1.65
  if (ranks.twin > 0 && ranks.kindling > 0) mods.twinFrac = 1
  if (ranks.glass > 0 && ranks.hearth > 0) mods.decayMult *= 1.2 / 1.5
  if (ranks.bellows > 0 && ranks.thorn > 0) mods.burstBoss = 1.55
  if (ranks.pierce > 0 && ranks.split > 0) mods.pierce += 1

  mods.speed *= Math.pow(0.84, curses.heavy)
  mods.maxHeat *= Math.pow(0.84, curses.thin)
  mods.decayMult *= Math.pow(1.26, curses.hungry)
  mods.touchMult *= Math.pow(1.28, curses.brittle)
  mods.light *= Math.pow(0.8, curses.dim)
  if (curses.sluggish > 0) {
    mods.shotDamage *= Math.pow(0.8, curses.sluggish)
    mods.shotSpeed *= Math.pow(0.86, curses.sluggish)
  }
  mods.extraSpawns += curses.swarm * 2
  if (curses.short > 0) {
    mods.burstCd *= Math.pow(1.32, curses.short)
    mods.burstCost += curses.short * 2
  }
  return mods
}

export function lightOf(heat: number, maxHeat: number, base: number): number {
  const h = maxHeat <= 0 ? 0 : Math.max(0, heat) / maxHeat
  return base * (0.74 + 0.26 * h)
}

export function roman(n: number): string {
  const glyphs = ['', 'I', 'II', 'III', 'IV', 'V']
  return glyphs[n] ?? String(n)
}

export function upgradeName(id: OfferId): string {
  if (id in UPGRADE_COPY) return UPGRADE_COPY[id as UpgradeId].name
  return CURSE_COPY[id as CurseId].name
}

export function hintFor(id: OfferId, ranks: Ranks): string | null {
  if (!(id in PARTNERS)) return null
  const mates = PARTNERS[id as UpgradeId] ?? []
  for (const mate of mates) {
    if (ranks[mate] > 0) {
      const syn = SYNERGIES.find((s) => (s.a === id && s.b === mate) || (s.b === id && s.a === mate))
      if (syn) return `With ${UPGRADE_COPY[mate].name}: ${syn.name}`
    }
  }
  const next = mates[0]
  if (!next) return null
  return `Pairs with ${UPGRADE_COPY[next].name}`
}

export function buildPhrase(ranks: Ranks, curses: Curses): string {
  const ups = UPGRADES.filter((id) => ranks[id] > 0).map((id) => `${UPGRADE_COPY[id].name} ${roman(ranks[id])}`)
  const downs = CURSES.filter((id) => curses[id] > 0).map((id) => `${CURSE_COPY[id].name} ${roman(curses[id])}`)
  if (ups.length === 0 && downs.length === 0) return 'Bare flame'
  return [...ups, ...downs].join(' · ')
}

export function rollOffers(rng: () => number, ranks: Ranks, curses: Curses, kind: 'upgrade' | 'curse'): Offer[] {
  if (kind === 'curse') {
    const pool = CURSES.filter((id) => curses[id] < MAX_CURSE)
    const picks = draw(rng, pool.length ? pool : CURSES, 3)
    return picks.map((id) => curseOffer(id, curses[id]))
  }
  const pool = UPGRADES.filter((id) => ranks[id] < MAX_UP[id])
  const source = pool.length ? pool : UPGRADES
  const picks: UpgradeId[] = []
  const bag = [...source]
  while (picks.length < 3 && bag.length) {
    const weights = bag.map((id) => WEIGHT[id] + partnerBias(id, ranks))
    const id = weighted(rng, bag, weights)
    picks.push(id)
    bag.splice(bag.indexOf(id), 1)
  }
  while (picks.length < 3) picks.push(source[picks.length % source.length]!)
  if (picks.every((id) => WEIGHT[id] >= 7)) {
    const spicy = bag.find((id) => WEIGHT[id] < 7)
    if (spicy) picks[2] = spicy
  }
  return picks.map((id) => upgradeOffer(id, ranks))
}

function partnerBias(id: UpgradeId, ranks: Ranks): number {
  const mates = PARTNERS[id] ?? []
  return mates.some((mate) => ranks[mate] > 0) ? 6 : 0
}

function upgradeOffer(id: UpgradeId, ranks: Ranks): Offer {
  const next = Math.min(MAX_UP[id], ranks[id] + 1)
  return {
    id,
    kind: 'upgrade',
    name: UPGRADE_COPY[id].name,
    text: UPGRADE_COPY[id].text(next),
    hint: hintFor(id, ranks),
    rank: next,
    max: MAX_UP[id],
    icon: iconFor(id),
  }
}

function curseOffer(id: CurseId, have: number): Offer {
  const next = Math.min(MAX_CURSE, have + 1)
  return {
    id,
    kind: 'curse',
    name: CURSE_COPY[id].name,
    text: CURSE_COPY[id].text(next),
    hint: null,
    rank: next,
    max: MAX_CURSE,
    icon: iconFor(id),
  }
}

function draw<T>(rng: () => number, items: T[], n: number): T[] {
  const bag = [...items]
  const out: T[] = []
  while (out.length < n && bag.length) {
    const i = Math.floor(rng() * bag.length)
    out.push(bag.splice(i, 1)[0]!)
  }
  while (out.length < n) out.push(items[out.length % items.length]!)
  return out
}

function weighted<T>(rng: () => number, items: T[], weights: number[]): T {
  const sum = weights.reduce((a, b) => a + b, 0)
  let roll = rng() * sum
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i] ?? 0
    if (roll <= 0) return items[i]!
  }
  return items[items.length - 1]!
}

export const EVENT_COPY: Record<EventId, { title: string; sub: string }> = {
  strong: { title: 'Fed shadows', sub: 'The dark hits harder and holds more heat.' },
  slip: { title: 'Slick ash', sub: 'The floor keeps the flame sliding.' },
  rubble: { title: 'Fallen stone', sub: 'More rock rises around the wick.' },
  haste: { title: 'Quick dark', sub: 'Wisps close faster.' },
  starve: { title: 'Starving air', sub: 'Heat leaves in a hurry this round.' },
  fog: { title: 'Close fog', sub: 'The light pulls tight.' },
  vents: { title: 'New vents', sub: 'More pits and bramble open.' },
  surge: { title: 'Second swarm', sub: 'Extra wisps pour in.' },
}

export function rollEvent(rng: () => number): EventId {
  return EVENTS[Math.floor(rng() * EVENTS.length)] ?? 'strong'
}

export const KIND_COLOR: Record<Kind, string> = {
  wisp: '#c9b8ae',
  cinder: '#ff4d3a',
  boss: '#f2e6dc',
}

export interface BestMarks {
  round: number
  time: number
  bosses: number
}

export interface Blessing {
  id: string
  name: string
  desc: string
  need: string
  met: (marks: BestMarks) => boolean
}

export const BLESSINGS: Blessing[] = [
  {
    id: 'bare',
    name: 'Bare flame',
    desc: 'Nothing extra. The honest start.',
    need: '',
    met: () => true,
  },
  {
    id: 'hearth',
    name: 'Banked hearth',
    desc: 'Begin with Hearth. A deeper well.',
    need: 'Reach round 4',
    met: (m) => m.round >= 4,
  },
  {
    id: 'step',
    name: 'Quick wick',
    desc: 'Begin with Cinderstep.',
    need: 'Reach round 6',
    met: (m) => m.round >= 6,
  },
  {
    id: 'kindling',
    name: 'First coal',
    desc: 'Begin with Kindling.',
    need: 'Reach round 8',
    met: (m) => m.round >= 8,
  },
  {
    id: 'slowburn',
    name: 'Long coal',
    desc: 'Begin with Slow burn.',
    need: 'Reach round 10 or last 2:00',
    met: (m) => m.round >= 10 || m.time >= 120,
  },
]

export function ranksForBlessing(id: string): Ranks {
  const ranks = emptyRanks()
  if (id === 'hearth' || id === 'step' || id === 'kindling' || id === 'slowburn') ranks[id] = 1
  return ranks
}

export function blessingById(id: string): Blessing | undefined {
  return BLESSINGS.find((b) => b.id === id)
}

export function eulogyFor(round: number, bosses: number): string {
  if (bosses > 1) return `The briar fell ${bosses} times. The wick still went out on round ${round}.`
  if (bosses === 1) return `One briar fell. Round ${round} took the rest of the flame.`
  if (round <= 1) return 'The wick starved before the first dark finished.'
  return `The wick went out on round ${round}.`
}

export function isUpgrade(id: OfferId): id is UpgradeId {
  return (UPGRADES as string[]).includes(id)
}

export function isCurse(id: OfferId): id is CurseId {
  return (CURSES as string[]).includes(id)
}
