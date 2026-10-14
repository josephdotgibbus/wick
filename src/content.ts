import type { Kind, Mods, Offer, OfferId, Ranks, UpgradeId } from './types.ts'

export interface EnemyStat {
  hp: number
  speed: number
  r: number
  touch: number
  xp: number
  emberN: number
  emberValue: number
  sap: number
}

export const ENEMIES: Record<Exclude<Kind, 'boss'>, EnemyStat> = {
  mote: { hp: 5, speed: 70, r: 8, touch: 12, xp: 2, emberN: 1, emberValue: 12, sap: 0 },
  ashling: { hp: 6, speed: 92, r: 9, touch: 14, xp: 3, emberN: 1, emberValue: 16, sap: 0 },
  warden: { hp: 18, speed: 40, r: 15, touch: 20, xp: 6, emberN: 3, emberValue: 14, sap: 0 },
  leech: { hp: 7, speed: 80, r: 8, touch: 0, xp: 4, emberN: 1, emberValue: 18, sap: 12 },
  popper: { hp: 3, speed: 112, r: 9, touch: 8, xp: 3, emberN: 2, emberValue: 14, sap: 0 },
  shade: { hp: 5, speed: 188, r: 10, touch: 16, xp: 4, emberN: 1, emberValue: 20, sap: 0 },
}

export const KIND_COLOR: Record<Kind, string> = {
  mote: '#e4d5c6',
  ashling: '#ff7a3c',
  warden: '#d4cfc6',
  leech: '#7ed0c0',
  popper: '#f2c14e',
  shade: '#8aa0bf',
  boss: '#d7eef8',
}

export const BOSS_NAMES = [
  'The Hearthless',
  'The Long Cold',
  'The Ash Regent',
  'The Unlit',
  'The Last Dark',
] as const

interface UpgradeDef {
  id: UpgradeId
  name: string
  rarity: 'common' | 'rare' | 'legend'
  max: number
  weight: number
  text: string
}

const UPGRADES: UpgradeDef[] = [
  { id: 'reach', name: 'Reach', rarity: 'common', max: 3, weight: 10, text: 'The light and its burn reach farther.' },
  { id: 'hunger', name: 'Hunger', rarity: 'common', max: 3, weight: 10, text: 'Embers drift in from farther away.' },
  { id: 'wisp', name: 'Wisp', rarity: 'common', max: 3, weight: 10, text: 'Another spark orbits the wick and fires.' },
  { id: 'temper', name: 'Temper', rarity: 'common', max: 3, weight: 10, text: 'Sparks hit harder and recharge sooner.' },
  { id: 'bellows', name: 'Bellows', rarity: 'common', max: 2, weight: 9, text: 'Burst comes back faster.' },
  { id: 'wick', name: 'Slow Burn', rarity: 'common', max: 2, weight: 9, text: 'The flame starves more slowly.' },
  { id: 'heart', name: 'Heartwood', rarity: 'common', max: 2, weight: 8, text: 'A deeper well of heat. Restore some now.' },
  { id: 'drift', name: 'Drift', rarity: 'common', max: 2, weight: 8, text: 'Move faster.' },
  { id: 'fan', name: 'Fan', rarity: 'rare', max: 2, weight: 4.2, text: 'Sparks pass through another body.' },
  { id: 'trail', name: 'Cinder', rarity: 'rare', max: 2, weight: 4.2, text: 'Burst leaves a patch of fire behind.' },
  { id: 'arc', name: 'Arc', rarity: 'rare', max: 2, weight: 4, text: 'A kill jumps to a nearby foe.' },
  { id: 'emberheart', name: 'Emberheart', rarity: 'rare', max: 1, weight: 3.6, text: 'Combos take longer to break.' },
  { id: 'feast', name: 'Feast', rarity: 'rare', max: 1, weight: 3.6, text: 'Embers feed more heat back into the wick.' },
  { id: 'hush', name: 'Hush', rarity: 'rare', max: 1, weight: 3.4, text: 'Hold still and the wick looses a beam.' },
  { id: 'glass', name: 'Glass', rarity: 'legend', max: 1, weight: 1.7, text: 'Much more damage. The wick starves faster.' },
  { id: 'nova', name: 'Nova', rarity: 'legend', max: 1, weight: 1.7, text: 'Every tenth kill erupts.' },
]

export interface Synergy {
  id: string
  name: string
  a: UpgradeId
  b: UpgradeId
}

export const SYNERGIES: Synergy[] = [
  { id: 'constellation', name: 'Constellation', a: 'wisp', b: 'temper' },
  { id: 'kiln', name: 'Kiln', a: 'glass', b: 'wick' },
  { id: 'wildfire', name: 'Wildfire', a: 'trail', b: 'bellows' },
  { id: 'storm', name: 'Storm', a: 'arc', b: 'fan' },
  { id: 'gluttony', name: 'Gluttony', a: 'hunger', b: 'feast' },
  { id: 'vigil', name: 'Vigil', a: 'hush', b: 'reach' },
]

