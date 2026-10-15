import type { Curses, CurseId, EventId, Kind, Mods, Offer, OfferId, Ranks, UpgradeId } from './types.ts'

export const UPGRADES: UpgradeId[] = [
  'kindling',
  'split',
  'moth',
  'orbit',
  'pop',
  'leech',
  'brand',
  'pierce',
  'back',
  'nova',
  'glass',
  'hearth',
  'step',
  'slowburn',
  'halo',
  'coal',
  'lure',
]

export const CURSES: CurseId[] = ['heavy', 'thin', 'hungry', 'brittle', 'dim', 'sluggish', 'swarm', 'short']

export const EVENTS: EventId[] = ['strong', 'slip', 'rubble', 'haste', 'starve', 'fog', 'vents', 'surge']

const MAX_UP: Record<UpgradeId, number> = {
  kindling: 3,
  split: 2,
  moth: 1,
  orbit: 1,
  pop: 1,
  leech: 1,
  brand: 1,
  pierce: 2,
  back: 1,
  nova: 1,
  glass: 1,
  hearth: 2,
  step: 2,
  slowburn: 2,
  halo: 1,
  coal: 1,
  lure: 1,
}

const MAX_CURSE = 2

const WEIGHT: Record<UpgradeId, number> = {
  kindling: 9,
  hearth: 8,
  slowburn: 8,
  step: 8,
  split: 7,
  pierce: 6.5,
  lure: 6,
  moth: 5,
  orbit: 5,
  leech: 5,
  brand: 5,
  halo: 4.6,
  pop: 4.4,
  back: 4,
  coal: 3.4,
  nova: 3.2,
  glass: 2.5,
}

