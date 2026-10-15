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

export type Rarity = 'common' | 'uncommon' | 'rare'

export function upgradeRarity(id: UpgradeId): Rarity {
  const weight = WEIGHT[id]
  if (weight >= 7) return 'common'
  if (weight >= 5) return 'uncommon'
  return 'rare'
}

export function rarityName(rarity: Rarity): string {
  if (rarity === 'common') return 'Common'
  if (rarity === 'uncommon') return 'Uncommon'
  return 'Rare'
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

function slower(perRank: number, rank: number): string {
  return `${Math.round((1 - Math.pow(perRank, rank)) * 100)}%`
}

function faster(perRank: number, rank: number): string {
  return `${Math.round((Math.pow(perRank, rank) - 1) * 100)}%`
}

const UPGRADE_COPY: Record<UpgradeId, Blurb> = {
  kindling: {
    name: 'Kindling',
    text: (n) => `Shots deal ${Math.round(8 + n * 4.2)} damage instead of 8, and they grow a little larger.`,
  },
  split: {
    name: 'Cleft spark',
    text: (n) => `Each shot also fires ${n} extra ${n === 1 ? 'shot' : 'shots'} to the side, at 55% damage.`,
  },
  moth: { name: 'Moth', text: () => 'Shots curve toward the nearest enemy.' },
  orbit: {
    name: 'Tooth ring',
    text: () => 'Three teeth circle you. An enemy touching one takes 28 damage a second.',
  },
  pop: {
    name: 'Cracked coal',
    text: () => 'When a shot fades out, it bursts into 6 short sparks at 42% damage.',
  },
  leech: {
    name: 'Wickdrink',
    text: () => 'A kill restores about 5 heat. Killing the Briar restores 18.',
  },
  brand: {
    name: 'Hot brand',
    text: () => 'A hit leaves fire on that spot for under a second. The fire deals half the shot’s damage each second.',
  },
  pierce: {
    name: 'Needle',
    text: (n) => `A shot hits ${n + 1} enemies before it disappears.`,
  },
  back: { name: 'Backdraft', text: () => 'Every shot also fires one behind you, at 62% damage.' },
  nova: { name: 'Ring breath', text: () => 'Every 4th shot also fires 8 shots in a ring, at half damage.' },
  glass: {
    name: 'Glass wick',
    text: () => `Shots deal ${Math.round((1.82 - 1) * 100)}% more damage. Heat drains ${Math.round((1.55 - 1) * 100)}% faster.`,
  },
  hearth: {
    name: 'Hearth',
    text: (n) => `Max heat becomes ${100 + n * 22}. You also gain 18 heat right now.`,
  },
  step: {
    name: 'Cinderstep',
    text: (n) => `You move ${Math.round(((198 + n * 34) / 198 - 1) * 100)}% faster.`,
  },
  slowburn: { name: 'Slow burn', text: (n) => `Heat drains ${slower(0.82, n)} slower.` },
  halo: {
    name: 'Ash halo',
    text: () => 'Enemies inside your light move 28% slower and take 7 damage a second.',
  },
  coal: {
    name: 'Last coal',
    text: () => 'Once each round, instead of dying, you come back with 22% of your max heat (at least 18).',
  },
  lure: {
    name: 'Lodestone',
    text: () =>
      'Sparks on the map restore 10 heat instead of 7, and they pull to you from about twice as far. Picking up any spark damages nearby enemies.',
  },
}

const CURSE_COPY: Record<CurseId, Blurb> = {
  heavy: { name: 'Heavy ash', text: (n) => `You move ${slower(0.84, n)} slower.` },
  thin: { name: 'Thin wick', text: (n) => `Max heat is ${slower(0.84, n)} lower.` },
  hungry: { name: 'Hungry dark', text: (n) => `Heat drains ${faster(1.26, n)} faster.` },
  brittle: { name: 'Brittle flame', text: (n) => `Touches and hazards take ${faster(1.28, n)} more heat.` },
  dim: { name: 'Dim wick', text: (n) => `The light around you is ${slower(0.8, n)} smaller.` },
  sluggish: {
    name: 'Sluggish spark',
    text: (n) => `Shots deal ${slower(0.8, n)} less damage and fly ${slower(0.86, n)} slower.`,
  },
  swarm: { name: 'Longer dark', text: (n) => `Every round spawns ${n * 2} extra enemies.` },
  short: {
    name: 'Short breath',
    text: (n) => `Burst takes ${faster(1.32, n)} longer to recharge and costs ${4 + n * 2} heat instead of 4.`,
  },
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
    shotSpeed: 168,
    shotLife: 1.5,
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

export function effectOf(id: OfferId, rank: number): string {
  if (id in UPGRADE_COPY) return UPGRADE_COPY[id as UpgradeId].text(rank)
  return CURSE_COPY[id as CurseId].text(rank)
}

export function buildPhrase(ranks: Ranks, curses: Curses): string {
  const ups = UPGRADES.filter((id) => ranks[id] > 0).map((id) => `${UPGRADE_COPY[id].name} ${roman(ranks[id])}`)
  const downs = CURSES.filter((id) => curses[id] > 0).map((id) => `${CURSE_COPY[id].name} ${roman(curses[id])}`)
  if (ups.length === 0 && downs.length === 0) return 'No upgrades'
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
    hint: null,
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
  strong: { title: 'Tougher enemies', sub: 'They have more health, and touching one costs more heat.' },
  slip: { title: 'Slick ground', sub: 'You slide. Letting go does not stop you at once.' },
  rubble: { title: 'Extra stones', sub: 'More rocks rise and block the way.' },
  haste: { title: 'Faster enemies', sub: 'Wisps and red enemies close in quicker.' },
  starve: { title: 'Heat drains faster', sub: 'Heat leaves about 50% faster this round.' },
  fog: { title: 'Smaller light', sub: 'The light around you shrinks.' },
  vents: { title: 'Extra hazards', sub: 'More pits and bramble. Pits drain heat. Bramble hurts when you touch it.' },
  surge: { title: 'Extra enemies', sub: 'Four more enemies join this round.' },
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
    name: 'None',
    desc: 'Start with no upgrade.',
    need: '',
    met: () => true,
  },
  {
    id: 'hearth',
    name: 'Hearth',
    desc: 'Start with Hearth: max heat 122 instead of 100.',
    need: 'Get to round 4',
    met: (m) => m.round >= 4,
  },
  {
    id: 'step',
    name: 'Cinderstep',
    desc: 'Start with Cinderstep: you move 17% faster.',
    need: 'Get to round 6',
    met: (m) => m.round >= 6,
  },
  {
    id: 'kindling',
    name: 'Kindling',
    desc: 'Start with Kindling: shots deal 12 damage instead of 8.',
    need: 'Get to round 8',
    met: (m) => m.round >= 8,
  },
  {
    id: 'slowburn',
    name: 'Slow burn',
    desc: 'Start with Slow burn: heat drains 18% slower.',
    need: 'Get to round 10, or survive 2:00',
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

export function eulogyFor(cause: string): string {
  if (cause === 'hunger') return 'Heat drained to zero.'
  if (cause === 'a pit') return 'A pit drained the last of your heat.'
  if (cause === 'bramble') return 'Bramble took the last of your heat.'
  if (cause === 'a red glare') return 'A red beam took the last of your heat. The warning line does not hurt. The bright beam does.'
  if (cause === 'a spike') return 'A Briar spike took the last of your heat.'
  if (cause === 'you let go') return 'You ended the run.'
  if (cause === 'Wisp') return 'A wisp touched you and took the last of your heat.'
  if (cause === 'Cinder wisp') return 'A red enemy touched you and took the last of your heat.'
  if (cause === 'The Briar') return 'The Briar touched you and took the last of your heat.'
  if (!cause) return 'Heat hit zero.'
  return `${cause} took the last of your heat.`
}

export function isUpgrade(id: OfferId): id is UpgradeId {
  return (UPGRADES as string[]).includes(id)
}

export function isCurse(id: OfferId): id is CurseId {
  return (CURSES as string[]).includes(id)
}