export function emptyRanks(): Ranks {
  return {
    reach: 0,
    hunger: 0,
    wisp: 0,
    temper: 0,
    fan: 0,
    trail: 0,
    bellows: 0,
    wick: 0,
    heart: 0,
    arc: 0,
    glass: 0,
    emberheart: 0,
    nova: 0,
    drift: 0,
    hush: 0,
    feast: 0,
  }
}

export function modsFrom(r: Ranks): Mods {
  const constellation = r.wisp > 0 && r.temper > 0
  const kiln = r.glass > 0 && r.wick > 0
  const wildfire = r.trail > 0 && r.bellows > 0
  const storm = r.arc > 0 && r.fan > 0
  const gluttony = r.hunger > 0 && r.feast > 0
  const vigil = r.hush > 0 && r.reach > 0

  let decayMult = Math.pow(0.86, r.wick)
  if (r.glass > 0) {
    const glassTax = kiln ? (r.wick >= 2 ? 1.12 : 1.26) : 1.5
    decayMult *= glassTax
  }
  const damageMult = 1 + (r.glass > 0 ? 0.62 : 0)

  return {
    light: 68 + r.reach * 20,
    auraDps: (4.5 + r.reach * 2.4) * damageMult,
    magnet: 100 + r.hunger * 56 + (gluttony ? 40 : 0),
    wisps: 1 + r.wisp,
    sparkDamage: (2 + r.temper * 0.8 + (constellation ? 0.5 : 0)) * damageMult,
    sparkInterval: Math.max(0.15, 0.48 * Math.pow(0.9, r.temper)),
    pierce: r.fan + (storm ? 1 : 0),
    trailRanks: r.trail,
    trailDps: (8 + r.trail * 6) * (wildfire ? 1.8 : 1) * damageMult,
    burstCd: Math.max(0.32, 1.05 * Math.pow(0.82, r.bellows) * (wildfire ? 0.85 : 1)),
    decayMult,
    maxHeat: 100 + r.heart * 24,
    chain: r.arc + (storm ? 1 : 0),
    chainRange: 120 + r.arc * 30 + (storm ? 60 : 0),
    chainFrac: 0.6 + (storm ? 0.2 : 0),
    damageMult,
    comboGrace: 1.2 + r.emberheart * 0.55,
    novaEvery: r.nova > 0 ? 10 : 0,
    speed: 1 + r.drift * 0.13,
    hush: r.hush > 0,
    hushTime: vigil ? 0.55 : 0.85,
    beamLen: (vigil ? 340 : 230) + r.reach * 12,
    beamDamage: (7 + r.reach * 1.5) * damageMult,
    feastHeat: r.feast > 0 ? (gluttony ? 2.8 : 1.6) : 0,
    orbit: (1.65 + r.wisp * 0.05) * (constellation ? 1.45 : 1),
  }
}

export function lightOf(heat: number, maxHeat: number, base: number, inferno: boolean): number {
  const h = maxHeat <= 0 ? 0 : Math.max(0, Math.min(1, heat / maxHeat))
  return base * (0.78 + 0.22 * h) * (inferno ? 1.2 : 1)
}

export function xpFor(level: number): number {
  return Math.round(8 + level * 9 + level * level * 1.35)
}

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI']

export function roman(n: number): string {
  return ROMAN[n] ?? String(n)
}

export function upgradeName(id: UpgradeId): string {
  return UPGRADES.find((u) => u.id === id)?.name ?? id
}

export function hintFor(id: OfferId, ranks: Ranks): string | null {
  if (id === 'gulp' || id === 'cache') return null
  for (const s of SYNERGIES) {
    if (s.a !== id && s.b !== id) continue
    const other = s.a === id ? s.b : s.a
    const have = ranks[other] > 0
    return have ? `Completes ${s.name}` : `Pairs with ${upgradeName(other)} · ${s.name}`
  }
  return null
}

export function activeSynergies(ranks: Ranks): string[] {
  return SYNERGIES.filter((s) => ranks[s.a] > 0 && ranks[s.b] > 0).map((s) => s.name)
}

export function buildPhrase(ranks: Ranks): string {
  const parts: string[] = []
  for (const u of UPGRADES) {
    const n = ranks[u.id]
    if (n > 0) parts.push(`${u.name} ${roman(n)}`)
  }
  return parts.length ? parts.join(' · ') : 'Bare flame'
}