export function emptyRanks(): Ranks {
  return {
    kindling: 0,
    split: 0,
    moth: 0,
    orbit: 0,
    pop: 0,
    leech: 0,
    brand: 0,
    pierce: 0,
    back: 0,
    nova: 0,
    glass: 0,
    hearth: 0,
    step: 0,
    slowburn: 0,
    halo: 0,
    coal: 0,
    lure: 0,
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
  const ash = '#2a201c'
  const body: Record<string, string> = {
    kindling: `<ellipse cx="32" cy="46" rx="14" ry="9" fill="${ash}" stroke="${gold}" stroke-width="2"/><path d="M32 10 C39 20 43 24 36 34 C45 29 44 42 32 44 C20 42 19 29 28 34 C21 24 25 20 32 10 Z" fill="${ember}"/><ellipse cx="32" cy="32" rx="3.5" ry="7" fill="#fff1d2"/>`,
    split: `<circle cx="32" cy="48" r="6" fill="${ember}"/><path d="M32 42 L16 16 M32 42 L48 16" stroke="${ink}" stroke-width="3" fill="none"/><circle cx="16" cy="14" r="5" fill="${gold}"/><circle cx="48" cy="14" r="5" fill="${ember}"/>`,
    moth: `<path d="M32 20 C16 8 6 24 16 36 C22 28 28 32 32 38 C36 32 42 28 48 36 C58 24 48 8 32 20 Z" fill="#c9b8ae"/><path d="M32 20 C22 14 16 24 22 32 C28 26 32 30 32 38 C32 30 36 26 42 32 C48 24 42 14 32 20 Z" fill="${ember}"/><ellipse cx="32" cy="42" rx="3" ry="8" fill="${ash}"/><circle cx="29" cy="24" r="1.5" fill="#ff2a22"/><circle cx="35" cy="24" r="1.5" fill="#ff2a22"/>`,
    orbit: `<circle cx="32" cy="32" r="13" fill="none" stroke="${gold}" stroke-width="2"/><path d="M32 8 L36 18 H28 Z M52 42 L42 38 L46 32 Z M12 42 L22 38 L18 32 Z" fill="${ink}"/><circle cx="32" cy="32" r="4" fill="${ember}"/>`,
    pop: `<circle cx="30" cy="36" r="13" fill="${ash}"/><path d="M22 30 L32 38 L26 48 M38 24 L34 36 L48 40" stroke="${gold}" stroke-width="2" fill="none"/><circle cx="14" cy="16" r="3.2" fill="${ember}"/><circle cx="50" cy="14" r="2.6" fill="${gold}"/><circle cx="52" cy="28" r="2" fill="#fff1d2"/>`,
    leech: `<path d="M26 50 C26 38 18 34 24 20 C28 30 36 30 40 20 C46 34 38 38 38 50 Z" fill="${ember}"/><path d="M32 8 C37 16 37 22 32 28 C27 22 27 16 32 8 Z" fill="${gold}"/>`,
    brand: `<rect x="28" y="6" width="8" height="20" rx="2" fill="#8d8278"/><rect x="16" y="26" width="32" height="24" rx="4" fill="${ash}" stroke="${ember}" stroke-width="3"/><path d="M24 36 H40 M32 30 V44" stroke="${gold}" stroke-width="2.4"/>`,
    pierce: `<path d="M8 46 L44 12" stroke="${ink}" stroke-width="3"/><path d="M40 8 L56 16 L42 24 Z" fill="#e4dcd4"/><circle cx="16" cy="40" r="3.2" fill="${ember}"/>`,
    back: `<circle cx="16" cy="32" r="8" fill="${ember}"/><circle cx="48" cy="32" r="6" fill="${gold}"/><path d="M24 32 H40" stroke="${ink}" stroke-width="2.4"/>`,
    nova: `<circle cx="32" cy="32" r="5" fill="#fff1d2"/><circle cx="32" cy="12" r="3.4" fill="${ember}"/><circle cx="32" cy="52" r="3.4" fill="${ember}"/><circle cx="12" cy="32" r="3.4" fill="${gold}"/><circle cx="52" cy="32" r="3.4" fill="${gold}"/><circle cx="18" cy="18" r="2.8" fill="${ember}"/><circle cx="46" cy="18" r="2.8" fill="${ember}"/><circle cx="18" cy="46" r="2.8" fill="${gold}"/><circle cx="46" cy="46" r="2.8" fill="${gold}"/>`,
    glass: `<path d="M14 12 H50 V52 H14 Z" fill="none" stroke="#d5e4ee" stroke-width="3"/><path d="M18 16 L32 32 L26 50 M32 32 L48 22" stroke="#d5e4ee" stroke-width="1.6" fill="none"/><path d="M32 42 C37 34 38 32 36 24 C33 32 29 32 26 24 C24 32 27 34 32 42 Z" fill="${ember}"/>`,
    hearth: `<path d="M32 8 C38 16 40 20 34 28 C40 24 38 36 32 36 C26 36 24 24 30 28 C24 20 26 16 32 8 Z" fill="${ember}"/><rect x="10" y="36" width="44" height="16" rx="2" fill="#3a302c"/><rect x="14" y="40" width="10" height="8" fill="${ash}"/><rect x="27" y="40" width="10" height="8" fill="${ash}"/><rect x="40" y="40" width="10" height="8" fill="${ash}"/>`,
    step: `<path d="M16 16 H34 V30 H50 V46 H12 V28 H16 Z" fill="${ash}" stroke="${ink}" stroke-width="2"/><circle cx="20" cy="42" r="2.2" fill="${ember}"/><circle cx="30" cy="44" r="2.2" fill="${gold}"/><circle cx="42" cy="42" r="2.2" fill="${ember}"/>`,
    slowburn: `<circle cx="32" cy="34" r="16" fill="none" stroke="#6e645c" stroke-width="7"/><circle cx="32" cy="34" r="16" fill="none" stroke="${gold}" stroke-width="2" stroke-dasharray="3 7"/><path d="M32 26 C36 31 36 33 32 40 C28 33 28 31 32 26 Z" fill="${ember}"/>`,
    halo: `<circle cx="32" cy="34" r="18" fill="none" stroke="${ember}" stroke-width="3"/><circle cx="32" cy="34" r="11" fill="none" stroke="${gold}" stroke-width="1.6" stroke-dasharray="2 3"/><path d="M32 24 C36 30 36 32 32 42 C28 32 28 30 32 24 Z" fill="#fff1d2"/>`,
    coal: `<ellipse cx="32" cy="38" rx="16" ry="12" fill="#14100e" stroke="${gold}" stroke-width="2"/><path d="M20 36 L32 28 L28 42 L44 32" stroke="${gold}" stroke-width="2" fill="none"/><circle cx="48" cy="18" r="3" fill="${ember}"/>`,
    lure: `<path d="M18 16 V34 C18 48 46 48 46 34 V16" fill="none" stroke="${curse}" stroke-width="8"/><rect x="14" y="12" width="10" height="8" fill="${ink}"/><rect x="40" y="12" width="10" height="8" fill="${ink}"/><circle cx="32" cy="14" r="3.2" fill="${ember}"/>`,
    heavy: `<rect x="18" y="26" width="28" height="18" fill="${curse}"/>`,
    thin: `<path d="M32 12 V52" stroke="${curse}" stroke-width="2"/>`,
    hungry: `<path d="M16 36 Q32 18 48 36 Q32 28 16 36" fill="${curse}"/>`,
    brittle: `<path d="M32 14 L36 30 L50 32 L38 40 L42 52 L32 44 L22 52 L26 40 L14 32 L28 30 Z" fill="none" stroke="${curse}" stroke-width="2"/>`,
    dim: `<circle cx="32" cy="32" r="10" fill="none" stroke="${curse}" stroke-width="3" opacity="0.7"/>`,
    sluggish: `<circle cx="32" cy="34" r="8" fill="${curse}" opacity="0.8"/>`,
    swarm: `<circle cx="22" cy="34" r="5" fill="${curse}"/><circle cx="36" cy="28" r="5" fill="${curse}"/><circle cx="42" cy="40" r="4" fill="${curse}"/>`,
    short: `<path d="M18 24 H46 L40 46 H24 Z" fill="none" stroke="${curse}" stroke-width="3"/>`,
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#16110e"/>${body[id] ?? ''}</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

interface Blurb {
  name: string
  text: (rank: number) => string
}

const UPGRADE_COPY: Record<UpgradeId, Blurb> = {
  kindling: { name: 'Kindling', text: (n) => `Sparks hit harder, and the mote swells with the hurt it can do. ${n > 1 ? `Rank ${n}.` : ''}`.trim() },
  split: { name: 'Cleft spark', text: (n) => `Each spark sheds ${n > 1 ? 'two smaller sisters' : 'a smaller sister'}.` },
  moth: { name: 'Moth', text: () => 'Sparks bend toward the nearest shadow.' },
  orbit: { name: 'Tooth ring', text: () => 'Three teeth circle the wick and chew whatever they touch.' },
  pop: { name: 'Cracked coal', text: () => 'A spark that dies bursts into cinders.' },
  leech: { name: 'Wickdrink', text: () => 'A kill feeds a sip of heat back into the wick.' },
  brand: { name: 'Hot brand', text: () => 'A hit leaves a patch of fire burning on the body.' },
  pierce: { name: 'Needle', text: (n) => `Sparks pass through ${n > 1 ? 'more bodies' : 'another body'}.` },
  back: { name: 'Backdraft', text: () => 'A weaker spark leaves backward.' },
  nova: { name: 'Ring breath', text: () => 'Every fourth spark is a ring of eight.' },
  glass: { name: 'Glass wick', text: () => 'Sparks hit much harder. Hunger comes on faster.' },
  hearth: { name: 'Hearth', text: (n) => `The well of heat is deeper. A little returns now. ${n > 1 ? `Rank ${n}.` : ''}`.trim() },
  step: { name: 'Cinderstep', text: (n) => `The flame moves quicker. ${n > 1 ? `Rank ${n}.` : ''}`.trim() },
  slowburn: { name: 'Slow burn', text: (n) => `Heat leaves more slowly. ${n > 1 ? `Rank ${n}.` : ''}`.trim() },
  halo: { name: 'Ash halo', text: () => 'Shadows inside the light slow down and scorch.' },
  coal: { name: 'Last coal', text: () => 'The first time a round would snuff you, a coal cracks and the wick stays.' },
  lure: { name: 'Lodestone', text: () => 'Map sparks rush in. Picking one up scorches the dark nearby.' },
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
  kindling: ['split', 'orbit', 'pop'],
  split: ['kindling', 'moth', 'back'],
  moth: ['split', 'brand', 'pop'],
  orbit: ['kindling'],
  pop: ['kindling', 'brand', 'moth'],
  leech: ['hearth', 'coal', 'lure'],
  brand: ['pop', 'moth'],
  pierce: ['nova'],
  back: ['split'],
  nova: ['pierce'],
  glass: ['hearth'],
  hearth: ['glass', 'leech', 'slowburn'],
  step: ['halo'],
  slowburn: ['halo', 'hearth'],
  halo: ['slowburn', 'step'],
  coal: ['leech'],
  lure: ['leech'],
}

export interface Synergy {
  name: string
  a: UpgradeId
  b: UpgradeId
}

export const SYNERGIES: Synergy[] = [
  { name: 'Cleft coal', a: 'kindling', b: 'split' },
  { name: 'Led moths', a: 'moth', b: 'split' },
  { name: 'Jaw', a: 'kindling', b: 'orbit' },
  { name: 'Shrapnel', a: 'kindling', b: 'pop' },
  { name: 'Seeking cinders', a: 'moth', b: 'pop' },
  { name: 'Fed flame', a: 'leech', b: 'hearth' },
  { name: 'Banked glass', a: 'glass', b: 'hearth' },
  { name: 'Kiln light', a: 'halo', b: 'slowburn' },
  { name: 'Wild light', a: 'step', b: 'halo' },
  { name: 'Cinderfield', a: 'brand', b: 'pop' },
  { name: 'Second swallow', a: 'coal', b: 'leech' },
  { name: 'Lodestone sip', a: 'lure', b: 'leech' },
  { name: 'Crossdraft', a: 'back', b: 'split' },
  { name: 'Spoked wheel', a: 'nova', b: 'pierce' },
  { name: 'Hot moths', a: 'brand', b: 'moth' },
  { name: 'Kept hearth', a: 'hearth', b: 'slowburn' },
]

export function activeSynergies(ranks: Ranks): string[] {
  return SYNERGIES.filter((s) => ranks[s.a] > 0 && ranks[s.b] > 0).map((s) => s.name)
}

export function modsFrom(ranks: Ranks, curses: Curses): Mods {
  const mods: Mods = {
    shotDamage: 8 + ranks.kindling * 4.2,
    shotSpeed: 340,
    shotLife: 0.58,
    pierce: ranks.pierce,
    forks: ranks.split,
    forkFrac: 0.55,
    fireInterval: 0.46,
    maxHeat: 100 + ranks.hearth * 22,
    decayMult: Math.pow(0.82, ranks.slowburn),
    magnet: 28 + (ranks.lure > 0 ? 48 : 0),
    speed: 198 + ranks.step * 34,
    touchMult: 1,
    light: 86,
    burstCd: 1.15,
    burstCost: 4,
    sparkValue: 7 + (ranks.lure > 0 ? 3 : 0),
    extraSpawns: 0,
    homing: ranks.moth > 0 ? 4.6 : 0,
    orbit: ranks.orbit > 0 ? 3 : 0,
    orbitDmg: ranks.orbit > 0 ? 28 : 0,
    pop: ranks.pop > 0,
    popFrac: ranks.pop > 0 ? 0.42 : 0,
    popCount: ranks.pop > 0 ? 6 : 0,
    popPatch: false,
    brand: ranks.brand > 0,
    brandForks: false,
    leech: ranks.leech > 0 ? 4.5 : 0,
    back: ranks.back > 0,
    backFrac: 0.62,
    backSplits: false,
    novaEvery: ranks.nova > 0 ? 4 : 0,
    novaFrac: 0.5,
    haloDps: ranks.halo > 0 ? 7 : 0,
    haloSlow: ranks.halo > 0 ? 0.72 : 1,
    lastCoal: ranks.coal > 0,
    coalRing: false,
    collectRing: ranks.lure > 0 ? 52 : 0,
  }
  if (ranks.glass > 0) {
    mods.shotDamage *= 1.82
    mods.decayMult *= 1.55
  }
  if (ranks.kindling > 0 && ranks.split > 0) mods.forkFrac = 0.92
  if (ranks.moth > 0 && ranks.split > 0) {
    mods.homing = 8
    mods.forkFrac = Math.max(mods.forkFrac, 0.85)
  }
  if (ranks.kindling > 0 && ranks.orbit > 0) {
    mods.orbit += 1
    mods.orbitDmg *= 1.65
  }
  if (ranks.kindling > 0 && ranks.pop > 0) {
    mods.popFrac = 0.9
    mods.popCount = 8
  }
  if (ranks.moth > 0 && ranks.pop > 0) {
    mods.homing = Math.max(mods.homing, 6.4)
    mods.popFrac = Math.max(mods.popFrac, 0.7)
  }
  if (ranks.leech > 0 && ranks.hearth > 0) mods.leech *= 2
  if (ranks.glass > 0 && ranks.hearth > 0) mods.decayMult /= 1.55
  if (ranks.halo > 0 && ranks.slowburn > 0) {
    mods.haloDps *= 1.6
    mods.haloSlow = 0.55
    mods.decayMult *= 0.84
  }
  if (ranks.step > 0 && ranks.halo > 0) mods.light *= 1.28
  if (ranks.brand > 0 && ranks.pop > 0) mods.popPatch = true
  if (ranks.coal > 0 && ranks.leech > 0) {
    mods.coalRing = true
    mods.leech += 2
  }
  if (ranks.lure > 0 && ranks.leech > 0) {
    mods.collectRing = 84
    mods.leech += 1.5
    mods.magnet += 24
    mods.sparkValue += 2
  }
  if (ranks.back > 0 && ranks.split > 0) mods.backSplits = true
  if (ranks.nova > 0 && ranks.pierce > 0) mods.novaFrac = 0.9
  if (ranks.brand > 0 && ranks.moth > 0) {
    mods.homing *= 1.35
    mods.brandForks = true
  }
  if (ranks.hearth > 0 && ranks.slowburn > 0) {
    mods.decayMult *= 0.82
    mods.maxHeat += 12
  }

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
  return mates.some((mate) => ranks[mate] > 0) ? 9 : 0
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
