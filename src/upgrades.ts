/**
 * Upgrades sit on treasure pedestals and, rarely, in chests.
 * Add an object to UPGRADES and the roll below can hand it out.
 *
 * Passive entries change stats and stay for the run. They stack.
 * Active entries fill the one active slot. A new active replaces the old one.
 * Using it calls `use` from sim.ts once it is charged.
 * Charges fill by 1 each time a room is cleared. The slot starts empty.
 *
 * Tier is 0 through 4. A roll picks the tier first, then an item in that tier.
 * Weights sum to 100: tier 0 is 46, 1 is 28, 2 is 15, 3 is 8, 4 is 3.
 * If the rolled tier has nothing left, the roll tries again, then any item still available.
 *
 * Stat fields are added to the player. maxHeat raises the wick, which is your life.
 * Leave a field out to leave that stat alone.
 */
export type Tier = 0 | 1 | 2 | 3 | 4

export interface UpgradeDef {
  id: string
  name: string
  description: string
  kind: 'passive' | 'active'
  tier: Tier
  damage?: number
  tears?: number
  speed?: number
  range?: number
  shotSpeed?: number
  luck?: number
  /** Extra pixels added to how far sparks start pulling toward you. */
  magnet?: number
  maxHeat?: number
  charges?: number
  use?: string
}

/** Chance of each tier, out of 100. */
export const TIER_WEIGHT: Record<Tier, number> = {
  0: 46,
  1: 28,
  2: 15,
  3: 8,
  4: 3,
}

const TIERS: Tier[] = [0, 1, 2, 3, 4]

export const UPGRADES: UpgradeDef[] = [
  {
    id: 'cinder-crumb',
    name: 'Cinder crumb',
    description: 'A dry fleck of wick. Stand-in for a common passive.',
    kind: 'passive',
    tier: 0,
    damage: 0.35,
  },
  {
    id: 'warm-splinter',
    name: 'Warm splinter',
    description: 'A hot sliver under the flame. Stand-in for an uncommon passive.',
    kind: 'passive',
    tier: 1,
    speed: 0.06,
    tears: 0.12,
  },
  {
    id: 'blue-wick',
    name: 'Blue wick',
    description: 'A cold thread in the flame. Use it to put 6 heat back. Stand-in for a tier 2 active.',
    kind: 'active',
    tier: 2,
    charges: 3,
    use: 'blue',
  },
  {
    id: 'bright-coal',
    name: 'Bright coal',
    description: 'A coal that keeps throwing sparks. Stand-in for a tier 3 passive.',
    kind: 'passive',
    tier: 3,
    damage: 0.8,
    luck: 0.4,
  },
  {
    id: 'white-dawn',
    name: 'White dawn',
    description: 'A blank morning caught in wax. Use it to put 12 heat back. Stand-in for a tier 4 active.',
    kind: 'active',
    tier: 4,
    charges: 4,
    use: 'dawn',
  },
]

export function upgradeById(id: string): UpgradeDef | undefined {
  return UPGRADES.find((item) => item.id === id)
}

export function rollTier(rng: () => number): Tier {
  let total = 0
  for (const tier of TIERS) total += TIER_WEIGHT[tier]
  let roll = rng() * total
  for (const tier of TIERS) {
    roll -= TIER_WEIGHT[tier]
    if (roll < 0) return tier
  }
  return 0
}

/** Pick an upgrade. `avoid` skips ids already set on the other pedestals in the room. */
export function rollUpgrade(rng: () => number, avoid: ReadonlySet<string> = new Set()): UpgradeDef | null {
  const available = UPGRADES.filter((item) => !avoid.has(item.id))
  if (!available.length) return null
  for (let attempt = 0; attempt < 6; attempt++) {
    const tier = rollTier(rng)
    const pool = available.filter((item) => item.tier === tier)
    if (!pool.length) continue
    return pool[Math.floor(rng() * pool.length)]!
  }
  return weightedPick(rng, available)
}

function weightedPick(rng: () => number, pool: UpgradeDef[]): UpgradeDef {
  const total = pool.reduce((sum, item) => sum + TIER_WEIGHT[item.tier], 0)
  let roll = rng() * total
  for (const item of pool) {
    roll -= TIER_WEIGHT[item.tier]
    if (roll < 0) return item
  }
  return pool[0]!
}

export function signed(n: number): string {
  const text = Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, '')
  return n > 0 ? `+${text}` : text
}

export function upgradeDetail(def: UpgradeDef): string {
  const parts: string[] = [`Tier ${def.tier}`]
  if (def.damage) parts.push(`Damage ${signed(def.damage)}`)
  if (def.tears) parts.push(`Tears ${signed(def.tears)}`)
  if (def.speed) parts.push(`Speed ${signed(def.speed)}`)
  if (def.range) parts.push(`Range ${signed(def.range)}`)
  if (def.shotSpeed) parts.push(`Shot speed ${signed(def.shotSpeed)}`)
  if (def.luck) parts.push(`Luck ${signed(def.luck)}`)
  if (def.magnet) parts.push(`Magnet ${signed(def.magnet)}`)
  if (def.maxHeat) parts.push(`Heat ${signed(def.maxHeat)}`)
  if (def.kind === 'active') parts.push(`Active item. Charges in ${def.charges ?? 1} cleared rooms.`)
  return parts.join(' · ')
}