export function rollOffers(rng: () => number, ranks: Ranks): Offer[] {
  const pool = UPGRADES.filter((u) => ranks[u.id] < u.max)
  const picks: UpgradeDef[] = []
  while (picks.length < 3 && pool.length > 0) {
    const total = pool.reduce((s, u) => s + u.weight, 0)
    let x = rng() * total
    let idx = pool.length - 1
    for (let i = 0; i < pool.length; i++) {
      x -= pool[i]!.weight
      if (x <= 0) {
        idx = i
        break
      }
    }
    const picked = pool.splice(idx, 1)[0]
    if (picked) picks.push(picked)
  }
  if (picks.length === 3 && picks.every((p) => p.rarity === 'common')) {
    const spice = pool.findIndex((p) => p.rarity !== 'common')
    if (spice >= 0) {
      const swapped = pool.splice(spice, 1)[0]
      if (swapped) picks[2] = swapped
    }
  }
  const offers: Offer[] = picks.map((u) => ({
    id: u.id,
    name: u.name,
    rarity: u.rarity,
    text: u.text,
    hint: hintFor(u.id, ranks),
    rank: ranks[u.id] + 1,
    max: u.max,
  }))
  const boons: Offer[] = [
    { id: 'gulp', name: 'Gulp', rarity: 'boon', text: 'Restore 30 heat right now.', hint: null, rank: 0, max: 0 },
    { id: 'cache', name: 'Cache', rarity: 'boon', text: 'Bank a pile of score.', hint: null, rank: 0, max: 0 },
    { id: 'gulp', name: 'Deep gulp', rarity: 'boon', text: 'Restore 44 heat right now.', hint: null, rank: 0, max: 0 },
  ]
  let b = 0
  while (offers.length < 3) {
    offers.push(boons[b % boons.length]!)
    b++
  }
  return offers
}

export interface BestMarks {
  score: number
  time: number
  combo: number
  bosses: number
}

export interface Blessing {
  id: string
  name: string
  desc: string
  need: string
  met: (best: BestMarks) => boolean
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
    id: 'hunger',
    name: 'Ash hunger',
    desc: 'Begin with Hunger. Embers lean toward you.',
    need: 'Score 1,000',
    met: (b) => b.score >= 1000,
  },
  {
    id: 'wisp',
    name: 'Twin spark',
    desc: 'Begin with a second orbiting spark.',
    need: 'Score 4,000',
    met: (b) => b.score >= 4000,
  },
  {
    id: 'wick',
    name: 'Banked coal',
    desc: 'Begin with Slow Burn. The wick starves slower.',
    need: 'Survive 60 seconds',
    met: (b) => b.time >= 60,
  },
  {
    id: 'emberheart',
    name: 'Long ember',
    desc: 'Begin with Emberheart. Combos linger.',
    need: 'Reach a combo of 15',
    met: (b) => b.combo >= 15,
  },
  {
    id: 'nova',
    name: 'First nova',
    desc: 'Begin with Nova. Every tenth kill blooms.',
    need: 'Defeat a boss',
    met: (b) => b.bosses >= 1,
  },
  {
    id: 'glass',
    name: 'Glass wick',
    desc: 'Begin with Glass. Brighter, and much hungrier.',
    need: 'Survive 2:30 or score 8,000',
    met: (b) => b.time >= 150 || b.score >= 8000,
  },
]

export function ranksForBlessing(id: string): Ranks {
  const ranks = emptyRanks()
  if (id === 'hunger') ranks.hunger = 1
  else if (id === 'wisp') ranks.wisp = 1
  else if (id === 'wick') ranks.wick = 1
  else if (id === 'emberheart') ranks.emberheart = 1
  else if (id === 'nova') ranks.nova = 1
  else if (id === 'glass') ranks.glass = 1
  return ranks
}

export function blessingById(id: string): Blessing | undefined {
  return BLESSINGS.find((b) => b.id === id)
}

export function eulogyFor(cause: string, time: number, combo: number, bosses: number): string {
  if (cause === 'quit') return 'You pinched the wick out yourself.'
  if (cause === 'starved') return 'The wick starved before the dark arrived.'
  if (cause === 'cold') return 'A ring of cold pinched the flame.'
  if (cause === 'shade') return 'A shade caught the wick outside the light.'
  if (cause === 'popper') return 'You stood too close to the bloom.'
  if (cause === 'leech') return 'They drank the heat and left the smoke.'
  if (cause === 'warden') return 'Stone outlasts a small flame.'
  if (cause === 'boss') return 'The cold closed its hand.'
  if (bosses > 0 && time > 80) return 'The dark flinched. Then it leaned back in.'
  if (combo >= 20) return 'Greedy to the last ember.'
  if (time > 150) return 'Longer than it had any right to burn.'
  if (time < 18) return 'Snuffed before the wick caught.'
  if (time < 45) return 'A brief light. The dark is patient.'
  return 'The flame went out. The score remains.'
}
